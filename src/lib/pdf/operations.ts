import { PDFDocument, rgb, degrees } from "pdf-lib";
import type { Annotation } from "./types";
import { ANNOTATION_COLORS } from "./types";

export async function loadPdf(data: ArrayBuffer) {
  return PDFDocument.load(data, { ignoreEncryption: true });
}

export async function getPageCount(data: ArrayBuffer): Promise<number> {
  const pdf = await loadPdf(data);
  return pdf.getPageCount();
}

export async function reorderPages(data: ArrayBuffer, order: number[]): Promise<ArrayBuffer> {
  const src = await loadPdf(data);
  const dst = await PDFDocument.create();
  const pages = await dst.copyPages(src, order);
  pages.forEach((p) => dst.addPage(p));
  return (await dst.save()).buffer as ArrayBuffer;
}

export async function rotatePages(
  data: ArrayBuffer,
  pageIndices: number[],
  rotation: 90 | 180 | 270
): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  for (const idx of pageIndices) {
    const page = pdf.getPage(idx);
    const current = page.getRotation().angle;
    page.setRotation(degrees(current + rotation));
  }
  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function deletePages(data: ArrayBuffer, indices: number[]): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  const toDelete = [...indices].sort((a, b) => b - a);
  for (const idx of toDelete) {
    pdf.removePage(idx);
  }
  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function extractPages(data: ArrayBuffer, indices: number[]): Promise<ArrayBuffer> {
  const src = await loadPdf(data);
  const dst = await PDFDocument.create();
  const pages = await dst.copyPages(src, indices);
  pages.forEach((p) => dst.addPage(p));
  return (await dst.save()).buffer as ArrayBuffer;
}

export async function mergePdfs(buffers: ArrayBuffer[]): Promise<ArrayBuffer> {
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const pdf = await loadPdf(buf);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return (await merged.save()).buffer as ArrayBuffer;
}

export async function imagesToPdf(files: File[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const isPng = file.type === "image/png";
    const image = isPng
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return (await pdf.save()).buffer as ArrayBuffer;
}

function parseRgba(color: string) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb(1, 0.84, 0);
  return rgb(+match[1] / 255, +match[2] / 255, +match[3] / 255);
}

export async function exportWithAnnotations(
  data: ArrayBuffer,
  annotations: Annotation[]
): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  const pages = pdf.getPages();

  for (const ann of annotations) {
    const page = pages[ann.pageNumber - 1];
    if (!page) continue;

    const { width, height } = page.getSize();
    const x = ann.rect.x * width;
    const y = height - (ann.rect.y + ann.rect.height) * height;
    const w = ann.rect.width * width;
    const h = ann.rect.height * height;
    const color = parseRgba(ann.color || ANNOTATION_COLORS[ann.type]);

    if (ann.type === "highlight") {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color,
        opacity: 0.35,
        borderWidth: 0,
      });
    } else if (ann.type === "underline") {
      page.drawLine({
        start: { x, y: y + 2 },
        end: { x: x + w, y: y + 2 },
        thickness: 2,
        color,
      });
    } else if (ann.type === "sticky" && ann.text) {
      page.drawRectangle({
        x,
        y,
        width: Math.max(w, 120),
        height: Math.max(h, 60),
        color: rgb(1, 0.95, 0.6),
        opacity: 0.9,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.7, 0.2),
      });
      page.drawText(ann.text.slice(0, 200), {
        x: x + 6,
        y: y + Math.max(h, 60) - 16,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: Math.max(w, 120) - 12,
        lineHeight: 11,
      });
    } else if (ann.type === "redaction") {
      page.drawRectangle({ x, y, width: w, height: h, color: rgb(0, 0, 0), borderWidth: 0 });
    } else if (ann.type === "stamp" && ann.stampLabel) {
      page.drawRectangle({
        x,
        y,
        width: Math.max(w, 100),
        height: Math.max(h, 30),
        borderWidth: 2,
        borderColor: rgb(0.9, 0.2, 0.2),
        color: rgb(1, 1, 1),
        opacity: 0,
      });
      page.drawText(ann.stampLabel, {
        x: x + 8,
        y: y + Math.max(h, 30) / 2,
        size: 14,
        color: rgb(0.9, 0.2, 0.2),
      });
    } else if (ann.type === "draw" && ann.paths && ann.paths.length > 1) {
      const color = parseRgba(ann.color);
      for (let i = 1; i < ann.paths.length; i++) {
        const p0 = ann.paths[i - 1];
        const p1 = ann.paths[i];
        page.drawLine({
          start: { x: p0.x * width, y: height - p0.y * height },
          end: { x: p1.x * width, y: height - p1.y * height },
          thickness: 2,
          color,
        });
      }
    } else if (ann.type === "signature" && ann.signatureDataUrl) {
      try {
        const base64 = ann.signatureDataUrl.split(",")[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const image = await pdf.embedPng(bytes);
        page.drawImage(image, { x, y, width: w, height: h });
      } catch {
        // Invalid signature image
      }
    }
  }

  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function renderPageThumbnail(
  data: ArrayBuffer,
  pageIndex: number,
  maxWidth = 120
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const { renderPdfPageToCanvas } = await import("./render");

  const pdf = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
  const page = await pdf.getPage(pageIndex + 1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / baseViewport.width;

  const canvas = document.createElement("canvas");
  await renderPdfPageToCanvas(page, canvas, scale);
  return canvas.toDataURL("image/jpeg", 0.7);
}
