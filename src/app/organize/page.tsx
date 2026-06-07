"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FileDropzone } from "@/components/files/file-dropzone";
import { useDocumentStore } from "@/stores/document-store";
import { toast } from "sonner";
import { imagesToPdf } from "@/lib/pdf/operations";

export default function OrganizeIndexPage() {
  const router = useRouter();
  const { documents, loadDocuments, importFile, importBuffer } = useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (documents.length === 1) {
      router.replace(`/organize/${documents[0].id}`);
    }
  }, [documents, router]);

  const handleImport = async (files: File[]) => {
    try {
      const pdfs = files.filter((f) => f.type === "application/pdf");
      if (pdfs.length > 0) {
        const id = await importFile(pdfs[0]);
        router.push(`/organize/${id}`);
        return;
      }
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length > 0) {
        const data = await imagesToPdf(images);
        const id = await importBuffer("Images.pdf", data);
        router.push(`/organize/${id}`);
      }
    } catch {
      toast.error("Import failed");
    }
  };

  return (
    <AppShell title="Organize">
      <div className="p-6 max-w-xl flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Select a document from Files, or import one to organize pages.
        </p>
        {documents.length > 0 && (
          <ul className="flex flex-col gap-1">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => router.push(`/organize/${doc.id}`)}
                >
                  {doc.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <FileDropzone onFiles={handleImport} label="Import PDF to organize" />
      </div>
    </AppShell>
  );
}
