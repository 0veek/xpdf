import { AppShell } from "@/components/layout/app-shell";
import { DocumentPicker } from "@/components/shared/document-picker";

export default function ProtectIndexPage() {
  return (
    <AppShell title="Protect">
      <DocumentPicker title="Protect" description="Redact, watermark, and scrub metadata." basePath="/protect" />
    </AppShell>
  );
}
