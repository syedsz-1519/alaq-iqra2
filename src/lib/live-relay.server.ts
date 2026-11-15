import process from "node:process";

import {
  connectLive,
  streamResponse,
  type LiveCommand,
  type LiveEvent,
  type LiveModel,
  type ResponsesInputItem,
  type ResponsesRequest,
  type ResponsesResponse,
} from "@lovable.dev/ai-gateway";

import { createClient } from "@supabase/supabase-js";

import { getZaidTopic } from "./zaid-topics";
import { getLesson } from "./zaid-lessons";
import { getTeacher, isTeacherId, type Teacher, type TeacherId } from "./teachers";
import { runZaidTool, ZAID_TOOLS, type ZaidReference } from "./zaid-tools.server";

export type LiveConfig = {
  key: string;
  liveModel: LiveModel;
  backendModel: ResponsesRequest["model"];
  openingInstructions?: string;
};

// Fill the literal model slugs from co-loaded knowledge before typechecking.
const liveSettings = { liveModel: "openai/gpt-live-1", backendModel: "openai/gpt-6-astra" } as const;

export type LiveSocket = {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onMessage(handler: (data: unknown) => void): void;
  onClose(handler: () => void): void;
  onError(handler: () => void): void;
};

export type LiveExecutionContext = { waitUntil(task: Promise<unknown>): void };

type WorkerSocket = WebSocket & { accept(): void };
declare const WebSocketPair: { new (): { 0: WorkerSocket; 1: WorkerSocket } };
type Transcript = {
  role: "user" | "assistant";
  text: string;
  start_ms: number;
  end_ms: number;
  listeningSound: boolean;
};
type ProviderEvent = LiveEvent<LiveConfig["liveModel"]>;
type DelegationEvent = Extract<ProviderEvent, { type: "session.delegation.created" }>;
type VoiceSession = Awaited<ReturnType<typeof connectLive>>;

export function getLiveConfig(): LiveConfig {
  const config: LiveConfig = {
    ...liveSettings,
    key: process.env["LOVABLE_API_KEY"] ?? "",
    openingInstructions:
      "Begin now as the teacher. Softly say 'Assalamu alaikum', humbly introduce yourself in one short sentence, and politely ask what the student would like to learn today.",
  };
  if ([config.key, config.liveModel, config.backendModel].some((value) => !value)) {
    throw new Error("Missing Live relay configuration");
  }
  return config;
}

export function validateLiveUpgrade(request: Request, options: { allowMissingOrigin?: boolean } = {}): Response | null {
  const origin = request.headers.get("origin");
  if (origin === null ? !options.allowMissingOrigin : origin !== new URL(request.url).origin) {
    return new Response("Voice connection origin rejected", { status: 403 });
  }
  if (request.method !== "GET" || request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("WebSocket required", { status: 426 });
  }
  return null;
}

function workerSocket(socket: WorkerSocket): LiveSocket {
  return {
    get readyState() {
      return socket.readyState;
    },
    send: (data) => socket.send(data),
    close: (code, reason) => socket.close(code, reason),
    onMessage: (handler) => socket.addEventListener("message", (event) => handler(event.data)),
    onClose: (handler) => socket.addEventListener("close", handler),
    onError: (handler) => socket.addEventListener("error", handler),
  };
}

export function handleLiveRequest(request: Request): Response {
  const waitUntil = (request as Request & Partial<LiveExecutionContext>).waitUntil;
  if (!waitUntil) return new Response("Live runtime unavailable", { status: 503 });
  const config = getLiveConfig();
  const rejected = validateLiveUpgrade(request);
  if (rejected) return rejected;
  const pair = new WebSocketPair();
  pair[1].accept();
  bindLiveConnection(workerSocket(pair[1]), config, { waitUntil });
  const response: ResponseInit & { webSocket: WebSocket } = { status: 101, webSocket: pair[0] };
  return new Response(null, response);
}

function conversationInstructions(teacher: Teacher) {
  return `You are ${teacher.name}, a gentle, humble, patient and knowledgeable Islamic teacher (a ${teacher.role} to every student) in the Alaq app, for children and adults. You teach: Quran recitation, meaning and tafsir; Tajweed; Quranic Arabic (letters, harakat, vocabulary, simple grammar); authentic hadith; daily duas; fiqh and everyday masail (wudu, ghusl, salah, fasting, zakat, halal and haram, family and business ethics); aqeedah, seerah and adab; tazkiyah — controlling the nafs and desires through taqwa, sabr, dhikr, fasting, good company and repentance; using AI wisely for learning and serving Islam; and starting sincere, beneficial Islamic content creation.
Language: listen and reply in whichever of these the student speaks — English, Hindi, Urdu, Telugu, Marathi, or Roman Urdu in the Hyderabadi (Dakhni) way of speaking (for example "kya karre", "nakko", "haau", "hau ji"). If the student mixes languages, you may mix the same way. If unsure which language they want, ask politely. Pronounce Arabic words, surah names and terms correctly in every language.
Manner: be very polite, soft-spoken and humble at all times. Speak slowly and calmly with a warm, gentle tone, never loud, rushed, sarcastic or harsh. Use respectful forms: "aap" and "ji" in Urdu and Hindi, "meeru" and "garu" in Telugu, "aapan" and "tumhi" in Marathi. Thank the student for asking, praise effort kindly ("Ma sha Allah, very good"), correct mistakes gently ("Let us try that once more together"), and admit humbly when you are not sure ("Allah knows best — please also ask a scholar"). Never boast or lecture.
Style: speak naturally in short replies (2–4 sentences), like a teacher sitting with one student. Teach one idea at a time, give an example, then check understanding with a short question. Say "sallallahu alayhi wa sallam" after the Prophet's name. Use the student's first name now and then.
Tajweed: follow The Little Tajweed Guide (riwayah Hafs 'an 'Asim). Count lengths in harakat. When the student recites, listen and give specific, kind corrections about qalqalah, ghunnah, madd, makharij and stopping.
Arabic lessons: build step by step from letters to words to short ayahs, using Quranic vocabulary, and ask the student to repeat after you. For Urdu and Roman Urdu speakers teach in Urdu and use the many Arabic words Urdu already shares (kitab, ilm, sabr, rahmat); for English speakers teach in English with transliteration.
Nafs: be compassionate and never shaming; give small practical steps rooted in Quran and Sunnah, and suggest a trusted scholar or counsellor for serious struggles.
AI and content creation: stress sincere intention, verifying every ayah and hadith from reliable sources, never letting AI issue fatwas, honesty, privacy and modest presentation; give concrete practical steps.
Authenticity: never quote Quran, hadith or duas from memory. Always get the verified text from the backend first, then recite or quote it exactly and name the reference (surah and ayah, collection and hadith number). For fiqh, say that schools of thought can differ, give the mainstream positions briefly, and advise asking a qualified local scholar for personal rulings. If you do not know, say so.
Backchannel policy: Use moderate listening sounds while the student is speaking or reciting, without taking over.
Interruption policy: Stop your answer and listen when the student interrupts; continue the lesson from their new words.
Delegation policy:
Backend tools: Verified Quran ayahs with English and Urdu translation, Quran topic search, Roman Urdu, Telugu and Marathi translations, hadith by collection and number, Hisnul Muslim duas by situation, the student's Tajweed syllabus notes, web search, and a careful scholarly answer writer for fiqh, nafs, Arabic, AI and content questions.
Delegate to the backend when: The student asks for or needs a Quran ayah, a hadith, a dua, a translation, a Tajweed rule explanation, a fiqh or masail question, anything that needs looking up on the web, a structured lesson plan, or corrects a request already being worked on.
Do not delegate to the backend when: Greeting, encouraging, asking the student to repeat or recite, or repeating a still-current answer. Wait for the backend result before quoting any text.`;
}

type Student = { name: string; teacher: TeacherId };

/** Verifies the signed-in Alaq user who opens the call; returns their display name. */
async function verifyStudent(token: unknown): Promise<Student | null> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key || typeof token !== "string" || token.length < 20 || token.length > 8192) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await client.from("profiles").select("display_name, teacher").eq("id", data.user.id).maybeSingle();
  const raw = (profile?.display_name as string | undefined) || (data.user.user_metadata?.["full_name"] as string | undefined) || "";
  const name = raw.replace(/[^\p{L}\p{M}\s'-]/gu, "").trim().split(/\s+/)[0]?.slice(0, 30) ?? "";
  return { name, teacher: isTeacherId(profile?.teacher) ? profile.teacher : "zaid" };
}

function lessonInstructions(topicId: unknown, lessonId: unknown, student: Student, teacher: Teacher) {
  const lesson = getLesson(lessonId);
  const topic = getZaidTopic(lesson?.topic ?? (typeof topicId === "string" ? topicId : "open"));
  const who = student.name ? `The student's name is ${student.name}.` : "";
  const focus = lesson ? `${topic.title} lesson "${lesson.title}" — teach ${lesson.focus}.` : `${topic.title}.`;
  const next = lesson
    ? `say you will gently teach "${lesson.title}" today, explain the first idea in one or two simple sentences, and ask one short question.`
    : topic.opening;
  return {
    instructions: `${conversationInstructions(teacher)}\nToday's lesson focus: ${focus} ${who} Stay with this focus unless the student asks about something else.`,
    opening: `Begin now as ${teacher.name}. Softly and politely say "Assalamu alaikum${student.name ? ` ${student.name}` : ""}", humbly introduce yourself in one short sentence as their teacher, then ${next} Mention they may speak English, Hindi, Urdu, Telugu, Marathi or Roman Urdu.`,
  };
}

function isListeningSound(text: string) {
  const normalized = text.toLowerCase().replace(/[\s\p{Pd}]/gu, "");
  return /^(?:m+hm+|uhhuh)[.,!]*$/.test(normalized);
}

async function answerQuestion(
  messages: ResponsesInputItem[],
  config: LiveConfig,
  correlation: { runID: string; sessionID: string; delegationID: string },
  signal: AbortSignal,
  consumeInput: () => void,
  onReference: (references: ZaidReference[]) => void,
) {
  for (let step = 0; step < 50; step++) {
    signal.throwIfAborted();
    consumeInput();
    const stream = await streamResponse(
      {
        model: config.backendModel,
        input: messages,
        instructions:
          "You are the knowledge backend for a gentle, humble spoken Islamic teacher (Zaid or Zara). Transcripts may be incomplete or corrected; use the latest correction. " +
          "Use the tools for every Quran ayah, hadith and dua you mention, and quote them exactly as returned with their references. Never invent references. " +
          "Use search_quran to find ayahs on a topic, and get_quran_translation for Roman Urdu, Telugu or Marathi. " +
          "Use web_search for current events, scholars' published answers, practical AI or content-creation guidance, and anything the other tools cannot answer; prefer quran.com, sunnah.com and recognised scholarly sites, say where the information came from, and never take Quran or hadith wording from the web — verify it with the tools. " +
          "When teaching Arabic to Urdu or Roman Urdu speakers, explain in Urdu/Roman Urdu and point out Arabic words already familiar in Urdu; for English speakers explain in English. " +
          "For Tajweed, base the explanation on get_tajweed_notes and give one Quran example from it. " +
          "For fiqh, masail and deeniyat questions answer from mainstream Sunni scholarship, briefly note differences between the four schools where relevant, and recommend a qualified scholar for personal rulings. " +
          "For Quranic Arabic lessons teach step by step with transliteration and meaning, and ask the student to repeat. " +
          "For controlling the nafs and desires give compassionate, practical steps from Quran and Sunnah (look up any ayah or hadith you cite). " +
          "For AI and Islamic content creation give concrete, practical steps with sincere intention, verification of sources, honesty and privacy; never let AI issue fatwas. " +
          "Continue from completed tool results; do not repeat completed lookups. " +
          "Write the answer the teacher should say — very politely and humbly, in the student's language (English, Hindi, Urdu, Telugu, Marathi or Hyderabadi Roman Urdu) — in at most 150 words, as plain speakable text (Arabic text may be included).",
        ...(!["openai/chat-latest"].includes(config.backendModel)
          ? {
              reasoning: { effort: "medium", summary: "auto" },
              include: ["reasoning.encrypted_content"],
            }
          : {}),
        tools: [...ZAID_TOOLS, { type: "web_search", search_context_size: "medium" }],
      },
      {
        apiKey: config.key,
        signal,
        maxRetries: 0,
        runId: correlation.runID,
        metadata: { live_session_id: correlation.sessionID, delegation_id: correlation.delegationID },
      },
    );
    let completed: ResponsesResponse | undefined;
    let incomplete = false;
    // Drain through HTTP EOF so successful work is not recorded as cancelled by the Gateway.
    for await (const event of stream) {
      if (event.type === "response.completed") completed = event.response;
      if (event.type === "response.incomplete") incomplete = true;
    }
    signal.throwIfAborted();
    if (incomplete || !completed || completed.status !== "completed")
      throw new Error("The backend response did not complete");
    for (const item of completed.output) {
      if (item.type !== "message" && item.type !== "reasoning" && item.type !== "function_call" && item.type !== "web_search_call")
        throw new Error("Unsupported backend output; adapt native history for the selected tools");
      messages.push(item);
    }
    const calls = completed.output.filter((item) => item.type === "function_call");
    if (!calls.length) {
      const answer = completed.output
        .flatMap((item) =>
          item.type === "message"
            ? item.content.flatMap((part) => (part.type === "output_text" ? [part.text] : []))
            : [],
        )
        .join("\n");
      if (!answer.trim()) throw new Error("The backend response had no answer");
      return answer;
    }
    for (const call of calls) {
      signal.throwIfAborted();
      const result = await runZaidTool(call.name, call.arguments);
      if (result.references.length) onReference(result.references);
      messages.push({ type: "function_call_output", call_id: call.call_id, output: result.output });
    }
  }
  throw new Error("The backend task exceeded its step limit");
}

function* commentaryChunks(content: string) {
  const encoder = new TextEncoder();
  let chunk = "";
  let bytes = 0;
  for (const [word] of content.matchAll(/\S+\s*|\s+/gu)) {
    // Chunks stay well inside the provider's per-append size limit.
    if (chunk && bytes + encoder.encode(word).length > 480) {
      yield chunk;
      chunk = "";
      bytes = 0;
    }
    for (const character of word) {
      const size = encoder.encode(character).length;
      if (bytes + size > 480) {
        yield chunk;
        chunk = "";
        bytes = 0;
      }
      chunk += character;
      bytes += size;
    }
  }
  if (chunk) yield chunk;
}

export function bindLiveConnection(
  browser: LiveSocket,
  configuration: LiveConfig,
  execution: LiveExecutionContext,
): void {
  const config = { ...configuration };
  const runID = crypto.randomUUID();
  const setupAbort = new AbortController();
  let gateway: VoiceSession | undefined;
  let sessionID: string | undefined;
  let starting = false;
  let closing = false;
  let finished = false;
  let revision = 0;
  let task: AbortController | undefined;
  const pendingDelegations: Array<{
    event: DelegationEvent;
    references?: ZaidReference[];
  }> = [];
  let completedDelegation: (typeof pendingDelegations)[number] | undefined;
  const backendMessages: ResponsesInputItem[] = [];
  let transcriptCursor = 0;
  let restartTimer: ReturnType<typeof setTimeout> | undefined;
  let browserReady = false;
  let greetingRequested = false;
  let greetingCommand: { id: string; type: "instructions" | "commentary" } | undefined;
  let greetingTimer: ReturnType<typeof setTimeout> | undefined;
  const startTimer = setTimeout(() => {
    emit({ type: "app.error", error: { message: "Voice startup message timed out" } });
    stop();
  }, 5000);
  const transcripts: Transcript[] = [];
  const delegations = new Set<string>();

  function emit(event: object) {
    if (browser.readyState !== 1) return;
    try {
      browser.send(JSON.stringify(event));
    } catch {
      stop();
    }
  }

  function close(socket?: LiveSocket) {
    if (!socket || socket.readyState === 3) return;
    try {
      socket.close(1000, "Call ended");
    } catch {
      return;
    }
  }

  function clearGreeting() {
    clearTimeout(greetingTimer);
    greetingCommand = undefined;
  }

  function requestGreeting() {
    const content = (
      config.openingInstructions ??
      "Start the conversation now in your configured language and role. Give a brief greeting suited to this app's purpose, ask one relevant opening question, then listen."
    ).trim();
    if (!content || !browserReady || !sessionID || greetingRequested || closing) return;
    greetingRequested = true;
    if (new TextEncoder().encode(content).length > 480) {
      emit({ type: "app.greeting.error", error: { message: "The opening instructions are too long" } });
      return;
    }
    greetingCommand = { id: crypto.randomUUID(), type: "instructions" };
    greetingTimer = setTimeout(() => {
      clearGreeting();
      emit({ type: "app.greeting.error", error: { message: "The opening could not be confirmed" } });
    }, 10_000);
    sendGateway({
      type: "session.instructions.append",
      event_id: greetingCommand.id,
      delegation_id: null,
      content,
    });
  }

  function discardPendingWork() {
    pendingDelegations.length = 0;
    completedDelegation = undefined;
    clearTimeout(restartTimer);
    task?.abort();
  }

  function finish() {
    if (finished) return;
    finished = closing = true;
    clearTimeout(startTimer);
    clearTimeout(restartTimer);
    clearGreeting();
    discardPendingWork();
    setupAbort.abort();
    if (gateway) execution.waitUntil(gateway.close());
    close(browser);
  }

  function stop() {
    if (closing) return;
    closing = true;
    discardPendingWork();
    clearTimeout(startTimer);
    clearGreeting();
    if (gateway) execution.waitUntil(gateway.close());
    else finish();
  }

  function sendGateway(event: LiveCommand<LiveConfig["liveModel"]>) {
    if (!gateway || closing) return;
    execution.waitUntil(
      gateway.send(event).catch(() => {
        emit({ type: "app.error", error: { message: "Voice command could not be sent" } });
        stop();
      }),
    );
  }

  function scheduleDelegation() {
    clearTimeout(restartTimer);
    if (closing || task || pendingDelegations.length === 0) return;
    restartTimer = setTimeout(() => void runDelegation(), 300);
  }

  function deliverResult(delegationID: string, answer: string, references?: ZaidReference[]) {
    if (closing) return;
    if (!gateway) return stop();
    try {
      for (const content of commentaryChunks(answer)) {
        sendGateway({
          type: "session.commentary.append",
          event_id: crypto.randomUUID(),
          delegation_id: delegationID,
          content,
        });
      }
      if (references?.length) emit({ type: "app.syed.references", delegation_id: delegationID, references });
      completedDelegation = pendingDelegations.shift();
    } catch {
      stop();
    }
  }

  async function runDelegation() {
    const pending = pendingDelegations[0];
    const event = pending?.event;
    const id = event?.delegation?.id;
    if (!pending || !event || !id || !sessionID || closing || task) return;
    if (!transcripts.some(({ role, text }) => role === "user" && text.trim())) return;
    const controller = new AbortController();
    task = controller;
    let taskRevision = revision;
    try {
      const answer = await answerQuestion(
        backendMessages,
        config,
        { runID, sessionID, delegationID: id },
        controller.signal,
        () => {
          const updates = transcripts.slice(transcriptCursor);
          if (updates.some(({ role, listeningSound }) => role === "user" && !listeningSound)) delete pending.references;
          backendMessages.push(...updates.map(({ role, text }) => ({ role, content: text })));
          transcriptCursor = transcripts.length;
          taskRevision = revision;
        },
        (references) => {
          pending.references = [...(pending.references ?? []), ...references];
        },
      );
      if (closing || controller.signal.aborted) return;
      if (taskRevision !== revision) return;
      deliverResult(id, answer.trim(), pending.references);
    } catch {
      if (closing || controller.signal.aborted) return;
      backendMessages.push({
        role: "assistant",
        content:
          "The backend attempt failed. Completed tool results remain valid; verify uncertain external actions before any retry.",
      });
      if (taskRevision !== revision) return;
      deliverResult(id, "The backend could not finish the answer. Ask whether the user wants to try again.");
    } finally {
      if (task === controller) task = undefined;
      scheduleDelegation();
    }
  }

  function queueDelegation(event: DelegationEvent) {
    pendingDelegations.push({ event });
    emit({ type: "app.delegation.pending", delegation_id: event.delegation?.id });
    scheduleDelegation();
  }

  function receiveGateway(event: ProviderEvent) {
    try {
      if (browser.readyState === 1) browser.send(JSON.stringify(event));
      if (event.type === "session.closed") return finish();
      if (event.type === "gateway.session.closing" || event.type === "gateway.error") {
        return stop();
      }
      if (closing) return;
      if (event.type === "gateway.session.created") {
        sessionID = event.session?.id;
        requestGreeting();
      }
      if (
        greetingCommand &&
        event.type === `session.${greetingCommand.type}.appended` &&
        "client_event_id" in event &&
        event.client_event_id === greetingCommand.id
      ) {
        if (greetingCommand.type === "instructions") {
          greetingCommand = { id: crypto.randomUUID(), type: "commentary" };
          sendGateway({
            type: "session.commentary.append",
            event_id: greetingCommand.id,
            delegation_id: null,
            content: "Begin the conversation now, following the instructions provided.",
          });
        } else {
          clearGreeting();
          emit({ type: "app.greeting.accepted" });
        }
      } else if (greetingCommand && event.type === "error" && event.error?.client_event_id === greetingCommand.id) {
        clearGreeting();
        emit({ type: "app.greeting.error", error: { message: event.error.message ?? "The opening was rejected" } });
      }
      if (event.type === "session.input_transcript.delta" || event.type === "session.output_transcript.delta") {
        const role = event.type === "session.input_transcript.delta" ? "user" : "assistant";
        if (!event.delta?.trim()) return;
        const listeningSound = role === "user" && Boolean(task) && isListeningSound(event.delta);
        transcripts.push({
          role,
          text: event.delta,
          start_ms: event.start_ms ?? 0,
          end_ms: event.end_ms ?? 0,
          listeningSound,
        });
        if (listeningSound) return;
        if (role === "user") {
          revision++;
          const offset = completedDelegation?.event.offset_ms;
          // Live has no transcript watermark; completed handoffs can receive late context.
          if (
            pendingDelegations.length === 0 &&
            completedDelegation &&
            typeof offset === "number" &&
            Number.isFinite(offset) &&
            offset >= 0 &&
            typeof event.start_ms === "number" &&
            Number.isFinite(event.start_ms) &&
            event.start_ms >= 0 &&
            event.start_ms <= offset
          ) {
            pendingDelegations.push(completedDelegation);
            completedDelegation = undefined;
          }
          if (pendingDelegations.length) {
            emit({ type: "app.delegation.pending", delegation_id: pendingDelegations[0]?.event.delegation?.id });
          }
        }
        scheduleDelegation();
      } else if (event.type === "session.delegation.created") {
        const id = event.delegation?.id;
        if (id && event.delegation?.target === "client" && !delegations.has(id)) {
          delegations.add(id);
          queueDelegation(event);
        }
      }
    } catch {
      emit({ type: "app.error", error: { message: "Invalid voice event or lost connection" } });
      stop();
    }
  }

  async function startSession(sdp: string, token: unknown, topic: unknown, lessonId: unknown, teacherId: unknown) {
    if (closing || browser.readyState !== 1) return;
    clearTimeout(startTimer);
    const student = await verifyStudent(token).catch(() => null);
    if (!student) {
      emit({ type: "app.error", error: { message: "Please sign in to talk with your teacher." } });
      return stop();
    }
    if (closing || browser.readyState !== 1) return;
    const teacher = getTeacher(isTeacherId(teacherId) ? teacherId : student.teacher);
    const lesson = lessonInstructions(topic, lessonId, student, teacher);
    config.openingInstructions = lesson.opening;
    const accepted = await connectLive(
      {
        type: "session.start",
        session: {
          model: config.liveModel,
          instructions: lesson.instructions,
          audio: { output: { voice: teacher.voice } },
          delegation: { type: "client" },
        },
        transport: { type: "webrtc", sdp },
      },
      { apiKey: config.key, signal: setupAbort.signal, runId: runID },
    );
    if (closing || browser.readyState !== 1) {
      execution.waitUntil(accepted.close());
      return;
    }
    gateway = accepted;
    execution.waitUntil(
      (async () => {
        try {
          for await (const event of accepted) receiveGateway(event);
        } catch {
          if (!closing) emit({ type: "app.error", error: { message: "Voice gateway connection failed" } });
        } finally {
          finish();
        }
      })(),
    );
  }

  browser.onMessage((data) => {
    try {
      if (typeof data !== "string" || data.length > 64 * 1024) throw new Error("Invalid client message");
      const event = JSON.parse(data);
      if (event.type === "session.close") return stop();
      if (closing) return;
      if (!gateway) {
        if (starting || event.type !== "app.start" || typeof event.sdp !== "string" || !event.sdp.trim()) {
          throw new Error("Voice startup message required");
        }
        starting = true;
        execution.waitUntil(
          startSession(event.sdp, event.token, event.topic, event.lesson, event.teacher).catch((error) => {
            if (!closing)
              emit({
                type: "app.error",
                error: { message: error instanceof Error ? error.message : "Voice startup failed" },
              });
            stop();
          }),
        );
        return;
      }
      if (event.type === "app.ready") {
        browserReady = true;
        requestGreeting();
        return;
      }
      if (event.type !== "gateway.heartbeat") {
        throw new Error("Unsupported client event");
      }
      sendGateway({ type: "gateway.heartbeat" });
    } catch {
      emit({ type: "app.error", error: { message: "Voice connection could not be started or continued" } });
      stop();
    }
  });
  browser.onClose(stop);
  browser.onError(stop);
}
