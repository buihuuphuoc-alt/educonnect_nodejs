# EduConnect

EduConnect là một nền tảng học trực tuyến (e-learning) viết bằng **Node.js /
Express**, render giao diện phía server bằng **Nunjucks** (không phải SPA gọi
REST API). Hệ thống hỗ trợ 2 vai trò chính: **học viên/giảng viên** (tạo khoá
học, đăng bài học, học và bình luận) và **quản trị viên** (quản lý người dùng,
khoá học, giao dịch ví, yêu cầu đặt lại mật khẩu...).

## Tính năng chính

- **Xác thực & tài khoản**: đăng ký, đăng nhập, đăng xuất, quên/đổi mật khẩu,
  cập nhật hồ sơ, yêu cầu xoá tài khoản.
- **Khoá học**: xem danh sách/tìm kiếm khoá học, tạo/sửa/xoá khoá học, đăng ký
  học (enroll), thêm/sửa/xoá bài học, tài liệu đính kèm (upload file) và bài
  tập cho từng bài học, đánh dấu hoàn thành bài học, đánh giá (review) khoá học.
- **Bình luận bài học**: thêm/sửa/xoá bình luận trong từng bài học.
- **Ví điện tử**: gửi yêu cầu nạp/rút tiền (admin duyệt), cập nhật thông tin
  ngân hàng, xem lịch sử giao dịch.
- **Trang quản trị (`/admin`)**: quản lý người dùng, khoá học, danh mục, liên
  hệ, yêu cầu nạp/rút tiền, yêu cầu đặt lại mật khẩu, yêu cầu xoá tài khoản.

## Cấu trúc thư mục

Dự án được tổ chức theo 3 vai trò rõ ràng: backend vẫn render HTML từ
views/public bên frontend qua đường dẫn tương đối — luồng chạy và logic
nghiệp vụ không phụ thuộc vào việc tách thư mục này.

```
EduConnect-main/
├── backend/               Node.js/Express app (logic, routes, middleware, DB access)
│   ├── src/
│   │   ├── app.js          Khởi tạo app, session, Nunjucks, filters, routes
│   │   ├── database.js     Kết nối MySQL (mysql2) + helper query
│   │   ├── middleware/
│   │   │   └── auth.js     loginRequired, adminRequired, getCurrentUser, checkPasswordChange
│   │   └── routes/
│   │       ├── public.js   Trang chủ, danh sách khoá học, tìm kiếm, giới thiệu, liên hệ
│   │       ├── auth.js     Đăng ký / đăng nhập / đăng xuất / quên mật khẩu
│   │       ├── user.js     Tài khoản, khoá học, bài học, tài liệu, bài tập, ví, bình luận
│   │       └── admin.js    Toàn bộ route dưới /admin
│   ├── scripts/
│   │   └── migrate-passwords.js   Migrate mật khẩu từ bản SQLite đời đầu
│   ├── tests/
│   │   ├── api.test.js         Test API (Jest + Supertest)
│   │   └── functional.test.js  Test luồng nghiệp vụ
│   ├── package.json
│   ├── package-lock.json
│   └── .env                Biến môi trường (không commit trong dự án thật)
│
├── frontend/              Giao diện (Nunjucks templates + tài nguyên tĩnh)
│   ├── views/              *.html — Nunjucks templates, render phía server
│   │   └── admin/          Templates riêng cho trang quản trị
│   └── public/              css/, js/, images/, uploads/ (bao gồm uploads/materials)
│
└── database/              Schema & dữ liệu
    ├── create_db.sql       Lệnh tạo database MySQL
    ├── database_mysql.sql  Schema đầy đủ: users, categories, courses, lessons,
    │                       lesson_materials, lesson_exercises, enrollments,
    │                       reviews, contacts, password_resets, wallet_transactions
    └── elearning.db        File SQLite cũ, chỉ dùng bởi scripts/migrate-passwords.js
                             để migrate mật khẩu từ bản SQLite đời đầu — KHÔNG phải
                             database chính; app hiện tại dùng MySQL
```

## Kiến trúc

Backend dùng `nunjucks.configure(..., { express: app })` để render HTML trực
tiếp từ `frontend/views`, và dùng session (cookie) lưu trong MySQL
(`express-mysql-session`) để xác thực — đây là ứng dụng **server-render
truyền thống**, không phải kiến trúc SPA gọi JSON API + token. Muốn tách thật
sự thành 2 service độc lập (frontend SPA React/Vue riêng, backend chỉ trả
JSON) sẽ cần viết lại route để trả JSON thay vì `res.render(...)`, chuyển xác
thực sang JWT/token, và viết lại toàn bộ template thành component render phía
client — đây là một lần viết lại đáng kể, không nằm trong phạm vi cấu trúc
hiện tại.

## Cài đặt & chạy dự án

### Yêu cầu

- Node.js (khuyến nghị bản LTS mới nhất)
- MySQL đang chạy (mặc định cấu hình cổng `3307`, xem `.env`)

### Các bước

```bash
cd backend
npm install

# 1. Tạo database
mysql -u root -p < ../database/create_db.sql

# 2. Import schema (bảng users, courses, lessons, ...)
mysql -u root -p educonnect < ../database/database_mysql.sql

# 3. Cấu hình biến môi trường trong backend/.env (xem bên dưới)

# 4. Chạy
npm start          # chạy production
# hoặc
npm run dev         # chạy với nodemon (tự reload khi sửa code)
```

Mặc định server chạy ở `http://localhost:5000` (đổi qua biến `PORT`).

### Biến môi trường (`backend/.env`)

| Biến | Mô tả | Giá trị mẫu |
|---|---|---|
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Port MySQL | `3307` |
| `DB_USER` | User MySQL | `root` |
| `DB_PASSWORD` | Mật khẩu MySQL | `root` |
| `DB_NAME` | Tên database | `educonnect` |
| `PORT` | Port chạy Express | `5000` |
| `SECRET_KEY` | Secret ký session | (đổi khi deploy thật) |

> ⚠️ `.env` trong repo chỉ chứa giá trị mẫu cho môi trường dev — **luôn đổi
> `DB_PASSWORD` và `SECRET_KEY` khi deploy thật**, không commit `.env` thật
> lên hệ thống quản lý mã nguồn.

### Chạy test

```bash
cd backend
npm test              # chạy toàn bộ test (Jest + Supertest)
npm run test:api      # chỉ test API (tests/api.test.js)
npm run test:functional  # chỉ test luồng nghiệp vụ (tests/functional.test.js)
```

## Đường dẫn (routes) chính

| Nhóm | Ví dụ route | Mô tả |
|---|---|---|
| Public (`public.js`) | `GET /`, `GET /khoa-hoc`, `GET /search`, `GET /gioi-thieu`, `POST /lien-he` | Trang chủ, danh sách/tìm kiếm khoá học, giới thiệu, liên hệ |
| Auth (`auth.js`) | `POST /login`, `POST /register`, `GET /logout`, `POST /quen-mat-khau` | Đăng ký / đăng nhập / đăng xuất / quên mật khẩu |
| User (`user.js`) | `GET /tai-khoan`, `POST /enroll/:course_id`, `POST /tao-khoa-hoc`, `GET /xem-bai-hoc/:lesson_id`, `POST /wallet/deposit-request`, `POST /lesson-comments` | Tài khoản, khoá học, bài học, tài liệu/bài tập, ví, bình luận |
| Admin (`admin.js`) | `GET /admin`, `GET /admin/users`, `GET /admin/courses`, `GET /admin/withdrawals`, `GET /admin/password-resets` | Toàn bộ trang quản trị |

Xem chi tiết đầy đủ trong từng file dưới `backend/src/routes/`.

## Lưu ý

- `node_modules/` không nên đóng gói khi chia sẻ dự án (chuẩn thực hành) —
  chạy `npm install` trong `backend/` sau khi tải/giải nén về.
- Backend serve tĩnh và render template từ `../frontend/public` và
  `../frontend/views` (cấu hình trong `src/app.js`), nên **hai thư mục
  `backend/` và `frontend/` phải nằm cạnh nhau** đúng như cấu trúc ở trên.
- `database/elearning.db` là dữ liệu SQLite cũ, chỉ phục vụ script migrate mật
  khẩu (`backend/scripts/migrate-passwords.js`) — ứng dụng hiện tại dùng
  MySQL làm database chính.
- `backend/.env` chứa mật khẩu DB mẫu (`root/root`) — nhớ đổi khi deploy thật.
