import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpenCheck,
  ChevronRight,
  GraduationCap,
  HandHeart,
  Info,
  Library,
  LogIn,
  LogOut,
  Menu,
  Repeat2,
  Settings,
  Share2,
  Sparkles,
  Star,
  UserRound,
  WifiOff,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { toast } from "sonner";
import { firstName, useAuth } from "@/lib/auth";
import { getTeacher } from "@/lib/teachers";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TeacherBadge } from "./teacher-ui";
import { cn } from "@/lib/utils";

type Item = { to: "/settings" | "/learn" | "/repeat" | "/assignments" | "/duas" | "/names" | "/dhikr" | "/offline" | "/sources"; label: string; icon: ComponentType<{ className?: string }> };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Your space",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/repeat", label: "Repeat after your teacher", icon: Repeat2 },
      { to: "/assignments", label: "Recite & get checked", icon: BookOpenCheck },
    ],
  },
  {
    title: "Remembrance",
    items: [
      { to: "/duas", label: "Duas & Adhkar", icon: HandHeart },
      { to: "/names", label: "99 Names of Allah", icon: Star },
      { to: "/dhikr", label: "Dhikr counter", icon: Sparkles },
    ],
  },
  {
    title: "App",
    items: [
      { to: "/offline", label: "Offline library", icon: WifiOff },
      { to: "/sources", label: "About & sources", icon: Info },
    ],
  },
];

/** The side menu: profile card, teacher, settings and everything else. */
export function SideMenu({ variant = "icon" }: { variant?: "icon" | "tab" }) {
  const [open, setOpen] = useState(false);
  const { ready, user, displayName, teacher: teacherId, signOut } = useAuth();
  const teacher = getTeacher(teacherId);
  const navigate = useNavigate();
  const name = firstName(displayName);
  const close = () => setOpen(false);

  const share = async () => {
    const data = { title: "Alaq", text: "Read and listen to the Quran, hadith, duas and voice lessons — Alaq", url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copied — share it with family and friends");
      }
    } catch {
      /* the person closed the share sheet */
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {variant === "tab" ? (
        <SheetTrigger className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Menu className="size-5" />
          Menu
        </SheetTrigger>
      ) : (
        <SheetTrigger
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Menu className="size-5" />
        </SheetTrigger>
      )}
      <SheetContent side="left" className="flex w-[min(22rem,88vw)] flex-col gap-0 overflow-y-auto border-r-0 bg-background p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Your profile, teacher, settings and more</SheetDescription>

        <div className="bg-hero relative overflow-hidden px-5 pb-5 pt-8 text-night-foreground">
          <div className="girih pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex items-center gap-3">
            <span className="bg-gold-gradient grid size-14 shrink-0 place-items-center rounded-full font-display text-2xl font-semibold text-gold-foreground shadow-glow">
              {user ? (name[0] ?? "A").toUpperCase() : <UserRound className="size-7" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-gold">Assalamu alaikum</p>
              <p className="truncate font-display text-xl font-semibold">{user ? name || "Friend" : "Welcome, guest"}</p>
              {user?.email && <p className="truncate text-xs opacity-70">{user.email}</p>}
            </div>
            {ready && !user && (
              <Link to="/auth" onClick={close} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3.5 text-sm font-semibold text-foreground">
                <LogIn className="size-4" /> Sign in
              </Link>
            )}
          </div>

          <Link
            to="/learn"
            onClick={close}
            className="relative mt-5 flex items-center gap-3 rounded-2xl border border-gold/30 bg-night-foreground/5 p-3 transition-colors hover:bg-night-foreground/10"
          >
            <TeacherBadge teacher={teacher} className="size-11" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Your teacher: {teacher.name}</span>
              <span className="block truncate text-xs opacity-75">Lessons, voice & preferences</span>
            </span>
            <ChevronRight className="size-4 text-gold" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-2">
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{g.title}</p>
              {g.items.map((it) => (
                <MenuRow key={it.to} icon={it.icon} label={it.label} onClick={() => { close(); void navigate({ to: it.to }); }} />
              ))}
            </div>
          ))}
          <div className="mt-1 border-t border-border pt-2">
            <MenuRow icon={Share2} label="Share Alaq" onClick={share} />
            <MenuRow icon={GraduationCap} label="Tajweed, Arabic & Fiqh lessons" onClick={() => { close(); void navigate({ to: "/learn" }); }} />
            {user && (
              <MenuRow
                icon={LogOut}
                label="Sign out"
                className="text-destructive"
                onClick={async () => {
                  close();
                  await signOut();
                  void navigate({ to: "/auth", replace: true });
                }}
              />
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <img src="/icon-192.png" alt="" width={32} height={32} className="size-8 rounded-full" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Alaq · العلق</p>
            <p className="flex items-center gap-1">
              <Library className="size-3" /> Quran, hadith & duas from cited sources
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MenuRow({ icon: Icon, label, onClick, className }: { icon: ComponentType<{ className?: string }>; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition-colors hover:bg-secondary", className)}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
