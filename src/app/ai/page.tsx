import { AppShell } from "@/components/layout/app-shell";
import { DocumentPicker } from "@/components/shared/document-picker";

export default function AiIndexPage() {
  return (
    <AppShell title="AI">
      <DocumentPicker title="Document intelligence" description="Local summarization, stats, and keyword search." basePath="/ai" />
    </AppShell>
  );
}
