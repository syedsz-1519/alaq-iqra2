/**
 * Zaid/Zara Chat Widget
 * 
 * Features:
 * - Text chat with message history
 * - Voice input (Web Speech API)
 * - Voice output (speechSynthesis)
 * - Persona selection (Zaid/Zara/Text)
 * - Language selection (English/Urdu/Hindi)
 * - Source citations
 * - Mobile-first responsive design
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Mic,
  Send,
  X,
  Settings,
  Volume2,
  Copy,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chat } from "@/lib/chat.functions";

type Persona = "zaid" | "zara" | "text";
type Lang = "en" | "ur" | "hi";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    type: "quran" | "hadith" | "dua";
    ref: string;
    arabic?: string;
    content: string;
    translation?: string;
    grading?: string;
  }>;
}

export function ZaidChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>("zaid");
  const [lang, setLang] = useState<Lang>("en");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        persona === "zaid"
          ? "Assalamu alaikum. I'm Zaid, your Islamic knowledge assistant. Ask me about the Quran, hadith, duas, or Islamic teachings. How can I help?"
          : "Assalamu alaikum. I'm Zara, your Islamic learning companion. I'm here to help you explore the Quran, hadith, and Islamic wisdom. What would you like to know?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setMessage(transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      toast.error("Microphone error. Please try again.");
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }

    recognitionRef.current.lang =
      lang === "en"
        ? "en-US"
        : lang === "ur"
          ? "ur-PK"
          : "hi-IN";

    recognitionRef.current.start();
  }, [lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        toast.error("Text-to-speech not supported");
        return;
      }

      window.speechSynthesis.cancel();

      utteranceRef.current = new SpeechSynthesisUtterance(text);
      utteranceRef.current.lang =
        lang === "en"
          ? "en-US"
          : lang === "ur"
            ? "ur-PK"
            : "hi-IN";

      // Select voice based on persona
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const voiceFilter =
          persona === "zaid"
            ? (v: SpeechSynthesisVoice) =>
                v.name.toLowerCase().includes("male") ||
                v.lang.includes("en") ||
                v.lang.includes("ur")
            : (v: SpeechSynthesisVoice) =>
                v.name.toLowerCase().includes("female") ||
                v.lang.includes("en") ||
                v.lang.includes("ur");

        const selectedVoice = voices.find(voiceFilter) ?? voices[0] ?? null;
        utteranceRef.current.voice = selectedVoice;
      }

      utteranceRef.current.onstart = () => setIsSpeaking(true);
      utteranceRef.current.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utteranceRef.current);
    },
    [persona, lang]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Add user message
    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      // Call server function
      const response = await chat({
        data: {
          message: message.trim(),
          persona,
          lang,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (response.error) {
        toast.error(
          response.error === "RATE_LIMIT"
            ? "Too many requests. Please try again later."
            : "Chat error. Please try again."
        );
        return;
      }

      // Add assistant message
      const assistantMsg: Message = {
        role: "assistant",
        content: response.response,
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak the response (for voice personas only)
      if (persona !== "text") {
        const speakText =
          persona === "zaid"
            ? "Let me help you with that. " + response.response
            : "Here's what I found. " + response.response;
        speak(speakText.substring(0, 200)); // Limit to 200 chars for TTS
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copySource = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success("Source copied");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-40 rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-shadow hover:shadow-xl lg:bottom-6"
        aria-label="Open Zaid chat"
      >
        <MessageCircle className="size-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 top-16 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 flex flex-col rounded-2xl border border-border bg-card shadow-xl sm:right-auto sm:left-4 sm:top-auto sm:h-[min(600px,calc(100dvh-7rem))] sm:w-96 lg:bottom-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {persona === "zaid" ? "Z" : "Z"}
          </div>
          <div>
            <p className="font-semibold capitalize">{persona}</p>
            <p className="text-xs text-muted-foreground">Islamic Assistant</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-2 hover:bg-muted"
          aria-label="Close chat"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Settings */}
      <div className="flex gap-2 border-b border-border p-3">
        <Select value={persona} onValueChange={(v) => setPersona(v as Persona)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zaid">Zaid</SelectItem>
            <SelectItem value="zara">Zara</SelectItem>
            <SelectItem value="text">Text Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ur">اردو</SelectItem>
            <SelectItem value="hi">हिंदी</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs rounded-lg p-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="break-words">{msg.content}</p>

              {/* Source citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.sources.map((source, j) => (
                    <button
                      key={j}
                      onClick={() => copySource(source.ref)}
                      className="text-xs bg-opacity-20 bg-primary rounded px-2 py-1 hover:bg-opacity-30 transition-colors"
                    >
                      {source.ref}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="size-2 rounded-full bg-muted-foreground animate-bounce"></div>
                <div
                  className="size-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="size-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="flex gap-2 border-t border-border p-3"
      >
        {persona !== "text" && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            className={`rounded-full p-2 ${
              isListening
                ? "bg-red-500 text-white"
                : "bg-muted hover:bg-muted/80"
            } disabled:opacity-50`}
          >
            <Mic className="size-4" />
          </button>
        )}

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me..."
          className="h-10"
          disabled={isLoading || isListening}
        />

        {persona !== "text" && isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="rounded-full p-2 bg-muted hover:bg-muted/80"
          >
            <Volume2 className="size-4" />
          </button>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !message.trim()}
          className="rounded-full"
        >
          <Send className="size-4" />
        </Button>
      </form>

      {/* Privacy note */}
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground text-center">
        Messages are not stored. Learn from Alaq's Islamic knowledge base.
      </div>
    </div>
  );
}
