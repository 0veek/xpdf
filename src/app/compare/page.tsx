"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CompareWorkspace = dynamic(
  () => import("@/components/workspaces/compare-workspace").then((m) => m.CompareWorkspace),
  { ssr: false, loading: () => <Skeleton className="m-6 h-96 w-full" /> }
);

export default function ComparePage() {
  return <CompareWorkspace />;
}
