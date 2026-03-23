import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — created on first request, not at module parse time.
// This prevents Next.js static analysis from crashing when env vars are
// absent during `npm run build`.
let _supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

export async function POST(req: NextRequest) {
  // 1. Verify the Clerk session
  const { userId } = await auth();
  console.log('[/api/reviews] Clerk userId:', userId ?? '⚠ NULL — unauthorized');
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized — no active Clerk session found.' },
      { status: 401 }
    );
  }

  // 2. Parse and validate the request body
  let body: { rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  console.log('[/api/reviews] Incoming Payload:', body);

  const { rating, comment } = body;

  if (typeof rating !== 'number' || !comment?.trim()) {
    return NextResponse.json(
      { error: 'Missing required fields: rating, comment.' },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5.' },
      { status: 400 }
    );
  }

  // 3. Insert into Supabase using the admin client (bypasses RLS)
  const { error } = await getSupabaseAdmin().from('community_reviews').insert({
    user_id: userId,   // Clerk userId stored as the author identifier
    rating,
    comment: comment.trim(),
  });

  if (error) {
    console.error('[/api/reviews] Supabase insert error:', error);
    return NextResponse.json(
      { error: error.message || 'Database insert failed.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wardName = searchParams.get('wardName');

  if (!wardName) {
    return NextResponse.json({ error: 'wardName query param is required.' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('ward_reviews')
    .select('id, rating, comment, created_at, user_id')
    .eq('ward_name', wardName)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
