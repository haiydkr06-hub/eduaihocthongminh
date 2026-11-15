import { runAI, type AIResult } from './aiEngine'
import type { QuestionInsight, StudentInClass, SubmissionDetail } from './teacherService'

/**
 * Các chức năng AI dành cho Giảng viên:
 *  1. Phân tích câu hỏi hay bị sai
 *  2. Cảnh báo học viên có nguy cơ (+ soạn tin nhắc nhở)
 *  3. Gợi ý nhận xét khi chấm bài
 * Mỗi chức năng có bộ máy cục bộ (luôn chạy được) và tự dùng Claude khi đã cấu hình key.
 */

const LETTER = (i: number) => String.fromCharCode(65 + i)
const shorten = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0)

/* ============================== 1. CÂU HỎI HAY BỊ SAI ============================== */

export type DifficultyLevel = 'Rất khó' | 'Khó' | 'Trung bình' | 'Dễ'

export function difficultyOf(q: QuestionInsight): DifficultyLevel {
  if (q.wrongRate >= 70) return 'Rất khó'
  if (q.wrongRate >= 45) return 'Khó'
  if (q.wrongRate >= 20) return 'Trung bình'
  return 'Dễ'
}

/** Phương án sai được chọn nhiều nhất (nhầm lẫn phổ biến). */
export function topDistractor(q: QuestionInsight): { index: number; count: number; share: number } | null {
  let best = -1
  q.optionCounts.forEach((c, i) => {
    if (i !== q.answerKey && c > 0 && (best === -1 || c > q.optionCounts[best])) best = i
  })
  if (best === -1) return null
  const wrongTotal = q.attempts - q.correctCount
  return { index: best, count: q.optionCounts[best], share: pct(q.optionCounts[best], wrongTotal) }
}

function localQuestionInsight(q: QuestionInsight): string {
  const lines: string[] = []
  const wrong = q.attempts - q.correctCount
  const distractor = topDistractor(q)
  const correctText = q.options[q.answerKey]

  lines.push(
    `**Mức độ: ${difficultyOf(q)}** — ${wrong}/${q.attempts} lượt làm sai (${q.wrongRate}%).`
  )

  if (distractor && distractor.share >= 50 && distractor.count >= 1) {
    lines.push(
      `**Nhầm lẫn phổ biến:** ${distractor.share}% số lượt sai cùng chọn **${LETTER(distractor.index)}. ${shorten(q.options[distractor.index])}** thay vì **${LETTER(q.answerKey)}. ${shorten(correctText)}**. Đây nhiều khả năng là một hiểu lầm có hệ thống chứ không phải đoán bừa.`
    )
  } else if (wrong >= 2) {
    lines.push('**Lựa chọn sai phân tán** trên nhiều phương án — học viên có thể chưa nắm kiến thức nền và đang đoán.')
  }
  if (q.unanswered > 0) {
    lines.push(`**${q.unanswered} lượt bỏ trống** — có thể do thiếu thời gian hoặc câu hỏi khó hiểu.`)
  }

  lines.push('**Gợi ý giảng dạy:**')
  if (q.explanation) lines.push(`- Giảng lại trọng tâm: ${q.explanation}`)
  if (distractor) {
    lines.push(`- Phân tích trên lớp vì sao "${shorten(q.options[distractor.index], 50)}" sai, đặt cạnh đáp án đúng để học viên so sánh.`)
  }
  lines.push('- Cho thêm 2–3 câu luyện tập cùng dạng, rồi kiểm tra lại bằng một câu tương tự ở bài sau.')
  if (q.wrongRate >= 70 && !(distractor && distractor.share >= 50)) {
    lines.push('- Xem lại cách diễn đạt câu hỏi và các phương án — tỷ lệ sai rất cao đôi khi do đề gây hiểu nhầm.')
  }
  return lines.join('\n')
}

export function analyzeQuestion(q: QuestionInsight): Promise<AIResult> {
  return runAI(
    'question_insight',
    {
      quiz: q.quizTitle,
      course: q.courseTitle,
      question: q.prompt,
      options: q.options.map((o, i) => ({ label: LETTER(i), text: o, chosen: q.optionCounts[i], correct: i === q.answerKey })),
      attempts: q.attempts,
      unanswered: q.unanswered,
      wrong_rate_percent: q.wrongRate,
      teacher_explanation: q.explanation,
    },
    () => localQuestionInsight(q)
  )
}

/* ============================== 2. HỌC VIÊN CÓ NGUY CƠ ============================== */

export type RiskLevel = 'Cao' | 'Trung bình' | 'Thấp'

export interface RiskAssessment {
  row: StudentInClass
  score: number
  level: RiskLevel
  reasons: string[]
  daysInactive: number | null
  suggestion: string
}

/**
 * Chấm điểm nguy cơ 0–100 từ 4 nhóm tín hiệu (có trọng số):
 *  - Không hoạt động (35): số ngày kể từ lần học / nộp bài gần nhất
 *  - Tiến độ (25): phần bài học chưa hoàn thành
 *  - Kết quả (30): điểm trung bình thấp hơn điểm đạt, hoặc điểm đang giảm
 *  - Trượt nhiều lần (10)
 */
export function assessRisk(row: StudentInClass, now = Date.now()): RiskAssessment {
  const reasons: string[] = []
  const daysInactive = row.lastActivityAt ? Math.floor((now - new Date(row.lastActivityAt).getTime()) / 86_400_000) : null

  let inactivity = 0
  if (daysInactive !== null) {
    inactivity = Math.min(daysInactive / 14, 1) * 35
    if (daysInactive >= 7) reasons.push(`${daysInactive} ngày chưa hoạt động`)
  }

  const progressGap = (1 - row.progressPercent / 100) * 25
  if (row.progressPercent < 50) reasons.push(`tiến độ mới ${row.progressPercent}%`)

  let performance = 0
  if (row.avgScore === null) {
    performance = 8 // chưa có dữ liệu kết quả -> rủi ro nhẹ
  } else {
    if (row.avgScore < row.passScore) {
      performance = Math.min((row.passScore - row.avgScore) / row.passScore, 1) * 30
      reasons.push(`điểm TB ${row.avgScore} dưới mức đạt ${row.passScore}`)
    }
    const n = row.scores.length
    if (n >= 2 && row.scores[n - 1] < row.scores[n - 2] - 10) {
      performance = Math.min(performance + 10, 30)
      reasons.push(`điểm giảm từ ${Math.round(row.scores[n - 2])} xuống ${Math.round(row.scores[n - 1])}`)
    }
  }

  const failed = Math.min(row.failedCount, 3) / 3 * 10
  if (row.failedCount >= 2) reasons.push(`trượt ${row.failedCount} lần`)

  const score = Math.round(inactivity + progressGap + performance + failed)
  const level: RiskLevel = score >= 55 ? 'Cao' : score >= 35 ? 'Trung bình' : 'Thấp'

  let suggestion: string
  if (daysInactive !== null && daysInactive >= 7) suggestion = 'Liên hệ hỏi thăm, nhắc lịch học và giao một mục tiêu nhỏ cho tuần này.'
  else if (row.avgScore !== null && row.avgScore < row.passScore) suggestion = 'Giao bài ôn tập theo các câu đã sai trước khi cho làm lại quiz.'
  else if (row.progressPercent < 50) suggestion = 'Khuyến khích hoàn thành bài học tiếp theo trước khi chuyển sang phần mới.'
  else suggestion = 'Tiếp tục theo dõi, chưa cần can thiệp.'

  return { row, score, level, reasons, daysInactive, suggestion }
}

export function rankAtRisk(rows: StudentInClass[], now = Date.now()): RiskAssessment[] {
  return rows.map((r) => assessRisk(r, now)).sort((a, b) => b.score - a.score)
}

function firstName(full: string) {
  const parts = full.trim().split(/\s+/)
  return parts[parts.length - 1] || full
}

function localRiskMessage(r: RiskAssessment): string {
  const name = firstName(r.row.name)
  const lines = [`Chào ${name}, thầy/cô theo dõi việc học của em ở khóa "${r.row.courseName}" và muốn cùng em lấy lại nhịp học nhé.`]
  const todo: string[] = []
  if (r.daysInactive !== null && r.daysInactive >= 7) todo.push(`dành 20–30 phút học lại bài đang dở (em đã nghỉ ${r.daysInactive} ngày)`)
  if (r.row.progressPercent < 50) todo.push(`hoàn thành thêm 2 bài học để vượt mốc 50% (hiện ${r.row.progressPercent}%)`)
  if (r.row.avgScore !== null && r.row.avgScore < r.row.passScore) todo.push(`ôn lại các câu đã sai rồi làm lại bài kiểm tra (cần đạt ${r.row.passScore} điểm)`)
  if (todo.length === 0) todo.push('giữ đều nhịp học mỗi ngày một chút')
  lines.push(`Tuần này em thử: ${todo.slice(0, 2).join('; ')}.`)
  lines.push('Nếu gặp khó khăn ở phần nào, em cứ nhắn thầy/cô hoặc hỏi Trợ lý AI nhé. Cố lên em!')
  return lines.join(' ')
}

export function draftRiskMessage(r: RiskAssessment): Promise<AIResult> {
  return runAI(
    'risk_message',
    {
      student_name: r.row.name,
      course: r.row.courseName,
      progress_percent: r.row.progressPercent,
      average_score: r.row.avgScore,
      pass_score: r.row.passScore,
      recent_scores: r.row.scores.slice(-5),
      failed_attempts: r.row.failedCount,
      days_inactive: r.daysInactive,
      risk_level: r.level,
      signals: r.reasons,
    },
    () => localRiskMessage(r)
  )
}

/* ============================== 3. GỢI Ý NHẬN XÉT ============================== */

function localFeedback(d: SubmissionDetail): string {
  const name = firstName(d.studentName)
  const wrong = d.items.filter((i) => !i.correct)
  const correctCount = d.items.length - wrong.length
  const score = Math.round(d.score)
  const parts: string[] = []

  if (score >= 90) parts.push(`Chào ${name}, bài làm rất tốt — em đạt ${score}/100 điểm, nắm chắc hầu hết kiến thức của "${d.quizTitle}".`)
  else if (score >= d.passScore) parts.push(`Chào ${name}, em đã đạt yêu cầu với ${score}/100 điểm (đúng ${correctCount}/${d.items.length} câu). Em còn có thể tiến bộ thêm ở vài điểm sau.`)
  else parts.push(`Chào ${name}, bài làm đạt ${score}/100 điểm (đúng ${correctCount}/${d.items.length} câu), chưa đạt mức ${d.passScore} điểm. Thầy/cô tin em sẽ làm tốt hơn sau khi ôn lại các phần dưới đây.`)

  if (wrong.length > 0) {
    parts.push('Những điểm cần ôn lại:')
    wrong.slice(0, 3).forEach((w) => {
      const chosen = w.selected === null ? 'em bỏ trống' : `em chọn "${shorten(w.options[w.selected], 40)}"`
      const fix = w.explanation || `đáp án đúng là "${shorten(w.options[w.answerKey], 50)}"`
      parts.push(`- ${shorten(w.prompt, 60)}: ${chosen} — ${fix}`)
    })
    if (wrong.length > 3) parts.push(`- Và ${wrong.length - 3} câu khác, em xem phần giải thích chi tiết trong kết quả bài làm.`)
  }

  parts.push(
    score >= d.passScore
      ? 'Em giữ vững phong độ và thử sức với bài nâng cao hơn nhé!'
      : 'Em ôn lại bài học liên quan rồi làm lại bài kiểm tra nhé, cố lên!'
  )
  return parts.join('\n')
}

export function suggestFeedback(d: SubmissionDetail): Promise<AIResult> {
  return runAI(
    'grading_feedback',
    {
      student_name: d.studentName,
      quiz: d.quizTitle,
      course: d.courseTitle,
      score: d.score,
      pass_score: d.passScore,
      questions: d.items.map((i) => ({
        question: i.prompt,
        student_answer: i.selected === null ? null : i.options[i.selected],
        correct_answer: i.options[i.answerKey],
        is_correct: i.correct,
        explanation: i.explanation,
      })),
    },
    () => localFeedback(d)
  )
}
