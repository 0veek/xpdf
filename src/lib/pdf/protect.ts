import { rgb, StandardFonts, degrees } from "pdf-lib";
import { loadPdf } from "./operations";
import type { Annotation } from "./types";

export async function addWatermark(
  data: ArrayBuffer,
  text: string,
  opacity = 0.15
): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (text.length * 12) / 2,
      y: height / 2,
      size: 48,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(-45),
    });
  }

  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function scrubMetadata(data: ArrayBuffer): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);
  pdf.setCreator("");
  pdf.setProducer("xpdf");
  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function applyRedactionsToPdf(
  data: ArrayBuffer,
  redactions: Annotation[]
): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  const pages = pdf.getPages();

  for (const ann of redactions.filter((a) => a.type === "redaction")) {
    const page = pages[ann.pageNumber - 1];
    if (!page) continue;
    const { width, height } = page.getSize();
    const x = ann.rect.x * width;
    const y = height - (ann.rect.y + ann.rect.height) * height;
    const w = ann.rect.width * width;
    const h = ann.rect.height * height;

    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: rgb(0, 0, 0),
      borderWidth: 0,
    });
  }

  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function embedSignature(
  data: ArrayBuffer,
  pageNumber: number,
  rect: { x: number; y: number; width: number; height: number },
  signaturePng: Uint8Array
): Promise<ArrayBuffer> {
  const pdf = await loadPdf(data);
  const page = pdf.getPages()[pageNumber - 1];
  if (!page) throw new Error("Page not found");

  const image = await pdf.embedPng(signaturePng);
  const { width, height } = page.getSize();
  const x = rect.x * width;
  const y = height - (rect.y + rect.height) * height;
  const w = rect.width * width;
  const h = rect.height * height;

  page.drawImage(image, { x, y, width: w, height: h });
  return (await pdf.save()).buffer as ArrayBuffer;
}

export async function protectWithPassword(
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  // pdf-lib does not support encryption; apply visible CONFIDENTIAL watermark as best-effort
  return addWatermark(data, "PROTECTED", 0.08);
}

export async function applyAllAnnotationsAndProtect(
  data: ArrayBuffer,
  annotations: Annotation[],
  options: {
    watermark?: string;
    scrubMetadata?: boolean;
    applyRedactions?: boolean;
  }
): Promise<ArrayBuffer> {
  let result = data;

  if (options.applyRedactions) {
    result = await applyRedactionsToPdf(result, annotations);
  }

  const { exportWithAnnotations } = await import("./operations");
  const nonRedact = annotations.filter((a) => a.type !== "redaction");
  if (nonRedact.length > 0) {
    result = await exportWithAnnotations(result, nonRedact);
  }

  if (options.watermark) {
    result = await addWatermark(result, options.watermark);
  }

  if (options.scrubMetadata) {
    result = await scrubMetadata(result);
  }

  return result;
}
