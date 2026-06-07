"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocumentStore } from "@/stores/document-store";
import { extractFullText, simpleSummary, keywordHighlight } from "@/lib/pdf/text";
import { baseName, downloadBlob } from "@/lib/pdf/types";

type AiWorkspaceProps = { documentId: string };

export function AiWorkspace({ documentId }: AiWorkspaceProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [keyword, setKeyword] = useState("");
  const [matches, setMatches] = useState<string[]>([]);
  const [stats, setStats] = useState({ words: 0, chars: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  const { currentDocument, isLoading, openDocument } = useDocumentStore();

  useEffect(() => {
    openDocument(documentId).catch(() => {
      toast.error("Document not found");
      router.push("/ai");
    });
  }, [documentId, openDocument, router]);

  useEffect(() => {
    if (!currentDocument) return;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      extractFullText(currentDocument.data)
        .then((t) => {
          if (cancelled) return;
          setText(t);
          const words = t.split(/\s+/).filter(Boolean).length;
          setStats({ words, chars: t.length, pages: currentDocument.pageCount });
          setSummary(simpleSummary(t));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [currentDocument]);

  const searchKeyword = () => {
    setMatches(keywordHighlight(text, keyword));
  };

  const exportSummary = () => {
    if (!currentDocument) return;
    downloadBlob(
      new Blob([`Summary of ${currentDocument.name}\n\n${summary}\n\n---\n\n${text.slice(0, 5000)}`], { type: "text/plain" }),
      `${baseName(currentDocument.name)}-analysis.txt`
    );
  };

  if (isLoading || !currentDocument) {
    return <AppShell title="AI"><div className="p-6">Loading…</div></AppShell>;
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "AI", href: "/ai" }, { label: currentDocument.name }]}
    >
      <div className="flex flex-col gap-6 p-6 max-w-3xl">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Document intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Local text analysis — no cloud, no account. {currentDocument.name}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pages", value: stats.pages },
            { label: "Words", value: stats.words.toLocaleString() },
            { label: "Characters", value: stats.chars.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border p-3 text-center">
              <p className="text-lg font-semibold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-2">
          <Label>Summary</Label>
          <p className="text-sm text-muted-foreground rounded-lg border p-4 min-h-[80px]">
            {loading ? "Analyzing…" : summary || "No extractable text found."}
          </p>
          <Button variant="outline" size="sm" className="w-fit" onClick={exportSummary}>
            Export analysis
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <Label>Keyword search</Label>
          <div className="flex gap-2">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search in document…"
              onKeyDown={(e) => e.key === "Enter" && searchKeyword()}
            />
            <Button onClick={searchKeyword}>Search</Button>
          </div>
          {matches.length > 0 && (
            <ScrollArea className="h-40 rounded-lg border p-3">
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                {matches.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </section>

        {currentDocument.ocrPages && Object.keys(currentDocument.ocrPages).length > 0 && (
          <section className="flex flex-col gap-2">
            <Label>OCR text available</Label>
            <p className="text-xs text-muted-foreground">
              {Object.keys(currentDocument.ocrPages).length} pages have OCR data from the OCR workspace.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
