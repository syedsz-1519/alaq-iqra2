import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { BookOpen, ChevronRight, GraduationCap, Headphones, Info, LogIn, LogOut, Moon, Palette, Sun, UserRound, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { shareImage } from "@/lib/share";
import { firstName, useAuth } from "@/lib/auth";
import { DEFAULT_SETTINGS, LANGS, LANG_IDS, VOICE_LANGS, normalizeSettings, type LangId, type Settings, type VoiceLang } from "@/lib/quran";
import { KEYS, useStored } from "@/lib/storage";
import { useAudioPlayer } from "@/components/alaq/audio-player";
import { ReciterSelect } from "@/components/alaq/reciter-select";
import { TeacherPicker } from "@/components/alaq/teacher-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: ({ match }) => ({
    meta: [
      { title: "Settings — Alaq" },
      { name: "description", content: "Choose your voice teacher, reciter, translations, Arabic text size and appearance in Alaq." },
      { property: "og:title", content: "Settings — Alaq" },
      { property: "og:description", content: "Personalise your Quran reading, listening and voice lessons." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: SettingsPage,
});

const FEEDBACK_LANGS = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["ur", "Urdu"],
  ["roman", "Roman Urdu (Hyderabadi)"],
  ["te", "Telugu"],
  ["mr", "Marathi"],
] as const;

function SettingsPage() {
  const { ready, user, displayName, updateDisplayName, signOut } = useAuth();
  const navigate = useNavigate();
  const player = useAudioPlayer();
  const [raw, setSettings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(raw);
  const [theme, setTheme] = useStored<"light" | "dark">(KEYS.theme, "light");
  const [feedbackLang, setFeedbackLang] = useStored<string>("alaq:feedback-lang", "en");
  const [name, setName] = useState(displayName);
  useEffect(() => setName(displayName), [displayName]);

  const update = (patch: Partial<Settings>) => setSettings((p) => ({ ...normalizeSettings(p), ...patch }));
  const toggleLang = (l: LangId) =>
    update({ translations: settings.translations.includes(l) ? settings.translations.filter((x) => x !== l) : [...settings.translations, l] });
  const chooseTheme = (t: "light" | "dark") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };
  const saveName = async () => {
    try {
      await updateDisplayName(name.trim());
      toast.success("Your name is saved");
    } catch {
      toast.error("Couldn't save your name. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Preferences</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
      <p className="mt-2 text-muted-foreground">Changes save automatically on this device{user ? " and your account" : ""}.</p>

      <Group icon={UserRound} title="Account">
        {!ready ? null : user ? (
          <>
            <Row label="Your name" hint="Used when the app and your teacher greet you.">
              <div className="flex w-full gap-2 sm:w-72">
                <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="bg-background" aria-label="Your name" />
                <Button size="sm" onClick={saveName} disabled={!name.trim() || name.trim() === displayName}>
                  Save
                </Button>
              </div>
            </Row>
            <Row label="Signed in as" hint={user.email ?? ""}>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  void navigate({ to: "/auth", replace: true });
                }}
              >
                <LogOut /> Sign out
              </Button>
            </Row>
          </>
        ) : (
          <Row label="You're browsing as a guest" hint="Sign in to talk with your teacher and keep your name.">
            <Button asChild size="sm">
              <Link to="/auth" search={{ redirect: "/settings" }}>
                <LogIn /> Sign in
              </Link>
            </Button>
          </Row>
        )}
      </Group>

      <Group icon={GraduationCap} title="Voice teacher">
        <div className="px-5 py-4">
          <p className="mb-2 text-sm font-medium">Choose your teacher</p>
          <TeacherPicker />
          <p className="mt-2 text-xs text-muted-foreground">
            Zaid has a male voice and Zara a female voice. Both are gentle and speak English, Hindi, Urdu, Telugu, Marathi and Hyderabadi Roman Urdu.
          </p>
        </div>
        <Row label="Recitation feedback language" hint="The language your teacher uses when checking your recitation.">
          <Select value={feedbackLang} onValueChange={setFeedbackLang}>
            <SelectTrigger className="h-9 w-full bg-background sm:w-56" aria-label="Feedback language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_LANGS.map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <LinkRow to="/learn" label={`Lessons with your teacher`} hint="Tajweed, Arabic & Fiqh" />
      </Group>

      <Group icon={BookOpen} title="Quran reading">
        <div className="px-5 py-4">
          <p className="text-sm font-medium">Translations to show</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LANG_IDS.map((l) => {
              const on = settings.translations.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleLang(l)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  {LANGS[l].label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Arabic text size</p>
            <span className="text-xs tabular-nums text-muted-foreground">{settings.arabicSize}px</span>
          </div>
          <Slider className="mt-3" min={22} max={52} step={2} value={[settings.arabicSize]} onValueChange={([v]) => update({ arabicSize: v ?? DEFAULT_SETTINGS.arabicSize })} />
          <p className="quran-text mt-3 text-center text-primary" style={{ fontSize: settings.arabicSize }}>
            بِسْمِ ٱللَّهِ
          </p>
        </div>
      </Group>

      <Group icon={Headphones} title="Listening">
        <Row label="Default reciter" hint="Any surah can still have its own reciter.">
          <ReciterSelect value={settings.reciter} onChange={(id) => update({ reciter: id })} className="w-full sm:w-64" />
        </Row>
        <Row label="Hear the meaning after each ayah">
          <Select value={player.voiceTranslation} onValueChange={(v) => player.setVoiceTranslation(v as VoiceLang)}>
            <SelectTrigger className="h-9 w-full bg-background sm:w-64" aria-label="Spoken translation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["none", ...LANG_IDS] as VoiceLang[]).map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "none" ? "Arabic recitation only" : `Arabic, then ${LANGS[l].label}${VOICE_LANGS[l].ai ? " (needs sign-in)" : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Repeat each ayah" hint="Good for memorising.">
          <Switch checked={player.repeatAyah} onCheckedChange={player.setRepeatAyah} aria-label="Repeat each ayah" />
        </Row>
      </Group>

      <Group icon={Palette} title="Appearance">
        <Row label="Theme">
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={theme === t}
                onClick={() => chooseTheme(t)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                  theme === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {t === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group icon={Info} title="More">
        <LinkRow to="/offline" label="Offline library" hint="Saved surahs and recitations" icon={WifiOff} />
        <LinkRow to="/sources" label="About & sources" hint="Where every text and recitation comes from" icon={Info} />
      </Group>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Alaq · العلق{firstName(displayName) ? ` · Assalamu alaikum, ${firstName(displayName)}` : ""}
      </p>
    </div>
  );
}

function Group({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-3.5 text-gold" /> {title}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function LinkRow({ to, label, hint, icon: Icon }: { to: "/learn" | "/offline" | "/sources"; label: string; hint?: string; icon?: ComponentType<{ className?: string }> }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/60">
      {Icon && <Icon className="size-4 text-muted-foreground" />}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
