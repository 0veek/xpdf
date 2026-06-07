"use client";

import { cn } from "@/lib/utils";

type MacWindowControlsProps = {
  className?: string;
};

export function MacWindowControls({ className }: MacWindowControlsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-1 py-2 group/mac-controls select-none",
        className
      )}
    >
      {/* Red Dot (Close) */}
      <div
        className="relative flex size-3 items-center justify-center rounded-full bg-[#FF5F56] border border-[#E0443E] transition-all cursor-pointer shadow-sm active:bg-[#E0443E]"
        aria-label="Close"
      >
        <span className="absolute text-[8px] font-semibold text-[#4C0002] opacity-0 group-hover/mac-controls:opacity-100 transition-opacity pointer-events-none -mt-[0.5px]">
          ×
        </span>
      </div>

      {/* Yellow Dot (Minimize) */}
      <div
        className="relative flex size-3 items-center justify-center rounded-full bg-[#FFBD2E] border border-[#DEA123] transition-all cursor-pointer shadow-sm active:bg-[#DEA123]"
        aria-label="Minimize"
      >
        <span className="absolute text-[8px] font-semibold text-[#5C3E00] opacity-0 group-hover/mac-controls:opacity-100 transition-opacity pointer-events-none -mt-[2px]">
          –
        </span>
      </div>

      {/* Green Dot (Zoom) */}
      <div
        className="relative flex size-3 items-center justify-center rounded-full bg-[#27C93F] border border-[#1AAB29] transition-all cursor-pointer shadow-sm active:bg-[#1AAB29]"
        aria-label="Zoom"
      >
        <span className="absolute text-[6px] font-bold text-[#003D00] opacity-0 group-hover/mac-controls:opacity-100 transition-opacity pointer-events-none -mt-[0.5px]">
          +
        </span>
      </div>
    </div>
  );
}
