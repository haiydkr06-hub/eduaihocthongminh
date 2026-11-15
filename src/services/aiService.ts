export interface AIQuizQuestion {
  id: string
  prompt: string
  options: [string, string, string, string]
  answer_key: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface GenerateQuizParams {
  content: string
  courseTitle: string
  questionsCount: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export const aiService = {
  /**
   * Sinh bản nháp bộ câu hỏi trắc nghiệm từ nội dung tài liệu bài giảng
   */
  async generateQuiz(params: GenerateQuizParams): Promise<AIQuizQuestion[]> {
    // Giả lập độ trễ xử lý của mô hình AI
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const isMath = params.courseTitle.toLowerCase().includes('toán') || params.content.toLowerCase().includes('hàm số')
    const isScience = params.courseTitle.toLowerCase().includes('khoa học') || params.content.toLowerCase().includes('vật lý')
    const isEnglish = params.courseTitle.toLowerCase().includes('tiếng anh') || params.content.toLowerCase().includes('english')

    const questions: AIQuizQuestion[] = []

    if (isMath) {
      questions.push(
        {
          id: `ai-q-${Date.now()}-1`,
          prompt: 'Tọa độ đỉnh I của đồ thị parabol hàm số y = ax² + bx + c (a ≠ 0) được xác định bởi công thức nào?',
          options: [
            'I(-b/2a; -Δ/4a)',
            'I(b/2a; Δ/4a)',
            'I(-b/a; -Δ/2a)',
            'I(-b/2a; Δ/4a)',
          ],
          answer_key: 0,
          explanation: 'Theo lý thuyết hàm số bậc hai, đỉnh parabol có hoành độ x = -b/(2a) và tung độ y = -Δ/(4a).',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-2`,
          prompt: 'Khi hệ số a > 0, bề lõm của đồ thị hàm số bậc hai y = ax² + bx + c sẽ:',
          options: [
            'Hướng lên trên và hàm số có giá trị nhỏ nhất',
            'Hướng xuống dưới và hàm số có giá trị lớn nhất',
            'Hướng sang phải đối xứng qua trục hoành',
            'Hướng sang trái đối xứng qua gốc tọa độ',
          ],
          answer_key: 0,
          explanation: 'Với a > 0, nhánh parabol hướng lên trên, điểm thấp nhất chính là đỉnh I (giá trị nhỏ nhất).',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-3`,
          prompt: 'Trục đối xứng của parabol y = 2x² - 8x + 5 là đường thẳng nào dưới đây?',
          options: ['x = 2', 'x = -2', 'x = 4', 'x = -4'],
          answer_key: 0,
          explanation: 'Trục đối xứng có phương trình x = -b/(2a) = -(-8)/(2 * 2) = 2.',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-4`,
          prompt: 'Giao điểm của parabol y = x² - 3x + 2 với trục tung Oy có tọa độ là:',
          options: ['(0; 2)', '(2; 0)', '(1; 0)', '(0; 1)'],
          answer_key: 0,
          explanation: 'Giao điểm với trục Oy có hoành độ x = 0 => y = 0² - 3(0) + 2 = 2 => Tọa độ là (0; 2).',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-5`,
          prompt: 'Khoảng đồng biến của hàm số y = x² - 4x + 3 là khoảng nào?',
          options: ['(2; +∞)', '(-∞; 2)', '(1; 3)', '(-∞; 4)'],
          answer_key: 0,
          explanation: 'Hệ số a = 1 > 0 nên hàm số nghịch biến trên (-∞; 2) và đồng biến trên (2; +∞).',
          difficulty: params.difficulty,
        }
      )
    } else if (isScience) {
      questions.push(
        {
          id: `ai-q-${Date.now()}-1`,
          prompt: 'Theo định luật vạn vật hấp dẫn của Newton, lực hấp dẫn giữa hai vật tỉ lệ nghịch với:',
          options: [
            'Bình phương khoảng cách giữa hai vật',
            'Khoảng cách giữa hai vật',
            'Tích khối lượng của hai vật',
            'Tổng khối lượng của hai vật',
          ],
          answer_key: 0,
          explanation: 'Công thức F_hd = G * (m1 * m2) / r², tỉ lệ nghịch với bình phương khoảng cách r².',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-2`,
          prompt: 'Đơn vị đo của gia tốc trọng trường trong hệ đo lường chuẩn SI là gì?',
          options: ['m/s²', 'm/s', 'N/kg²', 'kg.m/s'],
          answer_key: 0,
          explanation: 'Gia tốc trọng trường g có đơn vị đo là mét trên giây bình phương (m/s²).',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-3`,
          prompt: 'Quỹ đạo chuyển động của một vật ném ngang trong không khí (bỏ qua sức cản) có dạng:',
          options: [
            'Một nhánh của đường parabol',
            'Một đường thẳng đứng',
            'Một đường tròn đồng tâm',
            'Một đường cong hypebol',
          ],
          answer_key: 0,
          explanation: 'Vật ném ngang có phương trình quỹ đạo y = (g / (2v0²)) * x², là một nhánh của đường parabol.',
          difficulty: params.difficulty,
        }
      )
    } else if (isEnglish) {
      questions.push(
        {
          id: `ai-q-${Date.now()}-1`,
          prompt: 'Choose the correct sentence in Present Perfect tense:',
          options: [
            'She has lived here for five years.',
            'She is living here since five years.',
            'She lived here for five years ago.',
            'She has live here since five years.',
          ],
          answer_key: 0,
          explanation: 'Present perfect uses "has/have + V3/ed", and "for" is used with a period of time.',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-2`,
          prompt: 'Which word is closest in meaning to "INTENTIONAL"?',
          options: ['Deliberate', 'Accidental', 'Casual', 'Spontaneous'],
          answer_key: 0,
          explanation: '"Intentional" and "Deliberate" both mean done on purpose.',
          difficulty: params.difficulty,
        }
      )
    } else {
      questions.push(
        {
          id: `ai-q-${Date.now()}-1`,
          prompt: `Dựa vào tài liệu về "${params.courseTitle}", khẳng định nào sau đây là chính xác nhất?`,
          options: [
            'Khái niệm được xây dựng dựa trên nguyên lý nền tảng và có tính ứng dụng cao.',
            'Phương pháp chỉ áp dụng được trong môi trường lý thuyết đơn thuần.',
            'Không cần kiểm tra điều kiện xác định trước khi tính toán.',
            'Kết quả phụ thuộc ngẫu nhiên vào dữ liệu đầu vào.',
          ],
          answer_key: 0,
          explanation: 'Nguyên lý cốt lõi của bài học tập trung vào tính hệ thống và khả năng ứng dụng thực tiễn.',
          difficulty: params.difficulty,
        },
        {
          id: `ai-q-${Date.now()}-2`,
          prompt: 'Bước đầu tiên trong quy trình giải quyết vấn đề của chủ đề này là gì?',
          options: [
            'Xác định tập xác định và giả thiết đầu vào của bài toán.',
            'Bỏ qua các giả thiết và áp dụng ngay công thức mở rộng.',
            'Tính toán kết quả cuối cùng trước khi lập bảng biến thiên.',
            'Lấy mẫu ngẫu nhiên không cần kiểm chứng.',
          ],
          answer_key: 0,
          explanation: 'Quy tắc cơ bản luôn bắt đầu bằng việc đọc kỹ giả thiết và xác định phạm vi áp dụng.',
          difficulty: params.difficulty,
        }
      )
    }

    // Trả về đúng số lượng câu hỏi mong muốn
    return questions.slice(0, Math.min(params.questionsCount, questions.length))
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
