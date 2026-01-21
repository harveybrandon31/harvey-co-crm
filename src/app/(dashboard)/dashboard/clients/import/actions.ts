"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { parseCSV, type ParsedClient } from "@/lib/csv/parser";

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
  duplicates: string[];
}

export async function importClients(csvContent: string): Promise<ImportResult> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [{ row: 0, message: "Not authenticated" }],
      duplicates: [],
    };
  }

  // Parse CSV
  const parseResult = parseCSV(csvContent);

  if (parseResult.data.length === 0) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: parseResult.errors.length > 0
        ? parseResult.errors
        : [{ row: 0, message: "No valid data found in CSV" }],
      duplicates: [],
    };
  }

  // Get all existing clients to check for duplicates
  const { data: existingClients } = await supabase
    .from("clients")
    .select("email, phone, first_name, last_name")
    .eq("user_id", user.id);

  // Build sets for duplicate checking
  const existingEmails = new Set(
    (existingClients || [])
      .map((c) => c.email?.toLowerCase())
      .filter((e): e is string => !!e)
  );

  const existingPhones = new Set(
    (existingClients || [])
      .map((c) => c.phone?.replace(/\D/g, "")) // Normalize phone to digits only
      .filter((p): p is string => !!p && p.length >= 10)
  );

  const existingNames = new Set(
    (existingClients || [])
      .map((c) => `${c.first_name?.toLowerCase()?.trim()}|${c.last_name?.toLowerCase()?.trim()}`)
      .filter((n) => n !== "|")
  );

  // Filter out duplicates
  const duplicates: string[] = [];
  const clientsToInsert: ParsedClient[] = [];

  parseResult.data.forEach((client) => {
    const clientEmail = client.email?.toLowerCase();
    const clientPhone = client.phone?.replace(/\D/g, "");
    const clientNameKey = `${client.first_name.toLowerCase().trim()}|${client.last_name.toLowerCase().trim()}`;

    // Check for duplicate by email
    if (clientEmail && existingEmails.has(clientEmail)) {
      duplicates.push(`${client.first_name} ${client.last_name} (email: ${client.email})`);
      return;
    }

    // Check for duplicate by phone
    if (clientPhone && clientPhone.length >= 10 && existingPhones.has(clientPhone)) {
      duplicates.push(`${client.first_name} ${client.last_name} (phone: ${client.phone})`);
      return;
    }

    // Check for duplicate by exact name match
    if (existingNames.has(clientNameKey)) {
      duplicates.push(`${client.first_name} ${client.last_name} (name already exists)`);
      return;
    }

    // Also track this client to prevent duplicates within the CSV itself
    if (clientEmail) existingEmails.add(clientEmail);
    if (clientPhone && clientPhone.length >= 10) existingPhones.add(clientPhone);
    existingNames.add(clientNameKey);

    clientsToInsert.push(client);
  });

  if (clientsToInsert.length === 0) {
    return {
      success: false,
      imported: 0,
      failed: parseResult.errors.length,
      errors: parseResult.errors,
      duplicates,
    };
  }

  // Insert clients in batches
  const BATCH_SIZE = 50;
  let imported = 0;
  const insertErrors: { row: number; message: string }[] = [...parseResult.errors];

  for (let i = 0; i < clientsToInsert.length; i += BATCH_SIZE) {
    const batch = clientsToInsert.slice(i, i + BATCH_SIZE).map((client) => ({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone,
      address_street: client.address_street,
      address_city: client.address_city,
      address_state: client.address_state,
      address_zip: client.address_zip,
      ssn_last_four: client.ssn_last_four,
      filing_status: client.filing_status,
      status: client.status,
      notes: client.notes,
      has_spouse: client.has_spouse || false,
      spouse_first_name: client.spouse_first_name || null,
      spouse_last_name: client.spouse_last_name || null,
      user_id: user.id,
    }));

    const { error, data } = await supabase
      .from("clients")
      .insert(batch)
      .select("id");

    if (error) {
      // If batch fails, try inserting one by one to identify problem rows
      for (let j = 0; j < batch.length; j++) {
        const { error: singleError } = await supabase
          .from("clients")
          .insert(batch[j]);

        if (singleError) {
          insertErrors.push({
            row: i + j + 2, // +2 for header row and 0-indexing
            message: singleError.message,
          });
        } else {
          imported++;
        }
      }
    } else {
      imported += data?.length || batch.length;
    }
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");

  return {
    success: insertErrors.length === 0 && duplicates.length === 0,
    imported,
    failed: insertErrors.length - parseResult.errors.length,
    errors: insertErrors,
    duplicates,
  };
}
