import { shareImage } from "@/lib/share";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { DHIKR_PRESETS, EMPTY_DHIKR, incrementDhikr, todayKey, type DhikrState } from "@/lib/dhikr";
import { KEYS, useStored } from "@/lib/storage";
import { PageHeader } from "@/components/alaq/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dhikr")({
  head: ({ match }) => ({
    meta: [
      { title: "Dhikr & Tasbih Counter | Alaq" },
      { name: "description", content: "A calm digital tasbih: SubhanAllah, Alhamdulillah, Allahu Akbar, Istighfar and more, with targets from the Sunnah and a daily total." },
      { property: "og:title", content: "Dhikr & Tasbih Counter | Alaq" },
      { property: "og:description", content: "Count your dhikr with targets from authentic hadith." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: DhikrPage,
});

function DhikrPage() {
  const [state, setState] = useStored<DhikrState>(KEYS.dhikr, EMPTY_DHIKR);
  const [activeId, setActiveId] = useState<string>(DHIKR_PRESETS[0]!.id);
  const active = DHIKR_PRESETS.find((p) => p.id === activeId) ?? DHIKR_PRESETS[0]!;
  const count = state.counts[active.id] ?? 0;
  const inRound = count % active.target;
  const rounds = Math.floor(count / active.target);
  const today = state.day === todayKey() ? state.todayTotal : 0;
  const pct = ((inRound === 0 && count > 0 ? active.target : inRound) / active.target) * 100;

  const tap = () => {
    setState((s) => incrementDhikr({ ...EMPTY_DHIKR, ...s }, active.id));
    if ((count + 1) % active.target === 0 && "vibrate" in navigator) navigator.vibrate?.([60, 40, 60]);
    else if ("vibrate" in navigator) navigator.vibrate?.(8);
  };

  const reset = () => setState((s) => ({ ...EMPTY_DHIKR, ...s, counts: { ...s.counts, [active.id]: 0 } }));

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <PageHeader eyebrow="Remembrance" title="Dhikr">
        “Verily, in the remembrance of Allah do hearts find rest.” — Ar-Ra'd 13:28
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="order-2 grid content-start gap-2 lg:order-1">
          {DHIKR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                p.id === activeId ? "border-primary bg-accent" : "border-border bg-card hover:bg-secondary/60",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.transliteration}</p>
                <p className="truncate text-xs text-muted-foreground">{p.meaning}</p>
              </div>
              <span className="quran-text text-xl text-primary">{p.arabic}</span>
            </button>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <div className="girih flex flex-col items-center rounded-[2rem] bg-ink p-8 text-ink-foreground">
            <p className="quran-text text-4xl text-gold">{active.arabic}</p>
            <p className="mt-1 text-sm opacity-75">{active.meaning}</p>

            <button
              type="button"
              onClick={tap}
              aria-label={`Count ${active.transliteration}`}
              className="relative mt-8 grid size-56 place-items-center rounded-full transition-transform active:scale-[0.97]"
              style={{
                background: `conic-gradient(var(--gold) ${pct}%, color-mix(in oklab, var(--ink-foreground) 12%, transparent) ${pct}%)`,
              }}
            >
              <span className="grid size-48 place-items-center rounded-full bg-ink">
                <span className="text-center">
                  <span className="block font-display text-6xl font-semibold tabular-nums">
                    {inRound === 0 && count > 0 ? active.target : inRound}
                  </span>
                  <span className="text-sm opacity-70">of {active.target}</span>
                </span>
              </span>
            </button>
            <p className="mt-4 text-sm opacity-75">Tap the circle to count</p>

            <div className="mt-6 grid w-full grid-cols-3 gap-2 text-center text-sm">
              <Stat label="Rounds" value={rounds} />
              <Stat label="Today" value={today} />
              <Stat label="All time" value={state.lifetime} />
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink-foreground/25 px-4 py-2 text-sm"
            >
              <RotateCcw className="size-4" /> Reset this dhikr
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Reference: {active.source}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-ink-foreground/10 p-3">
      <p className="font-display text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}
