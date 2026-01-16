export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Harvey & Co Financial Services
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Client Relationship Management
        </p>
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
          <p className="text-gray-700 mb-4">
            Welcome to your CRM dashboard. This system helps you manage clients,
            track tax preparations, and streamline your workflow.
          </p>
          <div className="text-sm text-gray-500">
            Next.js + Tailwind CSS + Supabase
          </div>
        </div>
      </main>
    </div>
  );
}
