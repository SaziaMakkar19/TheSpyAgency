// utils/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

// Primary DB (Realtors & Outreach State)
export const realtorDb = createClient(
    process.env.NEXT_PUBLIC_REALTORS_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_REALTORS_SUPABASE_ANON_KEY!,
)

// Secondary DB (All Listings)
export const listingDb = createClient(
    process.env.NEXT_PUBLIC_LISTINGS_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LISTINGS_SUPABASE_ANON_KEY!, // Or Anon key, depending on your RLS
)
