CREATE TABLE post_images (
    id            BIGSERIAL PRIMARY KEY,
    post_id       BIGINT       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_url     VARCHAR(500) NOT NULL,
    display_order INT          NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);
