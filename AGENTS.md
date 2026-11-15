# AGENTS.md — Hướng dẫn cho AI agents

Tệp này cung cấp ngữ cảnh và quy tắc làm việc cho AI coding agents (và contributor) khi đọc hoặc thay đổi repository EduAI. Nội dung hướng đến dự án hiện tại, không phải tuyên bố rằng mọi tính năng đã được triển khai.

## 1. Tổng quan EduAI

EduAI là nền tảng học trực tuyến tích hợp AI, định hướng cho ba vai trò Student, Instructor và Admin. Mục tiêu sản phẩm gồm quản lý khóa học/bài học, theo dõi tiến độ, làm quiz và để giảng viên tạo bản nháp quiz từ tài liệu bằng AI rồi duyệt trước khi xuất bản.

**Trạng thái mã nguồn hiện tại (cập nhật 16/11/2026):** ứng dụng React 19 + TypeScript + Vite + React Router 7 + Tailwind, có đủ 3 khu vực Học viên / Giảng viên / Admin với route bảo vệ theo vai trò.

- **Hai chế độ dữ liệu** (tự chọn theo `.env`):
  - *Chế độ demo* (chưa cấu hình Supabase): dữ liệu lưu trong `localStorage` qua `src/services/demoDb.ts`, mô phỏng đúng các bảng trong `supabase/migrations`. Chỉ đăng nhập được bằng tài khoản demo (`student|teacher|admin@demo.com` / `123456`) hoặc tài khoản tự đăng ký ở chế độ demo.
  - *Chế độ Supabase*: Auth + Postgres + RLS thật; chấm điểm quiz qua RPC `submit_quiz_attempt` ở server.
- **AI (bộ máy kết hợp):** mặc định là "AI mô phỏng" chạy trong trình duyệt (không cần key). Khi đã cấu hình Supabase **và** đặt `ANTHROPIC_API_KEY` trong Edge Function Secrets, các chức năng AI của Giảng viên tự chuyển sang Claude qua Edge Function `supabase/functions/ai-assist`; lỗi/chưa có key thì tự quay về AI mô phỏng (`src/services/aiEngine.ts`). Mọi kết quả AI là bản nháp, giảng viên duyệt/sửa trước khi dùng.
  - `aiService.ts`: sinh quiz từ tài liệu, gia sư AI cho học viên (cục bộ).
  - `teacherAiService.ts`: phân tích câu hỏi hay sai, chấm điểm nguy cơ học viên + soạn lời nhắc, gợi ý nhận xét khi chấm bài (trang `/teacher/ai-insights` và cửa sổ chấm bài).
- Zustand, Axios, React Hook Form, Zod **không** được dùng. Đọc `package.json` và mã nguồn trước khi giả định một thư viện/endpoint tồn tại.

## 2. Cấu trúc quan trọng

```text
docs/                         Tài liệu nghiệp vụ / giao diện / kỹ thuật
supabase/migrations/
  20261115_init_schema.sql          Bảng, enum, trigger tạo profile (chạy lại được)
  20261116_security_hardening.sql   RLS chặt, RPC chấm điểm, chặn tự nâng quyền
src/
  App.tsx                     Định tuyến theo vai trò (lazy-load từng trang)
  main.tsx                    Entry point
  contexts/AuthContext.tsx    Đăng nhập / đăng ký / hồ sơ (demo hoặc Supabase)
  hooks/                      useAuth, useNotifications, useTeacherScope
  lib/                        supabase.ts, demoAccounts.ts, errorMessage.ts, localPrefs.ts
  services/                   studentService, teacherService, adminService,
                              notificationService, aiService, demoDb (dữ liệu demo)
  components/                 auth/, layout/, AITutorChat, MarkdownContent (Markdown + KaTeX)
  layouts/                    Khung trang Học viên (header, sidebar, tìm kiếm, chuông thông báo)
  pages/                      auth/, student/, teacher/, admin/, error/
  types/                      Kiểu dùng chung
```

Thư mục `features/` và Edge Function `supabase/functions/generate-quiz` trong tài liệu kỹ thuật vẫn là cấu trúc định hướng, chưa có trong repository.

## 3. Quy ước code

### Naming

- React component dùng `PascalCase`; hooks bắt đầu bằng `use`; hàm/biến dùng `camelCase`.
- Tên boolean nên diễn đạt trạng thái (`isLoading`, `hasAccess`).
- Hằng số và union types nên biểu đạt domain; tránh `any` và ép kiểu không cần thiết.
- Giữ tên sản phẩm, label UI và nội dung người dùng bằng tiếng Việt; tên code bằng tiếng Anh theo convention hiện có.

### Components và logic

- Component tập trung vào một trách nhiệm, nhận props có type rõ ràng.
- Giữ state cục bộ cho trạng thái chỉ thuộc một vùng UI; chỉ đưa state chia sẻ lên store khi có nhu cầu thực.
- Không thêm dependency/framework chỉ để giải quyết một trường hợp nhỏ; kiểm tra package và prior art trước.
- Khi tích hợp API, thể hiện loading/error/empty/success riêng; không che lỗi bằng dữ liệu mặc định thành công.
- Tính năng AI trả bản nháp; yêu cầu người có thẩm quyền duyệt trước khi xuất bản.

### Styling và accessibility

- Bám hệ thống giao diện "Aurora Glass" trong `src/index.css` (nền cực quang, thẻ kính mờ, banner động, nút gradient, sidebar tím đêm) và khung `src/components/layout/AppShell.tsx` dùng chung cho 3 vai trò. Font: Be Vietnam Pro (nội dung) + Plus Jakarta Sans (tiêu đề). `src/App.css` chỉ còn dùng cho dashboard học viên.
- Hiệu ứng động phải tắt được bằng `prefers-reduced-motion` (đã có quy tắc chung ở cuối `index.css`).
- Duy trì responsive trên mobile/tablet/desktop; không gây overflow ngang.
- Dùng semantic HTML, label cho input, accessible name cho icon button, focus-visible và trạng thái không chỉ dựa vào màu.
- Kiểm tra `prefers-reduced-motion`; giữ tương phản đủ dùng.

## 4. Lệnh thường dùng

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

Hiện `package.json` chưa có lệnh `test`; không báo test suite đã chạy nếu chưa được thêm. Node hiện yêu cầu Vite: dùng Node 20.19+ hoặc 22.12+.

Tài khoản demo (chỉ khi chưa cấu hình Supabase): `student@demo.com`, `teacher@demo.com`, `admin@demo.com` — mật khẩu `123456`. Xóa dữ liệu demo: xóa key `eduai_demo_db_v2` trong localStorage.

## 5. Database schema mục tiêu

Migration hiện có 9 bảng (8 bảng nghiệp vụ + `notifications`). **Lưu ý tên vai trò:** code và database dùng `teacher` (tài liệu nghiệp vụ gọi là Instructor/`instructor`).

- `profiles`: hồ sơ và role (`student`, `teacher`, `admin`).
- `courses`: khóa học, liên kết giảng viên qua `teacher_id`.
- `lessons`: nội dung bài học theo thứ tự khóa.
- `enrollments`: đăng ký học viên/khóa học, unique theo cặp.
- `lesson_progress`: tiến độ học viên/bài học, unique theo cặp.
- `quizzes`: quiz thuộc khóa/bài và trạng thái draft/published.
- `quiz_questions`: nội dung câu hỏi/lựa chọn/đáp án.
- `quiz_attempts`: câu trả lời và kết quả bài làm.

Chạy 2 file migration theo thứ tự trong Supabase SQL Editor (chạy lại nhiều lần không lỗi). Quy tắc đã được áp dụng bằng RLS/RPC và phải giữ nguyên khi sửa:

- Học viên **không** đọc trực tiếp `quiz_questions`; lấy đề qua `get_quiz_for_attempt` (không có đáp án), nộp bài qua `submit_quiz_attempt` (server chấm, chống nộp trùng bằng `client_attempt_id`).
- Không ai tự đăng ký hay tự nâng quyền thành `admin`; chỉ Admin được xuất bản khóa học (trigger `guard_course_changes`).
- Hồ sơ chỉ hiển thị cho chính chủ, Admin, giảng viên của khóa đã ghi danh và ngược lại.
- Gửi thông báo cho người khác: không dùng `.select()` sau `insert` (người gửi không có quyền đọc thông báo của người nhận).

## 6. Environment variables

Các biến frontend mục tiêu (chỉ public config):

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AI_API_URL=
```

- Để trống/giữ giá trị mẫu trong `.env` → ứng dụng chạy chế độ demo (không cần backend).
- `.env.local` chỉ dùng local và không commit.
- Không đặt Supabase `service_role`, OpenAI/AI provider key, password, access token hoặc secret nào trong `VITE_*`.
- AI key được lưu trong Supabase Edge Function Secrets: `supabase secrets set ANTHROPIC_API_KEY=...` rồi `supabase functions deploy ai-assist` (tùy chọn `AI_MODEL`, mặc định `claude-opus-5-5`; `APP_ORIGIN` để giới hạn CORS). Frontend không cần biến môi trường mới. Nếu phát hiện secret đã commit, báo ngay và rotate; xóa khỏi file không làm secret cũ an toàn trở lại.

## 7. Quy trình khi AI sửa code

1. Đọc yêu cầu, `package.json`, tệp liên quan và trạng thái hiện tại trước khi sửa.
2. Phân biệt tính năng đã có với định hướng trong tài liệu; hỏi lại nếu thay đổi hành vi/scope có nhiều lựa chọn.
3. Tìm pattern/helper đang có; lập thay đổi nhỏ, hoàn chỉnh và không sửa ngoài phạm vi.
4. Không đọc/in ra giá trị `.env`; không thêm secret vào source, log, tài liệu hoặc commit.
5. Giữ type safety; cập nhật tài liệu liên quan khi thay đổi API/hành vi/cấu hình.
6. Chạy validation nhỏ nhất phù hợp, tối thiểu `npm run build` và/hoặc `npm run lint` nếu sửa frontend.
7. Đọc lại diff, xác nhận không stage file ngoài phạm vi, không xóa thay đổi người khác.

### Checklist trước khi hoàn tất

- [ ] Thay đổi đúng yêu cầu, không mở rộng scope ngoài ý muốn.
- [ ] Build/typecheck/lint liên quan đã chạy và ghi nhận chính xác kết quả.
- [ ] Loading, lỗi, empty và trường hợp responsive/accessibility được xem xét.
- [ ] Không có secret, `.env`, build output hay `node_modules` trong nội dung chuẩn bị commit.
- [ ] Tài liệu, tên file và lệnh hướng dẫn khớp với mã nguồn thực tế.

## 8. Tài liệu tham khảo trong repository

- [Tài liệu nghiệp vụ](docs/01-TAI-LIEU-NGHIEP-VU.md)
- [Tài liệu giao diện AI](docs/02-TAI-LIEU-GIAO-DIEN-AI.md)
- [Tài liệu kỹ thuật Frontend](docs/03-TAI-LIEU-KY-THUAT-AI-FRONTEND.md)
- [Tài liệu kỹ thuật Backend/Admin](docs/04-TAI-LIEU-KY-THUAT-AI-ADMIN.md)
- [README](README.md)
