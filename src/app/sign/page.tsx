import { AppShell } from "@/components/layout/app-shell";
import { DocumentPicker } from "@/components/shared/document-picker";

export default function SignIndexPage() {
  return (
    <AppShell title="Sign">
      <DocumentPicker title="Sign" description="Draw or type a signature and place it on your PDF." basePath="/sign" />
    </AppShell>
  );
}
