import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax Client Intake | Harvey & Co Financial Services",
  description: "Complete your tax information securely",
};

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-background">
      {/* Header */}
      <header className="bg-brand-primary">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-brand-heading text-xl font-semibold text-white tracking-wide">
                Harvey <span className="font-light">&</span> Co
              </h1>
              <p className="text-xs text-white/70 tracking-wider uppercase">
                Financial Services
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">Secure Form</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-brand-primary/5 border-t border-brand-primary/10 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-brand-primary/60">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">Your information is encrypted and securely transmitted</span>
            </div>
            <p className="text-xs text-brand-primary/40">
              &copy; {new Date().getFullYear()} Harvey & Co Financial Services
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
