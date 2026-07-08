// ============================================================
//  EDUCONNECT — API TESTING
//  Kiểm thử tất cả các endpoint HTTP của hệ thống
//  Công cụ: Jest + Supertest
//  Chạy:    npm test
// ============================================================
//
//  LƯU Ý:
//  - src/app.js chỉ tự app.listen() khi chạy "node src/app.js" trực
//    tiếp (require.main === module). Khi bị require() từ file test
//    thì KHÔNG tự listen(), nên ta phải tự gọi initDb() ở beforeAll.
//  - Mọi email / tên / slug dùng để tạo dữ liệu mới đều có
//    Date.now() phía sau để đảm bảo dữ liệu luôn mới mỗi lần chạy
//    "npm test", tránh bị trùng với dữ liệu của lần chạy trước.
// ============================================================

const request = require('supertest');
const app     = require('../src/app');
const { initDb, fetchOne, getDb } = require('../src/database');

jest.setTimeout(30000);

// ─────────────────────────────────────────────────────────────
//  Biến dùng chung giữa các test (session cookie, ID, email...)
// ─────────────────────────────────────────────────────────────
let userCookie   = '';   // cookie session của học viên
let instrCookie  = '';   // cookie session của giảng viên (user mẫu)
let adminCookie  = '';   // cookie session của admin

let createdCourseId = null;
let createdLessonId = null;
let createdMatId    = null;
let createdExId     = null;

const testEmail = `hocvien_test_${Date.now()}@educonnect.vn`;

beforeAll(async () => {
  await initDb();
});

afterAll(async () => {
  await getDb().end();
});


// =============================================================
//  NHÓM 1: AUTH API — Đăng ký, Đăng nhập, Đăng xuất
// =============================================================
describe('━━━ [API] Auth — Đăng ký / Đăng nhập / Đăng xuất ━━━', () => {

  test('TC-API-01: POST /register — thiếu thông tin → 200 + success:false', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: '', email: '', password: '' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeTruthy();
  });

  test('TC-API-02: POST /register — đăng ký tài khoản học viên mới thành công', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Test Học Viên', email: testEmail, password: 'test123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/thành công/i);

    userCookie = res.headers['set-cookie']?.[0] || '';
  });

  test('TC-API-03: POST /register — email đã tồn tại → success:false', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Người Dùng Khác', email: testEmail, password: 'abc123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email/i);
  });

  test('TC-API-04: POST /login — sai mật khẩu → success:false', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testEmail, password: 'saimatkhau' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/không đúng/i);
  });

  test('TC-API-05: POST /login — đăng nhập học viên thành công', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testEmail, password: 'test123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/chào mừng/i);

    userCookie = res.headers['set-cookie']?.[0] || '';
  });

  test('TC-API-06: POST /login — đăng nhập giảng viên mẫu thành công', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'an.nguyen@educonnect.vn', password: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    instrCookie = res.headers['set-cookie']?.[0] || '';
  });

  test('TC-API-07: POST /login — đăng nhập admin thành công', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'admin@educonnect', password: 'admin@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    adminCookie = res.headers['set-cookie']?.[0] || '';
  });

  test('TC-API-08: GET /logout — đăng xuất, redirect về trang chủ', async () => {
    const res = await request(app)
      .get('/logout')
      .set('Cookie', userCookie);

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');

    // Đăng nhập lại để lấy cookie mới cho các test sau
    const login = await request(app)
      .post('/login')
      .send({ email: testEmail, password: 'test123' });
    userCookie = login.headers['set-cookie']?.[0] || '';
  });
});


// =============================================================
//  NHÓM 2: PUBLIC API — Trang chủ, Khóa học, Tìm kiếm, Liên hệ
// =============================================================
describe('━━━ [API] Public — Trang chủ / Khóa học / Liên hệ ━━━', () => {

  test('TC-API-09: GET / — trang chủ trả về 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/EduConnect|khóa học/i);
  });

  test('TC-API-10: GET /khoa-hoc — danh sách khóa học trả về 200', async () => {
    const res = await request(app).get('/khoa-hoc');
    expect(res.statusCode).toBe(200);
  });

  test('TC-API-11: GET /khoa-hoc?q=web — tìm kiếm có từ khóa trả về 200', async () => {
    const res = await request(app).get('/khoa-hoc?q=web');
    expect(res.statusCode).toBe(200);
  });

  test('TC-API-12: GET /search?q=seo — AJAX search trả về JSON array', async () => {
    const res = await request(app).get('/search?q=seo');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('TC-API-13: GET /search?q=xyzxyzxyz — tìm không thấy → mảng rỗng', async () => {
    const res = await request(app).get('/search?q=xyzxyzxyz_khong_ton_tai');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('TC-API-14: GET /gioi-thieu — trang giới thiệu trả về 200', async () => {
    const res = await request(app).get('/gioi-thieu');
    expect(res.statusCode).toBe(200);
  });

  test('TC-API-15: GET /lien-he — trang liên hệ trả về 200', async () => {
    const res = await request(app).get('/lien-he');
    expect(res.statusCode).toBe(200);
  });

  test('TC-API-16: POST /lien-he — gửi liên hệ hợp lệ thành công', async () => {
    const res = await request(app)
      .post('/lien-he')
      .send({
        name:    'Người Dùng Test',
        email:   'test@gmail.com',
        message: 'Tôi muốn hỏi về khóa học lập trình web.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/cảm ơn/i);
  });

  test('TC-API-17: POST /lien-he — thiếu thông tin → success:false', async () => {
    const res = await request(app)
      .post('/lien-he')
      .send({ name: '', email: '', message: '' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
  });
});


// =============================================================
//  NHÓM 3: USER API — Tài khoản, Khóa học, Ví
// =============================================================
describe('━━━ [API] User — Tài khoản / Khóa học / Ví ━━━', () => {

  test('TC-API-18: GET /tai-khoan — chưa đăng nhập → redirect 302', async () => {
    const res = await request(app).get('/tai-khoan');
    expect(res.statusCode).toBe(302);
  });

  test('TC-API-19: GET /tai-khoan — đã đăng nhập → 200', async () => {
    const res = await request(app)
      .get('/tai-khoan')
      .set('Cookie', userCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-20: POST /update-profile — đổi tên thành công', async () => {
    // Route /update-profile từ chối nếu tên trùng (đã chuẩn hóa bỏ dấu)
    // với người dùng khác → dùng tên có timestamp để chắc chắn không trùng.
    const res = await request(app)
      .post('/update-profile')
      .set('Cookie', userCookie)
      .send({ name: `Test Học Viên Mới ${Date.now()}` });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-API-21: POST /update-profile — tên rỗng → success:false', async () => {
    const res = await request(app)
      .post('/update-profile')
      .set('Cookie', userCookie)
      .send({ name: '' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
  });

  test('TC-API-22: POST /tao-khoa-hoc — tạo khóa học mới thành công', async () => {
    const title = `Khóa Học Test Automation ${Date.now()}`;
    const res = await request(app)
      .post('/tao-khoa-hoc')
      .set('Cookie', instrCookie)
      .field('title', title)
      .field('description', 'Mô tả khóa học test')
      .field('price', '100000')
      .field('level', 'beginner');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const course = await fetchOne(
      'SELECT id FROM courses WHERE title=? ORDER BY id DESC LIMIT 1', [title]
    );
    createdCourseId = course?.id;
  });

  test('TC-API-23: POST /tao-khoa-hoc — không có tên → success:false', async () => {
    const res = await request(app)
      .post('/tao-khoa-hoc')
      .set('Cookie', instrCookie)
      .field('title', '')
      .field('price', '0');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
  });

  test('TC-API-24: POST /them-bai-hoc — thêm bài học vào khóa học thành công', async () => {
    expect(createdCourseId).toBeTruthy();

    const res = await request(app)
      .post('/them-bai-hoc')
      .set('Cookie', instrCookie)
      .send({
        course_id:        createdCourseId,
        title:            'Bài Học Test 01',
        order_num:        1,
        duration_minutes: 30,
        video_url:        'https://youtube.com/watch?v=test'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    createdLessonId = res.body.lesson_id;
  });

  test('TC-API-25: POST /enroll/:id — học viên đăng ký khóa học thành công (khóa miễn phí)', async () => {
    const title = `Khóa Học Miễn Phí Test ${Date.now()}`;
    await request(app)
      .post('/tao-khoa-hoc')
      .set('Cookie', instrCookie)
      .field('title', title)
      .field('price', '0');

    const freeCourse = await fetchOne(
      'SELECT id FROM courses WHERE title=? ORDER BY id DESC LIMIT 1', [title]
    );

    const res = await request(app)
      .post(`/enroll/${freeCourse.id}`)
      .set('Cookie', userCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/thành công/i);
  });

  test('TC-API-26: POST /enroll/:id — chưa đăng nhập → 302 redirect', async () => {
    const res = await request(app).post('/enroll/1');
    expect(res.statusCode).toBe(302);
  });

  test('TC-API-27: POST /wallet/deposit-request — nạp tiền hợp lệ → success:true', async () => {
    const res = await request(app)
      .post('/wallet/deposit-request')
      .set('Cookie', userCookie)
      .send({ amount: 50000, transfer_content: 'NAP TIEN TEST', bank_name: 'VCB' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-API-28: POST /wallet/deposit-request — số tiền dưới mức tối thiểu → success:false', async () => {
    const res = await request(app)
      .post('/wallet/deposit-request')
      .set('Cookie', userCookie)
      .send({ amount: 5000 }); // dưới 10.000đ

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/tối thiểu/i);
  });

  test('TC-API-29: POST /quen-mat-khau — email tồn tại → success:true', async () => {
    const res = await request(app)
      .post('/quen-mat-khau')
      .send({ email: testEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-API-30: POST /quen-mat-khau — email không tồn tại → success:false', async () => {
    const res = await request(app)
      .post('/quen-mat-khau')
      .send({ email: 'khongtontai@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/không tồn tại/i);
  });

  test('TC-API-31: POST /them-material — thêm tài liệu văn bản thành công', async () => {
    expect(createdLessonId).toBeTruthy();

    const res = await request(app)
      .post('/them-material')
      .set('Cookie', instrCookie)
      .field('lesson_id', createdLessonId)
      .field('title', 'Tài liệu bài 1')
      .field('material_type', 'text')
      .field('content', 'Nội dung tài liệu test');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const mat = await fetchOne(
      'SELECT id FROM lesson_materials WHERE lesson_id=? ORDER BY id DESC LIMIT 1',
      [createdLessonId]
    );
    createdMatId = mat?.id;
  });

  test('TC-API-32: POST /them-exercise — thêm câu hỏi trắc nghiệm thành công', async () => {
    expect(createdLessonId).toBeTruthy();

    const res = await request(app)
      .post('/them-exercise')
      .set('Cookie', instrCookie)
      .send({
        lesson_id:      createdLessonId,
        question:       'HTML là viết tắt của gì?',
        option_a:       'HyperText Markup Language',
        option_b:       'High Tech Modern Language',
        option_c:       'Home Tool Markup Language',
        option_d:       'Hyperlink Text Markup Language',
        correct_answer: 'A',
        explanation:    'HTML = HyperText Markup Language'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const ex = await fetchOne(
      'SELECT id FROM lesson_exercises WHERE lesson_id=? ORDER BY id DESC LIMIT 1',
      [createdLessonId]
    );
    createdExId = ex?.id;
  });

  test('TC-API-33: POST /xoa-exercise/:id — xóa câu hỏi thành công', async () => {
    expect(createdExId).toBeTruthy();

    const res = await request(app)
      .post(`/xoa-exercise/${createdExId}`)
      .set('Cookie', instrCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-API-34: POST /xoa-material/:id — xóa tài liệu thành công', async () => {
    expect(createdMatId).toBeTruthy();

    const res = await request(app)
      .post(`/xoa-material/${createdMatId}`)
      .set('Cookie', instrCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-API-35: POST /xoa-bai-hoc/:id — xóa bài học thành công', async () => {
    expect(createdLessonId).toBeTruthy();

    const res = await request(app)
      .post(`/xoa-bai-hoc/${createdLessonId}`)
      .set('Cookie', instrCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-API-36: POST /xoa-khoa-hoc/:id — xóa khóa học thành công', async () => {
    expect(createdCourseId).toBeTruthy();

    const res = await request(app)
      .post(`/xoa-khoa-hoc/${createdCourseId}`)
      .set('Cookie', instrCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});


// =============================================================
//  NHÓM 4: ADMIN API — Dashboard, Users, Courses, Categories
// =============================================================
describe('━━━ [API] Admin — Dashboard / Quản lý ━━━', () => {

  test('TC-API-37: GET /admin — chưa đăng nhập → redirect 302', async () => {
    const res = await request(app).get('/admin');
    expect(res.statusCode).toBe(302);
  });

  test('TC-API-38: GET /admin — đăng nhập admin → 200', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-39: GET /admin/users — xem danh sách người dùng → 200', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-40: GET /admin/courses — xem danh sách khóa học → 200', async () => {
    const res = await request(app)
      .get('/admin/courses')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-41: GET /admin/contacts — xem danh sách liên hệ → 200', async () => {
    const res = await request(app)
      .get('/admin/contacts')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-42: GET /admin/categories — xem danh sách danh mục → 200', async () => {
    const res = await request(app)
      .get('/admin/categories')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-43: POST /admin/categories/add — thêm danh mục mới thành công', async () => {
    // Route tự sinh "slug" từ "name" (bỏ qua trường slug gửi lên),
    // nên chỉ cần gửi "name" — dùng giá trị động để tránh trùng.
    const res = await request(app)
      .post('/admin/categories/add')
      .set('Cookie', adminCookie)
      .send({ name: `Danh Mục Test API ${Date.now()}` });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-API-44: POST /admin/categories/add — slug trùng → success:false', async () => {
    const name = `Danh Mục Trùng ${Date.now()}`;
    // Tạo trước 1 lần để slug tự sinh đã tồn tại trong DB
    await request(app)
      .post('/admin/categories/add')
      .set('Cookie', adminCookie)
      .send({ name });

    // Tạo lần 2 với cùng "name" → slug tự sinh trùng → phải bị từ chối
    const res = await request(app)
      .post('/admin/categories/add')
      .set('Cookie', adminCookie)
      .send({ name });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
  });

  test('TC-API-45: GET /admin/password-resets — xem yêu cầu đặt lại mật khẩu → 200', async () => {
    const res = await request(app)
      .get('/admin/password-resets')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-46: GET /admin/deposits — xem yêu cầu nạp tiền → 200', async () => {
    const res = await request(app)
      .get('/admin/deposits')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-47: GET /admin/withdrawals — xem yêu cầu rút tiền → 200', async () => {
    const res = await request(app)
      .get('/admin/withdrawals')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-48: GET /admin/delete-requests — xem yêu cầu xóa tài khoản → 200', async () => {
    const res = await request(app)
      .get('/admin/delete-requests')
      .set('Cookie', adminCookie);

    expect(res.statusCode).toBe(200);
  });

  test('TC-API-49: GET /admin/login — trang đăng nhập admin → 200', async () => {
    const res = await request(app).get('/admin/login');
    expect(res.statusCode).toBe(200);
  });
});