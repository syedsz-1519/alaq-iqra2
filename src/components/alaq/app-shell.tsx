import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, GraduationCap, HandHeart, Headphones, Home, LogIn, LogOut, Moon, ScrollText, Settings, Sparkles, Star, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { KEYS, useStored } from "@/lib/storage";
import { firstName, useAuth } from "@/lib/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MiniPlayer } from "./mini-player";
import { SideMenu } from "./side-menu";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/quran", label: "Read", icon: BookOpen },
  { to: "/listen", label: "Listen", icon: Headphones },
  { to: "/hadith", label: "Hadith", icon: ScrollText },
  { to: "/duas", label: "Duas", icon: HandHeart },
  { to: "/names", label: "99 Names", icon: Star },
  { to: "/dhikr", label: "Dhikr", icon: Sparkles },
] as const;

const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[3]] as const;

export function ThemeToggle() {
  const [theme, setTheme] = useStored<"light" | "dark">(KEYS.theme, "light");
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Alaq home">
      <img src="/icon-192.png" alt="" width={36} height={36} className="size-9 rounded-full object-cover shadow-glow" />
      <span className="font-display text-xl font-semibold tracking-tight">Alaq</span>
      <span className="text-lg text-gold" style={{ fontFamily: "var(--font-naskh)" }}>
        العلق
      </span>
    </Link>
  );
}

function AccountButton() {
  const { ready, user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  if (!ready) return <span className="size-9" />;
  if (!user)
    return (
      <Link
        to="/auth"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <LogIn className="size-4" /> <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  const initial = (firstName(displayName)[0] ?? "A").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Your account"
        className="bg-gold-gradient grid size-9 place-items-center rounded-full font-display font-semibold text-gold-foreground shadow-glow"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-xs font-normal text-muted-foreground">Assalamu alaikum</p>
          <p className="truncate">{displayName || user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate({ to: "/settings" })}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void navigate({ to: "/learn" })}>
          <GraduationCap /> My teacher & lessons
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await signOut();
            void navigate({ to: "/auth", replace: true });
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-1">
            <SideMenu />
            <Logo />
          </div>
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <AccountButton />
          </div>
        </div>
      </header>

      <main className="pb-40 lg:pb-28">{children}</main>

      <MiniPlayer />

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {MOBILE_NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <n.icon className="size-5" />
              {n.label}
            </Link>
          ))}
          <SideMenu variant="tab" />
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="font-medium">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">Please check your internet connection.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      )}
    </div>
  );
}
