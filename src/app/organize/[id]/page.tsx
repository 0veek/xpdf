import { OrganizeWorkspace } from "@/components/workspaces/organize-workspace";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizeDocumentPage({ params }: PageProps) {
  const { id } = await params;
  return <OrganizeWorkspace documentId={id} />;
}
