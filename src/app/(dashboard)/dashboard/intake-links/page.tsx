import { getIntakeLinks } from "@/lib/intake/actions";
import CreateIntakeLinkForm from "@/components/intake/CreateIntakeLinkForm";
import IntakeLinksList from "@/components/intake/IntakeLinksList";
import { DEMO_MODE, mockIntakeLinks } from "@/lib/mock-data";

export default async function IntakeLinksPage() {
  let links = null;

  if (DEMO_MODE) {
    links = mockIntakeLinks;
  } else {
    const result = await getIntakeLinks();
    links = result.data;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Links</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate secure links for new clients to submit their tax information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Create New Link
            </h2>
            <CreateIntakeLinkForm />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              How it works
            </h3>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Generate a unique secure link</li>
              <li>Send the link to your client via email</li>
              <li>Client completes the intake questionnaire</li>
              <li>Review their information in your dashboard</li>
            </ol>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Links
              </h2>
            </div>
            <IntakeLinksList links={links || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
