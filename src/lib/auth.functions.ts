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
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[Auth] Session error:", error);
    return { session: null, user: null };
  }
  return { session: data.session, user: data.session?.user ?? null };
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
      throw new Error("Email and password required");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      console.error("[Auth] Sign in error:", error);
      throw new Error(error.message || "Failed to sign in");
    }

    return {
      session: data.session,
      user: data.user,
    };
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
      throw new Error("Email and password required");
    }

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
      console.error("[Auth] Sign up error:", error);
      throw new Error(error.message || "Failed to create account");
    }

    // Create profile entry
    if (data.user) {
      await createUserProfile(data.user.id, displayName, teacher);
    }

    return {
      session: data.session,
      user: data.user,
    };
  });

/**
 * Create or update user profile
 */
export const createUserProfile = createServerFn({
  method: "POST",
})
  .inputType<{ userId: string; displayName?: string; teacher?: string }>()
  .handler(async ({ userId, displayName, teacher }) => {
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
      console.error("[Auth] Profile creation error:", error);
      throw new Error(error.message || "Failed to create profile");
    }

    return data;
  });

/**
 * Get user profile (requires auth)
 */
export const getUserProfile = createServerFn({
  method: "GET",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
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

    const { error } = await context.supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("[Auth] Password update error:", error);
      throw new Error(error.message || "Failed to update password");
    }

    return { success: true };
  });

/**
 * Sign out
 */
export const signOut = createServerFn({
  method: "POST",
}).handler(async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[Auth] Sign out error:", error);
    throw new Error(error.message || "Failed to sign out");
  }

  return { success: true };
});

/**
 * Verify OTP (for email confirmations)
 */
export const verifyOtp = createServerFn({
  method: "POST",
})
  .inputType<{ email: string; token: string; type: "email" | "recovery" | "magic_link" }>()
  .handler(async ({ email, token, type }) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token,
      type,
    });

    if (error) {
      console.error("[Auth] OTP verification error:", error);
      throw new Error(error.message || "Invalid or expired verification code");
    }

    // Create profile if signing up via email link
    if (data.user && type === "email") {
      await createUserProfile(data.user.id, data.user.user_metadata?.display_name, data.user.user_metadata?.teacher);
    }

    return {
      session: data.session,
      user: data.user,
    };
  });
