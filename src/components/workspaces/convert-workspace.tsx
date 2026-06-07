"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { renderPageToBlob } from "@/lib/pdf/text";
import { extractFullText } from "@/lib/pdf/text";
import { baseName, downloadBlob } from "@/lib/pdf/types";

type ConvertWorkspaceProps = { documentId: string };

export function ConvertWorkspace({ documentId }: ConvertWorkspaceProps) {
  const router = useRouter();
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const { currentDocument, isLoading, openDocument } = useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/convert");
    });
  }, [documentId, openDocument, router]);

  const exportImages = async () => {
    if (!currentDocument) return;
    setBusy(true);
    setProgress(0);
    try {
      for (let i = 0; i < currentDocument.pageCount; i++) {
        const blob = await renderPageToBlob(currentDocument.data, i, format, 2);
        const ext = format === "png" ? "png" : "jpg";
        downloadBlob(blob, `${baseName(currentDocument.name)}-page-${i + 1}.${ext}`);
        setProgress(Math.round(((i + 1) / currentDocument.pageCount) * 100));
        await new Promise((r) => setTimeout(r, 200));
      }
      toast.success(`Exported ${currentDocument.pageCount} pages`);
    } catch {
      toast.error("Export failed");
    } finally {
      setBusy(false);
    }
  };

  const exportText = async () => {
    if (!currentDocument) return;
    setBusy(true);
    try {
      const text = await extractFullText(currentDocument.data);
      downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName(currentDocument.name)}.txt`);
      toast.success("Text exported");
    } catch {
      toast.error("Text export failed");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !currentDocument) {
    return <AppShell title="Convert"><div className="p-6">Loading…</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Convert", href: "/convert" },
        { label: currentDocument.name },
      ]}
    >
      <div className="flex flex-col gap-6 p-6 max-w-lg">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Convert</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentDocument.name} · {currentDocument.pageCount} pages
          </p>
        </div>

        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Export pages as images</h2>
          <div className="flex flex-col gap-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => v && setFormat(v as "png" | "jpeg")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {busy && <Progress value={progress} />}
          <Button onClick={exportImages} disabled={busy}>
            Export all pages
          </Button>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Export text</h2>
          <p className="text-xs text-muted-foreground">
            Extracts text from the PDF text layer (not OCR).
          </p>
          <Button variant="outline" onClick={exportText} disabled={busy}>
            Download as .txt
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
