"use client";

import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { primaryNav } from "@/lib/navigation";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const navigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search actions and workspaces…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {primaryNav.map((item) => (
            <CommandItem
              key={item.href + item.title}
              onSelect={() => navigate(item.href)}
            >
              <item.icon />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate("/files")}>
            <span>Import document</span>
            <CommandShortcut>⌘O</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/xhtml")}>
            <span>XHTML editor</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/organize")}>
            <span>Organize pages</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
