"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AutomationWorkspace = dynamic(
  () => import("@/components/workspaces/automation-workspace").then((m) => m.AutomationWorkspace),
  { ssr: false, loading: () => <Skeleton className="m-6 h-96 w-full max-w-lg" /> }
);

export default function AutomationPage() {
  return <AutomationWorkspace />;
}
