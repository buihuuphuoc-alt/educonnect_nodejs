# EduConnect — Cấu trúc đã tách Frontend / Backend / Database

Dự án gốc là một ứng dụng Express + Nunjucks server-render (không phải SPA gọi
REST API). Vì vậy việc "tách" ở đây là **tổ chức lại thư mục** theo 3 vai trò rõ
ràng, backend vẫn render HTML từ views/public bên frontend qua đường dẫn tương
đối — luồng chạy và toàn bộ logic nghiệp vụ giữ nguyên 100%, chỉ có vị trí file
là thay đổi.

```
EduConnect-organized/
├── backend/          Node.js/Express app (logic, routes, middleware, DB access)
│   ├── src/
│   │   ├── app.js
│   │   ├── database.js
│   │   ├── middleware/
│   │   └── routes/
│   ├── scripts/
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── frontend/         Giao diện (Nunjucks templates + tài nguyên tĩnh)
│   ├── views/         (*.html — Nunjucks templates, render phía server)
│   └── public/         (css/, js/, images/, uploads/)
│
└── database/         Schema & dữ liệu
    ├── create_db.sql       (lệnh tạo database MySQL)
    ├── database_mysql.sql  (schema đầy đủ — bảng, ràng buộc)
    └── elearning.db        (file SQLite cũ, chỉ dùng bởi scripts/migrate-passwords.js
                              để migrate mật khẩu từ bản SQLite đời đầu — KHÔNG phải
                              database chính; app hiện tại dùng MySQL)
```

## Vì sao không tách được thành 2 project độc lập (SPA + API)?

Backend hiện dùng `nunjucks.configure(..., { express: app })` để render HTML
trực tiếp từ `frontend/views`, và dùng session (cookie) lưu trong MySQL để xác
thực — không phải kiến trúc client gọi JSON API + token. Để tách thật sự thành
2 service độc lập (frontend SPA React/Vue riêng, backend chỉ trả JSON), cần:

- Viết lại toàn bộ route trong `backend/src/routes/*` để trả JSON thay vì
  `res.render(...)`.
- Chuyển xác thực session-cookie sang JWT/token để frontend riêng domain gọi được.
- Viết lại toàn bộ `frontend/views/*.html` (hiện là Nunjucks server-side) thành
  component JS render phía client, gọi API bằng `fetch`.

Đây là một lần viết lại đáng kể, không phải việc di chuyển file. Nếu bạn muốn
đi hướng này, mình có thể làm tiếp — chỉ cần xác nhận.

## Cách chạy sau khi tách

```bash
cd backend
npm install
# đảm bảo MySQL đang chạy, đã tạo database theo database/create_db.sql
# và import schema từ database/database_mysql.sql
npm start          # chạy production
# hoặc
npm run dev         # chạy với nodemon
```

`backend/.env` chứa cấu hình kết nối MySQL (`DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME`) — chỉnh lại theo môi trường của bạn.

Backend tự động serve tĩnh và render template từ `../frontend/public` và
`../frontend/views` (đường dẫn đã được cập nhật trong `src/app.js` và
`src/routes/user.js`), nên **hai thư mục `backend/` và `frontend/` phải nằm
cạnh nhau** đúng như cấu trúc ở trên.

## Những gì đã thay đổi so với bản gốc

| File | Thay đổi |
|---|---|
| `backend/src/app.js` | Đường dẫn static & views trỏ sang `../../frontend/public` và `../../frontend/views` |
| `backend/src/routes/user.js` | 4 đường dẫn upload/xoá ảnh trỏ sang `../../../frontend/public/...` |
| `backend/scripts/migrate-passwords.js` | `DB_PATH` trỏ sang `../../database/elearning.db` |

Không có thay đổi nào về logic nghiệp vụ, route, hay schema.

## Lưu ý

- `node_modules/` **không** được đóng gói lại (chuẩn thực hành) — chạy
  `npm install` trong `backend/` sau khi giải nén.
- `backend/.env` chứa mật khẩu DB mẫu (`root/root`) từ bản gốc — nhớ đổi khi
  deploy thật.
