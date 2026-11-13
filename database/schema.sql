CREATE DATABASE IF NOT EXISTS psp_db;
USE psp_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_no VARCHAR(20) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  reference_no VARCHAR(30) UNIQUE,
  status ENUM('draft','pending_review','needs_correction','complete',
              'form_released','submitted_to_governor','approved','denied')
         NOT NULL DEFAULT 'draft',
  submitted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  type ENUM('letter','cor','cog','barangay','id_signature') NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_remark VARCHAR(255) NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_doc_per_type (application_id, type),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE pickup_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 20
);

CREATE TABLE payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL UNIQUE,
  method ENUM('pickup','ewallet') NOT NULL,
  pickup_slot_id INT NULL,
  ewallet_provider VARCHAR(30) NULL,
  ewallet_number VARCHAR(20) NULL,
  ewallet_name VARCHAR(100) NULL,
  status ENUM('pending','released') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (pickup_slot_id) REFERENCES pickup_slots(id)
);

CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  application_start DATE,
  application_end DATE
);
INSERT INTO settings (id, application_start, application_end)
VALUES (1, '2026-11-12', '2026-12-31');

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);