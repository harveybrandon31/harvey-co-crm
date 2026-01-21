import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First, delete related records (cascade manually for safety)
  // Delete dependents
  await supabase.from("dependents").delete().eq("client_id", id);

  // Delete tasks
  await supabase.from("tasks").delete().eq("client_id", id);

  // Delete documents
  await supabase.from("documents").delete().eq("client_id", id);

  // Delete tax returns
  await supabase.from("tax_returns").delete().eq("client_id", id);

  // Delete intake links
  await supabase.from("intake_links").delete().eq("client_id", id);

  // Finally, delete the client
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
