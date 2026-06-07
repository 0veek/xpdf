"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileDropzone } from "@/components/files/file-dropzone";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentStore } from "@/stores/document-store";
import { editorHref, getDocumentKind, ALL_DOCUMENT_ACCEPT } from "@/lib/documents/kind";
import { importDocumentsFromFiles } from "@/lib/documents/import";
import { BLANK_XHTML, textToArrayBuffer } from "@/lib/xhtml/utils";
import { formatFileSize, formatRelativeTime } from "@/lib/pdf/types";
import { Code2, FileText, Plus, Trash2 } from "lucide-react";

export function FilesWorkspace() {
  const router = useRouter();
  const { documents, loadDocuments, importFile, importBuffer, deleteDocumentById } =
    useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleImport = async (files: File[]) => {
    try {
      const result = await importDocumentsFromFiles(files, { importFile, importBuffer });
      if (!result) {
        toast.error("Unsupported file type");
        return;
      }
      toast.success(result.message);
      router.push(result.href);
    } catch {
      toast.error("Failed to import file");
    }
  };

  const handleCreateBlankXhtml = async () => {
    try {
      const id = await importBuffer("Untitled.xhtml", textToArrayBuffer(BLANK_XHTML), "xhtml");
      toast.success("Created blank XHTML document");
      router.push(`/xhtml/${id}`);
    } catch {
      toast.error("Failed to create document");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-3xl w-full">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground mt-1">
          PDF and XHTML documents are saved locally in your browser. No account required.
        </p>
      </div>

      <FileDropzone
        onFiles={handleImport}
        accept={ALL_DOCUMENT_ACCEPT}
        label="Drop PDF or XHTML files here, or click to browse"
      />

      <Button variant="outline" size="sm" className="w-fit gap-1.5 text-xs" onClick={handleCreateBlankXhtml}>
        <Plus className="size-3.5" />
        New blank XHTML
      </Button>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Your documents
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
            No documents yet. Import a PDF or XHTML file to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors group"
              >
                <Link
                  href={editorHref(doc.id, doc)}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted shrink-0">
                    {getDocumentKind(doc) === "xhtml" ? (
                      <Code2 className="size-4 text-muted-foreground" />
                    ) : (
                      <FileText className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatRelativeTime(doc.updatedAt)}
                      {getDocumentKind(doc) === "pdf" ? ` · ${doc.pageCount} pages` : " · XHTML"}
                      {" · "}
                      {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                  onClick={async (e) => {
                    e.preventDefault();
                    await deleteDocumentById(doc.id);
                    toast.success("Document deleted");
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function FilesWorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
