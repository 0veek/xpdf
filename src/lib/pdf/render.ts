import type { PDFPageProxy } from "pdfjs-dist";

export type PageDimensions = { width: number; height: number };

export function getDevicePixelRatio() {
  return typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
}

export async function renderPdfPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number,
  options?: { pixelRatio?: number }
): Promise<PageDimensions> {
  const pixelRatio = options?.pixelRatio ?? getDevicePixelRatio();
  const displayViewport = page.getViewport({ scale });
  const renderViewport = page.getViewport({ scale: scale * pixelRatio });

  canvas.width = renderViewport.width;
  canvas.height = renderViewport.height;
  canvas.style.width = `${displayViewport.width}px`;
  canvas.style.height = `${displayViewport.height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  await page.render({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

  return { width: displayViewport.width, height: displayViewport.height };
}
