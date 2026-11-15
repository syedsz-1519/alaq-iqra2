import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";
import { useAuth } from "@/lib/auth";
import type { ZaidTopicId } from "@/lib/zaid-topics";
import { getLesson, type Lesson } from "@/lib/zaid-lessons";
import { getTeacher, type Teacher } from "@/lib/teachers";
import type { ZaidReference } from "@/lib/zaid-tools.server";

export type Caption = { role: "user" | "assistant"; text: string };

type ZaidCtx = {
  voice: ReturnType<typeof useLiveVoice>;
  topic: ZaidTopicId;
  setTopic: (t: ZaidTopicId) => void;
  captions: Caption[];
  references: ZaidReference[];
  thinking: boolean;
  idle: boolean;
  live: boolean;
  canStart: boolean;
  /** Start a call; optionally for a specific topic or structured lesson. */
  begin: (opts?: { topic?: ZaidTopicId; lesson?: string }) => void;
  /** The structured lesson of the current/last call, if any. */
  lesson: Lesson | undefined;
  /** The voice teacher the student chose (Zaid or Zara). */
  teacher: Teacher;
  /** The floating teacher panel, so the menu button can open it. */
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  statusText: string;
};

const Ctx = createContext<ZaidCtx | null>(null);

/** One Zaid call for the whole app, so a lesson keeps going while you move between pages. */
export function ZaidProvider({ children }: { children: ReactNode }) {
  const { session, teacher: teacherId } = useAuth();
  const teacher = getTeacher(teacherId);
  const [topic, setTopic] = useState<ZaidTopicId>("open");
  const [lessonId, setLessonId] = useState<string | undefined>();
  const [panelOpen, setPanelOpen] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [references, setReferences] = useState<ZaidReference[]>([]);
  const [thinking, setThinking] = useState(false);

  const onEvent = useCallback((event: LiveEvent) => {
    if (event.type === "session.input_transcript.delta" || event.type === "session.output_transcript.delta") {
      const delta = typeof event["delta"] === "string" ? (event["delta"] as string) : "";
      if (!delta) return;
      const role: Caption["role"] = event.type === "session.input_transcript.delta" ? "user" : "assistant";
      if (role === "assistant") setThinking(false);
      setCaptions((list) => {
        const last = list[list.length - 1];
        if (last && last.role === role) return [...list.slice(0, -1), { role, text: last.text + delta }];
        return [...list, { role, text: delta }].slice(-40);
      });
    } else if (event.type === "app.delegation.pending") {
      setThinking(true);
    } else if (event.type === "app.syed.references") {
      const refs = event["references"] as ZaidReference[] | undefined;
      if (refs?.length) setReferences((prev) => [...refs, ...prev].slice(0, 8));
    } else if (event.type === "app.closed") {
      setThinking(false);
    }
  }, []);

  const voice = useLiveVoice({ onEvent });
  const idle = voice.status === "idle" || voice.status === "closed";
  const live = voice.status === "connected";

  const begin = useCallback(
    (opts?: { topic?: ZaidTopicId; lesson?: string }) => {
      if (!session) return;
      const lesson = getLesson(opts?.lesson);
      const t = lesson?.topic ?? opts?.topic ?? topic;
      setTopic(t);
      setLessonId(lesson?.id);
      setCaptions([]);
      setReferences([]);
      setThinking(false);
      voice.start({ token: session.access_token, topic: t, teacher: teacher.id, ...(lesson ? { lesson: lesson.id } : {}) });
    },
    [session, topic, voice, teacher.id],
  );

  const statusText =
    voice.status === "connecting"
      ? `Connecting to ${teacher.name}…`
      : voice.status === "stopping"
        ? "Ending the lesson…"
        : live
          ? thinking
            ? `${teacher.name} is looking that up…`
            : voice.muted
              ? "Your microphone is muted"
              : "Listening — speak any time"
          : "Ready when you are";

  const value = useMemo<ZaidCtx>(
    () => ({
      voice,
      topic,
      setTopic,
      captions,
      references,
      thinking,
      idle,
      live,
      canStart: Boolean(session) && idle,
      begin,
      statusText,
      lesson: getLesson(lessonId),
      teacher,
      panelOpen,
      setPanelOpen,
    }),
    [voice, topic, captions, references, thinking, idle, live, session, begin, statusText, lessonId, teacher, panelOpen],
  );

  return (
    <Ctx.Provider value={value}>
      {/* Kept mounted for the whole call, on every page. */}
      <audio ref={voice.audioRef} autoPlay className="hidden" />
      {children}
    </Ctx.Provider>
  );
}

export function useZaid() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useZaid must be used inside ZaidProvider");
  return c;
}
