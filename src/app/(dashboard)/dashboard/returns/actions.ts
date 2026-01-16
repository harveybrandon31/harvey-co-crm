"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTaxReturn(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const returnData = {
    client_id: formData.get("client_id") as string,
    tax_year: parseInt(formData.get("tax_year") as string),
    return_type: formData.get("return_type") as string,
    status: formData.get("status") as string || "not_started",
    due_date: formData.get("due_date") as string || null,
    extended_due_date: formData.get("extended_due_date") as string || null,
    preparation_fee: formData.get("preparation_fee")
      ? parseFloat(formData.get("preparation_fee") as string)
      : null,
    notes: formData.get("notes") as string || null,
    user_id: user.id,
  };

  const { error } = await supabase.from("tax_returns").insert(returnData);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/returns");
  revalidatePath(`/dashboard/clients/${returnData.client_id}`);
  redirect("/dashboard/returns");
}

export async function updateTaxReturn(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const returnData = {
    client_id: formData.get("client_id") as string,
    tax_year: parseInt(formData.get("tax_year") as string),
    return_type: formData.get("return_type") as string,
    status: formData.get("status") as string,
    due_date: formData.get("due_date") as string || null,
    extended_due_date: formData.get("extended_due_date") as string || null,
    filed_date: formData.get("filed_date") as string || null,
    accepted_date: formData.get("accepted_date") as string || null,
    total_income: formData.get("total_income")
      ? parseFloat(formData.get("total_income") as string)
      : null,
    total_deductions: formData.get("total_deductions")
      ? parseFloat(formData.get("total_deductions") as string)
      : null,
    refund_amount: formData.get("refund_amount")
      ? parseFloat(formData.get("refund_amount") as string)
      : null,
    amount_due: formData.get("amount_due")
      ? parseFloat(formData.get("amount_due") as string)
      : null,
    preparation_fee: formData.get("preparation_fee")
      ? parseFloat(formData.get("preparation_fee") as string)
      : null,
    fee_paid: formData.get("fee_paid") === "on",
    notes: formData.get("notes") as string || null,
  };

  const { error } = await supabase
    .from("tax_returns")
    .update(returnData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/returns");
  revalidatePath(`/dashboard/returns/${id}`);
  revalidatePath(`/dashboard/clients/${returnData.client_id}`);
  redirect(`/dashboard/returns/${id}`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteTaxReturn(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("tax_returns")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/returns");
  redirect("/dashboard/returns");
}
