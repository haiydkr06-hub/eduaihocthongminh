import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

/**
 * Kiểm tra xem Supabase đã được cấu hình thật sự hay chưa.
 * Tránh việc gửi request tới domain giả lập dẫn tới treo mạng/đơ UI.
 */
export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('your-supabase-url') &&
  rawKey &&
  rawKey !== 'placeholder-anon-key' &&
  rawKey !== 'your-anon-key'
)

function getValidSupabaseConfig() {
  try {
    if (isSupabaseConfigured) {
      new URL(rawUrl)
      return { url: rawUrl, key: rawKey }
    }
  } catch {
    // fallback
  }
  return {
    url: 'https://placeholder-project.supabase.co',
    key: 'placeholder-anon-key',
  }
}

const config = getValidSupabaseConfig()

export const supabase = createClient(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options = {}) => {
      // Nếu chưa cấu hình Supabase thực, từ chối ngay lập tức để không gây treo UI vì DNS lookup / timeout
      if (!isSupabaseConfigured) {
        return Promise.reject(new Error('Supabase chưa được cấu hình'))
      }

      // Giới hạn timeout 3 giây cho mọi request Supabase
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const existingSignal = options.signal
      if (existingSignal) {
        existingSignal.addEventListener('abort', () => controller.abort())
      }

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    },
  },
})

/**
 * Wrapper hỗ trợ timeout cho các tác vụ bất đồng bộ Supabase hoặc async khác.
 * Tránh trường hợp UI bị treo vô hạn nếu mạng lag hoặc server không phản hồi.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T> | (() => PromiseLike<T>),
  timeoutMs: number = 3000,
  fallbackValue?: T
): Promise<T> {
  const p = typeof promise === 'function' ? promise() : promise
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (fallbackValue !== undefined) {
          resolve(fallbackValue)
        } else {
          reject(new Error(`Thao tác quá thời gian chờ (${timeoutMs}ms)`))
        }
      }, timeoutMs)
    }),
  ])
}
