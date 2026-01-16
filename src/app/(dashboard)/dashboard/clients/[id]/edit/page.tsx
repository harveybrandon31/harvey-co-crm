import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ClientForm from "@/components/ClientForm";
import { updateClient } from "../../actions";
import type { Client } from "@/lib/types";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) {
    notFound();
  }

  const updateClientWithId = updateClient.bind(null, id);

  return (
    <div>
      <Link
        href={`/dashboard/clients/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Client
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-6">
        Edit {(client as Client).first_name} {(client as Client).last_name}
      </h1>
      <ClientForm
        client={client as Client}
        action={updateClientWithId}
        submitLabel="Save Changes"
      />
    </div>
  );
}
