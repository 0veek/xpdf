export async function extractTextFromPdf(data: ArrayBuffer): Promise<{ page: number; text: string }[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
  const results: { page: number; text: string }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    results.push({ page: i, text });
  }

  return results;
}

export async function extractFullText(data: ArrayBuffer): Promise<string> {
  const pages = await extractTextFromPdf(data);
  return pages.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n");
}

export async function renderPageToCanvas(
  data: ArrayBuffer,
  pageIndex: number,
  scale = 2
): Promise<HTMLCanvasElement> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas;
}

export async function renderPageToBlob(
  data: ArrayBuffer,
  pageIndex: number,
  format: "png" | "jpeg" = "png",
  scale = 2
): Promise<Blob> {
  const canvas = await renderPageToCanvas(data, pageIndex, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      format === "png" ? "image/png" : "image/jpeg",
      0.92
    );
  });
}

export function simpleSummary(text: string, maxSentences = 5): string {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  return sentences.slice(0, maxSentences).join(". ") + (sentences.length ? "." : "");
}

export function keywordHighlight(text: string, keyword: string): string[] {
  if (!keyword.trim()) return [];
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const start = Math.max(0, m.index - 40);
    const end = Math.min(text.length, m.index + keyword.length + 40);
    matches.push("…" + text.slice(start, end) + "…");
    if (matches.length >= 20) break;
  }
  return matches;
}
