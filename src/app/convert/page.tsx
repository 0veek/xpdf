import { AppShell } from "@/components/layout/app-shell";
import { DocumentPicker } from "@/components/shared/document-picker";

export default function ConvertIndexPage() {
  return (
    <AppShell title="Convert">
      <DocumentPicker
        title="Convert"
        description="Export PDF pages as images or extract text."
        basePath="/convert"
      />
    </AppShell>
  );
}
