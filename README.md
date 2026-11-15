# EduAI — Nền tảng học tập thông minh tích hợp AI

EduAI là nền tảng học trực tuyến cho **3 vai trò: Học viên, Giảng viên, Quản trị viên**, xây dựng bằng React 19 + TypeScript + Vite + Tailwind CSS + Supabase, có các chức năng AI hỗ trợ giảng dạy.

[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ecf8e?logo=supabase)](https://supabase.com/)

---

## 🚀 Chạy thử trong 1 phút (không cần cấu hình gì)

```bash
git clone https://github.com/haiydkr06-hub/eduaihocthongminh.git
cd eduaihocthongminh
npm install
npm run dev
```

Mở `http://localhost:5173` và đăng nhập bằng một trong các tài khoản demo:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| 👩‍🎓 Học viên | `student@demo.com` | `123456` |
| 👨‍🏫 Giảng viên | `teacher@demo.com` | `123456` |
| 🛡️ Quản trị viên | `admin@demo.com` | `123456` |

> Trang đăng nhập có sẵn 3 nút **Trải nghiệm nhanh** để vào thẳng từng vai trò.

**Chế độ demo** tự bật khi chưa cấu hình Supabase: dữ liệu mẫu (khóa học, bài học, quiz, bài làm, thông báo) được lưu trong `localStorage` của trình duyệt nên **mọi thao tác đều được lưu lại** và đồng bộ giữa 3 vai trò trên cùng trình duyệt. Muốn khôi phục dữ liệu mẫu ban đầu: xóa key `eduai_demo_db_v2` trong DevTools → Application → Local Storage.

Yêu cầu: **Node.js 20.19+ hoặc 22.12+**.

---

## ✨ Chức năng theo vai trò

### 👩‍🎓 Học viên — `/student`
- **Tổng quan:** số khóa đang học, giờ học, điểm tích lũy, mục tiêu tuần, biểu đồ 7 ngày, bài học tiếp theo — **tính từ dữ liệu thật**, số đếm tăng dần.
- **Khóa học:** khám phá danh mục, tìm kiếm (cả từ thanh tìm kiếm trên cùng), lọc theo môn, đăng ký khóa học.
- **Phòng học:** nội dung bài học hiển thị Markdown + công thức toán (KaTeX), video YouTube, đánh dấu hoàn thành, ghi chú cá nhân, danh sách bài kiểm tra của khóa, gia sư AI bên cạnh.
- **Làm quiz:** đồng hồ đếm ngược, bản đồ câu hỏi, xác nhận khi còn câu bỏ trống, tự nộp khi hết giờ, **giữ bài làm khi tải lại trang**, xem đáp án + giải thích sau khi nộp.
- **Kế hoạch học tập:** khóa đang học dở và bài kiểm tra chưa đạt.
- **Thành tích:** chuỗi ngày học, huy hiệu (có tiến độ), chứng chỉ hoàn thành khóa (in / lưu PDF).
- **Thông báo, Hồ sơ:** đọc thông báo, cập nhật họ tên / SĐT, đổi mật khẩu.

### 👨‍🏫 Giảng viên — `/teacher`
- **Tổng quan:** số khóa, học viên, bài cần nhận xét, điểm trung bình, bài nộp gần đây.
- **Khóa học:** tạo khóa (chờ Admin duyệt), thêm bài học (nội dung + video).
- **Lớp học:** danh sách học viên theo khóa, tiến độ, điểm trung bình.
- **Bài kiểm tra:** tạo quiz kèm câu hỏi, xuất bản / thu hồi.
- **🤖 Soạn quiz bằng AI:** dán tài liệu → AI sinh câu hỏi từ chính nội dung tài liệu, đáp án được xáo trộn; giảng viên sửa và **phải tick xác nhận đã kiểm tra** mới xuất bản được.
- **🤖 Trợ lý AI giảng dạy** (`/teacher/ai-insights`):
  - **Câu hỏi hay bị sai:** tỷ lệ sai, phân bố lựa chọn, phương án học viên hay nhầm, AI phân tích nguyên nhân và gợi ý cách giảng lại.
  - **Học viên có nguy cơ:** điểm nguy cơ 0–100 (không hoạt động 35% · tiến độ 25% · kết quả 30% · số lần trượt 10%), lý do cụ thể, **AI soạn lời nhắc** → sửa → gửi thông báo cho học viên.
- **🤖 Chấm điểm & Nhận xét:** nút **"AI gợi ý nhận xét"** đọc từng câu đúng/sai và viết bản nháp nhận xét; khi lưu, học viên nhận thông báo kèm điểm và nhận xét.
- **Thống kê giảng dạy:** tiến độ, điểm theo khóa, học viên cần hỗ trợ (dùng chung bộ chấm điểm nguy cơ).

### 🛡️ Quản trị viên — `/admin`
- **Tổng quan:** số học viên / giảng viên / khóa học / lượt làm bài, tỷ lệ đạt, khóa chờ duyệt, nhật ký hoạt động gần đây.
- **Người dùng:** tìm kiếm theo tên/email, lọc vai trò, đổi vai trò (có xác nhận, không tự hạ quyền chính mình).
- **Khóa học:** duyệt xuất bản / thu hồi / lưu trữ — giảng viên nhận thông báo kết quả.
- **Bài kiểm tra, Báo cáo:** thống kê theo bộ môn, phổ điểm, **xuất CSV tiếng Việt có dấu** (mở đúng bằng Excel).
- **Thông báo:** gửi tới toàn hệ thống / học viên / giảng viên.

> Admin truy cập được cả khu vực Giảng viên và Học viên để kiểm tra.

---

## 🤖 Bộ máy AI kết hợp

| Tình huống | AI được dùng |
|---|---|
| Mặc định (chưa có key) | **AI mô phỏng** chạy trong trình duyệt — miễn phí, luôn hoạt động |
| Đã cấu hình Supabase + `ANTHROPIC_API_KEY` | **Claude** (`claude-opus-5-5`) qua Supabase Edge Function `ai-assist` cho 3 chức năng AI của giảng viên |
| Claude lỗi / quá tải | Tự quay về AI mô phỏng và báo cho giảng viên |

- API key **chỉ** nằm trong Edge Function Secrets, không bao giờ xuống trình duyệt.
- Mọi kết quả AI là **bản nháp** — giảng viên đọc, sửa trước khi dùng.
- Gia sư AI của học viên và chức năng soạn quiz hiện chạy bằng AI mô phỏng.

Bật AI thật:

```bash
supabase secrets set ANTHROPIC_API_KEY=<anthropic-api-key>
supabase secrets set APP_ORIGIN=https://ten-mien-cua-ban   # khuyến nghị: giới hạn CORS
supabase functions deploy ai-assist
```

---

## 🔐 Bảo mật & phân quyền

- Route theo vai trò (`ProtectedRoute`), vai trò chỉ lấy từ bảng `profiles` — không tin dữ liệu người dùng tự gửi lên.
- **Không ai tự đăng ký hay tự nâng quyền thành Admin** (trigger + RLS).
- Chặn open redirect sau đăng nhập (`?redirect=//trang-la.com`).
- **Chấm điểm quiz ở server** (RPC `submit_quiz_attempt`), học viên không đọc được đáp án trước khi nộp, không tự sửa điểm; chống nộp trùng.
- Chỉ Admin được xuất bản khóa học; giảng viên chỉ quản lý khóa của mình; học viên chỉ xem nội dung khóa đã đăng ký.
- Hồ sơ (email, SĐT) chỉ hiển thị cho chính chủ, Admin và giảng viên/học viên cùng khóa.

---

## 🗄️ Kết nối Supabase (tùy chọn)

1. Tạo file `.env.local` ở thư mục gốc:
   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
2. Trong Supabase SQL Editor, chạy **lần lượt** 2 file (chạy lại nhiều lần không lỗi):
   - `supabase/migrations/20261115_init_schema.sql`
   - `supabase/migrations/20261116_security_hardening.sql`
3. Tạo tài khoản Admin đầu tiên: đăng ký bình thường rồi chạy trong SQL Editor
   `update public.profiles set role = 'admin' where email = 'email-cua-ban';`
4. (Tùy chọn) Bật AI thật như mục trên.

Khi đã cấu hình Supabase, tài khoản demo bị tắt — mọi đăng nhập đi qua Supabase Auth.

---

## 🎨 Giao diện "Aurora Glass"

Nền cực quang chuyển động, thẻ kính mờ nổi lên khi rê chuột, banner dải màu chạy + vệt sáng, sidebar tím đêm dùng chung cho 3 vai trò, trang đăng nhập chia đôi có chữ tự gõ, số liệu đếm tăng dần, khối nội dung trượt vào khi chuyển trang. Responsive từ 320px; **mọi hiệu ứng tự tắt khi bật "giảm chuyển động"** (`prefers-reduced-motion`). Font: Be Vietnam Pro + Plus Jakarta Sans.

---

## 🧰 Lệnh thường dùng

```bash
npm run dev       # chạy phát triển
npm run build     # kiểm tra TypeScript (tsc -b) + build production
npm run lint      # oxlint
npm run preview   # xem bản build
```

---

## 📁 Cấu trúc thư mục

```text
├── docs/                         Tài liệu nghiệp vụ / giao diện / kỹ thuật
├── supabase/
│   ├── migrations/               Schema, RLS, RPC chấm điểm
│   └── functions/ai-assist/      Edge Function gọi Claude
└── src/
    ├── App.tsx                   Định tuyến theo vai trò (lazy-load từng trang)
    ├── index.css                 Hệ thống giao diện Aurora Glass
    ├── components/               AppShell (khung 3 vai trò), MarkdownContent, CountUp, auth/
    ├── contexts/AuthContext.tsx  Đăng nhập / đăng ký / hồ sơ (demo hoặc Supabase)
    ├── hooks/                    useAuth, useNotifications, useTeacherScope
    ├── lib/                      supabase, demoAccounts, errorMessage, localPrefs
    ├── services/                 student/teacher/admin/notification service,
    │                             aiEngine (AI kết hợp), teacherAiService, aiService, demoDb
    ├── layouts/                  Khung trang Học viên + thanh tìm kiếm, chuông thông báo
    └── pages/                    auth/, student/, teacher/, admin/, error/
```

---

## ⚠️ Giới hạn hiện tại

- Chế độ demo lưu dữ liệu trong trình duyệt, mỗi trình duyệt có dữ liệu riêng.
- Chế độ demo không gửi được email khôi phục mật khẩu (trang Quên mật khẩu sẽ thông báo rõ).
- Giảng viên chưa sửa / xóa được bài học và câu hỏi sau khi lưu; chưa có trang công khai giới thiệu khóa học trước khi đăng nhập.
- Đường gọi Claude thật đã được kiểm tra kiểu với SDK chính thức nhưng cần API key để chạy thực tế.
- Chưa có bộ test tự động (`npm test`).
