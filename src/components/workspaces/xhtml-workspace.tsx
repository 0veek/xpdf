"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XhtmlCodeEditor } from "@/components/xhtml/xhtml-code-editor";
import { useDocumentStore } from "@/stores/document-store";
import {
  arrayBufferToText,
  formatXhtml,
  textToArrayBuffer,
  validateXhtml,
} from "@/lib/xhtml/utils";
import { downloadBlob } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";
import { AlignLeft, Download, Eye, Save, Wand2 } from "lucide-react";

type XhtmlWorkspaceProps = { documentId: string };

export function XhtmlWorkspace({ documentId }: XhtmlWorkspaceProps) {
  const router = useRouter();
  const { currentDocument, isLoading, openDocument, updateDocumentData } = useDocumentStore();
  const [source, setSource] = useState("");
  const [savedSource, setSavedSource] = useState("");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/files");
    });
  }, [documentId, openDocument, router]);

  useEffect(() => {
    if (!currentDocument) return;
    const text = arrayBufferToText(currentDocument.data);
    setSource(text);
    setSavedSource(text);
  }, [currentDocument]);

  const validation = useMemo(() => validateXhtml(source), [source]);
  const isDirty = source !== savedSource;

  const handleSave = useCallback(async () => {
    if (!currentDocument) return;
    if (!validation.valid) {
      toast.error("Fix XML errors before saving");
      return;
    }
    try {
      await updateDocumentData(textToArrayBuffer(source), 1);
      setSavedSource(source);
      toast.success("XHTML saved");
    } catch {
      toast.error("Failed to save");
    }
  }, [currentDocument, source, validation.valid, updateDocumentData]);

  const handleExport = useCallback(() => {
    if (!currentDocument) return;
    if (!validation.valid) {
      toast.error("Fix XML errors before exporting");
      return;
    }
    downloadBlob(
      new Blob([source], { type: "application/xhtml+xml" }),
      currentDocument.name.endsWith(".xhtml") ? currentDocument.name : `${currentDocument.name}.xhtml`
    );
    toast.success("XHTML exported");
  }, [currentDocument, source, validation.valid]);

  const handleFormat = () => {
    setSource((prev) => formatXhtml(prev));
    toast.success("Document formatted");
  };

  if (isLoading || !currentDocument) {
    return (
      <AppShell title="XHTML Editor">
        <Skeleton className="m-4 h-[calc(100vh-8rem)] w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Files", href: "/files" },
        { label: currentDocument.name },
      ]}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
          <Button variant="outline" size="sm" onClick={handleFormat} className="text-xs gap-1.5">
            <Wand2 className="size-3.5" />
            Format
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || !validation.valid}
            className="text-xs gap-1.5"
          >
            <Save className="size-3.5" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="text-xs gap-1.5">
            <Download className="size-3.5" />
            Export
          </Button>
          <div className="ml-auto flex items-center gap-2 text-xs">
            {validation.valid ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Valid XML</span>
            ) : (
              <span className="text-destructive font-medium max-w-[40vw] truncate" title={validation.error}>
                Invalid: {validation.error}
              </span>
            )}
            {isDirty && <span className="text-muted-foreground">Unsaved changes</span>}
          </div>
        </div>

        {/* Desktop: side-by-side */}
        <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-2">
          <div className="flex min-h-0 flex-col border-r">
            <div className="flex items-center gap-1.5 border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <AlignLeft className="size-3.5" />
              Source
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <XhtmlCodeEditor value={source} onChange={setSource} />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center gap-1.5 border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Eye className="size-3.5" />
              Preview
            </div>
            <XhtmlPreview source={source} valid={validation.valid} className="flex-1" />
          </div>
        </div>

        {/* Mobile: tabs */}
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "edit" | "preview")}
          className="flex min-h-0 flex-1 flex-col lg:hidden"
        >
          <TabsList className="mx-3 mt-2 w-fit">
            <TabsTrigger value="edit" className="text-xs">Edit</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <XhtmlCodeEditor value={source} onChange={setSource} />
          </TabsContent>
          <TabsContent value="preview" className="mt-0 min-h-0 flex-1">
            <XhtmlPreview source={source} valid={validation.valid} className="h-full" />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function XhtmlPreview({
  source,
  valid,
  className,
}: {
  source: string;
  valid: boolean;
  className?: string;
}) {
  if (!valid) {
    return (
      <div className={cn("flex items-center justify-center p-6 text-sm text-muted-foreground", className)}>
        Fix XML errors to preview the document.
      </div>
    );
  }

  return (
    <iframe
      title="XHTML preview"
      sandbox="allow-same-origin"
      srcDoc={source}
      className={cn("w-full border-0 bg-white", className)}
    />
  );
}
