"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InspectorPanelProps = {
  children?: React.ReactNode;
};

export function InspectorPanel({ children }: InspectorPanelProps) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l bg-muted/30">
      <Tabs defaultValue="properties" className="flex flex-col h-full">
        <div className="border-b px-3 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="properties" className="flex-1 text-xs">
              Properties
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex-1 text-xs">
              Comments
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 text-xs">
              AI
            </TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <TabsContent value="properties" className="p-3 mt-0">
            {children ?? (
              <p className="text-xs text-muted-foreground">
                Select an object to view properties.
              </p>
            )}
          </TabsContent>
          <TabsContent value="comments" className="p-3 mt-0">
            <p className="text-xs text-muted-foreground">
              No comments on this page.
            </p>
          </TabsContent>
          <TabsContent value="ai" className="p-3 mt-0">
            <p className="text-xs text-muted-foreground">
              Ask AI about the selected content.
            </p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
