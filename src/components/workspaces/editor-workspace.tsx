"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocumentStore } from "@/stores/document-store";
import { exportWithAnnotations } from "@/lib/pdf/operations";
import { downloadBlob, type AnnotateTool } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";
import {
  Download,
  Highlighter,
  MousePointer2,
  Redo2,
  StickyNote,
  Underline,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const PdfDocumentView = dynamic(
  () => import("@/components/pdf/pdf-document-view").then((m) => m.PdfDocumentView),
  {
    ssr: false,
    loading: () => <Skeleton className="min-h-[480px] w-full max-w-[612px] mx-auto" />,
  }
);

const annotateTools: { id: AnnotateTool; label: string; icon: typeof Highlighter }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "underline", label: "Underline", icon: Underline },
  { id: "sticky", label: "Note", icon: StickyNote },
];

type EditorWorkspaceProps = {
  documentId: string;
};

export function EditorWorkspace({ documentId }: EditorWorkspaceProps) {
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const [activeTool, setActiveTool] = useState<AnnotateTool>("highlight");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const {
    currentDocument,
    annotations,
    isLoading,
    openDocument,
    addAnnotation,
    updateAnnotationText,
    removeAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/files");
    });
  }, [documentId, openDocument, router]);

  const handleExport = async () => {
    if (!currentDocument) return;
    try {
      const data = await exportWithAnnotations(currentDocument.data, annotations);
      downloadBlob(new Blob([data], { type: "application/pdf" }), currentDocument.name);
      toast.success("PDF exported");
    } catch {
      toast.error("Export failed");
    }
  };

  if (isLoading || !currentDocument) {
    return (
      <AppShell title="Editor">
        <Skeleton className="m-6 h-[600px] w-full max-w-3xl" />
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Files", href: "/files" },
        { label: currentDocument.name },
      ]}
      showInspector
      inspectorContent={
        <div className="flex flex-col gap-3 text-xs">
          <p className="text-muted-foreground">
            {annotations.length} annotation{annotations.length !== 1 ? "s" : ""}
          </p>
          {annotations.length > 0 && (
            <ul className="flex flex-col gap-1 max-h-64 overflow-auto">
              {annotations.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/60"
                >
                  <button
                    type="button"
                    className="truncate text-left flex-1"
                    onClick={() => {
                      if (a.type === "sticky") {
                        setEditingNoteId(a.id);
                        setNoteText(a.text ?? "");
                      }
                    }}
                  >
                    p.{a.pageNumber} · {a.type}
                    {a.text ? `: ${a.text.slice(0, 30)}` : ""}
                  </button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => removeAnnotation(a.id)}
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full bg-background">
        {/* Unified macOS Preview Header */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2 bg-background/50 backdrop-blur-md flex-wrap shrink-0">
          {/* History Controls */}
          <div className="flex items-center gap-0.5 bg-muted/20 border border-border/30 rounded-lg p-0.5 shadow-inner">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canUndo()}
              onClick={() => undo()}
              className="rounded-md hover:bg-background/80 disabled:opacity-30"
              aria-label="Undo"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canRedo()}
              onClick={() => redo()}
              className="rounded-md hover:bg-background/80 disabled:opacity-30"
              aria-label="Redo"
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 border-border/40 mx-1 hidden sm:block" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-muted/20 border border-border/30 rounded-lg p-0.5 shadow-inner">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              className="rounded-md hover:bg-background/80"
              aria-label="Zoom Out"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="text-xs font-bold tabular-nums text-foreground/80 w-12 text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              className="rounded-md hover:bg-background/80"
              aria-label="Zoom In"
            >
              <ZoomIn className="size-3.5" />
            </Button>
          </div>

          <span className="text-xs text-muted-foreground font-semibold ml-2 tabular-nums hidden md:inline select-none">
            {currentDocument.pageCount} pages
          </span>

          {/* Right Action buttons */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/organize/${documentId}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs font-bold px-3 h-8 rounded-full border-border/30 bg-muted/20 hover:bg-muted/40 hover:text-foreground text-muted-foreground transition-all"
              )}
            >
              Organize
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              className="text-xs font-bold rounded-full h-8 px-4 shadow-sm shadow-primary/25 bg-primary hover:bg-primary/90 transition-all"
            >
              <Download className="size-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* PDF Canvas Container */}
        <div className="flex-1 overflow-auto bg-canvas p-2 sm:p-4 lg:p-6 pt-12 sm:pt-16 relative flex justify-center items-start">
          {/* Floating macOS Markup Toolbar */}
          <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-0.5 sm:gap-1 overflow-x-auto mac-glass px-1.5 sm:px-2.5 py-1.5 rounded-full shadow-lg border border-border/40 bg-background/50 backdrop-blur-xl no-scrollbar">
            {annotateTools.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <Button
                  key={tool.id}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-xs h-7 sm:h-7.5 shrink-0 rounded-full px-2 sm:px-3 gap-1 sm:gap-1.5 transition-all font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-sm border border-primary/10 hover:bg-primary hover:text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => setActiveTool(tool.id)}
                >
                  <tool.icon className={cn("size-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  <span className="hidden sm:inline">{tool.label}</span>
                </Button>
              );
            })}
          </div>

          {/* PDF Page View */}
          <div className="w-full max-w-full flex justify-center py-2 sm:py-4">
            <PdfDocumentView
              data={currentDocument.data}
              scale={scale}
              annotations={annotations}
              activeTool={activeTool}
              onAddAnnotation={(partial) => addAnnotation(partial)}
              onAnnotationClick={(id) => {
                const ann = annotations.find((a) => a.id === id);
                if (ann?.type === "sticky") {
                  setEditingNoteId(id);
                  setNoteText(ann.text ?? "");
                }
              }}
            />
          </div>
        </div>
      </div>

      <Dialog
        open={!!editingNoteId}
        onOpenChange={(open) => !open && setEditingNoteId(null)}
      >
        <DialogContent className="mac-glass rounded-2xl border border-border/40 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold tracking-tight">Edit annotation note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            autoFocus
            className="text-xs rounded-xl border-border/40 focus-visible:ring-1 bg-muted/10"
          />
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editingNoteId && removeAnnotation(editingNoteId)}
              className="rounded-full text-xs font-semibold"
            >
              Delete
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (editingNoteId) {
                  updateAnnotationText(editingNoteId, noteText);
                  setEditingNoteId(null);
                }
              }}
              className="rounded-full text-xs font-semibold bg-primary hover:bg-primary/95"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
