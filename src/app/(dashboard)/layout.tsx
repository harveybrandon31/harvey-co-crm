import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { DEMO_MODE } from "@/lib/mock-data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Skip auth check in demo mode
  if (!DEMO_MODE) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
  }

  return (
    <div className="flex h-screen bg-[#F5F3EF]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
