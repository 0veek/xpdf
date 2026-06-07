"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { Annotation, AnnotateTool, NormalizedPoint, NormalizedRect } from "@/lib/pdf/types";
import { ANNOTATION_COLORS } from "@/lib/pdf/types";
import { renderPdfPageToCanvas, type PageDimensions } from "@/lib/pdf/render";
import { computeFitScale, useContainerWidth } from "@/hooks/use-container-width";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function UnderlineOverlay({ rect, color }: { rect: NormalizedRect; color: string }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${rect.x * 100}%`,
        top: `calc(${(rect.y + rect.height) * 100}% - 2px)`,
        width: `${rect.width * 100}%`,
        height: "3px",
        backgroundColor: color,
        borderRadius: "1px",
      }}
    />
  );
}

type PdfDocumentViewProps = {
  data: ArrayBuffer;
  scale?: number;
  annotations: Annotation[];
  activeTool: AnnotateTool;
  stampLabel?: string;
  signatureDataUrl?: string | null;
  ocrPages?: Record<number, { text: string; confidence: number }>;
  showOcrOverlay?: boolean;
  onAddAnnotation: (partial: Omit<Annotation, "id" | "createdAt">) => void;
  onAnnotationClick?: (id: string) => void;
  className?: string;
};

function PageAnnotations({
  pageNumber,
  annotations,
  activeTool,
  stampLabel,
  signatureDataUrl,
  ocrText,
  showOcrOverlay,
  onAddAnnotation,
  onAnnotationClick,
}: {
  pageNumber: number;
  annotations: Annotation[];
  activeTool: AnnotateTool;
  stampLabel?: string;
  signatureDataUrl?: string | null;
  ocrText?: string;
  showOcrOverlay?: boolean;
  onAddAnnotation: (partial: Omit<Annotation, "id" | "createdAt">) => void;
  onAnnotationClick?: (id: string) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<{ startX: number; startY: number } | null>(null);
  const [preview, setPreview] = useState<NormalizedRect | null>(null);
  const [drawPath, setDrawPath] = useState<NormalizedPoint[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const isDrawingPath = useRef(false);

  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNumber);

  const toNormalized = useCallback((clientX: number, clientY: number): NormalizedPoint | null => {
    const el = overlayRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === "select") return;
    const point = toNormalized(e.clientX, e.clientY);
    if (!point) return;

    setIsCapturing(true);
    if (e.pointerType === "touch") e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    if (activeTool === "sticky") {
      onAddAnnotation({
        documentId: "",
        pageNumber,
        type: "sticky",
        rect: { x: point.x, y: point.y, width: 0.15, height: 0.08 },
        color: ANNOTATION_COLORS.sticky,
        text: "Note",
      });
      return;
    }

    if (activeTool === "stamp" && stampLabel) {
      onAddAnnotation({
        documentId: "",
        pageNumber,
        type: "stamp",
        rect: { x: point.x, y: point.y, width: 0.18, height: 0.04 },
        color: ANNOTATION_COLORS.stamp,
        stampLabel,
      });
      return;
    }

    if (activeTool === "signature" && signatureDataUrl) {
      onAddAnnotation({
        documentId: "",
        pageNumber,
        type: "signature",
        rect: { x: point.x, y: point.y, width: 0.2, height: 0.08 },
        color: ANNOTATION_COLORS.signature,
        signatureDataUrl,
      });
      return;
    }

    if (activeTool === "draw") {
      isDrawingPath.current = true;
      setDrawPath([point]);
      return;
    }

    setDrawing({ startX: point.x, startY: point.y });
    setPreview({ x: point.x, y: point.y, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const point = toNormalized(e.clientX, e.clientY);
    if (!point) return;

    if (activeTool === "draw" && isDrawingPath.current) {
      setDrawPath((prev) => [...prev, point]);
      return;
    }

    if (!drawing) return;
    const x = Math.min(drawing.startX, point.x);
    const y = Math.min(drawing.startY, point.y);
    setPreview({
      x,
      y,
      width: Math.abs(point.x - drawing.startX),
      height: Math.abs(point.y - drawing.startY),
    });
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsCapturing(false);

    if (activeTool === "draw" && isDrawingPath.current) {
      isDrawingPath.current = false;
      if (drawPath.length > 2) {
        const xs = drawPath.map((p) => p.x);
        const ys = drawPath.map((p) => p.y);
        onAddAnnotation({
          documentId: "",
          pageNumber,
          type: "draw",
          rect: {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          },
          color: ANNOTATION_COLORS.draw,
          paths: drawPath,
        });
      }
      setDrawPath([]);
      return;
    }

    if (!drawing || !preview) {
      setDrawing(null);
      setPreview(null);
      return;
    }

    const minW = 0.01;
    const minH = 0.005;
    const isUnderline = activeTool === "underline";
    const isValid = isUnderline
      ? preview.width > minW
      : preview.width > minW && preview.height > minH;

    if (isValid) {
      const type =
        activeTool === "redaction"
          ? "redaction"
          : isUnderline
            ? "underline"
            : "highlight";

      onAddAnnotation({
        documentId: "",
        pageNumber,
        type,
        rect: isUnderline
          ? { ...preview, height: Math.max(preview.height, 0.008) }
          : preview,
        color: ANNOTATION_COLORS[type],
      });
    }
    setDrawing(null);
    setPreview(null);
  };

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute inset-0",
        activeTool === "select"
          ? "pointer-events-none"
          : isCapturing
            ? "touch-none"
            : "touch-pan-y touch-pan-x",
        activeTool !== "select" && "cursor-crosshair"
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {showOcrOverlay && ocrText && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80 sm:opacity-0 sm:hover:opacity-100 focus-within:opacity-100">
          <div className="absolute bottom-0 left-0 right-0 max-h-1/3 overflow-auto bg-background/90 p-2 text-[9px] leading-tight border-t">
            {ocrText}
          </div>
        </div>
      )}

      {pageAnnotations.map((ann) => (
        <AnnotationRender key={ann.id} ann={ann} onClick={() => onAnnotationClick?.(ann.id)} />
      ))}

      {drawPath.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            fill="none"
            stroke={ANNOTATION_COLORS.draw}
            strokeWidth="2"
            points={drawPath.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(" ")}
          />
        </svg>
      )}

      {preview &&
        (activeTool === "underline" ? (
          <UnderlineOverlay
            rect={{ ...preview, height: Math.max(preview.height, 0.008) }}
            color="rgba(255, 59, 48, 0.85)"
          />
        ) : (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${preview.x * 100}%`,
              top: `${preview.y * 100}%`,
              width: `${preview.width * 100}%`,
              height: `${preview.height * 100}%`,
              backgroundColor:
                activeTool === "redaction" ? "rgba(0,0,0,0.7)" : "rgba(255, 213, 0, 0.3)",
            }}
          />
        ))}
    </div>
  );
}

function AnnotationRender({ ann, onClick }: { ann: Annotation; onClick: () => void }) {
  if (ann.type === "draw" && ann.paths && ann.paths.length > 1) {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <polyline
          fill="none"
          stroke={ann.color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points={ann.paths.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(" ")}
        />
      </svg>
    );
  }

  if (ann.type === "underline") {
    return <UnderlineOverlay rect={ann.rect} color={ann.color} />;
  }

  if (ann.type === "signature" && ann.signatureDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ann.signatureDataUrl}
        alt="Signature"
        className="absolute object-contain"
        style={{
          left: `${ann.rect.x * 100}%`,
          top: `${ann.rect.y * 100}%`,
          width: `${ann.rect.width * 100}%`,
          height: `${ann.rect.height * 100}%`,
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute",
        (ann.type === "sticky" || ann.type === "stamp") && "pointer-events-auto cursor-pointer"
      )}
      style={{
        left: `${ann.rect.x * 100}%`,
        top: `${ann.rect.y * 100}%`,
        width: `${ann.rect.width * 100}%`,
        height: `${ann.rect.height * 100}%`,
        backgroundColor:
          ann.type === "stamp"
            ? undefined
            : ann.type === "redaction"
              ? "#000"
              : ann.color,
        border: ann.type === "stamp" ? `2px solid ${ann.color}` : undefined,
      }}
      onClick={(e) => {
        if (ann.type === "sticky" || ann.type === "stamp") {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {ann.type === "sticky" && ann.text && (
        <span className="block p-1.5 text-[10px] leading-tight text-foreground/80 truncate">
          {ann.text}
        </span>
      )}
      {ann.type === "stamp" && ann.stampLabel && (
        <span
          className="flex items-center justify-center h-full text-xs font-bold tracking-wider"
          style={{ color: ann.color }}
        >
          {ann.stampLabel}
        </span>
      )}
    </div>
  );
}

function PdfPage({
  pdf,
  pageNumber,
  scale,
  containerWidth,
  annotations,
  activeTool,
  stampLabel,
  signatureDataUrl,
  ocrText,
  showOcrOverlay,
  onAddAnnotation,
  onAnnotationClick,
}: {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  containerWidth: number;
  annotations: Annotation[];
  activeTool: AnnotateTool;
  stampLabel?: string;
  signatureDataUrl?: string | null;
  ocrText?: string;
  showOcrOverlay?: boolean;
  onAddAnnotation: (partial: Omit<Annotation, "id" | "createdAt">) => void;
  onAnnotationClick?: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<PageDimensions | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    void (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;
        const baseWidth = page.getViewport({ scale: 1 }).width;
        const effectiveScale = computeFitScale(baseWidth, containerWidth, scale);
        const dimensions = await renderPdfPageToCanvas(
          page,
          canvasRef.current,
          effectiveScale
        );
        if (!cancelled) setDims(dimensions);
      } catch {
        if (!cancelled) setDims(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale, containerWidth]);

  return (
    <div
      className="relative max-w-full shadow-elevated rounded-sm bg-white"
      style={dims ? { width: dims.width, height: dims.height } : undefined}
    >
      <canvas ref={canvasRef} className="block" />
      {dims && (
        <PageAnnotations
          pageNumber={pageNumber}
          annotations={annotations}
          activeTool={activeTool}
          stampLabel={stampLabel}
          signatureDataUrl={signatureDataUrl}
          ocrText={ocrText}
          showOcrOverlay={showOcrOverlay}
          onAddAnnotation={onAddAnnotation}
          onAnnotationClick={onAnnotationClick}
        />
      )}
    </div>
  );
}

export function PdfDocumentView({
  data,
  scale = 1,
  annotations,
  activeTool,
  stampLabel,
  signatureDataUrl,
  ocrPages,
  showOcrOverlay,
  onAddAnnotation,
  onAnnotationClick,
  className,
}: PdfDocumentViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdf(null);
    setPageCount(0);

    pdfjsLib
      .getDocument({ data: data.slice(0) })
      .promise.then((doc) => {
        if (cancelled) return;
        setPdf(doc);
        setPageCount(doc.numPages);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load PDF");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-4 items-center w-full", className)}>
        <Skeleton className="min-h-[50vh] w-full max-w-full aspect-[8.5/11]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!pdf) return null;

  return (
    <div ref={containerRef} className={cn("flex w-full max-w-full flex-col gap-4 sm:gap-6 items-center", className)}>
      {Array.from({ length: pageCount }, (_, index) => (
        <PdfPage
          key={index}
          pdf={pdf}
          pageNumber={index + 1}
          scale={scale}
          containerWidth={containerWidth}
          annotations={annotations}
          activeTool={activeTool}
          stampLabel={stampLabel}
          signatureDataUrl={signatureDataUrl}
          ocrText={ocrPages?.[index + 1]?.text}
          showOcrOverlay={showOcrOverlay}
          onAddAnnotation={(partial) => onAddAnnotation({ ...partial, documentId: "" })}
          onAnnotationClick={onAnnotationClick}
        />
      ))}
      <p className="text-xs text-muted-foreground tabular-nums pb-4">
        {pageCount} {pageCount === 1 ? "page" : "pages"}
      </p>
    </div>
  );
}
