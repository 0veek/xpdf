import type { DocumentKind, StoredDocument } from "@/lib/pdf/types";

const XHTML_EXTENSIONS = /\.(xhtml|html?|xml)$/i;

export function isXhtmlFilename(name: string): boolean {
  return XHTML_EXTENSIONS.test(name);
}

export function getDocumentKind(doc: Pick<StoredDocument, "name" | "kind">): DocumentKind {
  if (doc.kind) return doc.kind;
  return isXhtmlFilename(doc.name) ? "xhtml" : "pdf";
}

export function editorHref(id: string, doc: Pick<StoredDocument, "name" | "kind">): string {
  return getDocumentKind(doc) === "xhtml" ? `/xhtml/${id}` : `/editor/${id}`;
}

export const XHTML_ACCEPT =
  "application/xhtml+xml,text/html,application/xml,text/xml,.xhtml,.html,.htm,.xml";

export const ALL_DOCUMENT_ACCEPT = `application/pdf,image/png,image/jpeg,${XHTML_ACCEPT}`;
