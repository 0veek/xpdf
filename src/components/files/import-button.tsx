"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/stores/document-store";
import { imagesToPdf } from "@/lib/pdf/operations";
import { Upload } from "lucide-react";

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { importFile, importBuffer } = useDocumentStore();

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const list = Array.from(files);
      const pdfs = list.filter((f) => f.type === "application/pdf");
      const images = list.filter((f) => f.type.startsWith("image/"));

      if (pdfs.length > 0) {
        const id = await importFile(pdfs[0]);
        toast.success(`Imported ${pdfs[0].name}`);
        router.push(`/editor/${id}`);
        return;
      }

      if (images.length > 0) {
        const data = await imagesToPdf(images);
        const name =
          images.length === 1
            ? `${images[0].name.replace(/\.\w+$/, "")}.pdf`
            : "Images.pdf";
        const id = await importBuffer(name, data);
        toast.success(`Created PDF from ${images.length} image(s)`);
        router.push(`/editor/${id}`);
      }
    } catch {
      toast.error("Import failed");
    }
  };

  return (
    <>
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
        accept="application/pdf,image/png,image/jpeg"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </>
  );
}
