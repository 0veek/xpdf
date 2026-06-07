import { AppShell } from "@/components/layout/app-shell";
import { FilesWorkspace } from "@/components/files/files-workspace";

export default function FilesPage() {
  return (
    <AppShell title="Files">
      <FilesWorkspace />
    </AppShell>
  );
}
