"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocumentStore } from "@/stores/document-store";
import { getDocument } from "@/lib/db/indexed-db";
import { compareDocuments, renderPagePair } from "@/lib/pdf/compare";
import type { CompareResult, StoredDocument } from "@/lib/pdf/types";

export function CompareWorkspace() {
  const [docAId, setDocAId] = useState("");
  const [docBId, setDocBId] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [page, setPage] = useState(0);
  const [visualA, setVisualA] = useState<string | null>(null);
  const [visualB, setVisualB] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { documents, loadDocuments } = useDocumentStore();
  const [docAData, setDocAData] = useState<ArrayBuffer | null>(null);
  const [docBData, setDocBData] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const runCompare = async () => {
    if (!docAId || !docBId) {
      toast.error("Select two documents");
      return;
    }
    setBusy(true);
    try {
      const docA = (await getDocument(docAId)) as StoredDocument | undefined;
      const docB = (await getDocument(docBId)) as StoredDocument | undefined;
      if (!docA || !docB) throw new Error("Document not found");

      setDocAData(docA.data.slice(0));
      setDocBData(docB.data.slice(0));

      const metaA = documents.find((d) => d.id === docAId)!;
      const metaB = documents.find((d) => d.id === docBId)!;
      const cmp = await compareDocuments(docA.data, docB.data, metaA.name, metaB.name);
      setResult(cmp);
      setPage(0);
      toast.success("Comparison complete");
    } catch {
      toast.error("Comparison failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!docAData || !docBData) return;
    renderPagePair(docAData, docBData, page, 1.25).then(({ canvasA, canvasB }) => {
      setVisualA(canvasA?.toDataURL() ?? null);
      setVisualB(canvasB?.toDataURL() ?? null);
    });
  }, [docAData, docBData, page]);

  const maxPages = result ? Math.max(result.pageCountA, result.pageCountB) : 0;

  return (
    <AppShell title="Compare">
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Compare documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Side-by-side visual and text diff</p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Document A</Label>
            <Select value={docAId} onValueChange={(v) => v && setDocAId(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {documents.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Document B</Label>
            <Select value={docBId} onValueChange={(v) => v && setDocBId(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {documents.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runCompare} disabled={busy}>Compare</Button>
        </div>

        {result && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Pages A" value={result.pageCountA} />
              <Stat label="Pages B" value={result.pageCountB} />
              <Stat label="Lines added" value={result.textDiff.added.length} />
              <Stat label="Lines removed" value={result.textDiff.removed.length} />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span className="text-xs tabular-nums">Page {page + 1} / {maxPages}</span>
              <Button variant="outline" size="sm" disabled={page >= maxPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-2 truncate">{result.docAName}</p>
                {visualA ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={visualA} alt="Doc A" className="rounded border w-full" />
                ) : (
                  <div className="aspect-[3/4] bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">No page</div>
                )}
              </div>
              <div>
                <p className="text-xs font-medium mb-2 truncate">{result.docBName}</p>
                {visualB ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={visualB} alt="Doc B" className="rounded border w-full" />
                ) : (
                  <div className="aspect-[3/4] bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">No page</div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <DiffPanel title="Removed" lines={result.textDiff.removed} color="text-destructive" />
              <DiffPanel title="Added" lines={result.textDiff.added} color="text-green-600 dark:text-green-400" />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DiffPanel({ title, lines, color }: { title: string; lines: string[]; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{title}</Label>
      <ScrollArea className="h-48 rounded-lg border p-3">
        {lines.length === 0 ? (
          <p className="text-xs text-muted-foreground">None</p>
        ) : (
          <ul className={`flex flex-col gap-1 text-xs font-mono ${color}`}>
            {lines.map((l, i) => (
              <li key={i}>{l.slice(0, 120)}</li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
