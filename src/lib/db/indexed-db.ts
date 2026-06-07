import type { Annotation, DocumentMeta, StoredDocument } from "@/lib/pdf/types";

const DB_NAME = "xpdf";
const DB_VERSION = 1;

type StoreName = "documents" | "annotations";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("annotations")) {
        const store = db.createObjectStore("annotations", { keyPath: "id" });
        store.createIndex("documentId", "documentId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);

    if (result instanceof Promise) {
      result.then(resolve).catch(reject);
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error);
      return;
    }

    result.onsuccess = () => resolve(result.result);
    result.onerror = () => reject(result.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllDocumentsMeta() {
  const db = await openDb();
  return new Promise<DocumentMeta[]>((resolve, reject) => {
    const tx = db.transaction("documents", "readonly");
    const store = tx.objectStore("documents");
    const request = store.getAll();

    request.onsuccess = () => {
      const docs = (request.result as StoredDocument[])
        .map((doc) => {
          const meta = { ...doc } as Partial<StoredDocument>;
          delete meta.data;
          return meta as DocumentMeta;
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(docs);
      db.close();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDocument(id: string) {
  return withStore<StoredDocument | undefined>("documents", "readonly", (store) => store.get(id));
}

export async function saveDocument(doc: StoredDocument) {
  return withStore("documents", "readwrite", (store) => store.put(doc));
}

export async function deleteDocument(id: string) {
  await withStore("documents", "readwrite", (store) => store.delete(id));
  const annotations = await getAnnotations(id);
  for (const ann of annotations) {
    await withStore("annotations", "readwrite", (store) => store.delete(ann.id));
  }
}

export async function getAnnotations(documentId: string) {
  const db = await openDb();
  return new Promise<Annotation[]>((resolve, reject) => {
    const tx = db.transaction("annotations", "readonly");
    const store = tx.objectStore("annotations");
    const index = store.index("documentId");
    const request = index.getAll(documentId);

    request.onsuccess = () => {
      resolve(request.result as Annotation[]);
      db.close();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveAnnotation(annotation: Annotation) {
  return withStore("annotations", "readwrite", (store) => store.put(annotation));
}

export async function deleteAnnotation(id: string) {
  return withStore("annotations", "readwrite", (store) => store.delete(id));
}

export async function replaceAnnotations(documentId: string, annotations: Annotation[]) {
  const existing = await getAnnotations(documentId);
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("annotations", "readwrite");
    const store = tx.objectStore("annotations");
    for (const ann of existing) {
      store.delete(ann.id);
    }
    for (const ann of annotations) {
      store.put(ann);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
