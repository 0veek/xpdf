import { XhtmlWorkspace } from "@/components/workspaces/xhtml-workspace";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function XhtmlDocumentPage({ params }: PageProps) {
  const { id } = await params;
  return <XhtmlWorkspace documentId={id} />;
}
