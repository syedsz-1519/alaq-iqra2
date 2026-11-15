import { Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { TEACHERS, TEACHER_IDS, type Teacher, type TeacherId } from "@/lib/teachers";
import { cn } from "@/lib/utils";

/** A calligraphic medallion for a teacher — their name in Arabic script, no faces. */
export function TeacherBadge({ teacher, className }: { teacher: Teacher; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-hero grid aspect-square place-items-center rounded-full border border-gold/40 text-gold shadow-glow",
        className,
      )}
      style={{ containerType: "inline-size" }}
    >
      <span className="leading-none" style={{ fontFamily: "var(--font-naskh)", fontSize: "34cqw" }}>
        {teacher.arabic}
      </span>
    </span>
  );
}

/** Choose Zaid or Zara. Saved to the account (or this device when signed out). */
export function TeacherPicker({
  disabled,
  compact,
  value,
  onChange,
}: {
  disabled?: boolean;
  compact?: boolean;
  /** Controlled mode (e.g. the sign-up form) — otherwise saves to the account. */
  value?: TeacherId;
  onChange?: (t: TeacherId) => void;
}) {
  const auth = useAuth();
  const current = value ?? auth.teacher;
  const choose = (t: TeacherId) => {
    if (onChange) return onChange(t);
    void auth.updateTeacher(t).catch(() => toast.error("Couldn't save your choice. Please try again."));
  };
  return (
    <div role="radiogroup" aria-label="Choose your teacher" className="grid grid-cols-2 gap-2">
      {TEACHER_IDS.map((id) => {
        const t = TEACHERS[id];
        const on = current === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => choose(id)}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
              on ? "border-gold bg-gold/10 shadow-glow" : "border-border bg-card hover:border-primary/40",
            )}
          >
            <TeacherBadge teacher={t} className={compact ? "size-9" : "size-12"} />
            <span className="min-w-0">
              <span className="block font-display font-semibold leading-tight text-foreground">{t.name}</span>
              {!compact && <span className="block text-xs text-muted-foreground">{t.role === "brother" ? "Male voice" : "Female voice"}</span>}
            </span>
            {on && <Check className="absolute right-2 top-2 size-3.5 text-gold" />}
          </button>
        );
      })}
    </div>
  );
}
