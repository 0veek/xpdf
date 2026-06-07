"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDocumentStore } from "@/stores/document-store";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

type DocumentPickerProps = {
  title: string;
  description: string;
  basePath: string;
  children?: React.ReactNode;
};

export function DocumentPicker({ title, description, basePath, children }: DocumentPickerProps) {
  const router = useRouter();
  const { documents, loadDocuments } = useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {children}
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
          No documents yet.{" "}
          <Link href="/files" className="text-primary hover:underline">
            Import a PDF
          </Link>{" "}
          first.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                onClick={() => router.push(`${basePath}/${doc.id}`)}
              >
                <div className="flex size-9 items-center justify-center rounded-md bg-muted shrink-0">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{doc.pageCount} pages</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link href="/files" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}>
        Import new file
      </Link>
    </div>
  );
}

export function DocumentLoading() {
  return <Skeleton className="m-6 h-96 w-full max-w-4xl" />;
}
