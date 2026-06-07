import { AppShell } from "@/components/layout/app-shell";
import { HomeDashboard } from "@/components/home/home-dashboard";

export default function HomePage() {
  return (
    <AppShell title="Home">
      <HomeDashboard />
    </AppShell>
  );
}
