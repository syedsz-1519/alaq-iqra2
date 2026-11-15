import { shareImage } from "@/lib/share";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: ({ match }) => ({
    meta: [
      { title: "Choose a new password — Alaq" },
      { name: "description", content: "Set a new password for your Alaq account." },
      { property: "og:title", content: "Choose a new password — Alaq" },
      { property: "og:description", content: "Set a new password for your Alaq account." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    void navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-7 shadow-elegant">
        <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">
          {busy && <Loader2 className="animate-spin" />} Save password
        </Button>
      </form>
    </div>
  );
}
