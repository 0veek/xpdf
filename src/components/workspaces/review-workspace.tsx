"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocumentStore } from "@/stores/document-store";
import { exportWithAnnotations } from "@/lib/pdf/operations";
import { downloadBlob, STAMP_PRESETS, type AnnotateTool } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Highlighter,
  MessageSquare,
  Pencil,
  Stamp,
  Underline,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const PdfDocumentView = dynamic(
  () => import("@/components/pdf/pdf-document-view").then((m) => m.PdfDocumentView),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full max-w-xl mx-auto" /> }
);

const reviewTools: { id: AnnotateTool; label: string; icon: typeof Pencil }[] = [
  { id: "select", label: "Select", icon: MessageSquare },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "underline", label: "Underline", icon: Underline },
  { id: "draw", label: "Draw", icon: Pencil },
  { id: "stamp", label: "Stamp", icon: Stamp },
  { id: "sticky", label: "Comment", icon: MessageSquare },
];

type ReviewWorkspaceProps = { documentId: string };

export function ReviewWorkspace({ documentId }: ReviewWorkspaceProps) {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<AnnotateTool>("highlight");
  const [stampLabel, setStampLabel] = useState<string>(STAMP_PRESETS[0]);
  const [commentText, setCommentText] = useState("");
  const [selectedAnn, setSelectedAnn] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const {
    currentDocument,
    annotations,
    isLoading,
    openDocument,
    addAnnotation,
    addComment,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/review");
    });
  }, [documentId, openDocument, router]);

  const handleExport = async () => {
    if (!currentDocument) return;
    const data = await exportWithAnnotations(currentDocument.data, annotations);
    downloadBlob(new Blob([data], { type: "application/pdf" }), currentDocument.name);
    toast.success("Exported");
  };

  const selected = annotations.find((a) => a.id === selectedAnn);

  if (isLoading || !currentDocument) {
    return <AppShell title="Review"><div className="p-6">Loading…</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "Review", href: "/review" }, { label: currentDocument.name }]}
      showInspector
      inspectorContent={
        <div className="flex flex-col gap-3 text-xs">
          {selected ? (
            <>
              <p className="font-medium">{selected.type} · page {selected.pageNumber}</p>
              <ul className="flex flex-col gap-1 max-h-32 overflow-auto">
                {(selected.comments ?? []).map((c) => (
                  <li key={c.id} className="rounded bg-muted/60 p-2">
                    <span className="font-medium">{c.author}</span>: {c.body}
                  </li>
                ))}
              </ul>
              <Input
                placeholder="Add comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (commentText.trim()) {
                    addComment(selected.id, commentText.trim());
                    setCommentText("");
                  }
                }}
              >
                Post
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">Select an annotation to view threads.</p>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-1 border-b px-2 sm:px-3 py-1.5 bg-muted/20 flex-wrap overflow-x-auto">
          {reviewTools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "secondary" : "ghost"}
              size="sm"
              className={cn("text-xs h-7 gap-1 shrink-0", activeTool === tool.id && "font-medium")}
              onClick={() => setActiveTool(tool.id)}
            >
              <tool.icon className="size-3.5" />
              <span className="hidden sm:inline">{tool.label}</span>
            </Button>
          ))}
          {activeTool === "stamp" && (
            <Select value={stampLabel} onValueChange={(v) => v && setStampLabel(v)}>
              <SelectTrigger className="h-7 w-28 sm:w-32 text-xs shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAMP_PRESETS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="ml-auto flex gap-1 shrink-0">
            <Button variant="ghost" size="icon-sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} aria-label="Zoom out">
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="text-xs font-bold tabular-nums w-10 text-center self-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setScale((s) => Math.min(3, s + 0.25))} aria-label="Zoom in">
              <ZoomIn className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" disabled={!canUndo()} onClick={() => undo()}>↩</Button>
            <Button variant="ghost" size="icon-sm" disabled={!canRedo()} onClick={() => redo()}>↪</Button>
            <Button variant="outline" size="sm" onClick={handleExport}>Export</Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-canvas p-2 sm:p-4 lg:p-6">
          <PdfDocumentView
            data={currentDocument.data}
            scale={scale}
            annotations={annotations}
            activeTool={activeTool}
            stampLabel={stampLabel}
            onAddAnnotation={(p) => addAnnotation(p)}
            onAnnotationClick={setSelectedAnn}
          />
        </div>
      </div>
    </AppShell>
  );
}
