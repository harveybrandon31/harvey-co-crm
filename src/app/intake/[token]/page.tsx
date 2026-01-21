import { validateIntakeLink } from "@/lib/intake/actions";
import IntakeForm from "@/components/intake/IntakeForm";
import { DEMO_MODE } from "@/lib/mock-data";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // In demo mode, allow any token for testing
  const result = DEMO_MODE
    ? {
        valid: true,
        linkId: "demo-link-id",
        clientId: null,
        email: "demo@example.com",
        prefillFirstName: "Demo",
        prefillLastName: "User"
      }
    : await validateIntakeLink(token);

  if (!result.valid) {
    return (
      <div className="text-center py-12">
        <div className="bg-white shadow rounded-lg p-8 max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Link Invalid or Expired
          </h2>
          <p className="text-gray-600 mb-6">{result.error}</p>
          <p className="text-sm text-gray-500">
            Please contact Harvey & Co Financial Services if you believe this is
            an error or need a new intake link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to Your Tax Intake
        </h1>
        <p className="mt-2 text-gray-600">
          Please complete the following information to get started with your tax
          preparation. Your data is encrypted and securely stored.
        </p>
      </div>

      <IntakeForm
        token={token}
        linkId={result.linkId!}
        clientId={result.clientId}
        prefillData={{
          email: result.email || undefined,
          firstName: result.prefillFirstName || undefined,
          lastName: result.prefillLastName || undefined,
        }}
      />
    </div>
  );
}
