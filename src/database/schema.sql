CREATE DATABASE IF NOT EXISTS appointments_db;
USE appointments_db;

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    insured_id VARCHAR(5) NOT NULL,
    schedule_id INT NOT NULL,
    country_iso VARCHAR(2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    center_id INT,
    specialty_id INT,
    medic_id INT,
    appointment_date DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_insured_id (insured_id),
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_country_iso (country_iso),
    INDEX idx_status (status),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

