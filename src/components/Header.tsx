import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { DEMO_MODE } from "@/lib/mock-data";

export default async function Header() {
  let userEmail: string | undefined;

  if (!DEMO_MODE) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email;
  } else {
    userEmail = "demo@harveynco.com";
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-[#F5F3EF] px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search clients, returns..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#2D4A43] focus:ring-2 focus:ring-[#2D4A43]/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#2D4A43] transition-all">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C9A962]"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#2D4A43] flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {userEmail?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {userEmail?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        {!DEMO_MODE && (
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Sign out
            </button>
          </form>
        )}
        {DEMO_MODE && (
          <span className="rounded-lg bg-[#C9A962]/20 border border-[#C9A962]/30 px-3 py-1.5 text-sm font-medium text-[#8B7355]">
            Demo Mode
          </span>
        )}
      </div>
    </header>
  );
}
