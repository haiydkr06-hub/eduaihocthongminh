import { useState, type FormEvent } from 'react'
import { MarkdownContent } from '../../components/MarkdownContent'
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Lightbulb,
} from 'lucide-react'
import { aiService, type AIChatMessage } from '../../services/aiService'

export function StudentAiAssistantPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'm-welcome',
      role: 'assistant',
      content: `Xin chào bạn! Mình là **Trợ lý AI Học tập EduAI**. 
Mình có thể giúp bạn:
- Giải thích các khái niệm Toán, Khoa học, Tiếng Anh và Công nghệ.
- Tóm tắt kiến thức trọng tâm trước kỳ thi.
- Hướng dẫn phương pháp giải bài tập từng bước.

Bạn đang quan tâm đến chủ đề nào hôm nay?`,
      createdAt: 'Vừa xong',
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const quickPrompts = [
    'Tóm tắt công thức Hàm số bậc hai và Parabol',
    'Giải thích Định luật vạn vật hấp dẫn của Newton',
    'Cách dùng thì Hiện tại hoàn thành trong tiếng Anh',
    'Mẹo phân bố thời gian làm bài thi trắc nghiệm',
  ]

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    const userMsg: AIChatMessage = {
      id: `u-${crypto.randomUUID()}`,
      role: 'user',
      content: text,
      createdAt: 'Bây giờ',
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await aiService.askTutor(text)
      const aiMsg: AIChatMessage = {
        id: `ai-${crypto.randomUUID()}`,
        role: 'assistant',
        content: response,
        createdAt: 'Bây giờ',
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${crypto.randomUUID()}`,
          role: 'assistant',
          content: 'Xin lỗi bạn, kết nối tới dịch vụ AI tạm thời bị gián đoạn. Bạn thử lại nhé!',
          createdAt: 'Bây giờ',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSend()
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 'm-welcome-new',
        role: 'assistant',
        content: 'Cuộc trò chuyện mới đã bắt đầu. Bạn muốn hỏi điều gì nào?',
        createdAt: 'Vừa xong',
      },
    ])
  }

  return (
    <div className="page-content space-y-5 max-w-4xl mx-auto flex flex-col h-[calc(100vh-100px)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#eceef4]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center shadow-md shadow-[#6857DF]/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#252641]">Trợ lý AI Học tập Thông minh</h1>
            <p className="text-xs text-[#777a91]">Gia sư ảo 24/7 giải đáp mọi câu hỏi bài giảng</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#eceef4] bg-white text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Xóa hội thoại
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-[#777a91] flex items-center gap-1 whitespace-nowrap">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Gợi ý nhanh:
        </span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-full border border-[#eceef4] bg-white hover:bg-[#F0EDFF] hover:border-[#6857DF]/30 text-xs text-[#252641] whitespace-nowrap transition shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'

          return (
            <div
              key={msg.id}
              className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-[#6857DF] text-white'
                    : 'bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-3xl p-4 text-xs md:text-sm leading-relaxed shadow-xs relative group ${
                  isUser
                    ? 'bg-[#6857DF] text-white rounded-tr-none'
                    : 'bg-white border border-[#eceef4] text-[#252641] rounded-tl-none'
                }`}
              >
                {isUser ? <div className="whitespace-pre-line">{msg.content}</div> : <MarkdownContent text={msg.content} />}

                <div
                  className={`mt-2 flex items-center justify-between text-[10px] ${
                    isUser ? 'text-purple-200' : 'text-gray-400'
                  }`}
                >
                  <span>{msg.createdAt}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-[#6857DF]"
                      title="Sao chép nội dung"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-[#777a91]">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6857DF] flex items-center justify-center font-bold">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-white border border-[#eceef4] px-4 py-2.5 rounded-2xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#6857DF] animate-ping" />
              <span>Gia sư AI đang chuẩn bị câu trả lời...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#eceef4] p-2 shadow-sm flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi bạn cần giải đáp hoặc dán đề bài vào đây..."
          className="flex-1 px-4 py-2 text-xs md:text-sm bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/25 disabled:opacity-40"
        >
          <Send className="w-4 h-4" /> Gửi
        </button>
      </form>
    </div>
  )
}
