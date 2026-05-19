CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    username     VARCHAR(20)  NOT NULL UNIQUE,
    display_name VARCHAR(50)  NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url   VARCHAR(500),
    bio          TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
