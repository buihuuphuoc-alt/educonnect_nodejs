=======
# 🎓 EduConnect — Nền tảng học trực tuyến

EduConnect là một ứng dụng web học trực tuyến (e-learning) xây dựng bằng **Node.js + Express**, sử dụng **MySQL** làm cơ sở dữ liệu và **Nunjucks** làm template engine. Hệ thống hỗ trợ hai vai trò: **Người học** và **Admin**, với đầy đủ tính năng quản lý khóa học, bài học, ví điện tử, bình luận và tài khoản. Schema cơ sở dữ liệu, dữ liệu mẫu và tài khoản admin đều được **tự động khởi tạo** khi server chạy lần đầu — không cần import file SQL hay chạy script riêng.

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
- [API & Routes](#-api--routes)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)
- [Kiểm thử (Testing)](#-kiểm-thử-testing)

---

## ✨ Tính năng

### Người dùng (User)
- Đăng ký / Đăng nhập / Đăng xuất
- Quên mật khẩu (gửi yêu cầu đến Admin, admin cấp mật khẩu tạm và bắt buộc đổi mật khẩu ở lần đăng nhập kế tiếp)
- Xem danh sách và chi tiết khóa học (lọc theo danh mục, giá, cấp độ, từ khóa, phân trang)
- Đăng ký học và theo dõi tiến trình học tập (đánh dấu hoàn thành từng bài học)
- Xem bài học (video, tài liệu đính kèm, bài tập trắc nghiệm có giải thích đáp án)
- Bình luận / trao đổi trong từng bài học (hỗ trợ trả lời/reply, sửa, xóa bình luận)
- Đánh giá / review khóa học
- Quản lý ví điện tử: gửi yêu cầu nạp tiền, gửi yêu cầu rút tiền (kèm thông tin ngân hàng), xem lịch sử giao dịch
- Tạo và chỉnh sửa khóa học, bài học, tài liệu bài học và bài tập trắc nghiệm (cho Instructor)
- Chỉnh sửa thông tin tài khoản cá nhân, cập nhật thông tin ngân hàng
- Gửi yêu cầu xóa tài khoản

### Admin
- Dashboard tổng quan (thống kê người dùng, khóa học, doanh thu, lượt đăng ký)
- Quản lý người dùng (xem, khóa/xóa tài khoản, cộng số dư ví)
- Quản lý khóa học (thêm/sửa/xóa/khóa khóa học) và danh mục
- Duyệt/từ chối yêu cầu nạp tiền và rút tiền
- Cấp lại mật khẩu tạm thời / từ chối yêu cầu đặt lại mật khẩu
- Duyệt/từ chối yêu cầu xóa tài khoản
- Quản lý liên hệ từ người dùng (xem, xóa)
- Badge thông báo số lượng yêu cầu đang chờ xử lý (nạp/rút tiền, đặt lại mật khẩu, xóa tài khoản, liên hệ)

---

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js |
| Web framework | Express.js 4 (+ `express-async-errors` để bắt lỗi async tự động) |
| Template engine | Nunjucks 3 |
| Cơ sở dữ liệu | MySQL 8.0 (driver `mysql2/promise`) |
| Session store | express-mysql-session (lưu trong bảng `sessions`, tự tạo bảng) |
| Upload file | Multer |
| Flash message | express-flash |
| Gửi email | Nodemailer |
| Dev server | Nodemon |
| Testing | Jest + Supertest |

---

## 📁 Cấu trúc dự án

```
EduConnect-main/
├── src/
│   ├── app.js                  # Entry point, cấu hình Express, session, Nunjucks & các filter
│   ├── database.js             # MySQL connection pool, auto-migration, auto-seed & helper functions
│   ├── middleware/
│   │   └── auth.js             # loginRequired, adminRequired, checkPasswordChange, getCurrentUser
│   └── routes/
│       ├── public.js           # Routes công khai (trang chủ, danh sách khóa học, tìm kiếm, liên hệ)
│       ├── auth.js             # Routes xác thực (login, register, logout, quên mật khẩu)
│       ├── user.js             # Routes người dùng (tài khoản, khóa học, bài học, ví, bình luận...)
│       └── admin.js            # Routes admin (dashboard, quản lý hệ thống)
├── views/
│   ├── layout.html             # Layout chính (user)
│   ├── trang-chu.html          # Trang chủ
│   ├── tat-ca-khoa-hoc.html    # Danh sách khóa học
│   ├── xem-bai-hoc.html        # Xem bài học (kèm bình luận)
│   ├── tai-khoan-cua-toi.html  # Trang tài khoản cá nhân & ví điện tử
│   ├── chinh-sua-khoa-hoc.html # Chỉnh sửa khóa học
│   ├── chinh-sua-bai-hoc.html  # Chỉnh sửa bài học
│   ├── gioi-thieu.html         # Giới thiệu
│   ├── lien-he.html            # Liên hệ
│   ├── quen-mat-khau.html      # Quên mật khẩu
│   ├── doi-mat-khau.html       # Đổi mật khẩu
│   └── admin/
│       ├── layout.html         # Layout admin
│       ├── dashboard.html      # Dashboard admin
│       ├── users.html          # Quản lý người dùng
│       ├── courses.html        # Quản lý khóa học
│       ├── categories.html     # Quản lý danh mục
│       ├── contacts.html       # Quản lý liên hệ
│       ├── deposit.html        # Yêu cầu nạp tiền
│       ├── withdrawals.html    # Yêu cầu rút tiền
│       ├── password-resets.html# Yêu cầu đặt lại mật khẩu
│       ├── delete_requests.html# Yêu cầu xóa tài khoản
│       └── login.html          # Đăng nhập admin
├── public/
│   ├── css/                    # Stylesheet từng trang
│   ├── js/                     # JavaScript từng trang
│   ├── images/                 # Ảnh tĩnh & thumbnail khóa học
│   └── uploads/                # File tài liệu bài học do người dùng upload
├── scripts/
│   └── migrate-passwords.js    # Script tiện ích hỗ trợ chuẩn hóa mật khẩu cũ (tuỳ chọn)
├── tests/
│   ├── api.test.js             # Test toàn bộ API endpoint (Jest + Supertest)
│   └── functional.test.js      # Test luồng nghiệp vụ (functional flow)
├── database_mysql.sql          # Schema & dữ liệu mẫu MySQL (tham khảo/import thủ công nếu cần)
├── create_db.sql               # Lệnh tạo database rỗng nhanh (CREATE DATABASE educonnect ...)
├── .env                        # Biến môi trường (không commit)
└── package.json
```

---

## 💻 Yêu cầu hệ thống

- **Node.js** >= 18
- **MySQL** >= 8.0
- **npm** >= 9

---

## 🚀 Cài đặt & Chạy

### 1. Giải nén dự án

```bash
cd EduConnect-main
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo database rỗng

Chỉ cần tạo **database rỗng**, không cần import schema — ứng dụng sẽ tự tạo bảng, migrate và seed dữ liệu mẫu khi khởi động lần đầu.

```bash
mysql -u root -p < create_db.sql
```

hoặc trong MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS educonnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> 💡 Nếu muốn import sẵn schema + dữ liệu mẫu đầy đủ theo cách thủ công, có thể dùng `database_mysql.sql` thay thế bước trên. Trong trường hợp bình thường, bước này là **không bắt buộc**.

### 4. Cấu hình biến môi trường

Tạo/chỉnh file `.env` ở thư mục gốc (xem [Cấu hình môi trường](#-cấu-hình-môi-trường)).

### 5. Khởi động server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Ở lần chạy đầu tiên, ứng dụng sẽ tự động:
- Kết nối MySQL và tạo toàn bộ bảng (nếu chưa có) + chạy các migration cần thiết
- Seed dữ liệu mẫu (danh mục, khóa học, người dùng mẫu...) nếu database đang trống
- Tạo sẵn tài khoản **Admin** mặc định nếu chưa tồn tại tài khoản admin nào (xem [Tài khoản mặc định](#-tài-khoản-mặc-định))

Ứng dụng chạy tại: [http://localhost:5000](http://localhost:5000)
Admin panel: [http://localhost:5000/admin](http://localhost:5000/admin)

---

## ⚙️ Cấu hình môi trường

Tạo file `.env` ở thư mục gốc với nội dung sau:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=educonnect

# Server (tùy chọn — mặc định PORT=5000)
PORT=5000
NODE_ENV=development

# Session (tùy chọn — nên đổi khi lên production)
SECRET_KEY=your_very_secret_key_here
```

> ⚠️ **Không commit file `.env` lên Git.** File `.gitignore` đã loại trừ file này.
> `PORT` và `SECRET_KEY` đều có giá trị mặc định trong code (`5000` và một secret dev) nên có thể bỏ qua khi chạy thử nhanh.

---

## 🗄 Cơ sở dữ liệu

Toàn bộ bảng được tự động tạo bởi `runMigrations()` trong `src/database.js` mỗi khi server khởi động (dùng `CREATE TABLE IF NOT EXISTS` và tự động `ALTER TABLE` khi cần thêm cột mới), gồm:

| Bảng | Mô tả |
|---|---|
| `users` | Tài khoản người dùng & admin, ví điện tử, thông tin ngân hàng |
| `categories` | Danh mục khóa học |
| `courses` | Khóa học (tiêu đề, giá, cấp độ, instructor, trạng thái khóa...) |
| `lessons` | Bài học trong khóa học (video, thứ tự) |
| `lesson_materials` | Tài liệu bài học (document/file/nội dung) |
| `lesson_exercises` | Bài tập trắc nghiệm của bài học (đáp án + giải thích) |
| `lesson_progress` | Tiến trình hoàn thành từng bài học của học viên |
| `lesson_comments` | Bình luận trong bài học (hỗ trợ reply qua `parent_id`) |
| `enrollments` | Lịch sử đăng ký học & tiến trình tổng thể |
| `reviews` | Đánh giá khóa học |
| `contacts` | Tin nhắn liên hệ |
| `deposit_requests` | Yêu cầu nạp tiền vào ví |
| `wallet_transactions` | Lịch sử giao dịch ví (nạp/rút/mua) |
| `password_reset_requests` | Yêu cầu đặt lại mật khẩu |
| `delete_requests` | Yêu cầu xóa tài khoản |
| `sessions` | Session store (tự tạo bởi `express-mysql-session`) |

---

## 🔗 API & Routes

### Public

| Method | Route | Mô tả |
|---|---|---|
| GET | `/` | Trang chủ |
| GET | `/khoa-hoc` | Danh sách khóa học (hỗ trợ filter & phân trang) |
| GET | `/search` | Tìm kiếm khóa học (JSON) |
| GET | `/gioi-thieu` | Trang giới thiệu |
| GET/POST | `/lien-he` | Trang liên hệ |

### Auth

| Method | Route | Mô tả |
|---|---|---|
| POST | `/login` | Đăng nhập (JSON) |
| POST | `/register` | Đăng ký (JSON) |
| GET | `/logout` | Đăng xuất |
| GET/POST | `/quen-mat-khau` | Quên mật khẩu (gửi yêu cầu đến admin) |

### User — Tài khoản & khóa học (yêu cầu đăng nhập)

| Method | Route | Mô tả |
|---|---|---|
| GET | `/tai-khoan` | Trang tài khoản cá nhân |
| POST | `/update-profile` | Cập nhật thông tin cá nhân |
| POST | `/update-bank-info` | Cập nhật thông tin ngân hàng |
| GET/POST | `/doi-mat-khau` | Đổi mật khẩu |
| POST | `/request-delete-account` | Gửi yêu cầu xóa tài khoản |
| POST | `/enroll/:course_id` | Đăng ký khóa học |
| POST | `/review` | Đánh giá khóa học |

### User — Quản lý khóa học/bài học (Instructor)

| Method | Route | Mô tả |
|---|---|---|
| POST | `/tao-khoa-hoc` | Tạo khóa học mới (upload ảnh) |
| GET/POST | `/chinh-sua-khoa-hoc/:course_id` | Xem/chỉnh sửa khóa học |
| POST | `/cap-nhat-khoa-hoc/:course_id` | Cập nhật khóa học (upload ảnh) |
| POST | `/xoa-khoa-hoc/:cid` | Xóa khóa học |
| GET | `/xem-bai-hoc/:lesson_id` | Xem chi tiết bài học |
| GET/POST | `/chinh-sua-bai-hoc/:lesson_id` | Xem/chỉnh sửa bài học |
| POST | `/them-bai-hoc` | Thêm bài học mới |
| POST | `/xoa-bai-hoc/:lesson_id` | Xóa bài học |
| POST | `/mark-lesson-complete` | Đánh dấu hoàn thành bài học |
| POST | `/them-material` / `/chinh-sua-material/:mat_id` / `/xoa-material/:mat_id` | Thêm/sửa/xóa tài liệu bài học (upload file) |
| POST | `/them-exercise` / `/chinh-sua-exercise/:ex_id` / `/xoa-exercise/:ex_id` | Thêm/sửa/xóa bài tập trắc nghiệm |

### User — Bình luận bài học

| Method | Route | Mô tả |
|---|---|---|
| GET | `/lesson-comments/:lesson_id` | Lấy danh sách bình luận của bài học |
| POST | `/lesson-comments` | Thêm bình luận / trả lời |
| POST | `/lesson-comments/:id/edit` | Sửa bình luận |
| POST | `/lesson-comments/:id/delete` | Xóa bình luận |

### User — Ví điện tử

| Method | Route | Mô tả |
|---|---|---|
| POST | `/wallet/deposit-request` | Gửi yêu cầu nạp tiền |
| POST | `/wallet/withdraw-request` | Gửi yêu cầu rút tiền |
| POST | `/wallet/clear-history` | Xóa lịch sử giao dịch hiển thị |

### Admin (yêu cầu quyền admin)

| Method | Route | Mô tả |
|---|---|---|
| GET/POST | `/admin/login` | Đăng nhập admin |
| GET | `/admin/logout` | Đăng xuất admin |
| GET | `/admin` | Dashboard |
| GET/POST | `/admin/courses`, `/admin/courses/add`, `/admin/courses/edit/:cid`, `/admin/courses/delete/:cid`, `/admin/courses/lock/:cid` | Quản lý khóa học |
| GET/POST | `/admin/categories`, `/admin/categories/add`, `/admin/categories/edit/:cid`, `/admin/categories/delete/:cid` | Quản lý danh mục |
| GET/POST | `/admin/users`, `/admin/users/delete/:uid`, `/admin/users/add-balance/:uid` | Quản lý người dùng |
| GET/POST | `/admin/contacts`, `/admin/contacts/delete/:cid` | Quản lý liên hệ |
| GET/POST | `/admin/deposits`, `/admin/deposits/approve/:did`, `/admin/deposits/reject/:did` | Duyệt/từ chối nạp tiền |
| GET/POST | `/admin/withdrawals`, `/admin/withdrawals/complete/:wid`, `/admin/withdrawals/reject/:wid` | Duyệt/từ chối rút tiền |
| GET/POST | `/admin/password-resets`, `/admin/password-resets/grant/:rid`, `/admin/password-resets/reject/:rid` | Xử lý yêu cầu đặt lại mật khẩu |
| GET/POST | `/admin/delete-requests`, `/admin/delete-requests/approve/:rid`, `/admin/delete-requests/reject/:rid` | Xử lý yêu cầu xóa tài khoản |

---

## 👤 Tài khoản mặc định

Tài khoản Admin được **tự động tạo khi server khởi động lần đầu** (nếu database chưa có tài khoản admin nào) — không cần chạy thêm lệnh nào:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@educonnect` | `admin@123` |

Đăng nhập admin tại: [http://localhost:5000/admin/login](http://localhost:5000/admin/login)

Ngoài ra, nếu database đang trống, hệ thống cũng tự seed sẵn danh mục và một số tài khoản/khóa học mẫu để tiện demo/kiểm thử.

---

## 🧪 Kiểm thử (Testing)

Dự án sử dụng **Jest + Supertest** để kiểm thử API và luồng nghiệp vụ, chạy trực tiếp trên database MySQL đã cấu hình trong `.env`.

```bash
npm test              # Chạy toàn bộ test (tests/)
npm run test:api      # Chỉ chạy test API (tests/api.test.js)
npm run test:functional  # Chỉ chạy test luồng nghiệp vụ (tests/functional.test.js)
```

> Test được chạy tuần tự (`--runInBand`) và dữ liệu tạo mới trong lúc test đều gắn timestamp để tránh trùng lặp giữa các lần chạy.

---

## 📝 Lưu ý phát triển

- **Upload ảnh khóa học**: lưu tại `public/images/courses/`, tối đa 5MB, hỗ trợ JPG/PNG/GIF/WEBP.
- **Upload tài liệu bài học**: lưu tại `public/uploads/materials/`, tối đa 20MB, hỗ trợ PDF/DOCX/XLSX/PPTX/ZIP và ảnh.
- **Template engine**: Nunjucks với các custom filter `currency`, `date`, `rating`, `numfmt`, `tojson`, `map`, `max`, `min`, `sum`, `substr` và global `range` đã được đăng ký sẵn.
- **Session**: lưu trong bảng MySQL `sessions`, thời gian hết hạn 7 ngày.
- **Mật khẩu**: hệ thống hiện lưu mật khẩu dạng plain text (đơn giản hóa cho môi trường phát triển/demo). Script `scripts/migrate-passwords.js` là công cụ tùy chọn dùng để chuẩn hóa các mật khẩu cũ (từ hệ thống trước) sang mật khẩu mặc định — không bắt buộc trong luồng chạy bình thường.
- **Đổi mật khẩu bắt buộc**: khi admin cấp mật khẩu tạm cho người dùng (qua chức năng đặt lại mật khẩu), người dùng sẽ bị bắt buộc đổi mật khẩu ở lần đăng nhập kế tiếp (`must_change_password`).
>>>>>>> 723ad003850833936fe1acaec236017f7617b580
