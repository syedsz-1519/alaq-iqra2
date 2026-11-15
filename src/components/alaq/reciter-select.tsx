import { RECITERS, RECITER_GROUPS } from "@/lib/quran";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Reciter dropdown grouped by school (Makkah & Madinah imams, Egyptian masters, …). */
export function ReciterSelect({
  value,
  onChange,
  variant = "card",
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  variant?: "card" | "ink" | "night";
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Reciter"
        className={cn(
          "h-9 text-xs",
          variant === "card" && "bg-card",
          variant === "ink" && "h-8 border-ink-foreground/20 bg-transparent text-ink-foreground",
          variant === "night" && "h-10 rounded-full border-night-foreground/25 bg-transparent text-sm text-night-foreground",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {RECITER_GROUPS.map((g, gi) => (
          <SelectGroup key={g}>
            <SelectLabel>{g}</SelectLabel>
            {RECITERS.filter((r) => r.group === gi).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
