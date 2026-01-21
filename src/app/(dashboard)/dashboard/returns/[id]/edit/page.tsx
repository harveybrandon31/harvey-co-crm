import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TaxReturnForm from "@/components/TaxReturnForm";
import { updateTaxReturn } from "../../actions";
import { mockClients, mockTaxReturns, DEMO_MODE } from "@/lib/mock-data";
import type { TaxReturn, Client } from "@/lib/types";

export default async function EditReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let taxReturn: TaxReturn | null = null;
  let clients: Client[] = [];

  if (DEMO_MODE) {
    taxReturn = mockTaxReturns.find((r) => r.id === id) || null;
    clients = [...mockClients].sort((a, b) => a.last_name.localeCompare(b.last_name));
  } else {
    const supabase = await createClient();

    const [{ data: returnData }, { data: clientsData }] = await Promise.all([
      supabase.from("tax_returns").select("*").eq("id", id).single(),
      supabase
        .from("clients")
        .select("*")
        .order("last_name", { ascending: true }),
    ]);

    taxReturn = returnData as TaxReturn;
    clients = (clientsData as Client[]) || [];
  }

  if (!taxReturn) {
    notFound();
  }

  const updateReturnWithId = updateTaxReturn.bind(null, id);

  return (
    <div>
      <Link
        href={`/dashboard/returns/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Return
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-6">
        Edit {(taxReturn as TaxReturn).tax_year} {(taxReturn as TaxReturn).return_type}
      </h1>
      <TaxReturnForm
        taxReturn={taxReturn as TaxReturn}
        clients={(clients as Client[]) || []}
        action={updateReturnWithId}
        submitLabel="Save Changes"
      />
    </div>
  );
}
