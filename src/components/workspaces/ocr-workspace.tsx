"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocumentStore } from "@/stores/document-store";
import { renderPageToCanvas } from "@/lib/pdf/text";
import { ocrCanvas, OCR_LANGUAGES } from "@/lib/pdf/ocr";

type OcrWorkspaceProps = { documentId: string };

export function OcrWorkspace({ documentId }: OcrWorkspaceProps) {
  const router = useRouter();
  const [lang, setLang] = useState("eng");
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editedText, setEditedText] = useState("");

  const { currentDocument, isLoading, openDocument, saveOcrPages } = useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/files");
    });
  }, [documentId, openDocument, router]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const existing = currentDocument?.ocrPages?.[page];
      setEditedText(existing?.text ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [currentDocument, page]);

  const runOcrPage = async () => {
    if (!currentDocument) return;
    setBusy(true);
    setProgress(10);
    try {
      const canvas = await renderPageToCanvas(currentDocument.data, page - 1, 2);
      setProgress(40);
      const result = await ocrCanvas(canvas, lang, (p) => setProgress(40 + p * 0.5));
      setEditedText(result.text);
      const pages = { ...currentDocument.ocrPages, [page]: result };
      await saveOcrPages(pages);
      toast.success(`OCR complete (${Math.round(result.confidence)}% confidence)`);
    } catch {
      toast.error("OCR failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const runOcrAll = async () => {
    if (!currentDocument) return;
    setBusy(true);
    const pages: Record<number, { text: string; confidence: number }> = {
      ...currentDocument.ocrPages,
    };
    try {
      for (let i = 0; i < currentDocument.pageCount; i++) {
        setProgress(Math.round((i / currentDocument.pageCount) * 100));
        const canvas = await renderPageToCanvas(currentDocument.data, i, 2);
        const result = await ocrCanvas(canvas, lang);
        pages[i + 1] = result;
      }
      await saveOcrPages(pages);
      toast.success("OCR complete for all pages");
    } catch {
      toast.error("OCR failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const saveCorrection = async () => {
    if (!currentDocument) return;
    const pages = {
      ...currentDocument.ocrPages,
      [page]: { text: editedText, confidence: currentDocument.ocrPages?.[page]?.confidence ?? 100 },
    };
    await saveOcrPages(pages);
    toast.success("Correction saved");
  };

  if (isLoading || !currentDocument) {
    return <AppShell title="OCR"><div className="p-6">Loading…</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Files", href: "/files" },
        { label: currentDocument.name },
        { label: "OCR" },
      ]}
    >
      <div className="flex flex-col gap-4 p-6 max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">OCR</h1>
            <p className="text-sm text-muted-foreground">Recognize scanned text with Tesseract.js</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Language</Label>
            <Select value={lang} onValueChange={(v) => v && setLang(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OCR_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs">Page</Label>
          <Select value={String(page)} onValueChange={(v) => v && setPage(+v)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: currentDocument.pageCount }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={runOcrPage} disabled={busy}>Run OCR</Button>
          <Button size="sm" variant="outline" onClick={runOcrAll} disabled={busy}>OCR all pages</Button>
        </div>

        {busy && <Progress value={progress} />}

        <div className="grid md:grid-cols-2 gap-4">
          <OcrPreview data={currentDocument.data} page={page - 1} />
          <div className="flex flex-col gap-2">
            <Label>Extracted text (editable)</Label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={16}
              className="font-mono text-xs"
              placeholder="Run OCR to extract text…"
            />
            <Button size="sm" variant="outline" onClick={saveCorrection}>Save correction</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function OcrPreview({ data, page }: { data: ArrayBuffer; page: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    renderPageToCanvas(data, page, 1.5).then((c) => setSrc(c.toDataURL()));
  }, [data, page]);

  if (!src) return <div className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Page preview" className="rounded-lg border shadow-elevated w-full" />
  );
}
