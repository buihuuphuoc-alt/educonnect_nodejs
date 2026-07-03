// src/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'educonnect',
  waitForConnections: true,
  connectionLimit:    10,
  charset:            'utf8mb4',
  timezone:           '+00:00',
  supportBigNumbers:  true,
  bigNumberStrings:   true,
});

// mysql2 yêu cầu số phải là Number thuần cho LIMIT/OFFSET
function castParams(params) {
  return params.map(p => {
    if (p === null || p === undefined) return null;
    if (typeof p === 'number' && isNaN(p)) return null; // ← FIX: chặn NaN trước khi gửi xuống MySQL
    if (typeof p === "boolean") return p ? 1 : 0;
    if (typeof p === "string" && /^\d+$/.test(p)) return Number(p);
    return p;
  });
}

async function fetchOne(sql, params = []) {
  const [rows] = await pool.query(sql, castParams(params));
  return rows[0];
}
async function fetchAll(sql, params = []) {
  const [rows] = await pool.query(sql, castParams(params));
  return rows;
}
async function run(sql, params = []) {
  const [result] = await pool.query(sql, castParams(params));
  return result;
}
async function exec(sql) {
  const conn = await pool.getConnection();
  try {
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) await conn.query(stmt);
  } finally { conn.release(); }
}
function getDb() { return pool; }

// Thêm cột nếu chưa có — tương thích mọi MySQL version
async function addCol(table, column, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (Number(rows[0].n) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  + Thêm cột ${table}.${column}`);
  }
}

async function runMigrations() {
  // ── Tạo bảng (không dùng FOREIGN KEY và không DEFAULT '' cho TEXT) ──
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      name           VARCHAR(100)  NOT NULL,
      email          VARCHAR(255)  NOT NULL UNIQUE,
      password       VARCHAR(255)  NOT NULL,
      avatar         VARCHAR(255)  DEFAULT '',
      bio            TEXT,
      balance        DECIMAL(15,2) NOT NULL DEFAULT 0,
      wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      is_admin       TINYINT(1)    NOT NULL DEFAULT 0,
      must_change_password TINYINT(1) NOT NULL DEFAULT 0,
      bank_name      VARCHAR(100)  DEFAULT '',
      bank_account   VARCHAR(50)   DEFAULT '',
      bank_holder    VARCHAR(100)  DEFAULT '',
      created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS categories (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS courses (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      title          VARCHAR(255)  NOT NULL,
      slug           VARCHAR(255)  NOT NULL UNIQUE,
      description    TEXT,
      image          VARCHAR(255)  DEFAULT '',
      thumbnail      VARCHAR(255)  DEFAULT '',
      price          DECIMAL(15,2) NOT NULL DEFAULT 0,
      original_price DECIMAL(15,2) NOT NULL DEFAULT 0,
      level          VARCHAR(50)   NOT NULL DEFAULT 'beginner',
      duration       VARCHAR(50)   NOT NULL DEFAULT '0 gio',
      is_featured    TINYINT(1)    NOT NULL DEFAULT 0,
      is_locked      TINYINT(1)    NOT NULL DEFAULT 0,
      rating         DECIMAL(3,1)  NOT NULL DEFAULT 0,
      total_lessons  INT           NOT NULL DEFAULT 0,
      total_students INT           NOT NULL DEFAULT 0,
      instructor_id  INT           DEFAULT NULL,
      category_id    INT           DEFAULT NULL,
      created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS lessons (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      course_id        INT          NOT NULL,
      title            VARCHAR(255) NOT NULL,
      video_url        VARCHAR(500) DEFAULT '',
      duration         INT          NOT NULL DEFAULT 0,
      duration_minutes INT          DEFAULT NULL,
      position         INT          NOT NULL DEFAULT 0,
      order_num        INT          NOT NULL DEFAULT 1,
      is_free          TINYINT(1)   NOT NULL DEFAULT 0,
      created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS enrollments (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT      NOT NULL,
      course_id   INT      NOT NULL,
      enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      progress    INT      NOT NULL DEFAULT 0,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_enrollment (user_id, course_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT      NOT NULL,
      course_id  INT      NOT NULL,
      rating     TINYINT  NOT NULL DEFAULT 5,
      comment    TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS contacts (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(255) NOT NULL,
      message    TEXT         NOT NULL,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS wallet_transactions (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT           NOT NULL,
      type        VARCHAR(20)   NOT NULL,
      amount      DECIMAL(15,2) NOT NULL,
      description TEXT,
      status      VARCHAR(20)   NOT NULL DEFAULT 'pending',
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS lesson_materials (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      lesson_id     INT          NOT NULL,
      title         VARCHAR(255) NOT NULL,
      url           VARCHAR(500) DEFAULT '',
      material_type VARCHAR(50)  DEFAULT 'document',
      content       TEXT,
      order_num     INT          NOT NULL DEFAULT 1,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS lesson_exercises (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      lesson_id      INT  NOT NULL,
      question       TEXT NOT NULL,
      option_a       VARCHAR(500) DEFAULT '',
      option_b       VARCHAR(500) DEFAULT '',
      option_c       VARCHAR(500) DEFAULT '',
      option_d       VARCHAR(500) DEFAULT '',
      correct_answer VARCHAR(5)   DEFAULT '',
      explanation    TEXT,
      answer         TEXT,
      order_num      INT  NOT NULL DEFAULT 1,
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS lesson_progress (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT        NOT NULL,
      lesson_id  INT        NOT NULL,
      completed  TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_progress (user_id, lesson_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS password_reset_requests (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT          NOT NULL,
      email      VARCHAR(255) NOT NULL,
      status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      handled_at DATETIME     DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS deposit_requests (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      user_id          INT           NOT NULL,
      amount           DECIMAL(15,2) NOT NULL,
      transfer_content TEXT,
      bank_name        VARCHAR(100)  DEFAULT '',
      status           VARCHAR(20)   NOT NULL DEFAULT 'pending',
      note             TEXT,
      created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS delete_requests (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT  NOT NULL,
      reason     TEXT NOT NULL,
      status     VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS lesson_comments (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      lesson_id  INT      NOT NULL,
      user_id    INT      NOT NULL,
      parent_id  INT      DEFAULT NULL,
      content    TEXT     NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_lesson (lesson_id),
      INDEX idx_parent (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of tables) {
    try { await pool.query(sql); }
    catch (e) { console.warn('Table warning:', e.message); }
  }

  // ── Thêm cột còn thiếu vào bảng đã tồn tại ──
  const cols = [
    ['users',            'wallet_balance',       'DECIMAL(15,2) NOT NULL DEFAULT 0'],
    ['users',            'must_change_password', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['users',            'bank_name',            "VARCHAR(100) DEFAULT ''"],
    ['users',            'bank_account',         "VARCHAR(50) DEFAULT ''"],
    ['users',            'bank_holder',          "VARCHAR(100) DEFAULT ''"],
    ['courses',          'image',                "VARCHAR(255) DEFAULT ''"],
    ['courses',          'thumbnail',            "VARCHAR(255) DEFAULT ''"],
    ['courses',          'original_price',       'DECIMAL(15,2) NOT NULL DEFAULT 0'],
    ['courses',          'duration',             "VARCHAR(50) NOT NULL DEFAULT '0 gio'"],
    ['courses',          'total_students',       'INT NOT NULL DEFAULT 0'],
    ['courses',          'is_locked',            'TINYINT(1) NOT NULL DEFAULT 0'],
    ['courses',          'rating',               'DECIMAL(3,1) NOT NULL DEFAULT 0'],
    ['lessons',          'order_num',            'INT NOT NULL DEFAULT 1'],
    ['lessons',          'duration_minutes',     'INT DEFAULT NULL'],
    ['enrollments',      'enrolled_at',          'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
    ['enrollments',      'progress',             'INT NOT NULL DEFAULT 0'],
    ['lesson_materials', 'material_type',        "VARCHAR(50) DEFAULT 'document'"],
    ['lesson_materials', 'content',              'TEXT'],
    ['lesson_materials', 'order_num',            'INT NOT NULL DEFAULT 1'],
    ['lesson_exercises', 'option_a',             "VARCHAR(500) DEFAULT ''"],
    ['lesson_exercises', 'option_b',             "VARCHAR(500) DEFAULT ''"],
    ['lesson_exercises', 'option_c',             "VARCHAR(500) DEFAULT ''"],
    ['lesson_exercises', 'option_d',             "VARCHAR(500) DEFAULT ''"],
    ['lesson_exercises', 'correct_answer',       "VARCHAR(5) DEFAULT ''"],
    ['lesson_exercises', 'explanation',          'TEXT'],
    ['lesson_exercises', 'order_num',            'INT NOT NULL DEFAULT 1'],
    ['lesson_comments',  'parent_id',             'INT DEFAULT NULL'],
    ['lesson_comments',  'updated_at',            'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ];

  for (const [table, column, def] of cols) {
    try { await addCol(table, column, def); }
    catch (e) { console.warn(`Alter [${table}.${column}]:`, e.message); }
  }
}

async function initDb() {
  try {
    await pool.query('SELECT 1');
    console.log('\u2705 Kết nối MySQL thành công');
    await runMigrations();
    console.log('\u2705 Migrations hoàn tất');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('\u{1F4CB} Bảng:', tables.map(t => Object.values(t)[0]).join(', '));
    // Tự động tạo admin nếu chưa có
    const [admins] = await pool.query("SELECT id FROM users WHERE is_admin=1 LIMIT 1");
    if (admins.length === 0) {
      await pool.query(
        "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)",
        ['Admin', 'admin@educonnect', 'admin@123']
      );
      console.log('\u2705 Đã tạo tài khoản admin mặc định (admin@educonnect / admin@123)');
    }
    await seedData();
  } catch (e) {
    console.error('\u274C Lỗi kết nối MySQL:', e);
    process.exit(1);
  }
}

module.exports = { getDb, initDb, fetchOne, fetchAll, run, exec };
async function seedData() {
  // Kiểm tra xem đã có data mẫu chưa (dựa vào categories)
  const [cats] = await pool.query('SELECT COUNT(*) as n FROM categories');
  if (Number(cats[0].n) > 0) return; // đã có rồi, bỏ qua

  console.log('🌱 Seeding dữ liệu mẫu...');

  // Categories
  await pool.query(`INSERT INTO categories (name, slug) VALUES
    ('Lập Trình Web', 'lap-trinh-web'),
    ('Digital Marketing', 'digital-marketing'),
    ('SEO', 'seo'),
    ('Thiết Kế', 'thiet-ke'),
    ('Kinh Doanh Online', 'kinh-doanh-online'),
    ('Tiếp Thị Liên Kết', 'tiep-thi-lien-ket')`);

  // Users mẫu (plain text password)
  await pool.query(`INSERT INTO users (name, email, password, wallet_balance) VALUES
    ('Nguyễn Văn An', 'an.nguyen@educonnect.vn', '123456', 5200000),
    ('Trần Thị Bình', 'binh.tran@educonnect.vn', '123456', 3800000),
    ('Lê Minh Cường', 'cuong.le@educonnect.vn', '123456', 7100000)`);

  // Courses (instructor_id 2,3,4 vì admin là id=1, 3 user mẫu là 2,3,4)
  await pool.query(`INSERT INTO courses (title, slug, description, price, original_price, instructor_id, category_id, level, duration, total_lessons, total_students, rating, is_featured) VALUES
    ('Lập Trình Web Từ Zero Đến Hero', 'lap-trinh-web-zero-hero', 'Khóa học toàn diện từ HTML, CSS, JavaScript đến React và Node.js. Bạn sẽ xây dựng 5 dự án thực tế và sẵn sàng đi làm sau khóa học.', 799000, 1200000, 2, 1, 'beginner', '40 giờ', 8, 2340, 4.8, 1),
    ('SEO Thực Chiến 2024', 'seo-thuc-chien-2024', 'Học SEO từ cơ bản đến nâng cao, tối ưu website lên top Google. Bao gồm On-page SEO, Off-page SEO, Technical SEO và Local SEO.', 599000, 900000, 3, 3, 'intermediate', '25 giờ', 5, 1890, 4.7, 1),
    ('Tiếp Thị Liên Kết Từ Tế', 'tiep-thi-lien-ket-tu-te', 'Kiếm tiền thụ động với Affiliate Marketing - Hướng dẫn chi tiết A-Z.', 699000, 1000000, 4, 6, 'beginner', '30 giờ', 5, 3120, 4.9, 1),
    ('Digital Marketing Tổng Thể', 'digital-marketing-tong-the', 'Facebook Ads, Google Ads, Email Marketing - Toàn bộ trong 1 khóa học.', 899000, 1400000, 2, 2, 'intermediate', '45 giờ', 140, 1560, 4.6, 1),
    ('Thiết Kế UI/UX Chuyên Nghiệp', 'thiet-ke-ui-ux', 'Figma, Adobe XD và nguyên tắc thiết kế hiện đại.', 749000, 1100000, 3, 4, 'beginner', '35 giờ', 110, 980, 4.7, 1),
    ('Kinh Doanh Online Từ A-Z', 'kinh-doanh-online-az', 'Xây dựng và phát triển cửa hàng online thành công.', 649000, 950000, 4, 5, 'beginner', '28 giờ', 85, 2100, 4.5, 1)`);

  // Lessons
  await pool.query(`INSERT INTO lessons (course_id, title, duration_minutes, order_num, is_free) VALUES
    (1, 'Giới thiệu khóa học & Lộ trình học tập', 10, 1, 1),
    (1, 'HTML Cơ Bản - Cấu trúc trang web', 25, 2, 1),
    (1, 'HTML Nâng Cao - Semantic & Form', 30, 3, 0),
    (1, 'CSS Căn Bản - Selector & Box Model', 35, 4, 0),
    (1, 'CSS Flexbox - Layout hiện đại', 40, 5, 0),
    (1, 'CSS Grid - Bố cục 2 chiều', 38, 6, 0),
    (1, 'JavaScript Nhập Môn - Biến & Hàm', 45, 7, 0),
    (1, 'JavaScript DOM - Tương tác giao diện', 50, 8, 0),
    (2, 'SEO là gì? Tổng quan và cách hoạt động', 15, 1, 1),
    (2, 'Nghiên cứu từ khóa với Google Keyword Planner', 30, 2, 1),
    (2, 'On-page SEO - Tối ưu nội dung', 35, 3, 0),
    (2, 'Technical SEO - Tốc độ & Cấu trúc', 40, 4, 0),
    (2, 'Link Building - Xây dựng backlink chất lượng', 45, 5, 0),
    (3, 'Affiliate Marketing là gì? Mô hình kiếm tiền', 20, 1, 1),
    (3, 'Chọn sản phẩm & nền tảng Affiliate', 25, 2, 1),
    (3, 'Xây dựng kênh traffic miễn phí', 35, 3, 0),
    (3, 'Chạy quảng cáo cho Affiliate', 40, 4, 0),
    (3, 'Tối ưu tỉ lệ chuyển đổi (CRO)', 30, 5, 0)`);

  // Reviews
  await pool.query(`INSERT INTO reviews (user_id, course_id, rating, comment) VALUES
    (2, 2, 5, 'Khóa học SEO cực kỳ chi tiết! Mình tăng traffic từ 800 lên 8.000 lượt/ngày sau 2 tháng áp dụng.'),
    (3, 1, 5, 'Thầy An giảng dạy rất dễ hiểu. Mình đã build được website đầu tiên sau 3 tuần học!'),
    (4, 4, 5, 'Digital Marketing tổng thể nhất mình từng học. Đáng từng đồng học phí!')`);

  // Wallet transactions
  await pool.query(`INSERT INTO wallet_transactions (user_id, type, amount, description, status) VALUES
    (2, 'deposit', 2000000, 'Nạp tiền qua chuyển khoản ngân hàng', 'completed'),
    (2, 'purchase', 599000, 'Mua khóa học: SEO Thực Chiến 2024', 'completed'),
    (3, 'deposit', 5000000, 'Nạp tiền qua chuyển khoản ngân hàng', 'completed'),
    (3, 'purchase', 799000, 'Mua khóa học: Lập Trình Web Từ Zero Đến Hero', 'completed'),
    (4, 'deposit', 10000000, 'Nạp tiền qua chuyển khoản ngân hàng', 'completed'),
    (4, 'purchase', 899000, 'Mua khóa học: Digital Marketing Tổng Thể', 'completed')`);

  console.log('✅ Seed dữ liệu mẫu hoàn tất!');
}
