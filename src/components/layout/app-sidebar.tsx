"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { primaryNav, secondaryNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { state, setOpenMobile } = useSidebar();

  const isCollapsed = state === "collapsed";

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar/40 backdrop-blur-xl border-r border-sidebar-border/50 transition-all duration-200"
    >
      <SidebarHeader className={cn(
        "border-b border-sidebar-border/30 flex flex-col transition-all duration-200",
        isCollapsed ? "p-2 py-4 items-center" : "p-4 pt-3 pb-3 gap-3"
      )}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              className="hover:bg-transparent active:bg-transparent px-1 focus-visible:ring-0"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                <span className="text-sm font-bold tracking-tight">XP</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold tracking-tight text-sm text-foreground">xpdf</span>
                  <span className="text-[10px] font-semibold text-muted-foreground/80">Professional PDF</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-3">
        <SidebarGroup className="p-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {primaryNav.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "rounded-lg px-3 transition-all text-muted-foreground hover:text-foreground font-medium",
                        isActive && "bg-sidebar-accent/80 text-primary hover:text-primary font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5"
                      )}
                    >
                      <item.icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground/80")} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-2">
        <SidebarMenu className="gap-0.5">
          {secondaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "rounded-lg px-3 transition-all text-muted-foreground hover:text-foreground font-medium",
                    isActive && "bg-sidebar-accent/80 text-primary hover:text-primary font-semibold border border-black/5 dark:border-white/5"
                  )}
                >
                  <item.icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground/80")} />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
