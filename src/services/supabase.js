// src/services/supabase.js
// Central Supabase client – import this everywhere instead of calling createClient yourself

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_API_URL ?? import.meta.env.SUPABASE_API_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[AllDevNeeds] Supabase env vars missing. ' +
    'Copy .env.example → .env.local and add your credentials.'
  )
}
const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')
export default supabase

supabase.from('coderooms').upsert({},{})