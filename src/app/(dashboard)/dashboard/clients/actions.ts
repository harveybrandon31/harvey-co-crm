"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function addClient(formData: FormData) {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const clientData = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    email: formData.get("email") as string || null,
    phone: formData.get("phone") as string || null,
    address_street: formData.get("address_street") as string || null,
    address_city: formData.get("address_city") as string || null,
    address_state: formData.get("address_state") as string || null,
    address_zip: formData.get("address_zip") as string || null,
    ssn_last_four: formData.get("ssn_last_four") as string || null,
    filing_status: formData.get("filing_status") as string || null,
    status: formData.get("status") as string || "active",
    notes: formData.get("notes") as string || null,
    user_id: user.id,
  };

  const { error } = await supabase.from("clients").insert(clientData);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const clientData = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    email: formData.get("email") as string || null,
    phone: formData.get("phone") as string || null,
    address_street: formData.get("address_street") as string || null,
    address_city: formData.get("address_city") as string || null,
    address_state: formData.get("address_state") as string || null,
    address_zip: formData.get("address_zip") as string || null,
    ssn_last_four: formData.get("ssn_last_four") as string || null,
    filing_status: formData.get("filing_status") as string || null,
    status: formData.get("status") as string || "active",
    notes: formData.get("notes") as string || null,
  };

  const { error } = await supabase
    .from("clients")
    .update(clientData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  redirect(`/dashboard/clients/${id}`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteClient(id: string, formData: FormData) {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}
