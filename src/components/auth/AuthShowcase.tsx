import { useEffect, useState } from 'react'
import { BrainCircuit, LineChart, Sparkles, Wand2 } from 'lucide-react'

const WORDS = ['thông minh hơn', 'nhanh hơn', 'cá nhân hóa', 'vui hơn mỗi ngày']

/** Chữ tự gõ / xóa lần lượt các cụm từ. Tắt khi người dùng bật "giảm chuyển động". */
function TypingText() {
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(reduced ? WORDS[0].length : 0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduced) return
    const word = WORDS[index]
    let delay = deleting ? 45 : 90
    if (!deleting && length === word.length) delay = 1600
    if (deleting && length === 0) delay = 300
    const timer = setTimeout(() => {
      if (!deleting && length === word.length) setDeleting(true)
      else if (deleting && length === 0) {
        setDeleting(false)
        setIndex((i) => (i + 1) % WORDS.length)
      } else setLength((l) => l + (deleting ? -1 : 1))
    }, delay)
    return () => clearTimeout(timer)
  }, [index, length, deleting, reduced])

  return (
    <span className="text-gradient typing-caret" aria-label={WORDS.join(', ')}>
      {WORDS[index].slice(0, length)}
    </span>
  )
}

const FEATURES = [
  { icon: Wand2, title: 'AI soạn quiz từ tài liệu', desc: 'Dán bài giảng, nhận bản nháp câu hỏi trong vài giây', tone: 'from-[#ec6fb4] to-[#f5a524]' },
  { icon: BrainCircuit, title: 'Gia sư AI 24/7', desc: 'Giải thích công thức, tóm tắt bài học tức thì', tone: 'from-[#8b7bff] to-[#5b47e0]' },
  { icon: LineChart, title: 'Cảnh báo sớm', desc: 'Phát hiện học viên có nguy cơ tụt lại', tone: 'from-[#2ec4b6] to-[#3b82f6]' },
]

/** Panel giới thiệu bên trái trang đăng nhập / đăng ký (chỉ hiện trên màn hình lớn). */
export function AuthShowcase() {
  return (
    <section className="auth-showcase hidden lg:flex flex-col justify-between p-12 xl:p-14 text-white">
      <span className="orb orb-1" aria-hidden="true" />
      <span className="orb orb-2" aria-hidden="true" />

      <div className="flex items-center gap-3">
        <span className="brand-orb w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl">
          <Sparkles className="w-6 h-6 text-[#ffd6ec]" />
        </span>
        <span className="font-display text-2xl font-extrabold tracking-tight">
          Edu<span className="text-gradient">AI</span>
        </span>
      </div>

      <div className="max-w-xl">
        <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur">
          <span className="live-dot w-2 h-2 rounded-full bg-emerald-400 text-emerald-400" /> Nền tảng học tập tích hợp AI
        </p>
        <h1 className="mt-6 font-display text-5xl xl:text-6xl font-extrabold leading-[1.08]">
          Học tập
          <br />
          <TypingText />
        </h1>
        <p className="mt-5 text-base text-white/70 leading-relaxed">
          Bài học rõ ràng, quiz phù hợp, theo dõi tiến độ theo thời gian thực — cho học viên, giảng viên và nhà quản trị.
        </p>

        <ul className="mt-10 space-y-3">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="float-card flex items-center gap-4 p-4 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md max-w-md"
            >
              <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.tone} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <f.icon className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-sm font-bold">{f.title}</span>
                <span className="block text-xs text-white/60">{f.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-white/45">© 2026 EduAI · Học thông minh, tiến bộ mỗi ngày</p>
    </section>
  )
}
