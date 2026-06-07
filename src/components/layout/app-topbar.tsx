"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/layout/command-palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ImportButton } from "@/components/files/import-button";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Search } from "lucide-react";

type AppTopbarProps = {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
};

export function AppTopbar({
  title = "xpdf",
  breadcrumbs = [],
}: AppTopbarProps) {
  const [commandOpen, setCommandOpen] = useState(false);

  useKeyboardShortcuts([
    { key: "k", meta: true, handler: () => setCommandOpen(true) },
  ]);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/40 bg-background/40 backdrop-blur-xl px-4 transition-all duration-200">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50 rounded-lg" />
        <Separator orientation="vertical" className="h-4 border-border/40" />

        <div className="min-w-0 flex-1">
        {breadcrumbs.length > 0 ? (
          <Breadcrumb className="hidden sm:flex ml-1">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.label} className="contents">
                  {i > 0 && <BreadcrumbSeparator className="text-muted-foreground/40" />}
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink render={<Link href={crumb.href} />} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-xs font-bold text-foreground">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <span className="text-xs font-bold truncate text-foreground/90 ml-1">{title}</span>
        )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-2 text-muted-foreground/80 bg-muted/20 border-border/30 rounded-full px-3 h-8 shadow-inner hover:bg-muted/40 transition-all text-xs font-medium focus-visible:ring-1"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-3.5 text-muted-foreground/60" />
            <span>Search tools & files...</span>
            <kbd className="pointer-events-none hidden lg:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/40 bg-background/80 px-1.5 font-mono text-[9px] font-bold text-muted-foreground shadow-sm">
              ⌘K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon-sm" className="md:hidden rounded-full hover:bg-muted/50" onClick={() => setCommandOpen(true)}>
            <Search className="size-4 text-muted-foreground" />
          </Button>

          <ImportButton />
          <ThemeToggle />
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
