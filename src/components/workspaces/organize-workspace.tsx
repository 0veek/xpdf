"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentStore } from "@/stores/document-store";
import {
  deletePages,
  exportWithAnnotations,
  mergePdfs,
  reorderPages,
  renderPageThumbnail,
  rotatePages,
} from "@/lib/pdf/operations";
import { downloadBlob } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";
import {
  Download,
  Merge,
  RotateCw,
  Trash2,
} from "lucide-react";

function SortablePage({
  id,
  index,
  thumbnail,
  selected,
  onSelect,
}: {
  id: string;
  index: number;
  thumbnail: string | null;
  selected: boolean;
  onSelect: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-lg border p-2 cursor-grab active:cursor-grabbing bg-card",
        selected && "ring-2 ring-primary",
        isDragging && "opacity-50 shadow-lg z-10"
      )}
      onClick={() => onSelect(index)}
      {...attributes}
      {...listeners}
    >
      <span className="text-[10px] tabular-nums text-muted-foreground absolute top-1 left-1.5 bg-background/80 px-1 rounded">
        {index + 1}
      </span>
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt={`Page ${index + 1}`} className="w-full rounded-sm" draggable={false} />
      ) : (
        <Skeleton className="w-full aspect-[3/4]" />
      )}
    </div>
  );
}

type OrganizeWorkspaceProps = {
  documentId: string;
};

export function OrganizeWorkspace({ documentId }: OrganizeWorkspaceProps) {
  const router = useRouter();
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    currentDocument,
    annotations,
    isLoading,
    openDocument,
    updateDocumentData,
  } = useDocumentStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/files");
    });
  }, [documentId, openDocument, router]);

  useEffect(() => {
    if (!currentDocument) return;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      const order = Array.from({ length: currentDocument.pageCount }, (_, i) => i);
      setPageOrder(order);
      setSelected(new Set());

      async function loadThumbs() {
        const thumbs: (string | null)[] = [];
        for (let i = 0; i < currentDocument!.pageCount; i++) {
          try {
            thumbs.push(await renderPageThumbnail(currentDocument!.data, i));
          } catch {
            thumbs.push(null);
          }
        }
        if (!cancelled) setThumbnails(thumbs);
      }
      loadThumbs();
    });

    return () => {
      cancelled = true;
    };
  }, [currentDocument]);

  const applyPageData = async (data: ArrayBuffer) => {
    const { getPageCount } = await import("@/lib/pdf/operations");
    const count = await getPageCount(data);
    await updateDocumentData(data, count);
    setPageOrder(Array.from({ length: count }, (_, i) => i));
    setSelected(new Set());
    const thumbs: (string | null)[] = [];
    for (let i = 0; i < count; i++) {
      try {
        thumbs.push(await renderPageThumbnail(data, i));
      } catch {
        thumbs.push(null);
      }
    }
    setThumbnails(thumbs);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPageOrder((order) => {
      const oldIndex = order.indexOf(Number(active.id));
      const newIndex = order.indexOf(Number(over.id));
      return arrayMove(order, oldIndex, newIndex);
    });
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleApplyOrder = async () => {
    if (!currentDocument) return;
    setIsProcessing(true);
    try {
      const data = await reorderPages(currentDocument.data, pageOrder);
      await applyPageData(data);
      toast.success("Page order saved");
    } catch {
      toast.error("Failed to reorder pages");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async () => {
    if (!currentDocument || selected.size === 0) return;
    setIsProcessing(true);
    try {
      const indices = [...selected];
      const data = await rotatePages(currentDocument.data, indices, 90);
      await applyPageData(data);
      toast.success(`Rotated ${indices.length} page(s)`);
    } catch {
      toast.error("Failed to rotate pages");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDocument || selected.size === 0) return;
    if (currentDocument.pageCount - selected.size < 1) {
      toast.error("Cannot delete all pages");
      return;
    }
    setIsProcessing(true);
    try {
      const indices = [...selected].sort((a, b) => b - a);
      const data = await deletePages(currentDocument.data, indices);
      await applyPageData(data);
      toast.success(`Deleted ${indices.length} page(s)`);
    } catch {
      toast.error("Failed to delete pages");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMerge = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.multiple = false;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !currentDocument) return;
      setIsProcessing(true);
      try {
        const other = await file.arrayBuffer();
        const data = await mergePdfs([currentDocument.data, other]);
        await applyPageData(data);
        toast.success(`Merged with ${file.name}`);
      } catch {
        toast.error("Failed to merge PDFs");
      } finally {
        setIsProcessing(false);
      }
    };
    input.click();
  };

  const handleExport = async () => {
    if (!currentDocument) return;
    try {
      const ordered =
        pageOrder.length === currentDocument.pageCount
          ? await reorderPages(currentDocument.data, pageOrder)
          : currentDocument.data;
      const data = await exportWithAnnotations(ordered, annotations);
      downloadBlob(new Blob([data], { type: "application/pdf" }), currentDocument.name);
      toast.success("PDF exported");
    } catch {
      toast.error("Export failed");
    }
  };

  if (isLoading || !currentDocument) {
    return (
      <AppShell title="Organize">
        <Skeleton className="m-6 h-96 w-full" />
      </AppShell>
    );
  }

  const sortableIds = pageOrder.map(String);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Files", href: "/files" },
        { label: currentDocument.name, href: `/editor/${documentId}` },
        { label: "Organize" },
      ]}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Organize pages</h1>
            <p className="text-sm text-muted-foreground">
              Drag to reorder · Click to select · {currentDocument.pageCount} pages
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={selected.size === 0 || isProcessing}
              onClick={handleRotate}
            >
              <RotateCw />
              Rotate 90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selected.size === 0 || isProcessing}
              onClick={handleDelete}
            >
              <Trash2 />
              Delete
            </Button>
            <Button variant="outline" size="sm" disabled={isProcessing} onClick={handleMerge}>
              <Merge />
              Merge PDF
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={handleApplyOrder}
            >
              Save order
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download />
              Export
            </Button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {pageOrder.map((pageIndex, displayIndex) => (
                <SortablePage
                  key={pageIndex}
                  id={String(pageIndex)}
                  index={displayIndex}
                  thumbnail={thumbnails[pageIndex] ?? null}
                  selected={selected.has(pageIndex)}
                  onSelect={() => toggleSelect(pageIndex)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </AppShell>
  );
}
