"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  label?: string;
};

export function FileDropzone({
  onFiles,
  accept = "application/pdf,image/png,image/jpeg,application/xhtml+xml,text/html,.xhtml,.html,.htm",
  multiple = true,
  className,
  label = "Drop PDF files here, or click to browse",
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      onFiles(Array.from(fileList));
    },
    [onFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "mac-glass flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-9 transition-all duration-300 ease-out cursor-pointer group/dropzone",
        isDragging
          ? "border-primary bg-primary/5 shadow-[0_0_25px_rgba(0,122,255,0.15)] scale-[1.01]"
          : "border-border/60 hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-md hover:scale-[1.005]",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover/dropzone:scale-110 group-hover/dropzone:bg-primary/20 shadow-sm border border-primary/10">
        <Upload className="size-5 text-primary" />
      </div>
      <div className="text-center flex flex-col gap-1">
        <p className="text-sm font-semibold tracking-tight text-foreground/90 group-hover/dropzone:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground/85 font-medium">
          PDF, XHTML, PNG, JPEG · Local in-browser privacy
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
