import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Simple endpoint to save document label + Uploadcare URL
// No complex auth - just saves the document link to the client's profile

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_id, document_label, uploadcare_url, category } = body;

    console.log('=== DOCUMENT SAVE START ===');
    console.log('client_id:', client_id);
    console.log('document_label:', document_label);
    console.log('uploadcare_url:', uploadcare_url);
    console.log('category:', category);

    // Validate required fields
    if (!client_id || !document_label || !uploadcare_url) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, document_label, uploadcare_url' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        client_id,
        name: document_label,
        file_path: uploadcare_url,
        category: category || 'other',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving document:', error);
      return NextResponse.json(
        { error: 'Failed to save document', details: error.message },
        { status: 500 }
      );
    }

    console.log('Document saved successfully:', data);
    console.log('=== DOCUMENT SAVE END ===');

    return NextResponse.json({ success: true, document: data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
