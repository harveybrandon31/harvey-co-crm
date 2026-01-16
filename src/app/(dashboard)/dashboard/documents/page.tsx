import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import DocumentList from "@/components/DocumentList";
import type { Client } from "@/lib/types";

interface DocumentWithRelations {
  id: string;
  created_at: string;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
  };
  tax_returns: {
    id: string;
    tax_year: number;
    return_type: string;
  } | null;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; return_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get clients for the upload form
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("status", "active")
    .order("last_name", { ascending: true });

  // Get documents with filters
  let query = supabase
    .from("documents")
    .select("*, clients(id, first_name, last_name), tax_returns(id, tax_year, return_type)")
    .order("created_at", { ascending: false });

  if (params.client_id) {
    query = query.eq("client_id", params.client_id);
  }

  if (params.return_id) {
    query = query.eq("tax_return_id", params.return_id);
  }

  const { data: documents } = await query;

  // Get tax returns if client is selected
  let taxReturns: { id: string; tax_year: number; return_type: string }[] = [];
  if (params.client_id) {
    const { data } = await supabase
      .from("tax_returns")
      .select("id, tax_year, return_type")
      .eq("client_id", params.client_id)
      .order("tax_year", { ascending: false });
    taxReturns = data || [];
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <form className="flex gap-4">
                <select
                  name="client_id"
                  defaultValue={params.client_id || ""}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Clients</option>
                  {clients?.map((client: Client) => (
                    <option key={client.id} value={client.id}>
                      {client.last_name}, {client.first_name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Filter
                </button>
                {(params.client_id || params.return_id) && (
                  <Link
                    href="/dashboard/documents"
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </Link>
                )}
              </form>
            </div>

            <DocumentList documents={(documents as unknown as DocumentWithRelations[]) || []} />
          </div>
        </div>

        <div>
          <DocumentUploadForm
            clients={(clients as Client[]) || []}
            taxReturns={taxReturns}
            defaultClientId={params.client_id}
            defaultReturnId={params.return_id}
          />
        </div>
      </div>
    </div>
  );
}
