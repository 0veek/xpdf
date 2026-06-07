"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/stores/document-store";
import { ALL_DOCUMENT_ACCEPT } from "@/lib/documents/kind";
import { importDocumentsFromFiles } from "@/lib/documents/import";
import { Upload } from "lucide-react";

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { importFile, importBuffer } = useDocumentStore();

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const result = await importDocumentsFromFiles(Array.from(files), {
        importFile,
        importBuffer,
      });
      if (!result) {
        toast.error("Unsupported file type");
        return;
      }
      toast.success(result.message);
      router.push(result.href);
    } catch {
      toast.error("Import failed");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        className="sm:hidden rounded-full border-border/30 bg-muted/20 hover:bg-muted/40"
        onClick={() => inputRef.current?.click()}
        aria-label="Import file"
      >
        <Upload className="size-3.5" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex gap-1.5 rounded-full px-3.5 h-8 border-border/30 bg-muted/20 hover:bg-muted/40 transition-all font-semibold text-xs text-foreground/90 shadow-sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5 text-muted-foreground/80" />
        Import
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ALL_DOCUMENT_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </>
  );
}
