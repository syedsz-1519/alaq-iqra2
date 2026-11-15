import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isTeacherId, type TeacherId } from "@/lib/teachers";

type AuthState = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  displayName: string;
  /** The voice teacher this person chose (Zaid or Zara). */
  teacher: TeacherId;
  updateTeacher: (t: TeacherId) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);
const TEACHER_KEY = "alaq:teacher";
/** Teacher picked on the sign-in page before a Google/Lovable redirect; saved to the profile after sign-in. */
export const PENDING_TEACHER_KEY = "alaq:teacher-pending";

function nameFromUser(user: User | null) {
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const pick = [m["display_name"], m["full_name"], m["name"]].find((v) => typeof v === "string" && v.trim());
  return (pick as string | undefined)?.trim() ?? user?.email?.split("@")[0] ?? "";
}

/** First word of a name, for warm greetings ("Assalamu alaikum, Zaid"). */
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profileName, setProfileName] = useState("");
  const [teacher, setTeacher] = useState<TeacherId>("zaid");

  // Signed-out visitors can still pick a teacher; it is kept on this device.
  useEffect(() => {
    const saved = localStorage.getItem(TEACHER_KEY);
    if (isTeacherId(saved)) setTeacher(saved);
  }, []);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) return setProfileName("");
    const { data } = await supabase.from("profiles").select("display_name, teacher").eq("id", user.id).maybeSingle();
    setProfileName(data?.display_name?.trim() || nameFromUser(user));
    const pending = localStorage.getItem(PENDING_TEACHER_KEY);
    localStorage.removeItem(PENDING_TEACHER_KEY);
    if (isTeacherId(pending) && pending !== data?.teacher) {
      setTeacher(pending);
      localStorage.setItem(TEACHER_KEY, pending);
      await supabase.from("profiles").update({ teacher: pending }).eq("id", user.id);
    } else if (isTeacherId(data?.teacher)) {
      setTeacher(data.teacher);
      localStorage.setItem(TEACHER_KEY, data.teacher);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void loadProfile(next?.user ?? null);
        void router.invalidate();
        if (event === "SIGNED_IN") {
          const after = sessionStorage.getItem("alaq:after-auth");
          sessionStorage.removeItem("alaq:after-auth");
          if (after?.startsWith("/") && !after.startsWith("//")) void router.navigate({ to: after });
        }
        if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadProfile(data.session?.user ?? null).finally(() => setReady(true));
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile, router, queryClient]);

  const user = session?.user ?? null;

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      user,
      displayName: profileName || nameFromUser(user),
      teacher,
      updateTeacher: async (t: TeacherId) => {
        setTeacher(t);
        localStorage.setItem(TEACHER_KEY, t);
        if (!user) return;
        const { error } = await supabase.from("profiles").update({ teacher: t }).eq("id", user.id);
        if (error) throw error;
      },
      refreshProfile: () => loadProfile(user),
      updateDisplayName: async (name: string) => {
        if (!user) return;
        const clean = name.trim().slice(0, 60);
        const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: clean });
        if (error) throw error;
        setProfileName(clean);
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        await supabase.auth.signOut();
        setProfileName("");
      },
    }),
    [ready, session, user, profileName, teacher, loadProfile, queryClient],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
