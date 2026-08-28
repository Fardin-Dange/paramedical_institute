import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Btn, Card, Field, Input } from "@/components/ui-kit";
import { useAppData } from "@/lib/useAppData";
import { saveSettingsFn } from "@/lib/settings";
import { defaultSettings, type Settings } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Institute Fee Management" },
      { name: "description", content: "Update institute name, logo, address and contact details shown on fee receipts." },
      { property: "og:title", content: "Settings — Institute Fee Management" },
      { property: "og:description", content: "Institute details used on generated receipts." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { mounted, settings, settingsError, refresh } = useAppData();
  const [f, setF] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted) setF(settings);
  }, [mounted, settings]);

  const set = (k: keyof Settings, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <AppLayout title="Settings" subtitle="These details appear on generated receipts">
      <Card className="max-w-2xl">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setSaveError(null);
              await saveSettingsFn({ data: f });
              await refresh();
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            } catch (error) {
              console.error("Failed to save settings:", error);
              setSaveError(
                error instanceof Error
                  ? error.message
                  : "Failed to save settings.",
              );
            }
          }}
        >
          <Field label="Institute Name"><Input required value={f.instituteName} onChange={(e) => set("instituteName", e.target.value)} /></Field>
          <Field label="Address"><Input required value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile Number"><Input required value={f.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
            <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          </div>
          <Field label="Institute Logo">
            <div className="flex flex-wrap items-center gap-4">
              {f.logo && <img src={f.logo} alt="Institute logo preview" className="h-16 w-16 rounded-xl border border-border object-cover" />}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => set("logo", String(reader.result));
                  reader.readAsDataURL(file);
                }}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground"
              />
              {f.logo && <Btn type="button" variant="outline" onClick={() => set("logo", "")}>Remove</Btn>}
            </div>
          </Field>
          <div className="flex items-center gap-3 pt-2">
            <Btn type="submit">Save Settings</Btn>
            {saved && <span className="text-sm text-[oklch(0.45_0.13_155)]">Settings saved.</span>}
            {(settingsError || saveError) && (
              <span className="text-sm text-destructive">
                {saveError || `Unable to load settings from the database: ${settingsError}`}
              </span>
            )}
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}
