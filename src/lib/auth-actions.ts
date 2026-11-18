// Email sign-in helpers. These run in the browser on purpose: the session must be
// stored on the reader's device, and a server-side sign-in would never reach it.
// The signup trigger creates the profile row, so no admin access is needed here.
import { supabase } from "@/integrations/supabase/client";

function friendly(message: string, fallback: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Invalid email or password. Please try again.";
  if (m.includes("email not confirmed")) return "Please confirm your email before signing in. Check your inbox.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Too many attempts. Please try again in a few minutes.";
  if (m.includes("already registered")) return "This email is already registered. Sign in instead.";
  if (m.includes("invalid email")) return "Please enter a valid email address.";
  if (m.includes("expired")) return "This code has expired. Request a new one.";
  return message || fallback;
}

export async function signInWithEmail({ email, password }: { email: string; password: string }) {
  if (!email || !password) throw new Error("Email and password are required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (error) throw new Error(friendly(error.message, "Failed to sign in."));
  return data;
}

export async function signUpWithEmail({
  email,
  password,
  displayName,
  teacher,
  redirectTo,
}: {
  email: string;
  password: string;
  displayName?: string;
  teacher?: string;
  redirectTo?: string;
}) {
  if (!email || !password) throw new Error("Email and password are required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  if (email.length > 254) throw new Error("Email is too long.");
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      data: { display_name: displayName?.trim() ?? "", teacher: teacher ?? "zaid" },
    },
  });
  if (error) throw new Error(friendly(error.message, "Failed to create account."));
  return data;
}

export async function sendPasswordResetEmail({ email }: { email: string }) {
  if (!email) throw new Error("Email required");
  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(friendly(error.message, "Failed to send reset email."));
}

export async function verifyOtp({
  email,
  token,
  type,
}: {
  email: string;
  token: string;
  type: "email" | "recovery" | "magiclink";
}) {
  if (!email || !token) throw new Error("Email and verification code are required.");
  if (token.length !== 6) throw new Error("Verification code must be 6 characters.");
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.toLowerCase().trim(),
    token,
    type,
  });
  if (error) throw new Error(friendly(error.message, "Invalid or expired verification code"));
  return data;
}
