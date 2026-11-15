import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Bộ máy AI KẾT HỢP:
 *  - Mặc định: "AI mô phỏng" chạy trong trình duyệt (không cần key, miễn phí).
 *  - Khi đã cấu hình Supabase + đặt ANTHROPIC_API_KEY trong Edge Function Secrets:
 *    tự động dùng Claude qua Edge Function `ai-assist`.
 *  - Nếu AI thật lỗi / chưa có key -> tự quay về AI mô phỏng, không làm gián đoạn giảng viên.
 */

export type AIEngine = 'local' | 'claude'
export type RemoteTask = 'question_insight' | 'risk_message' | 'grading_feedback'

export interface AIResult {
  text: string
  engine: AIEngine
  /** Lý do dùng AI mô phỏng thay vì AI thật (nếu có) — hiển thị cho giảng viên. */
  note?: string
}

export const ENGINE_LABEL: Record<AIEngine, string> = {
  local: 'AI mô phỏng (cục bộ)',
  claude: 'Claude (Anthropic)',
}

// Ghi nhớ trong phiên: server báo chưa có key thì không gọi lại mỗi lần
let remoteUnavailable = !isSupabaseConfigured

export function currentEngine(): AIEngine {
  return remoteUnavailable ? 'local' : 'claude'
}

async function readErrorCode(error: unknown): Promise<{ code?: string; status?: number }> {
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response
    try {
      const body = (await res.clone().json()) as { code?: string }
      return { code: body.code, status: res.status }
    } catch {
      return { status: res.status }
    }
  }
  return {}
}

/** Gọi AI thật; trả null nếu không dùng được (kèm lý do) để nơi gọi tự dùng AI mô phỏng. */
async function callRemote(task: RemoteTask, payload: unknown): Promise<{ text: string } | { fallbackNote: string }> {
  if (remoteUnavailable) return { fallbackNote: '' }
  try {
    const { data, error } = await supabase.functions.invoke('ai-assist', { body: { task, payload } })
    if (error) {
      const { code, status } = await readErrorCode(error)
      if (code === 'AI_NOT_CONFIGURED' || status === 404) {
        // Chưa có key hoặc chưa deploy function -> dùng AI mô phỏng cho cả phiên
        remoteUnavailable = true
        return { fallbackNote: '' }
      }
      if (code === 'AI_RATE_LIMITED') return { fallbackNote: 'Claude đang quá tải — tạm dùng AI mô phỏng.' }
      return { fallbackNote: 'Không kết nối được Claude — tạm dùng AI mô phỏng.' }
    }
    const text = (data as { text?: string } | null)?.text?.trim()
    return text ? { text } : { fallbackNote: 'Claude không trả về nội dung — tạm dùng AI mô phỏng.' }
  } catch {
    return { fallbackNote: 'Không kết nối được Claude — tạm dùng AI mô phỏng.' }
  }
}

/** Chạy tác vụ: thử Claude trước (nếu khả dụng), không được thì dùng hàm cục bộ. */
export async function runAI(task: RemoteTask, payload: unknown, local: () => string): Promise<AIResult> {
  const remote = await callRemote(task, payload)
  if ('text' in remote) return { text: remote.text, engine: 'claude' }
  // Giả lập độ trễ ngắn để giao diện hiển thị trạng thái "đang phân tích"
  await new Promise((resolve) => setTimeout(resolve, 400))
  return { text: local(), engine: 'local', note: remote.fallbackNote || undefined }
}
