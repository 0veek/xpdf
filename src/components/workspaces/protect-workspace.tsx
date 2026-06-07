"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useDocumentStore } from "@/stores/document-store";
import {
  addWatermark,
  applyAllAnnotationsAndProtect,
  applyRedactionsToPdf,
  scrubMetadata,
} from "@/lib/pdf/protect";
import { downloadBlob, type AnnotateTool } from "@/lib/pdf/types";
import { Skeleton } from "@/components/ui/skeleton";

const PdfDocumentView = dynamic(
  () => import("@/components/pdf/pdf-document-view").then((m) => m.PdfDocumentView),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full max-w-xl mx-auto" /> }
);

type ProtectWorkspaceProps = { documentId: string };

export function ProtectWorkspace({ documentId }: ProtectWorkspaceProps) {
  const router = useRouter();
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [scrubMeta, setScrubMeta] = useState(true);
  const [applyRedact, setApplyRedact] = useState(true);
  const [activeTool, setActiveTool] = useState<AnnotateTool>("redaction");
  const [scale] = useState(1.25);

  const {
    currentDocument,
    annotations,
    isLoading,
    openDocument,
    addAnnotation,
    updateDocumentData,
  } = useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/protect");
    });
  }, [documentId, openDocument, router]);

  const redactions = annotations.filter((a) => a.type === "redaction");

  const applyProtect = async () => {
    if (!currentDocument) return;
    try {
      let data = currentDocument.data;

      if (applyRedact && redactions.length > 0) {
        data = await applyRedactionsToPdf(data, redactions);
      }

      if (watermarkText.trim()) {
        data = await addWatermark(data, watermarkText.trim());
      }

      if (scrubMeta) {
        data = await scrubMetadata(data);
      }

      await updateDocumentData(data);
      downloadBlob(new Blob([data], { type: "application/pdf" }), currentDocument.name);
      toast.success("Protected PDF saved and exported");
    } catch {
      toast.error("Protection failed");
    }
  };

  const previewExport = async () => {
    if (!currentDocument) return;
    try {
      const data = await applyAllAnnotationsAndProtect(currentDocument.data, annotations, {
        watermark: watermarkText.trim() || undefined,
        scrubMetadata: scrubMeta,
        applyRedactions: applyRedact,
      });
      downloadBlob(new Blob([data], { type: "application/pdf" }), `protected-${currentDocument.name}`);
      toast.success("Exported");
    } catch {
      toast.error("Export failed");
    }
  };

  if (isLoading || !currentDocument) {
    return <AppShell title="Protect"><div className="p-6">Loading…</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "Protect", href: "/protect" }, { label: currentDocument.name }]}
    >
      <div className="flex flex-col lg:flex-row gap-4 p-4 h-full">
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4 border rounded-lg p-4">
          <h1 className="text-sm font-semibold">Protect & comply</h1>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Redact tool</Label>
            <Button
              size="sm"
              variant={activeTool === "redaction" ? "secondary" : "outline"}
              onClick={() => setActiveTool("redaction")}
            >
              Draw redaction boxes
            </Button>
            <p className="text-xs text-muted-foreground tabular-nums">
              {redactions.length} redaction(s) marked
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Watermark</Label>
            <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={scrubMeta} onCheckedChange={(c) => setScrubMeta(!!c)} id="scrub" />
            <Label htmlFor="scrub" className="text-xs">Scrub metadata</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={applyRedact} onCheckedChange={(c) => setApplyRedact(!!c)} id="redact" />
            <Label htmlFor="redact" className="text-xs">Apply redactions on save</Label>
          </div>

          <Button onClick={applyProtect}>Apply & save</Button>
          <Button variant="outline" onClick={previewExport}>Export preview</Button>

          <p className="text-[10px] text-muted-foreground">
            Redactions permanently black out content. Preview before applying.
          </p>
        </aside>

        <div className="flex-1 overflow-auto bg-canvas p-4 rounded-lg">
          <PdfDocumentView
            data={currentDocument.data}
            scale={scale}
            annotations={annotations}
            activeTool={activeTool}
            onAddAnnotation={(p) => addAnnotation(p)}
          />
        </div>
      </div>
    </AppShell>
  );
}
