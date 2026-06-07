import {
  FileText,
  FolderOpen,
  GitCompare,
  Home,
  LayoutGrid,
  PenLine,
  RefreshCw,
  ScanText,
  Settings,
  Shield,
  Signature,
  Sparkles,
  Workflow,
  Code2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const primaryNav: NavItem[] = [
  { title: "Home", href: "/", icon: Home, description: "Recent files and quick actions" },
  { title: "Files", href: "/files", icon: FolderOpen, description: "Import and manage documents" },
  { title: "Editor", href: "/files", icon: PenLine, description: "View, annotate, export PDFs" },
  { title: "XHTML", href: "/xhtml", icon: Code2, description: "Edit XHTML and XML documents" },
  { title: "Organize", href: "/organize", icon: LayoutGrid, description: "Reorder, rotate, merge pages" },
  { title: "Convert", href: "/convert", icon: RefreshCw, description: "Export images and text" },
  { title: "OCR", href: "/ocr", icon: ScanText, description: "Recognize scanned text" },
  { title: "Forms", href: "/forms", icon: FileText, description: "Fill PDF form fields" },
  { title: "Sign", href: "/sign", icon: Signature, description: "Draw and place signatures" },
  { title: "Review", href: "/review", icon: PenLine, description: "Markup, stamps, comments" },
  { title: "Protect", href: "/protect", icon: Shield, description: "Redact, watermark, metadata" },
  { title: "Compare", href: "/compare", icon: GitCompare, description: "Diff two documents" },
  { title: "AI", href: "/ai", icon: Sparkles, description: "Summarize and search locally" },
  { title: "Automation", href: "/automation", icon: Workflow, description: "Batch presets" },
];

export const secondaryNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings, description: "Appearance and shortcuts" },
];

export type AnnotateTool = "highlight" | "underline" | "sticky" | "draw" | "stamp" | "redaction" | "signature" | "select";
