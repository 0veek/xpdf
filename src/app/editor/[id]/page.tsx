import { EditorWorkspace } from "@/components/workspaces/editor-workspace";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditorDocumentPage({ params }: PageProps) {
  const { id } = await params;
  return <EditorWorkspace documentId={id} />;
}
