CREATE TABLE posts (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    VARCHAR(280) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_posts_user_id    ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
