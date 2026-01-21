import { createClient } from "@/lib/supabase/server";
import TaxReturnForm from "@/components/TaxReturnForm";
import { createTaxReturn } from "../actions";
import { mockClients, DEMO_MODE } from "@/lib/mock-data";
import type { Client } from "@/lib/types";

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const params = await searchParams;

  let clients: Client[] = [];

  if (DEMO_MODE) {
    clients = mockClients
      .filter((c) => c.status === "active")
      .sort((a, b) => a.last_name.localeCompare(b.last_name));
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("last_name", { ascending: true });
    clients = (data as Client[]) || [];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Tax Return</h1>
      <TaxReturnForm
        clients={clients}
        defaultClientId={params.client_id}
        action={createTaxReturn}
        submitLabel="Create Return"
      />
    </div>
  );
}
