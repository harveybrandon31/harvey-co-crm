import IntakeForm from "@/components/intake/IntakeForm";

export const metadata = {
  title: "Start Your Tax Intake | Harvey & Co Financial Services",
  description: "Begin your tax preparation journey with Harvey & Co. Complete our secure intake form to get started.",
};

export default function PublicIntakePage() {
  return (
    <div>
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="font-brand-heading text-2xl font-semibold text-[#1A1A1A]">
          Get Started with Your <span className="italic">Tax Preparation</span>
        </h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Welcome to Harvey & Co Financial Services! Please complete the following
          information to begin your tax preparation process. Your data is encrypted
          and securely stored.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-[#2D4A43]/5 border border-[#2D4A43]/10 rounded-xl p-5 mb-8">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-[#2D4A43] mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong className="text-[#2D4A43]">New Client?</strong> Complete this form to start your tax
              preparation. A member of our team will review your information and
              reach out to schedule your consultation.
            </p>
          </div>
        </div>
      </div>

      <IntakeForm
        token="self-service"
        linkId="self-service"
        clientId={null}
        prefillData={{}}
      />
    </div>
  );
}
