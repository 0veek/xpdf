import { createWorker, type Worker } from "tesseract.js";

let worker: Worker | null = null;
let currentLang = "";

async function getWorker(lang: string): Promise<Worker> {
  if (worker && currentLang === lang) return worker;
  if (worker) {
    await worker.terminate();
    worker = null;
  }
  worker = await createWorker(lang);
  currentLang = lang;
  return worker;
}

export async function ocrCanvas(
  canvas: HTMLCanvasElement,
  lang = "eng",
  onProgress?: (pct: number) => void
): Promise<{ text: string; confidence: number }> {
  const w = await getWorker(lang);
  const result = await w.recognize(canvas);
  if (onProgress) onProgress(100);
  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
  };
}

export async function terminateOcrWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
    currentLang = "";
  }
}

export const OCR_LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "deu", label: "German" },
  { code: "fra", label: "French" },
  { code: "spa", label: "Spanish" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
] as const;
