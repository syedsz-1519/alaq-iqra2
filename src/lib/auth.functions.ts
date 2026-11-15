import { createServerFn } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Get current user session (public - works on client)
 */
export const getCurrentSession = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("[Auth] Session error:", error);
      return { session: null, user: null };
    }
    
    return { session: data.session, user: data.session?.user ?? null };
  } catch (err) {
    console.error("[Auth] Unexpected session error:", err);
    return { session: null, user: null };
  }
});

/**
 * Sign in with email and password
 */
export const signInWithEmail = createServerFn({
  method: "POST",
})
  .inputType<{ email: string; password: string }>()
  .handler(async ({ email, password }) => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error("[Auth] Sign in error:", error.message);
        
        // User-friendly error messages
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please confirm your email before signing in. Check your inbox.");
        }
        if (error.message.includes("too many requests")) {
          throw new Error("Too many login attempts. Please try again in a few minutes.");
        }
        
        throw new Error(error.message || "Failed to sign in.");
      }

      if (!data.session) {
        throw new Error("Sign in successful but no session created. Please try again.");
      }

      return {
        session: data.session,
        user: data.user,
      };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Network error. Please check your connection and try again.");
    }
  });

/**
 * Sign up with email and password
 */
export const signUpWithEmail = createServerFn({
  method: "POST",
})
  .inputType<{ email: string; password: string; displayName?: string; teacher?: string }>()
  .handler(async ({ email, password, displayName, teacher }) => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    if (email.length > 254) {
      throw new Error("Email is too long.");
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || "",
            teacher: teacher || "zaid",
          },
        },
      });

      if (error) {
        console.error("[Auth] Sign up error:", error.message);
        
        if (error.message.includes("already registered")) {
          throw new Error("This email is already registered. Sign in instead.");
        }
        if (error.message.includes("invalid email")) {
          throw new Error("Please enter a valid email address.");
        }
        
        throw new Error(error.message || "Failed to create account.");
      }

      // Auto-create profile entry (even if user not confirmed yet)
      if (data.user?.id) {
        try {
          await supabaseAdmin
            .from("profiles")
            .insert({
              id: data.user.id,
              display_name: displayName?.trim() || "",
              teacher: teacher || "zaid",
            })
            .select()
            .single();
        } catch (profileErr) {
          console.error("[Auth] Profile creation error (non-blocking):", profileErr);
          // Don't throw — signup is successful even if profile creation fails (profile table may not exist yet)
        }
      }

      return {
        session: data.session,
        user: data.user,
      };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Network error. Please check your connection and try again.");
    }
  });

/**
 * Create or update user profile
 */
export const createUserProfile = createServerFn({
  method: "POST",
})
  .inputType<{ userId: string; displayName?: string; teacher?: string }>()
  .handler(async ({ userId, displayName, teacher }) => {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            display_name: displayName?.trim() || "",
            teacher: teacher || "zaid",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) {
        console.error("[Auth] Profile creation error:", error.message);
        throw new Error(error.message || "Failed to create profile.");
      }

      return data;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to create profile.");
    }
  });

/**
 * Get user profile (requires auth)
 */
export const getUserProfile = createServerFn({
  method: "GET",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("profiles")
        .select("*")
        .eq("id", context.userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned (not an error)
        console.error("[Auth] Profile fetch error:", error);
        throw new Error(error.message || "Failed to fetch profile");
      }

      return data || null;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to fetch profile.");
    }
  });

/**
 * Update user profile (requires auth)
 */
export const updateUserProfile = createServerFn({
  method: "PUT",
})
  .middleware([requireSupabaseAuth])
  .inputType<{ displayName?: string; teacher?: string }>()
  .handler(async (input, { context }) => {
    const { displayName, teacher } = input;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (displayName !== undefined) {
      updates.display_name = displayName.trim();
    }
    if (teacher !== undefined) {
      updates.teacher = teacher;
    }

    try {
      const { data, error } = await context.supabase
        .from("profiles")
        .update(updates)
        .eq("id", context.userId)
        .select()
        .single();

      if (error) {
        console.error("[Auth] Profile update error:", error);
        throw new Error(error.message || "Failed to update profile");
      }

      return data;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to update profile.");
    }
  });

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = createServerFn({
  method: "POST",
})
  .inputType<{ email: string }>()
  .handler(async ({ email }) => {
    if (!email) {
      throw new Error("Email required");
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : "https://alaq.app"}/reset-password`,
        }
      );

      if (error) {
        console.error("[Auth] Password reset email error:", error);
        throw new Error(error.message || "Failed to send reset email");
      }

      return { success: true };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to send reset email.");
    }
  });

/**
 * Update password
 */
export const updatePassword = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputType<{ password: string }>()
  .handler(async (input, { context }) => {
    const { password } = input;

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    try {
      const { error } = await context.supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("[Auth] Password update error:", error);
        throw new Error(error.message || "Failed to update password");
      }

      return { success: true };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to update password.");
    }
  });

/**
 * Sign out
 */
export const signOut = createServerFn({
  method: "POST",
}).handler(async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[Auth] Sign out error:", error);
      throw new Error(error.message || "Failed to sign out");
    }

    return { success: true };
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Failed to sign out.");
  }
});

/**
 * Verify OTP (for email confirmations)
 */
export const verifyOtp = createServerFn({
  method: "POST",
})
  .inputType<{ email: string; token: string; type: "email" | "recovery" | "magic_link" }>()
  .handler(async ({ email, token, type }) => {
    if (!email || !token) {
      throw new Error("Email and verification code are required.");
    }

    if (token.length !== 6) {
      throw new Error("Verification code must be 6 characters.");
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token,
        type,
      });

      if (error) {
        console.error("[Auth] OTP verification error:", error);
        
        if (error.message.includes("expired")) {
          throw new Error("Verification code has expired. Request a new one.");
        }
        
        throw new Error(error.message || "Invalid or expired verification code");
      }

      // Create profile if signing up via email link
      if (data.user && type === "email") {
        try {
          await createUserProfile(
            { userId: data.user.id, displayName: data.user.user_metadata?.display_name, teacher: data.user.user_metadata?.teacher }
          );
        } catch (profileErr) {
          console.error("[Auth] Profile creation after OTP (non-blocking):", profileErr);
          // Don't fail verification if profile creation fails
        }
      }

      return {
        session: data.session,
        user: data.user,
      };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to verify code.");
    }
  });
