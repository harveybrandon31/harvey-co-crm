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

  // Check for duplicates by email
  const emailsToCheck = parseResult.data
    .filter((c) => c.email)
    .map((c) => c.email as string);

  let existingEmails: string[] = [];
  if (emailsToCheck.length > 0) {
    const { data: existingClients } = await supabase
      .from("clients")
      .select("email")
      .eq("user_id", user.id)
      .in("email", emailsToCheck);

    existingEmails = (existingClients || [])
      .map((c) => c.email)
      .filter((e): e is string => e !== null);
  }

  // Filter out duplicates
  const duplicates: string[] = [];
  const clientsToInsert: ParsedClient[] = [];

  parseResult.data.forEach((client) => {
    if (client.email && existingEmails.includes(client.email)) {
      duplicates.push(`${client.first_name} ${client.last_name} (${client.email})`);
    } else {
      clientsToInsert.push(client);
    }
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
      ...client,
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
