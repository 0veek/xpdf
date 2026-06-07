"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useDocumentStore } from "@/stores/document-store";
import {
  DEFAULT_PRESETS,
  deletePreset,
  getPresets,
  savePreset,
} from "@/lib/automation/presets";
import type { AutomationPreset } from "@/lib/pdf/types";
import { renderPageToBlob } from "@/lib/pdf/text";
import { extractFullText } from "@/lib/pdf/text";
import { addWatermark, scrubMetadata } from "@/lib/pdf/protect";
import { baseName, downloadBlob } from "@/lib/pdf/types";

export function AutomationWorkspace() {
  const [presets, setPresets] = useState<AutomationPreset[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const { documents, loadDocuments, openDocument, updateDocumentData } = useDocumentStore();

  useEffect(() => {
    loadDocuments();
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = getPresets();
      setPresets(stored.length > 0 ? stored : DEFAULT_PRESETS);
      if (stored.length === 0) {
        DEFAULT_PRESETS.forEach(savePreset);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadDocuments]);

  const runPreset = async (preset: AutomationPreset) => {
    if (!selectedDoc) {
      toast.error("Select a document first");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      await openDocument(selectedDoc);
      const doc = useDocumentStore.getState().currentDocument!;
      let data = doc.data;

      switch (preset.action) {
        case "export-png":
          for (let i = 0; i < doc.pageCount; i++) {
            const blob = await renderPageToBlob(data, i, "png", 2);
            downloadBlob(blob, `${baseName(doc.name)}-page-${i + 1}.png`);
            setProgress(Math.round(((i + 1) / doc.pageCount) * 100));
            await new Promise((r) => setTimeout(r, 150));
          }
          break;
        case "export-jpg":
          for (let i = 0; i < doc.pageCount; i++) {
            const blob = await renderPageToBlob(data, i, "jpeg", 2);
            downloadBlob(blob, `${baseName(doc.name)}-page-${i + 1}.jpg`);
            setProgress(Math.round(((i + 1) / doc.pageCount) * 100));
            await new Promise((r) => setTimeout(r, 150));
          }
          break;
        case "export-text": {
          const text = await extractFullText(data);
          downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName(doc.name)}.txt`);
          break;
        }
        case "watermark":
          data = await addWatermark(data, preset.options?.text ?? "CONFIDENTIAL");
          await updateDocumentData(data);
          downloadBlob(new Blob([data], { type: "application/pdf" }), doc.name);
          break;
        case "scrub-metadata":
          data = await scrubMetadata(data);
          await updateDocumentData(data);
          downloadBlob(new Blob([data], { type: "application/pdf" }), doc.name);
          break;
      }
      toast.success(`Ran: ${preset.name}`);
    } catch {
      toast.error("Automation failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <AppShell title="Automation">
      <div className="flex flex-col gap-6 p-6 max-w-lg">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">Batch actions and saved presets</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Target document</Label>
          <Select value={selectedDoc} onValueChange={(v) => v && setSelectedDoc(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select document…" />
            </SelectTrigger>
            <SelectContent>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {busy && <Progress value={progress} />}

        <ul className="flex flex-col gap-2">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="text-xs text-muted-foreground">{preset.action}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={() => runPreset(preset)} disabled={busy}>
                  Run
                </Button>
                {!DEFAULT_PRESETS.find((p) => p.id === preset.id) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      deletePreset(preset.id);
                      setPresets(getPresets());
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
