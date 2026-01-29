import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import DocumentList from "@/components/DocumentList";
import { mockClients, mockDocuments, mockTaxReturns, DEMO_MODE } from "@/lib/mock-data";
import type { Client } from "@/lib/types";

interface DocumentWithRelations {
  id: string;
  created_at: string;
  name: string;
  file_path: string;
  mime_type: string | null;
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

  let clients: Client[] = [];
  let documents: DocumentWithRelations[] = [];
  let taxReturns: { id: string; tax_year: number; return_type: string }[] = [];

  if (DEMO_MODE) {
    clients = mockClients.filter((c) => c.status === "active");

    documents = mockDocuments.map((doc) => {
      const client = mockClients.find((c) => c.id === doc.client_id);
      const taxReturn = doc.tax_return_id
        ? mockTaxReturns.find((r) => r.id === doc.tax_return_id)
        : null;
      return {
        ...doc,
        clients: {
          id: client?.id || "",
          first_name: client?.first_name || "",
          last_name: client?.last_name || "",
        },
        tax_returns: taxReturn
          ? { id: taxReturn.id, tax_year: taxReturn.tax_year, return_type: taxReturn.return_type }
          : null,
      };
    });

    if (params.client_id) {
      documents = documents.filter((d) => d.clients.id === params.client_id);
      taxReturns = mockTaxReturns
        .filter((r) => r.client_id === params.client_id)
        .map((r) => ({ id: r.id, tax_year: r.tax_year, return_type: r.return_type }));
    }

    if (params.return_id) {
      documents = documents.filter((d) => d.tax_returns?.id === params.return_id);
    }
  } else {
    const supabase = await createClient();

    // Get clients for the upload form
    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("last_name", { ascending: true });
    clients = (clientsData as Client[]) || [];

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

    const { data: docsData } = await query;
    documents = (docsData as unknown as DocumentWithRelations[]) || [];

    // Get tax returns if client is selected
    if (params.client_id) {
      const { data } = await supabase
        .from("tax_returns")
        .select("id, tax_year, return_type")
        .eq("client_id", params.client_id)
        .order("tax_year", { ascending: false });
      taxReturns = data || [];
    }
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

            <DocumentList documents={documents} />
          </div>
        </div>

        <div>
          <DocumentUploadForm
            clients={clients}
            taxReturns={taxReturns}
            defaultClientId={params.client_id}
            defaultReturnId={params.return_id}
          />
        </div>
      </div>
    </div>
  );
}
