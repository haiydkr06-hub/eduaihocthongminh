import { useState, useEffect, useRef, type FormEvent } from 'react'
import { aiService } from '../services/aiService'

interface AITutorChatProps {
  lessonTitle?: string
  lessonContent?: string
  defaultOpen?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
}

export function AITutorChat({ lessonTitle, defaultOpen = false }: AITutorChatProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `Chào bạn! Mình là **Gia sư AI EduAI** 🤖.\n\nBạn đang theo dõi bài học: **${lessonTitle || 'bài học hôm nay'}**.\nNếu có bất kỳ khái niệm khó hiểu, bài tập cần giải thích hoặc muốn tóm tắt ý chính, hãy nhắn cho mình nhé!`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  // Cập nhật lời chào khi bài học thay đổi
  useEffect(() => {
    if (lessonTitle) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-switch-${Date.now()}`,
          role: 'assistant',
          text: `Bạn vừa chuyển sang bài: **${lessonTitle}**. Bạn cần mình hỗ trợ giải đáp nội dung nào của bài này không?`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }
  }, [lessonTitle])

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  // Focus ô nhập khi mở khung chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen])

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || input).trim()
    if (!question || isTyping) return

    const userMsgId = `usr-${Date.now()}`
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        text: question,
        time: timeStr,
      },
    ]

    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    try {
      // Gọi service AI Tutor (có sẵn logic sư phạm và dữ liệu chuyên môn)
      const reply = await aiService.askTutor(question, lessonTitle || 'Chương trình học EduAI')
      
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: 'Xin lỗi bạn, kết nối với Gia sư AI tạm thời bị gián đoạn. Bạn vui lòng thử lại sau giây lát nhé!',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt)
  }

  return (
    <>
      {/* NÚT FLOATING CON ROBOT Ở GÓC DƯỚI BÊN PHẢI */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-gray-200 text-xs font-semibold text-gray-700 animate-fade-in pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gia sư AI đang trực tuyến</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Thu gọn Gia sư AI' : 'Mở Gia sư AI'}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all duration-200 active:scale-95 ${
            isOpen
              ? 'bg-gray-800 text-white hover:bg-gray-900 shadow-gray-800/30 rotate-90'
              : 'bg-gradient-to-tr from-primary-600 to-indigo-500 text-white hover:shadow-primary-500/40 hover:scale-105 shadow-primary-600/30'
          }`}
          title="Trợ lý Gia sư AI"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <span className="relative">
              🤖
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </span>
          )}
        </button>
      </div>

      {/* KHUNG CHAT MINI (MINI CHAT WINDOW) */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] h-[550px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
                🤖
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <span>Gia sư AI EduAI</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-semibold border border-emerald-400/30">
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-white/80 line-clamp-1">
                  {lessonTitle ? `Hỗ trợ: ${lessonTitle}` : 'Giải đáp kiến thức 24/7'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Vùng tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/60 text-xs sm:text-sm">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant'
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      🤖
                    </div>
                  )}

                  <div className={`max-w-[85%] ${isAssistant ? '' : 'text-right'}`}>
                    <div
                      className={`p-3 rounded-2xl shadow-2xs leading-relaxed whitespace-pre-wrap ${
                        isAssistant
                          ? 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                          : 'bg-primary-600 text-white rounded-tr-xs text-left'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 px-1">
                      {msg.time}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Trạng thái AI đang gõ (Typing Indicator) */}
            {isTyping && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="p-3 bg-white border border-gray-200/80 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">Gia sư AI đang soạn câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi nhanh (Quick Prompts) */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickPrompt('Tóm tắt 3 ý quan trọng nhất của bài học này')}
              className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 text-[11px] font-medium whitespace-nowrap transition border border-gray-200/60"
            >
              💡 Tóm tắt ý chính
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Giải thích chi tiết công thức trong bài')}
              className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 text-[11px] font-medium whitespace-nowrap transition border border-gray-200/60"
            >
              🔍 Giải thích công thức
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Cho mình 1 câu hỏi trắc nghiệm ôn tập')}
              className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 text-[11px] font-medium whitespace-nowrap transition border border-gray-200/60"
            >
              🎯 Câu hỏi ôn tập
            </button>
          </div>

          {/* Ô nhập tin nhắn */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Đặt câu hỏi cho Gia sư AI..."
              disabled={isTyping}
              className="flex-1 px-3.5 py-2.5 bg-gray-100/80 hover:bg-gray-100 focus:bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 rounded-xl border border-transparent focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white flex items-center justify-center transition duration-150 shadow-xs flex-shrink-0"
              title="Gửi câu hỏi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default AITutorChat
