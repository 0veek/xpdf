import { OcrWorkspace } from "@/components/workspaces/ocr-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function OcrDocPage({ params }: PageProps) {
  const { id } = await params;
  return <OcrWorkspace documentId={id} />;
}
