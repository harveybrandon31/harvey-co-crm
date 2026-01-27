import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptSSN } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { encryptedSSN } = await request.json();

    if (!encryptedSSN) {
      return NextResponse.json({ error: "No SSN provided" }, { status: 400 });
    }

    const decrypted = decryptSSN(encryptedSSN);

    if (!decrypted) {
      return NextResponse.json({ error: "Failed to decrypt" }, { status: 500 });
    }

    return NextResponse.json({ ssn: decrypted });
  } catch (error) {
    console.error("Error decrypting SSN:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
