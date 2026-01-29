import DocumentUploadPage from "./DocumentUploadPage";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <DocumentUploadPage token={token} />;
}
