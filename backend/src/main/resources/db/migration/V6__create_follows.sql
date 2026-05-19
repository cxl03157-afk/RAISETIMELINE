CREATE TABLE follows (
    id          BIGSERIAL PRIMARY KEY,
    follower_id BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followee_id BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, followee_id),
    CHECK (follower_id <> followee_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followee_id ON follows(followee_id);
