import { create } from "zustand";
import {
  deleteDocument as dbDeleteDocument,
  getAllDocumentsMeta,
  getAnnotations,
  getDocument,
  saveAnnotation,
  saveDocument,
  replaceAnnotations,
  deleteAnnotation as dbDeleteAnnotation,
} from "@/lib/db/indexed-db";
import { isXhtmlFilename } from "@/lib/documents/kind";
import { getPageCount } from "@/lib/pdf/operations";
import type {
  Annotation,
  AnnotationComment,
  DocumentKind,
  DocumentMeta,
  StoredDocument,
} from "@/lib/pdf/types";

type HistoryEntry = {
  annotations: Annotation[];
};

type DocumentState = {
  documents: DocumentMeta[];
  currentDocument: StoredDocument | null;
  annotations: Annotation[];
  history: HistoryEntry[];
  historyIndex: number;
  isLoading: boolean;

  loadDocuments: () => Promise<void>;
  importFile: (file: File) => Promise<string>;
  importBuffer: (name: string, data: ArrayBuffer, kind?: DocumentKind) => Promise<string>;
  openDocument: (id: string) => Promise<void>;
  updateDocumentData: (data: ArrayBuffer, pageCount?: number) => Promise<void>;
  deleteDocumentById: (id: string) => Promise<void>;
  closeDocument: () => void;

  addAnnotation: (annotation: Omit<Annotation, "id" | "createdAt">) => Promise<void>;
  removeAnnotation: (id: string) => Promise<void>;
  updateAnnotationText: (id: string, text: string) => Promise<void>;
  addComment: (annotationId: string, body: string) => Promise<void>;
  saveOcrPages: (pages: Record<number, { text: string; confidence: number }>) => Promise<void>;
  saveFormValues: (values: Record<string, string | boolean>) => Promise<void>;
  setAnnotations: (annotations: Annotation[]) => void;

  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

function pushHistory(
  history: HistoryEntry[],
  historyIndex: number,
  annotations: Annotation[]
) {
  const trimmed = history.slice(0, historyIndex + 1);
  trimmed.push({ annotations: structuredClone(annotations) });
  return { history: trimmed, historyIndex: trimmed.length - 1 };
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocument: null,
  annotations: [],
  history: [],
  historyIndex: -1,
  isLoading: false,

  loadDocuments: async () => {
    const documents = await getAllDocumentsMeta();
    set({ documents });
  },

  importFile: async (file: File) => {
    const data = await file.arrayBuffer();
    return get().importBuffer(file.name, data);
  },

  importBuffer: async (name: string, data: ArrayBuffer, kind?: DocumentKind) => {
    const resolvedKind = kind ?? (isXhtmlFilename(name) ? "xhtml" : "pdf");
    const pageCount = resolvedKind === "xhtml" ? 1 : await getPageCount(data);
    const id = crypto.randomUUID();
    const now = Date.now();
    const doc: StoredDocument = {
      id,
      name,
      data,
      pageCount,
      fileSize: data.byteLength,
      kind: resolvedKind,
      createdAt: now,
      updatedAt: now,
    };
    await saveDocument(doc);
    await get().loadDocuments();
    return id;
  },

  openDocument: async (id: string) => {
    set({ isLoading: true });
    const doc = (await getDocument(id)) as StoredDocument | undefined;
    if (!doc) {
      set({ isLoading: false });
      throw new Error("Document not found");
    }
    const annotations = await getAnnotations(id);
    set({
      currentDocument: doc,
      annotations,
      history: [{ annotations: structuredClone(annotations) }],
      historyIndex: 0,
      isLoading: false,
    });
  },

  updateDocumentData: async (data: ArrayBuffer, pageCount?: number) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const count =
      pageCount ??
      (currentDocument.kind === "xhtml" || isXhtmlFilename(currentDocument.name)
        ? 1
        : await getPageCount(data));
    const updated: StoredDocument = {
      ...currentDocument,
      data,
      pageCount: count,
      fileSize: data.byteLength,
      updatedAt: Date.now(),
    };
    await saveDocument(updated);
    set({ currentDocument: updated });
    await get().loadDocuments();
  },

  deleteDocumentById: async (id: string) => {
    await dbDeleteDocument(id);
    const { currentDocument } = get();
    if (currentDocument?.id === id) {
      set({ currentDocument: null, annotations: [], history: [], historyIndex: -1 });
    }
    await get().loadDocuments();
  },

  closeDocument: () => {
    set({ currentDocument: null, annotations: [], history: [], historyIndex: -1 });
  },

  addAnnotation: async (partial) => {
    const { currentDocument, annotations } = get();
    if (!currentDocument) return;

    const annotation: Annotation = {
      ...partial,
      documentId: currentDocument.id,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    const next = [...annotations, annotation];
    await saveAnnotation(annotation);
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, next);
    set({ annotations: next, history, historyIndex });
  },

  removeAnnotation: async (id: string) => {
    const next = get().annotations.filter((a) => a.id !== id);
    await dbDeleteAnnotation(id);
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, next);
    set({ annotations: next, history, historyIndex });
  },

  updateAnnotationText: async (id: string, text: string) => {
    const next = get().annotations.map((a) => (a.id === id ? { ...a, text } : a));
    const updated = next.find((a) => a.id === id);
    if (updated) await saveAnnotation(updated);
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, next);
    set({ annotations: next, history, historyIndex });
  },

  addComment: async (annotationId: string, body: string) => {
    const comment: AnnotationComment = {
      id: crypto.randomUUID(),
      author: "You",
      body,
      createdAt: Date.now(),
    };
    const next = get().annotations.map((a) =>
      a.id === annotationId
        ? { ...a, comments: [...(a.comments ?? []), comment] }
        : a
    );
    const updated = next.find((a) => a.id === annotationId);
    if (updated) await saveAnnotation(updated);
    const { history, historyIndex } = pushHistory(get().history, get().historyIndex, next);
    set({ annotations: next, history, historyIndex });
  },

  saveOcrPages: async (pages) => {
    const { currentDocument } = get();
    if (!currentDocument) return;
    const updated: StoredDocument = {
      ...currentDocument,
      ocrPages: pages,
      updatedAt: Date.now(),
    };
    await saveDocument(updated);
    set({ currentDocument: updated });
    await get().loadDocuments();
  },

  saveFormValues: async (values) => {
    const { currentDocument } = get();
    if (!currentDocument) return;
    const updated: StoredDocument = {
      ...currentDocument,
      formValues: values,
      updatedAt: Date.now(),
    };
    await saveDocument(updated);
    set({ currentDocument: updated });
    await get().loadDocuments();
  },

  setAnnotations: (annotations) => set({ annotations }),

  undo: async () => {
    const { historyIndex, history, currentDocument } = get();
    if (historyIndex <= 0 || !currentDocument) return;
    const newIndex = historyIndex - 1;
    const snapshot = structuredClone(history[newIndex].annotations);
    await replaceAnnotations(currentDocument.id, snapshot);
    set({ annotations: snapshot, historyIndex: newIndex });
  },

  redo: async () => {
    const { historyIndex, history, currentDocument } = get();
    if (historyIndex >= history.length - 1 || !currentDocument) return;
    const newIndex = historyIndex + 1;
    const snapshot = structuredClone(history[newIndex].annotations);
    await replaceAnnotations(currentDocument.id, snapshot);
    set({ annotations: snapshot, historyIndex: newIndex });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));
