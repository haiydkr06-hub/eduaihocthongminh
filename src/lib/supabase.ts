import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function getValidSupabaseConfig() {
  try {
    if (rawUrl && rawUrl.startsWith('http')) {
      new URL(rawUrl)
      return { url: rawUrl, key: rawKey || 'placeholder-anon-key' }
    }
  } catch {
    // Fall back to mockable/placeholder endpoint
  }
  return {
    url: 'https://placeholder-project.supabase.co',
    key: 'placeholder-anon-key',
  }
}

const config = getValidSupabaseConfig()

export const supabase = createClient(config.url, config.key)
