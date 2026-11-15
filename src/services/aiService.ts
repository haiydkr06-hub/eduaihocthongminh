/**
 * Dịch vụ AI của EduAI.
 *
 * Hiện tại chạy bằng "AI mô phỏng" cục bộ (thuật toán phân tích văn bản trong trình duyệt),
 * KHÔNG gọi mô hình ngôn ngữ và KHÔNG cần API key. Kết quả luôn là BẢN NHÁP để giảng viên duyệt.
 * Khi tích hợp mô hình thật, thay phần thân hàm bằng lời gọi Supabase Edge Function (xem docs/04).
 */

export type QuizDifficulty = 'easy' | 'medium' | 'hard'

export interface AIQuizQuestion {
  id: string
  prompt: string
  options: string[]
  answer_key: number
  explanation: string
  difficulty: QuizDifficulty
}

export interface GenerateQuizParams {
  content: string
  courseTitle: string
  questionsCount: number
  difficulty: QuizDifficulty
}

export interface GenerateQuizResult {
  questions: AIQuizQuestion[]
  /** Cảnh báo hiển thị cho giảng viên (ví dụ: tài liệu không đủ ý để sinh đủ số câu). */
  warnings: string[]
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export const AI_ENGINE_LABEL = 'AI mô phỏng (chạy cục bộ, chưa kết nối mô hình ngôn ngữ)'
export const SOURCE_MIN_CHARS = 100
export const SOURCE_MAX_CHARS = 30_000
export const MAX_QUESTIONS = 20

export class AIInputError extends Error {}

/* ============================== TIỆN ÍCH ============================== */

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

/** Cặp từ trái nghĩa / đối lập dùng để tạo phương án nhiễu "gần đúng". */
const OPPOSITES: [string, string][] = [
  ['đồng biến', 'nghịch biến'],
  ['hướng lên', 'hướng xuống'],
  ['quay lên', 'quay xuống'],
  ['lên trên', 'xuống dưới'],
  ['lớn nhất', 'nhỏ nhất'],
  ['cao nhất', 'thấp nhất'],
  ['tỉ lệ thuận', 'tỉ lệ nghịch'],
  ['tăng', 'giảm'],
  ['dương', 'âm'],
  ['luôn', 'không bao giờ'],
  ['hút', 'đẩy'],
  ['trước', 'sau'],
  ['bên trái', 'bên phải'],
  ['nhanh', 'chậm'],
  ['a > 0', 'a < 0'],
  ['> 0', '< 0'],
  ['since', 'for'],
  ['always', 'never'],
]

function swapOpposite(sentence: string): string | null {
  const lower = sentence.toLowerCase()
  for (const [a, b] of shuffle(OPPOSITES)) {
    const ia = lower.indexOf(a)
    if (ia !== -1) return sentence.slice(0, ia) + b + sentence.slice(ia + a.length)
    const ib = lower.indexOf(b)
    if (ib !== -1) return sentence.slice(0, ib) + a + sentence.slice(ib + b.length)
  }
  return null
}

/** Biến đổi số trong câu (vd 9,8 -> 10,8) để tạo phương án sai. */
function perturbNumber(text: string): string | null {
  const m = /-?\d+(?:[.,]\d+)?/.exec(text)
  if (!m) return null
  const raw = m[0]
  const n = Number(raw.replace(',', '.'))
  if (!Number.isFinite(n)) return null
  const delta = Number.isInteger(n) ? (Math.random() < 0.5 ? 1 : 2) : 1
  const sign = Math.random() < 0.5 ? -1 : 1
  let next = n + sign * delta
  // Không biến số dương thành 0/âm (tránh phương án vô nghĩa như "-b/0a")
  if (n > 0 && next <= 0) next = n + delta
  if (next === n) next = n + 1
  const formatted = raw.includes(',') ? String(next).replace('.', ',') : String(next)
  return text.slice(0, m.index) + formatted + text.slice(m.index + raw.length)
}

/* ============================== PHÂN TÍCH TÀI LIỆU ============================== */

interface Fact {
  sentence: string
  /** Chủ thể (vế trái) và nội dung (vế phải) nếu câu có dạng định nghĩa "X là Y" / "X: Y" / "X = Y". */
  subject?: string
  answer?: string
}

function splitSentences(content: string): string[] {
  return content
    .replace(/\r/g, '')
    .replace(/[#*`$]/g, '')
    // Chỉ tách câu ở xuống dòng hoặc dấu . ! ? theo sau là chữ hoa/số — KHÔNG tách ở ";"
    // (trước đây cắt cụt tọa độ như "I(-b/2a; -Δ/4a)")
    .split(/\n+|(?<=[.!?])\s+(?=[\p{Lu}\d])/u)
    .map((s) => s.replace(/^(?:[-•]|\d+[.)])\s+/, '').trim())
    .filter((s) => s.length >= 15 && s.length <= 260 && /[\p{L}]/u.test(s))
}

function toFact(sentence: string): Fact {
  const clean = sentence.replace(/[.]+$/, '')
  const patterns: RegExp[] = [
    /^(.{4,80}?)\s+(?:là|được gọi là|được xác định bởi|có dạng|có đơn vị(?: đo)? là|bằng)\s+(.{2,160})$/i,
    /^(.{4,80}?)\s*[:：]\s*(.{2,160})$/,
    /^(.{3,60}?)\s+(?:is|are|means)\s+(.{2,160})$/i,
  ]
  for (const re of patterns) {
    const m = re.exec(clean)
    if (m && m[2].split(' ').length <= 25) return { sentence: clean, subject: m[1].trim(), answer: m[2].trim() }
  }
  return { sentence: clean }
}

/* ============================== SINH CÂU HỎI ============================== */

let seq = 0
const qid = () => `ai-q-${Date.now()}-${++seq}`

function buildOptions(correct: string, candidates: string[]): { options: string[]; answer_key: number } | null {
  const seen = new Set([norm(correct)])
  const distractors: string[] = []
  for (const c of candidates) {
    const n = norm(c)
    if (!c.trim() || seen.has(n)) continue
    seen.add(n)
    distractors.push(c.trim())
    if (distractors.length === 3) break
  }
  if (distractors.length < 3) return null
  const options = shuffle([correct.trim(), ...distractors])
  return { options, answer_key: options.indexOf(correct.trim()) }
}

/** Câu hỏi định nghĩa: "Theo tài liệu, <chủ thể> là gì?" — phương án nhiễu lấy từ các định nghĩa khác. */
function definitionQuestion(fact: Fact, facts: Fact[], difficulty: QuizDifficulty): AIQuizQuestion | null {
  if (!fact.subject || !fact.answer) return null
  const others = facts.filter((f) => f !== fact && f.answer).map((f) => f.answer!)
  const near = [swapOpposite(fact.answer), perturbNumber(fact.answer)].filter((x): x is string => !!x)
  // Mức khó: ưu tiên phương án "gần đúng" (đảo nghĩa / đổi số); mức dễ: ưu tiên định nghĩa khác hẳn
  const pool = difficulty === 'easy' ? [...shuffle(others), ...near] : [...near, ...shuffle(others)]
  const built = buildOptions(fact.answer, pool)
  if (!built) return null
  return {
    id: qid(),
    prompt: `Theo tài liệu, "${fact.subject}" là gì / được xác định thế nào?`,
    ...built,
    explanation: `Tài liệu nêu: "${fact.sentence}".`,
    difficulty,
  }
}

/** Câu hỏi "phát biểu đúng": đáp án là câu gốc, phương án nhiễu là các câu đã bị đảo nghĩa / đổi số. */
function trueStatementQuestion(fact: Fact, facts: Fact[], difficulty: QuizDifficulty): AIQuizQuestion | null {
  const distractors: string[] = []
  for (const f of shuffle(facts)) {
    if (f === fact) continue
    const altered = swapOpposite(f.sentence) ?? perturbNumber(f.sentence)
    if (altered) distractors.push(altered)
  }
  const selfAltered = [swapOpposite(fact.sentence), perturbNumber(fact.sentence)].filter((x): x is string => !!x)
  const pool = difficulty === 'hard' ? [...selfAltered, ...distractors] : [...distractors, ...selfAltered]
  const built = buildOptions(fact.sentence, pool)
  if (!built) return null
  return {
    id: qid(),
    prompt: 'Phát biểu nào sau đây ĐÚNG theo nội dung tài liệu?',
    ...built,
    explanation: `Phát biểu đúng được trích từ tài liệu: "${fact.sentence}". Các phương án khác đã bị đổi nghĩa hoặc đổi số liệu.`,
    difficulty,
  }
}

/** Câu hỏi "phát biểu sai": đáp án là câu bị đảo nghĩa; 3 phương án còn lại là câu đúng trong tài liệu. */
function falseStatementQuestion(fact: Fact, facts: Fact[], difficulty: QuizDifficulty): AIQuizQuestion | null {
  const wrong = swapOpposite(fact.sentence) ?? perturbNumber(fact.sentence)
  if (!wrong) return null
  const truths = shuffle(facts.filter((f) => f !== fact)).map((f) => f.sentence)
  const built = buildOptions(wrong, truths)
  if (!built) return null
  return {
    id: qid(),
    prompt: 'Phát biểu nào sau đây KHÔNG ĐÚNG theo nội dung tài liệu?',
    ...built,
    explanation: `Câu sai đã bị thay đổi so với tài liệu. Nội dung đúng là: "${fact.sentence}".`,
    difficulty,
  }
}

export const aiService = {
  /**
   * Sinh bản nháp câu hỏi trắc nghiệm TỪ CHÍNH NỘI DUNG tài liệu giảng viên cung cấp.
   * - Đáp án đúng được xáo trộn vị trí (trước đây luôn là A)
   * - Cố gắng sinh đúng số câu yêu cầu; nếu tài liệu không đủ ý thì trả về ít hơn kèm cảnh báo rõ ràng
   */
  async generateQuiz(params: GenerateQuizParams): Promise<GenerateQuizResult> {
    const content = params.content.trim()
    if (content.length < SOURCE_MIN_CHARS) {
      throw new AIInputError(`Nội dung tài liệu cần ít nhất ${SOURCE_MIN_CHARS} ký tự (hiện có ${content.length}).`)
    }
    if (content.length > SOURCE_MAX_CHARS) {
      throw new AIInputError(`Nội dung tài liệu tối đa ${SOURCE_MAX_CHARS.toLocaleString('vi-VN')} ký tự.`)
    }
    const count = Math.max(1, Math.min(MAX_QUESTIONS, Math.round(params.questionsCount)))

    // Giả lập thời gian xử lý để giao diện hiển thị trạng thái loading
    await new Promise((resolve) => setTimeout(resolve, 600))

    const facts = [...new Map(splitSentences(content).map((s) => [norm(s), toFact(s)])).values()]
    const warnings: string[] = []
    if (facts.length < 4) {
      throw new AIInputError(
        'Tài liệu quá ngắn hoặc chưa tách được ý: cần ít nhất 4 câu/ý rõ ràng (mỗi ý một dòng hoặc kết thúc bằng dấu chấm).'
      )
    }

    const builders =
      params.difficulty === 'easy'
        ? [definitionQuestion, trueStatementQuestion]
        : params.difficulty === 'hard'
        ? [falseStatementQuestion, trueStatementQuestion, definitionQuestion]
        : [definitionQuestion, trueStatementQuestion, falseStatementQuestion]

    const questions: AIQuizQuestion[] = []
    const usedPrompts = new Set<string>()
    const usedFacts = new Set<Fact>()

    // Vòng 1: mỗi ý tối đa 1 câu hỏi; vòng 2: cho phép dạng câu hỏi khác trên cùng ý
    for (let round = 0; round < builders.length && questions.length < count; round++) {
      for (const fact of shuffle(facts)) {
        if (questions.length >= count) break
        if (round === 0 && usedFacts.has(fact)) continue
        for (let k = 0; k < builders.length; k++) {
          const build = builders[(k + round) % builders.length]
          const q = build(fact, facts, params.difficulty)
          if (!q) continue
          const key = norm(q.prompt + '|' + q.options[q.answer_key])
          if (usedPrompts.has(key)) continue
          usedPrompts.add(key)
          usedFacts.add(fact)
          questions.push(q)
          break
        }
      }
    }

    if (questions.length === 0) {
      throw new AIInputError(
        'Không sinh được câu hỏi từ tài liệu này. Hãy viết các ý dạng định nghĩa ("X là Y") hoặc nhận định rõ ràng, mỗi ý một dòng.'
      )
    }
    if (questions.length < count) {
      warnings.push(
        `Tài liệu chỉ đủ ý để sinh ${questions.length}/${count} câu hỏi. Hãy bổ sung thêm nội dung hoặc tự thêm câu hỏi.`
      )
    }
    warnings.push('Câu hỏi do AI mô phỏng tạo từ tài liệu — vui lòng kiểm tra kỹ nội dung, đáp án và giải thích trước khi xuất bản.')
    return { questions, warnings }
  },

  /**
   * Trả lời thắc mắc của học viên theo phong cách gia sư sư phạm
   */
  async askTutor(question: string, contextTopic = 'Toán học và Khoa học'): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const q = question.toLowerCase()

    if (q.includes('parabol') || q.includes('hàm số') || q.includes('bậc hai')) {
      return `Chào bạn! Về chủ đề **Hàm số bậc hai $y = ax^2 + bx + c$ ($a \\neq 0$)**, đây là 3 điểm mấu chốt bạn cần nhớ:
1. **Đỉnh Parabol:** Điểm $I\\left(-\\frac{b}{2a}; -\\frac{\\Delta}{4a}\\right)$. Đây là điểm cao nhất khi $a < 0$ và thấp nhất khi $a > 0$.
2. **Trục đối xứng:** Đường thẳng thẳng đứng $x = -\\frac{b}{2a}$.
3. **Chiều biến thiên:**
   - Nếu $a > 0$: Nghịch biến trên $\\left(-\\infty; -\\frac{b}{2a}\\right)$ và đồng biến trên $\\left(-\\frac{b}{2a}; +\\infty\\right)$.
   - Nếu $a < 0$: Đồng biến trên $\\left(-\\infty; -\\frac{b}{2a}\\right)$ và nghịch biến trên $\\left(-\\frac{b}{2a}; +\\infty\\right)$.

💡 *Mẹo thi:* Để tìm nhanh giá trị lớn nhất/nhỏ nhất, bạn chỉ cần thay $x = -\\frac{b}{2a}$ vào biểu thức hàm số!`
    }

    if (q.includes('hấp dẫn') || q.includes('vật lý') || q.includes('newton')) {
      return `Về **Định luật vạn vật hấp dẫn**:
Công thức định luật:
$$F_{hd} = G \\cdot \\frac{m_1 \\cdot m_2}{r^2}$$
Trong đó:
- $G \\approx 6.67 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$ là hằng số hấp dẫn.
- $m_1, m_2$ là khối lượng hai chất điểm (kg).
- $r$ là khoảng cách giữa hai chất điểm (m).

Lưu ý: Lực hấp dẫn luôn là **lực hút**, tỉ lệ thuận với tích khối lượng và tỉ lệ nghịch với bình phương khoảng cách giữa chúng.`
    }

    if (q.includes('tiếng anh') || q.includes('thì') || q.includes('tense')) {
      return `Chào bạn! Trong tiếng Anh, thì **Hiện tại hoàn thành (Present Perfect)** dùng để diễn tả:
1. Hành động đã bắt đầu trong quá khứ và vẫn tiếp diễn ở hiện tại (thường đi với *since* + mốc thời gian, *for* + khoảng thời gian).
2. Hành động vừa mới xảy ra (*just, recently, already*).
3. Trải nghiệm tính đến thời điểm hiện tại (*ever, never*).

Cấu trúc:
$$\\text{S} + \\text{have/has} + \\text{V}_{3/ed}$$
Ví dụ: *I have studied on EduAI for 3 months.*`
    }

    return `Cảm ơn câu hỏi của bạn về chủ đề **${contextTopic}**!
Dựa trên kiến thức bài giảng:
- **Nguyên tắc cơ bản:** Hãy nắm chắc định nghĩa và tập xác định trước khi đi vào giải bài tập chi tiết.
- **Phương pháp luyện tập:** Đọc lại phần lý thuyết trong mục Bài học, sau đó làm các câu hỏi trắc nghiệm tự luyện để củng cố phản xạ.
Nếu bạn muốn mình giải thích chi tiết một bài tập cụ thể, bạn cứ gửi đề bài vào đây nhé!`
  },
}
