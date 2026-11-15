import { Link } from "@tanstack/react-router";
import { BookOpen, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

/** Switch between the two Quran sections: Read and Listen. */
export function QuranSections({ active, surah, className }: { active: "read" | "listen"; surah?: number; className?: string }) {
  const item = (on: boolean) =>
    cn(
      "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
      on ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground",
    );
  return (
    <nav aria-label="Quran sections" className={cn("section-switch inline-flex rounded-full p-1", className)}>
      {surah ? (
        <>
          <Link to="/quran/$surah" params={{ surah: String(surah) }} search={{}} className={item(active === "read")}>
            <BookOpen className="size-4" /> Read
          </Link>
          <Link to="/listen/$surah" params={{ surah: String(surah) }} className={item(active === "listen")}>
            <Headphones className="size-4" /> Listen
          </Link>
        </>
      ) : (
        <>
          <Link to="/quran" className={item(active === "read")}>
            <BookOpen className="size-4" /> Read
          </Link>
          <Link to="/listen" className={item(active === "listen")}>
            <Headphones className="size-4" /> Listen
          </Link>
        </>
      )}
    </nav>
  );
}
