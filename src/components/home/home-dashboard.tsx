"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDropzone } from "@/components/files/file-dropzone";
import { useDocumentStore } from "@/stores/document-store";
import { formatFileSize, formatRelativeTime } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { editorHref, getDocumentKind } from "@/lib/documents/kind";
import { importDocumentsFromFiles } from "@/lib/documents/import";
import { BLANK_XHTML, textToArrayBuffer } from "@/lib/xhtml/utils";
import {
  GitCompare,
  PenLine,
  RefreshCw,
  ScanText,
  Shield,
  Signature,
  Sparkles,
  Workflow,
  FileText,
  ChevronRight,
  Plus,
} from "lucide-react";

export function HomeDashboard() {
  const router = useRouter();
  const { documents, loadDocuments, importFile, importBuffer } = useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleImport = async (files: File[]) => {
    try {
      const result = await importDocumentsFromFiles(files, { importFile, importBuffer });
      if (!result) {
        toast.error("Unsupported file type");
        return;
      }
      router.push(result.href);
    } catch {
      toast.error("Import failed");
    }
  };

  const handleCreateBlankXhtml = async () => {
    try {
      const id = await importBuffer("Untitled.xhtml", textToArrayBuffer(BLANK_XHTML), "xhtml");
      router.push(`/xhtml/${id}`);
      toast.success("Created blank XHTML document");
    } catch {
      toast.error("Failed to create XHTML document");
    }
  };

  const handleCreateBlankA4 = async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      pdf.addPage([595.276, 841.89]); // A4 in points
      const data = (await pdf.save()).buffer as ArrayBuffer;
      const id = await importBuffer("Blank A4.pdf", data);
      router.push(`/editor/${id}`);
      toast.success("Created new blank A4 PDF");
    } catch {
      toast.error("Failed to create blank document");
    }
  };

  const handleCreateBlankLetter = async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      pdf.addPage([612, 792]); // Letter in points
      const data = (await pdf.save()).buffer as ArrayBuffer;
      const id = await importBuffer("Blank Letter.pdf", data);
      router.push(`/editor/${id}`);
      toast.success("Created new blank US Letter PDF");
    } catch {
      toast.error("Failed to create blank document");
    }
  };

  const recent = documents.slice(0, 4);

  const workspaces = [
    { href: "/convert", label: "Convert", icon: RefreshCw, color: "text-blue-500 bg-blue-500/10 border-blue-500/10" },
    { href: "/ocr", label: "OCR", icon: ScanText, color: "text-purple-500 bg-purple-500/10 border-purple-500/10" },
    { href: "/forms", label: "Forms", icon: FileText, color: "text-amber-500 bg-amber-500/10 border-amber-500/10" },
    { href: "/sign", label: "Sign", icon: Signature, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10" },
    { href: "/review", label: "Review", icon: PenLine, color: "text-rose-500 bg-rose-500/10 border-rose-500/10" },
    { href: "/protect", label: "Protect", icon: Shield, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/10" },
    { href: "/compare", label: "Compare", icon: GitCompare, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/10" },
    { href: "/ai", label: "AI Tools", icon: Sparkles, color: "text-violet-500 bg-violet-500/10 border-violet-500/10" },
    { href: "/automation", label: "Automation", icon: Workflow, color: "text-orange-500 bg-orange-500/10 border-orange-500/10" },
  ];

  return (
    <div className="flex flex-col min-h-full justify-between gap-6 sm:gap-12 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* 2-Column Main Workspace */}
      <div className="grid lg:grid-cols-5 gap-8 items-start flex-1 w-full">
        
        {/* Left Column (3/5 width): Headers, dropzone, and templates */}
        <div className="lg:col-span-3 flex flex-col gap-6 w-full">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80 bg-clip-text text-transparent">
              Your documents, understood.
            </h1>
            <p className="text-xs text-muted-foreground/80 font-semibold max-w-xl">
              A premium browser-based PDF suite. No cloud uploads, no logins. Everything runs securely on your device.
            </p>
          </section>

          <FileDropzone onFiles={handleImport} className="w-full shadow-sm" />

          {/* Quick Start templates section */}
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Quick Start Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleCreateBlankA4}
                className="flex items-center gap-3 rounded-xl p-3 bg-muted/20 border border-border/20 hover:bg-muted/40 hover:border-border/30 transition-all text-left group cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                  <Plus className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">Blank A4</p>
                  <p className="text-[9px] text-muted-foreground/80 truncate">Start A4 blank page</p>
                </div>
              </button>

              <button
                onClick={handleCreateBlankLetter}
                className="flex items-center gap-3 rounded-xl p-3 bg-muted/20 border border-border/20 hover:bg-muted/40 hover:border-border/30 transition-all text-left group cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                  <Plus className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">US Letter</p>
                  <p className="text-[9px] text-muted-foreground/80 truncate">Start US Letter page</p>
                </div>
              </button>

              <button
                onClick={handleCreateBlankXhtml}
                className="flex items-center gap-3 rounded-xl p-3 bg-muted/20 border border-border/20 hover:bg-muted/40 hover:border-border/30 transition-all text-left group cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                  <Plus className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">Blank XHTML</p>
                  <p className="text-[9px] text-muted-foreground/80 truncate">Edit structured markup</p>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column (2/5 width): Recents OR Onboarding card */}
        <div className="lg:col-span-2 w-full lg:sticky lg:top-4">
          {recent.length > 0 ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Recent Documents
                </h2>
                <Link
                  href="/files"
                  className="flex items-center gap-0.5 text-xs font-bold text-primary hover:underline transition-all"
                >
                  <span>All files</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recent.map((doc) => (
                  <Link
                    key={doc.id}
                    href={editorHref(doc.id, doc)}
                    className="flex flex-col items-center gap-3 rounded-2xl p-3 bg-muted/15 border border-border/10 hover:bg-muted/30 hover:border-border/30 transition-all duration-300 group text-center cursor-pointer shadow-sm"
                  >
                    {/* macOS-style PDF Preview Icon */}
                    <div className="relative w-12 h-16 bg-background dark:bg-card rounded-md border border-border/50 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 overflow-hidden flex flex-col items-center justify-between py-1 shrink-0">
                      <div className={cn(
                        "absolute top-1 left-0 right-0 text-[6px] font-black text-white text-center py-0.5 tracking-wider uppercase select-none",
                        getDocumentKind(doc) === "xhtml" ? "bg-blue-600" : "bg-red-600"
                      )}>
                        {getDocumentKind(doc) === "xhtml" ? "XHTML" : "PDF"}
                      </div>
                      <div className="w-6 h-[1.5px] bg-muted-foreground/15 rounded-full mt-4"></div>
                      <div className="w-8 h-[1.5px] bg-muted-foreground/15 rounded-full"></div>
                      <div className="w-5 h-[1.5px] bg-muted-foreground/15 rounded-full mb-1"></div>
                    </div>

                    <div className="flex flex-col gap-0.5 w-full min-w-0">
                      <p className="text-[11px] font-bold text-foreground/90 truncate w-full group-hover:text-primary transition-colors">
                        {doc.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground/80 font-medium tabular-nums">
                        {doc.pageCount} pages · {formatFileSize(doc.fileSize)}
                      </p>
                      <p className="text-[8px] text-muted-foreground/60 font-medium mt-0.5">
                        {formatRelativeTime(doc.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="flex flex-col gap-4">
              <div className="border-b border-border/30 pb-2">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Getting Started
                </h2>
              </div>
              
              <div className="mac-glass rounded-2xl p-5 border border-border/30 flex flex-col gap-4 shadow-sm bg-muted/10">
                <ul className="flex flex-col gap-4 text-xs">
                  <li className="flex gap-3">
                    <div className="size-5.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 text-[10px] font-black border border-blue-500/10">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground/90 text-[11px]">Drop or Import a PDF</h4>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-normal">
                        Drag any PDF or photo here. Convert images directly to high-quality PDFs.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="size-5.5 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 text-[10px] font-black border border-purple-500/10">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground/90 text-[11px]">Use Launchpad tools</h4>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-normal">
                        Edit annotations, sign, compare pages, redact confidential data, or use local AI tools.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="size-5.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 text-[10px] font-black border border-emerald-500/10">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground/90 text-[11px]">Secure Offline Environment</h4>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-normal">
                        Files are parsed local-only. No telemetry, no backend, absolute privacy.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>

      </div>

      {/* macOS-style Bottom Dock */}
      <div className="mt-auto pt-6 border-t border-border/30 w-full flex flex-col gap-3.5 items-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Quick Actions Launchpad
        </span>
        <div className="mac-glass rounded-[24px] p-2 flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar select-none shadow-[0_12px_45px_rgba(0,0,0,0.08)] border border-white/10 dark:border-white/5 bg-background/20 backdrop-blur-2xl">
          {workspaces.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mac-dock-item flex flex-col items-center justify-center gap-1 w-[70px] h-[70px] rounded-[18px] hover:bg-primary/[0.04] transition-all group relative"
              title={item.label}
            >
              <div className={cn(
                "flex size-10 items-center justify-center rounded-[12px] shadow-sm border transition-all",
                item.color
              )}>
                <item.icon className="size-4.5 transition-transform group-hover:scale-105" />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[62px] tracking-tight">
                {item.label}
              </span>
              
              {/* Active dot indicator on hover */}
              <div className="absolute bottom-1.5 size-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-40 w-full max-w-xl rounded-2xl" />
    </div>
  );
}
