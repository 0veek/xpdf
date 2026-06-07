import { diffLines } from "diff";
import { extractFullText } from "./text";
import type { CompareResult } from "./types";

export async function compareDocuments(
  dataA: ArrayBuffer,
  dataB: ArrayBuffer,
  nameA: string,
  nameB: string
): Promise<CompareResult> {
  const [textA, textB] = await Promise.all([
    extractFullText(dataA),
    extractFullText(dataB),
  ]);

  const changes = diffLines(textA, textB);
  const added: string[] = [];
  const removed: string[] = [];
  let unchanged = 0;

  for (const part of changes) {
    const lines = part.value.split("\n").filter(Boolean);
    if (part.added) added.push(...lines.slice(0, 50));
    else if (part.removed) removed.push(...lines.slice(0, 50));
    else unchanged += lines.length;
  }

  const { getPageCount } = await import("./operations");
  const [pageCountA, pageCountB] = await Promise.all([
    getPageCount(dataA),
    getPageCount(dataB),
  ]);

  return {
    docAName: nameA,
    docBName: nameB,
    textDiff: { added, removed, unchanged },
    pageCountA,
    pageCountB,
  };
}

export async function renderPagePair(
  dataA: ArrayBuffer,
  dataB: ArrayBuffer,
  pageIndex: number,
  scale = 1.25
): Promise<{ canvasA: HTMLCanvasElement | null; canvasB: HTMLCanvasElement | null }> {
  const { renderPageToCanvas } = await import("./text");
  const { getPageCount } = await import("./operations");

  const [countA, countB] = await Promise.all([getPageCount(dataA), getPageCount(dataB)]);

  const canvasA = pageIndex < countA ? await renderPageToCanvas(dataA, pageIndex, scale) : null;
  const canvasB = pageIndex < countB ? await renderPageToCanvas(dataB, pageIndex, scale) : null;

  return { canvasA, canvasB };
}
