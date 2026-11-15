import { shareImage } from "@/lib/share";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { GoogleButton } from "@/components/alaq/google-button";
import { TeacherPicker } from "@/components/alaq/teacher-ui";
import { PENDING_TEACHER_KEY } from "@/lib/auth";
import type { TeacherId } from "@/lib/teachers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { redirect?: string };

/** Only same-origin paths are allowed as post-sign-in destinations. */
function safePath(p: string | undefined) {
  return p && p.startsWith("/") && !p.startsWith("//") ? p : "/";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search =>
    typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {},
  head: ({ match }) => ({
    meta: [
      { title: "Sign in to Alaq — Your Quran & Islamic learning companion" },
      { name: "description", content: "Create your free Alaq account to be greeted by name and learn with Zaid or Zara, your Islamic voice teachers." },
      { property: "og:title", content: "Sign in to Alaq" },
      { property: "og:description", content: "Create your free Alaq account and learn Quran, Tajweed, hadith and more with Zaid or Zara." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const target = safePath(redirect);
  const navigate = useNavigate();
  const { user, ready, teacher: savedTeacher } = useAuth();
  const [teacher, setTeacher] = useState<TeacherId>(savedTeacher);
  useEffect(() => setTeacher(savedTeacher), [savedTeacher]);
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  useEffect(() => {
    if (ready && user) void navigate({ to: target, replace: true });
  }, [ready, user, target, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + target, data: { display_name: name.trim(), teacher } },
        });
        if (error) throw error;
        if (!data.session) setSent("confirm");
      } else if (mode === "signin") {
        if (teacher !== savedTeacher) localStorage.setItem(PENDING_TEACHER_KEY, teacher);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Assalamu alaikum — welcome back");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "lovable") => {
    if (target !== "/") sessionStorage.setItem("alaq:after-auth", target);
    if (teacher !== savedTeacher) localStorage.setItem(PENDING_TEACHER_KEY, teacher);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message ?? "Sign-in failed");
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-2">
      <section className="bg-hero relative hidden overflow-hidden rounded-[2rem] p-10 text-night-foreground shadow-elegant md:block">
        <img src="/icon-512.png" alt="Alaq calligraphy logo" className="animate-glow mx-auto size-56 rounded-full object-cover mix-blend-screen" />
        <p className="quran-text mt-6 text-center text-3xl text-gold">ٱقْرَأْ بِٱسْمِ رَبِّكَ</p>
        <p className="mt-2 text-center text-sm opacity-75">“Read in the name of your Lord.” — Al-Alaq 96:1</p>
        <ul className="mt-8 space-y-2 text-sm opacity-90">
          <li>• Be greeted by name every day</li>
          <li>• Learn with Zaid, your voice teacher</li>
          <li>• Hear Telugu & Marathi translations spoken aloud</li>
        </ul>
      </section>

      <section className="mx-auto w-full max-w-sm">
        {sent ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-elegant">
            <MailCheck className="mx-auto size-10 text-gold" />
            <h1 className="mt-4 font-display text-2xl font-semibold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {sent === "confirm"
                ? `We sent a confirmation link to ${email}. Open it to finish creating your account.`
                : `We sent a password reset link to ${email}.`}
            </p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={() => { setSent(null); setMode("signin"); }}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <div className="animate-fade-up rounded-3xl border border-border bg-card p-7 shadow-elegant">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Assalamu alaikum</p>
            <h1 className="mt-1 font-display text-3xl font-semibold">
              {mode === "signup" ? "Create your account" : mode === "signin" ? "Welcome back" : "Reset password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "forgot" ? "We'll email you a link to choose a new password." : "Free, ad-free, and yours forever."}
            </p>

            {mode !== "forgot" && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">Choose your voice teacher</p>
                <TeacherPicker value={teacher} onChange={setTeacher} />
                <p className="mt-1.5 text-xs text-muted-foreground">Zaid has a male voice, Zara a female voice. Both speak all six languages — change any time.</p>
              </div>
            )}

            {mode !== "forgot" && (
              <div className="mt-5 space-y-2.5">
                <GoogleButton onClick={() => void social("google")}>Continue with Google</GoogleButton>
                <button type="button" className="lovable-auth-button w-full" onClick={() => void social("lovable")}>
                  Continue with Lovable
                </button>
                <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Syed Shah Nawaz" autoComplete="name" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode("forgot")}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                </div>
              )}
              <Button type="submit" disabled={busy} className="mt-2 h-11 w-full rounded-full">
                {busy && <Loader2 className="animate-spin" />}
                {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "signup" ? "Already have an account? " : mode === "signin" ? "New to Alaq? " : "Remembered it? "}
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">Continue without an account</Link>
        </p>
      </section>
    </div>
  );
}
