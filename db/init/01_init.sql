-- 01_init.sql
-- Auth database schema: users, roles (many-to-many), refresh tokens,
-- and bootstrap admin.
--
-- Every statement is guarded for idempotency.

CREATE DATABASE IF NOT EXISTS auth
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE auth;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USERS (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    USERNAME      VARCHAR(100) NOT NULL,
    EMAIL         VARCHAR(255) NOT NULL,
    PASSWORD_HASH VARCHAR(255) NOT NULL,
    ENABLED       TINYINT(1)   NOT NULL DEFAULT 1,
    EXTERNAL_UUID VARCHAR(36)  NOT NULL,
    CREATED_AT    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT UK_USERS_USERNAME UNIQUE (USERNAME),
    CONSTRAINT UK_USERS_EMAIL    UNIQUE (EMAIL),
    CONSTRAINT UK_USERS_UUID     UNIQUE (EXTERNAL_UUID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- ROLES — catalogue of available roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ROLES (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    NAME        VARCHAR(50)  NOT NULL,
    DESCRIPTION VARCHAR(255) DEFAULT NULL,
    CREATED_AT  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UK_ROLES_NAME UNIQUE (NAME)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- USERS_ROLES — many-to-many junction
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USERS_ROLES (
    USER_ID     BIGINT   NOT NULL,
    ROLE_ID     BIGINT   NOT NULL,
    ASSIGNED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (USER_ID, ROLE_ID),
    CONSTRAINT FK_USERS_ROLES_USER FOREIGN KEY (USER_ID) REFERENCES USERS(id) ON DELETE CASCADE,
    CONSTRAINT FK_USERS_ROLES_ROLE FOREIGN KEY (ROLE_ID) REFERENCES ROLES(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- REFRESH_TOKENS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS REFRESH_TOKENS (
    id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
    USER_ID    BIGINT       NOT NULL,
    TOKEN      VARCHAR(255) NOT NULL,
    EXPIRES_AT DATETIME     NOT NULL,
    REVOKED    TINYINT(1)   NOT NULL DEFAULT 0,
    CREATED_AT DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_REFRESH_TOKENS_USER FOREIGN KEY (USER_ID) REFERENCES USERS(id) ON DELETE CASCADE,
    CONSTRAINT UK_REFRESH_TOKENS_TOKEN UNIQUE (TOKEN),
    INDEX IDX_REFRESH_TOKENS_USER (USER_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Seed roles
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO ROLES (NAME, DESCRIPTION) VALUES
    ('CITIZEN', 'Regular citizen — default role'),
    ('GOVERNMENT', 'Government employee — default role'),
    ('ACTIVITY_MANAGER', 'Manager of an activity'),
    ('ADMIN',   'System administrator with elevated privileges');

-- ---------------------------------------------------------------------------
-- Bootstrap admin user
-- Password: admin123 (bcrypt hash, rounds=12)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, ENABLED, EXTERNAL_UUID)
VALUES (
    'admin',
    'admin@rp-government.gov',
    '$2b$12$zI.76mkGj4/acqFxfjGeN.Z0Hx8hWZVJQ5h2G8pjDIUswqZnsEFgS',
    1,
    'a0000000-0000-0000-0000-000000000001'
);

-- Link admin user to ADMIN + CITIZEN roles
INSERT IGNORE INTO USERS_ROLES (USER_ID, ROLE_ID)
SELECT u.id, r.id
FROM USERS u, ROLES r
WHERE u.EXTERNAL_UUID = 'a0000000-0000-0000-0000-000000000001'
  AND r.NAME IN ('ADMIN', 'CITIZEN');
