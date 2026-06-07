export type AnnotationType =
  | "highlight"
  | "underline"
  | "sticky"
  | "draw"
  | "stamp"
  | "redaction"
  | "signature";

export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NormalizedPoint = { x: number; y: number };

export type AnnotationComment = {
  id: string;
  author: string;
  body: string;
  createdAt: number;
};

export type Annotation = {
  id: string;
  documentId: string;
  pageNumber: number;
  type: AnnotationType;
  rect: NormalizedRect;
  color: string;
  text?: string;
  paths?: NormalizedPoint[];
  stampLabel?: string;
  signatureDataUrl?: string;
  comments?: AnnotationComment[];
  createdAt: number;
};

export type DocumentKind = "pdf" | "xhtml";

export type StoredDocument = {
  id: string;
  name: string;
  data: ArrayBuffer;
  pageCount: number;
  fileSize: number;
  kind?: DocumentKind;
  createdAt: number;
  updatedAt: number;
  ocrPages?: Record<number, { text: string; confidence: number }>;
  formValues?: Record<string, string | boolean>;
};

export type DocumentMeta = Omit<StoredDocument, "data">;

export type AnnotateTool = AnnotationType | "select";

export type FormFieldInfo = {
  name: string;
  type: string;
  value?: string | boolean;
  options?: string[];
};

export type CompareResult = {
  docAName: string;
  docBName: string;
  textDiff: { added: string[]; removed: string[]; unchanged: number };
  pageCountA: number;
  pageCountB: number;
};

export type AutomationPreset = {
  id: string;
  name: string;
  action: "export-png" | "export-jpg" | "export-text" | "watermark" | "scrub-metadata";
  options?: Record<string, string>;
  createdAt: number;
};

export const ANNOTATION_COLORS = {
  highlight: "rgba(255, 213, 0, 0.4)",
  underline: "rgba(255, 59, 48, 0.8)",
  sticky: "rgba(255, 204, 0, 0.95)",
  draw: "rgba(0, 122, 255, 0.9)",
  stamp: "rgba(255, 59, 48, 0.85)",
  redaction: "rgba(0, 0, 0, 1)",
  signature: "transparent",
} as const;

export const STAMP_PRESETS = ["APPROVED", "DRAFT", "CONFIDENTIAL", "REVIEWED", "VOID"] as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadZip(files: { name: string; blob: Blob }[]) {
  // Simple multi-download fallback when zip not available
  for (const f of files) {
    downloadBlob(f.blob, f.name);
    await new Promise((r) => setTimeout(r, 300));
  }
}

export function baseName(filename: string): string {
  return filename.replace(/\.pdf$/i, "");
}
