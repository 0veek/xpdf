import { ReviewWorkspace } from "@/components/workspaces/review-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function ReviewDocPage({ params }: PageProps) {
  const { id } = await params;
  return <ReviewWorkspace documentId={id} />;
}
