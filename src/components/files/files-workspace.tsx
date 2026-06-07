"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileDropzone } from "@/components/files/file-dropzone";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentStore } from "@/stores/document-store";
import { formatFileSize, formatRelativeTime } from "@/lib/pdf/types";
import { FileText, Trash2 } from "lucide-react";
import { imagesToPdf } from "@/lib/pdf/operations";

export function FilesWorkspace() {
  const router = useRouter();
  const { documents, loadDocuments, importFile, importBuffer, deleteDocumentById } =
    useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleImport = async (files: File[]) => {
    try {
      const pdfs = files.filter((f) => f.type === "application/pdf");
      const images = files.filter((f) => f.type.startsWith("image/"));

      for (const file of pdfs) {
        const id = await importFile(file);
        toast.success(`Imported ${file.name}`);
        router.push(`/editor/${id}`);
        return;
      }

      if (images.length > 0) {
        const data = await imagesToPdf(images);
        const name = images.length === 1 ? `${images[0].name.replace(/\.\w+$/, "")}.pdf` : "Images.pdf";
        const id = await importBuffer(name, data);
        toast.success(`Created PDF from ${images.length} image(s)`);
        router.push(`/editor/${id}`);
      }
    } catch {
      toast.error("Failed to import file");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-3xl w-full">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Documents are saved locally in your browser. No account required.
        </p>
      </div>

      <FileDropzone onFiles={handleImport} />

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Your documents
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
            No documents yet. Import a PDF to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors group"
              >
                <Link
                  href={`/editor/${doc.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted shrink-0">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatRelativeTime(doc.updatedAt)} · {doc.pageCount} pages · {formatFileSize(doc.fileSize)}
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
