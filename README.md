# EduAI — Hệ thống học tập thông minh tích hợp trí tuệ nhân tạo (AI)

EduAI là nền tảng giáo dục trực tuyến toàn diện, kết nối học viên, giảng viên và quản trị viên với sự trợ lực mạnh mẽ từ trí tuệ nhân tạo (AI). Nền tảng được xây dựng trên nền React 19, TypeScript, Vite, Tailwind CSS và Supabase.

[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?logo=supabase)](https://supabase.com/)

---

## Kiến trúc 3 phân hệ độc lập (RBAC)

### 1. Quản trị viên (Admin) — `/admin`
- **Dashboard quản trị:** Thống kê tổng số học viên, giảng viên, khóa học, quiz, lượt nộp bài và tỷ lệ hoàn thành.
- **Quản lý người dùng & phân quyền:** Tìm kiếm, lọc theo vai trò (`admin`, `teacher`, `student`), phân quyền nhanh qua modal xác thực.
- **Kiểm duyệt khóa học:** Phê duyệt (`published`), chuyển nháp (`draft`) hoặc lưu trữ (`archived`).
- **Quản lý bài kiểm tra (Quiz):** Quản lý đề thi, tỷ lệ đạt, xem chi tiết và xóa đề thi.
- **Báo cáo & Thống kê hệ thống:** Tỷ lệ hoàn thành theo danh mục, phổ điểm học viên toàn trường, xuất báo cáo CSV.
- **Thông báo toàn hệ thống:** Gửi thông báo broadcast tới học viên, giảng viên hoặc toàn trường.
- **Cài đặt hệ thống:** Cấu hình thông tin trường học, AI Model (OpenAI / Google Gemini / Claude), Supabase và chế độ bảo trì.

### 2. Giảng viên (Teacher) — `/teacher`
- **Dashboard giảng viên:** Theo dõi tổng học viên, khóa học đang dạy, bài kiểm tra và bài nộp cần chấm điểm.
- **Quản lý khóa học của tôi:** Tạo khóa học mới, chỉnh sửa, thêm bài giảng kèm link video YouTube embed và thời lượng.
- **Quản lý lớp học & học viên:** Danh sách học viên ghi danh, tiến độ học (%) và điểm số trung bình.
- **Tạo & Quản lý bài kiểm tra:** Trình soạn quiz thủ công với danh sách câu hỏi trắc nghiệm, đáp án đúng và lời giải thích.
- **Soạn Quiz tự động bằng AI:** Nhập tài liệu/nội dung bài giảng, AI tự động phân tích và sinh bộ câu hỏi trắc nghiệm kèm giải thích; giảng viên có thể xem trước, chỉnh sửa câu hỏi/đáp án trước khi xuất bản.
- **Chấm điểm & Nhận xét:** Xem danh sách bài thi của học viên, chấm điểm, nhập nhận xét chi tiết.
- **Thống kê kết quả giảng dạy:** Cảnh báo học viên cần lưu ý/tiến độ chậm, phân bố kết quả học tập.
- **Hồ sơ giảng viên:** Cập nhật thông tin chuyên môn, khoa/bộ môn, tiểu sử và đổi mật khẩu.

### 3. Học viên (Student) — `/student`
- **Dashboard học tập:** Giữ nguyên phong cách giao diện EduAI tím đặc trưng (`#6857DF`), thống kê khóa học, tiến độ cá nhân, bảng xếp hạng và biểu đồ thời gian học trong tuần.
- **Khám phá & Khóa học của tôi:** Tìm kiếm theo danh mục môn học, lọc trạng thái, ghi danh vào khóa học mới với 1 cú click.
- **Phòng học trực tuyến:** Xem bài giảng đa phương tiện (Video Player responsive), danh sách bài học, đánh dấu hoàn thành, tích hợp khung chat Trợ lý AI gia sư trực tiếp bên cạnh bài học.
- **Làm bài kiểm tra trực tuyến (Quiz):** Đồng hồ đếm ngược thời gian thực, bảng điều hướng danh sách câu hỏi, nộp bài tính điểm tự động, hiển thị đáp án đúng kèm lời giải thích chi tiết.
- **Lịch học & Lịch thi:** Theo dõi thời khóa biểu, lịch thi và hạn nộp bài tập theo ngày.
- **Thành tích & Chứng chỉ:** Chuỗi học tập (Streak), điểm tích lũy (XP), huy hiệu danh hiệu và cấp chứng chỉ hoàn thành khóa học.
- **Trợ lý AI học tập 24/7:** Hỏi đáp kiến thức mọi môn học Toán, Lý, Hóa, Tiếng Anh; gợi ý câu hỏi nhanh, hỗ trợ định dạng công thức và sao chép câu trả lời.
- **Hồ sơ cá nhân:** Chỉnh sửa thông tin cá nhân và cập nhật mật khẩu.

---

## Bảo mật & Phân quyền (Authentication & RLS)

- **Supabase Authentication:** Hỗ trợ Đăng nhập, Đăng ký (lựa chọn vai trò Học viên hoặc Giảng viên), Quên mật khẩu và Đặt lại mật khẩu.
- **Role-Based Access Control (RBAC):**
  - Trang bảo vệ `ProtectedRoute`: Kiểm tra session đăng nhập và vai trò người dùng.
  - Ngăn chặn triệt để hành vi truy cập trái phép bằng cách nhập URL trực tiếp.
  - Tự động chuyển hướng đúng Dashboard theo vai trò sau khi đăng nhập (`/` $\rightarrow$ `/admin/dashboard`, `/teacher/dashboard`, hoặc `/student/dashboard`).
  - Trang lỗi trực quan: `403 Unauthorized` (không đủ quyền hạn) và `404 Not Found`.
- **Database Row Level Security (RLS):** 10 bảng dữ liệu (`profiles`, `courses`, `lessons`, `enrollments`, `lesson_progress`, `quizzes`, `quiz_questions`, `quiz_attempts`, `notifications`) được bảo vệ bằng RLS policy ở cấp cơ sở dữ liệu.

---

## Cài đặt và Khởi chạy

### Yêu cầu hệ thống
- **Node.js:** phiên bản `20.19+` hoặc `22.12+`
- **npm:** phiên bản `10+`

### Các bước thực hiện

1. **Clone repository:**
   ```bash
   git clone https://github.com/haiydkr06-hub/eduaihocthongminh.git
   cd eduaihocthongminh/eduai
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường:**
   Tạo file `.env.local` tại thư mục `eduai/` với thông tin Supabase của bạn:
   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_AI_API_URL=https://your-project.supabase.co/functions/v1/generate-quiz
   ```
   *(Hệ thống đã có cơ chế fallback thông minh, ứng dụng vẫn hiển thị và chạy demo mượt mà ngay cả khi chưa kết nối Supabase).*

4. **Khởi chạy Database Migration:**
   Mở SQL Editor trên Supabase Dashboard và thực thi script:
   `supabase/migrations/20261115_init_schema.sql`

5. **Khởi chạy ứng dụng:**
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: `http://localhost:5173`

6. **Kiểm tra mã nguồn & Build:**
   ```bash
   npm run lint     # Oxlint kiểm tra cú pháp và quy tắc React (0 warnings, 0 errors)
   npm run build    # TypeScript compiler (tsc -b) & Vite production build
   ```

---

## Cấu trúc thư mục mã nguồn

```text
eduai/
├── src/
│   ├── app/
│   │   └── router.tsx                     # Hệ thống định tuyến toàn diện & RBAC
│   ├── components/
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.tsx         # Route Guard ngăn chặn truy cập trái phép
│   │   │   └── RootRedirect.tsx           # Điều hướng thông minh theo Role
│   │   └── layout/
│   │       ├── AdminLayout.tsx            # Khung giao diện Quản trị viên
│   │       ├── TeacherLayout.tsx          # Khung giao diện Giảng viên
│   │       └── StudentLayout.tsx          # Khung giao diện Học viên (Style tím đặc trưng)
│   ├── contexts/
│   │   ├── auth-context-base.ts          # Định nghĩa Context & Kiểu
│   │   └── AuthContext.tsx                # Quản lý Session Supabase & Profile
│   ├── hooks/
│   │   └── useAuth.ts                     # Custom hook xác thực
│   ├── lib/
│   │   └── supabase.ts                    # Supabase Client khởi tạo
│   ├── pages/
│   │   ├── admin/                         # 7 trang nghiệp vụ Admin
│   │   ├── teacher/                       # 7 trang nghiệp vụ Teacher + AI Quiz
│   │   ├── student/                       # 7 trang nghiệp vụ Student + AI Tutor
│   │   ├── auth/                          # Login, Register, Forgot, Reset Password
│   │   └── error/                         # 403 Unauthorized, 404 Not Found
│   ├── services/
│   │   ├── adminService.ts                # Dữ liệu & Thống kê Admin
│   │   ├── teacherService.ts              # Quản lý khóa học, bài học, chấm điểm
│   │   ├── studentService.ts              # Học tập, nộp quiz, tiến độ, thành tích
│   │   └── aiService.ts                   # Trợ lý AI Gia sư & AI Quiz Generator
│   ├── types/
│   │   └── auth.ts                        # TypeScript interfaces & Enums
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── supabase/
│   └── migrations/
│       └── 20261115_init_schema.sql       # 10 bảng, Trigger, RLS Policies & Indices
├── package.json
└── vite.config.ts
```
