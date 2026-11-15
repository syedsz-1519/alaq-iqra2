import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { dailyHadithNumber, dailyHadithQuery } from "@/lib/daily";
import { cn } from "@/lib/utils";

/** Today's hadith from An-Nawawi's Forty, quoted exactly from the cited source. */
export function DailyHadith({ date, tone = "card", clamp = false }: { date: Date; tone?: "card" | "night"; clamp?: boolean }) {
  const n = dailyHadithNumber(date);
  const { data, isError } = useQuery(dailyHadithQuery(n));
  const night = tone === "night";
  return (
    <section
      className={cn(
        "rounded-3xl p-6 text-left",
        night ? "border border-night-foreground/15 bg-night-foreground/5" : "border border-border bg-card shadow-elegant",
      )}
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
        <ScrollText className="size-3.5" /> Hadith of the day
      </p>
      {isError ? (
        <p className={cn("mt-3 text-sm", night ? "opacity-70" : "text-muted-foreground")}>Connect to the internet to see today's hadith.</p>
      ) : !data ? (
        <div className="mt-4 space-y-2">
          <div className={cn("h-4 animate-pulse rounded", night ? "bg-night-foreground/10" : "bg-muted")} />
          <div className={cn("h-4 w-5/6 animate-pulse rounded", night ? "bg-night-foreground/10" : "bg-muted")} />
          <div className={cn("h-4 w-2/3 animate-pulse rounded", night ? "bg-night-foreground/10" : "bg-muted")} />
        </div>
      ) : (
        <>
          <p className={cn("mt-3 leading-relaxed", night ? "opacity-90" : "text-foreground/85", clamp && "line-clamp-6")}>{data.english}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={night ? "opacity-70" : "text-muted-foreground"}>{data.source}</span>
            <Link to="/hadith/$collection" params={{ collection: "nawawi" }} className="font-medium text-gold hover:underline">
              Read all forty
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
