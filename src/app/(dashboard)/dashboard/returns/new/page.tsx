import { createClient } from "@/lib/supabase/server";
import TaxReturnForm from "@/components/TaxReturnForm";
import { createTaxReturn } from "../actions";
import type { Client } from "@/lib/types";

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("status", "active")
    .order("last_name", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Tax Return</h1>
      <TaxReturnForm
        clients={(clients as Client[]) || []}
        defaultClientId={params.client_id}
        action={createTaxReturn}
        submitLabel="Create Return"
      />
    </div>
  );
}
