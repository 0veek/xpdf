import { AppShell } from "@/components/layout/app-shell";
import { DocumentPicker } from "@/components/shared/document-picker";

export default function OcrIndexPage() {
  return (
    <AppShell title="OCR">
      <DocumentPicker title="OCR" description="Recognize scanned text with Tesseract.js." basePath="/ocr" />
    </AppShell>
  );
}
