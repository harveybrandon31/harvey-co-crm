"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function startProcessing(clientId: string): Promise<{ success: boolean; returnId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if client already has a current-year tax return
    const currentYear = new Date().getFullYear();
    const { data: existing } = await supabase
      .from("tax_returns")
      .select("id")
      .eq("client_id", clientId)
      .eq("tax_year", currentYear)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `A ${currentYear} tax return already exists for this client` };
    }

    // Create tax return
    const { data, error } = await supabase
      .from("tax_returns")
      .insert({
        client_id: clientId,
        tax_year: currentYear,
        return_type: "1040",
        status: "not_started",
        due_date: `${currentYear + 1}-04-15`,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating tax return:", error);
      return { success: false, error: error.message };
    }

    // Update client pipeline status
    await supabase
      .from("clients")
      .update({ pipeline_status: "in_preparation", status: "active" })
      .eq("id", clientId);

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/pipeline");

    return { success: true, returnId: data.id };
  } catch (error) {
    console.error("Error starting processing:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
