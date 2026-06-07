import { AppShell } from "@/components/layout/app-shell";
import { DocumentPicker } from "@/components/shared/document-picker";

export default function FormsIndexPage() {
  return (
    <AppShell title="Forms">
      <DocumentPicker title="Forms" description="Fill interactive PDF form fields." basePath="/forms" />
    </AppShell>
  );
}
