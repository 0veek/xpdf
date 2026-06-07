import type { AutomationPreset } from "@/lib/pdf/types";

const STORAGE_KEY = "xpdf-automation-presets";

export function getPresets(): AutomationPreset[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as AutomationPreset[];
  } catch {
    return [];
  }
}

export function savePreset(preset: AutomationPreset) {
  const presets = getPresets();
  const idx = presets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function deletePreset(id: string) {
  const presets = getPresets().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export const DEFAULT_PRESETS: AutomationPreset[] = [
  {
    id: "export-all-png",
    name: "Export all pages as PNG",
    action: "export-png",
    createdAt: Date.now(),
  },
  {
    id: "export-text",
    name: "Export text to file",
    action: "export-text",
    createdAt: Date.now(),
  },
  {
    id: "watermark-confidential",
    name: "Add CONFIDENTIAL watermark",
    action: "watermark",
    options: { text: "CONFIDENTIAL" },
    createdAt: Date.now(),
  },
  {
    id: "scrub-meta",
    name: "Scrub document metadata",
    action: "scrub-metadata",
    createdAt: Date.now(),
  },
];
