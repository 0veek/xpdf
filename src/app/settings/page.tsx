"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-6 p-6 max-w-md">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            xpdf runs entirely in your browser. Documents are stored locally via IndexedDB.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Appearance
          </h2>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Theme</span>
            <ThemeToggle />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Keyboard shortcuts
          </h2>
          <dl className="text-sm flex flex-col gap-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Command palette</dt>
              <dd className="font-mono text-xs">⌘K</dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Clearing browser data will remove stored documents. Export important files before clearing site data.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
