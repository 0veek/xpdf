"use client";

import { useState } from "react";
import { PanelRight } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { InspectorPanel } from "@/components/layout/inspector-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [inspectorOpen, setInspectorOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen className="h-screen w-full max-w-full overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-col overflow-hidden bg-background">
        <AppTopbar title={title} breadcrumbs={breadcrumbs} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="min-w-0 flex-1 overflow-auto bg-background/30">{children}</main>
          {showInspector && (
            <InspectorPanel>{inspectorContent}</InspectorPanel>
          )}
        </div>
        {showInspector && inspectorContent && (
          <>
            <Button
              type="button"
              size="sm"
              className="fixed bottom-4 right-4 z-30 gap-1.5 rounded-full shadow-lg lg:hidden"
              onClick={() => setInspectorOpen(true)}
            >
              <PanelRight className="size-3.5" />
              Panel
            </Button>
            <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
              <SheetContent side="right" className="w-full sm:max-w-sm p-0">
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle className="text-sm">Inspector</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-auto p-4">{inspectorContent}</div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
