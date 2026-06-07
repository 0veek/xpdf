import { AppShell } from "@/components/layout/app-shell";
import { DocumentPicker } from "@/components/shared/document-picker";

export default function ReviewIndexPage() {
  return (
    <AppShell title="Review">
      <DocumentPicker title="Review" description="Markup, stamps, drawings, and comment threads." basePath="/review" />
    </AppShell>
  );
}
