-- EduConnect Database Schema (MySQL)

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- Tạo database (tuỳ chọn)
-- CREATE DATABASE IF NOT EXISTS educonnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE educonnect;

CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    wallet_balance DECIMAL(15,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(15,2) DEFAULT 0,
    original_price DECIMAL(15,2) DEFAULT 0,
    image VARCHAR(255) DEFAULT NULL,
    instructor_id INT,
    category_id INT,
    level VARCHAR(50) DEFAULT 'beginner',
    duration VARCHAR(50) DEFAULT '0 giờ',
    total_lessons INT DEFAULT 0,
    total_students INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_featured TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500),
    duration_minutes INT DEFAULT 0,
    order_num INT DEFAULT 0,
    is_free TINYINT(1) DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_materials (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    material_type VARCHAR(50) DEFAULT 'document',
    order_num INT DEFAULT 0,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_exercises (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(10),
    explanation TEXT,
    order_num INT DEFAULT 0,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress INT DEFAULT 0,
    UNIQUE KEY uq_enrollment (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit','withdraw','purchase','refund') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status ENUM('pending','completed','failed') DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
