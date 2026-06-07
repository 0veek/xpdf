"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { InspectorPanel } from "@/components/layout/inspector-panel";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  showInspector?: boolean;
  inspectorContent?: React.ReactNode;
};

export function AppShell({
  children,
  title,
  breadcrumbs,
  showInspector = false,
  inspectorContent,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen className="h-screen w-screen overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden bg-background">
        <AppTopbar title={title} breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto bg-background/30">{children}</main>
          {showInspector && (
            <InspectorPanel>{inspectorContent}</InspectorPanel>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
