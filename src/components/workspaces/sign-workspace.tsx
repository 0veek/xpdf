"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignaturePad } from "@/components/sign/signature-pad";
import { useDocumentStore } from "@/stores/document-store";
import { exportWithAnnotations } from "@/lib/pdf/operations";
import { downloadBlob, type AnnotateTool } from "@/lib/pdf/types";
import { Skeleton } from "@/components/ui/skeleton";

const PdfDocumentView = dynamic(
  () => import("@/components/pdf/pdf-document-view").then((m) => m.PdfDocumentView),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full max-w-xl mx-auto" /> }
);

type SignWorkspaceProps = { documentId: string };

export function SignWorkspace({ documentId }: SignWorkspaceProps) {
  const router = useRouter();
  const [signature, setSignature] = useState<string | null>(null);
  const [typedSig, setTypedSig] = useState("");
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [scale] = useState(1.25);

  const {
    currentDocument,
    annotations,
    isLoading,
    openDocument,
    addAnnotation,
  } = useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/sign");
    });
  }, [documentId, openDocument, router]);

  const activeSignature =
    mode === "draw"
      ? signature
      : typedSig
        ? textToSignatureDataUrl(typedSig)
        : null;

  const handleExport = async () => {
    if (!currentDocument) return;
    try {
      const data = await exportWithAnnotations(currentDocument.data, annotations);
      downloadBlob(new Blob([data], { type: "application/pdf" }), currentDocument.name);
      toast.success("Signed PDF exported");
    } catch {
      toast.error("Export failed");
    }
  };

  if (isLoading || !currentDocument) {
    return <AppShell title="Sign"><div className="p-6">Loading…</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Sign", href: "/sign" },
        { label: currentDocument.name },
      ]}
    >
      <div className="flex flex-col lg:flex-row gap-4 p-4 h-full overflow-hidden">
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4 border rounded-lg p-4">
          <h1 className="text-sm font-semibold">Create signature</h1>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "draw" | "type")}>
            <TabsList className="w-full">
              <TabsTrigger value="draw" className="flex-1 text-xs">Draw</TabsTrigger>
              <TabsTrigger value="type" className="flex-1 text-xs">Type</TabsTrigger>
            </TabsList>
            <TabsContent value="draw" className="mt-3">
              <SignaturePad onChange={setSignature} />
            </TabsContent>
            <TabsContent value="type" className="mt-3 flex flex-col gap-2">
              <Label className="text-xs">Your name</Label>
              <Input value={typedSig} onChange={(e) => setTypedSig(e.target.value)} placeholder="John Doe" />
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Click on the document to place your signature.
          </p>
          <Button onClick={handleExport} disabled={!annotations.some((a) => a.type === "signature")}>
            Export signed PDF
          </Button>
        </aside>

        <div className="flex-1 overflow-auto bg-canvas p-4 rounded-lg">
          <PdfDocumentView
            data={currentDocument.data}
            scale={scale}
            annotations={annotations}
            activeTool={"signature" as AnnotateTool}
            signatureDataUrl={activeSignature}
            onAddAnnotation={(partial) => addAnnotation(partial)}
          />
        </div>
      </div>
    </AppShell>
  );
}

function textToSignatureDataUrl(text: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 80;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 300, 80);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillText(text, 16, 50);
  return canvas.toDataURL("image/png");
}
