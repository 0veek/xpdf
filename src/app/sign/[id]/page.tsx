import { SignWorkspace } from "@/components/workspaces/sign-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function SignDocPage({ params }: PageProps) {
  const { id } = await params;
  return <SignWorkspace documentId={id} />;
}
