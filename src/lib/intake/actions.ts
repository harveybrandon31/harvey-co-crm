"use server";

import { createClient } from "@/lib/supabase/server";
import { generateIntakeToken, generateIntakeUrl, getExpirationDate } from "./tokens";
import { revalidatePath } from "next/cache";

export interface CreateIntakeLinkInput {
  email?: string;
  prefillFirstName?: string;
  prefillLastName?: string;
  expiresInDays?: number;
}

export interface IntakeLinkResult {
  success: boolean;
  url?: string;
  token?: string;
  error?: string;
}

/**
 * Create a new intake link for a prospective client
 */
export async function createIntakeLink(input: CreateIntakeLinkInput): Promise<IntakeLinkResult> {
  try {
    console.log("[createIntakeLink] Starting with input:", JSON.stringify(input));

    const supabase = await createClient();
    console.log("[createIntakeLink] Supabase client created");

    // Get the current user (preparer creating the link)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[createIntakeLink] Auth result - user:", user?.id, "error:", authError?.message);

    if (authError) {
      return { success: false, error: `Authentication error: ${authError.message}` };
    }

    if (!user) {
      return { success: false, error: "You must be logged in to create intake links" };
    }

    const token = generateIntakeToken();
    const expiresAt = getExpirationDate(input.expiresInDays || 30);

    console.log("[createIntakeLink] Inserting link for user:", user.id);

    // Insert the intake link
    const { data, error } = await supabase
      .from("intake_links")
      .insert({
        token,
        email: input.email || null,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        prefill_first_name: input.prefillFirstName || null,
        prefill_last_name: input.prefillLastName || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[createIntakeLink] Insert error:", error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    console.log("[createIntakeLink] Link created:", data?.id);

    const url = generateIntakeUrl(token);

    revalidatePath("/dashboard/intake-links");

    return { success: true, url, token };
  } catch (error) {
    console.error("[createIntakeLink] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Unexpected error: ${message}` };
  }
}

export interface ValidateIntakeLinkResult {
  valid: boolean;
  linkId?: string;
  clientId?: string | null;
  email?: string | null;
  prefillFirstName?: string | null;
  prefillLastName?: string | null;
  error?: string;
}

/**
 * Validate an intake link token
 */
export async function validateIntakeLink(token: string): Promise<ValidateIntakeLinkResult> {
  try {
    const supabase = await createClient();

    const { data: link, error } = await supabase
      .from("intake_links")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !link) {
      return { valid: false, error: "Invalid or expired link" };
    }

    // Check if link has expired
    if (new Date(link.expires_at) < new Date()) {
      return { valid: false, error: "This link has expired" };
    }

    // Check if link has already been used
    if (link.used_at) {
      return { valid: false, error: "This link has already been used" };
    }

    return {
      valid: true,
      linkId: link.id,
      clientId: link.client_id,
      email: link.email,
      prefillFirstName: link.prefill_first_name,
      prefillLastName: link.prefill_last_name,
    };
  } catch (error) {
    console.error("Error validating intake link:", error);
    return { valid: false, error: "An unexpected error occurred" };
  }
}

/**
 * Mark an intake link as used and associate it with a client
 */
export async function markIntakeLinkUsed(
  linkId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("intake_links")
      .update({
        used_at: new Date().toISOString(),
        client_id: clientId,
      })
      .eq("id", linkId);

    if (error) {
      console.error("Error marking link as used:", error);
      return { success: false, error: "Failed to update link" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking link as used:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all intake links (for admin view)
 */
export async function getIntakeLinks() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("intake_links")
      .select(`
        *,
        client:clients(id, first_name, last_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching intake links:", error);
      return { success: false, error: "Failed to fetch intake links", data: null };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching intake links:", error);
    return { success: false, error: "An unexpected error occurred", data: null };
  }
}

/**
 * Delete an intake link
 */
export async function deleteIntakeLink(linkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("intake_links")
      .delete()
      .eq("id", linkId);

    if (error) {
      console.error("Error deleting intake link:", error);
      return { success: false, error: "Failed to delete intake link" };
    }

    revalidatePath("/dashboard/intake-links");
    return { success: true };
  } catch (error) {
    console.error("Error deleting intake link:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
