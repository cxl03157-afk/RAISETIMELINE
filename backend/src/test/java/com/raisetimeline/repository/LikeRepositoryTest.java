package com.raisetimeline.repository;

import com.raisetimeline.entity.Like;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LikeRepositoryTest {

    @PersistenceContext EntityManager em;
    @Autowired LikeRepository likeRepository;

    private User alice;
    private Post post1;
    private Post post2;

    @BeforeEach
    void setUp() {
        alice = User.builder().username("alice").displayName("Alice").email("alice@example.com").passwordHash("h").build();
        User bob = User.builder().username("bob").displayName("Bob").email("bob@example.com").passwordHash("h").build();
        em.persist(alice);
        em.persist(bob);
        post1 = Post.builder().user(bob).content("post1").build();
        post2 = Post.builder().user(bob).content("post2").build();
        em.persist(post1);
        em.persist(post2);
        em.flush();
    }

    @Test
    @DisplayName("existsByPostIdAndUserId: いいね済みは true")
    void existsByPostIdAndUserId_true() {
        em.persist(Like.builder().post(post1).user(alice).build());
        em.flush();
        assertThat(likeRepository.existsByPostIdAndUserId(post1.getId(), alice.getId())).isTrue();
    }

    @Test
    @DisplayName("existsByPostIdAndUserId: いいねしていない場合 false（同値分割: 無効グループ）")
    void existsByPostIdAndUserId_false() {
        assertThat(likeRepository.existsByPostIdAndUserId(post1.getId(), alice.getId())).isFalse();
    }

    @Test
    @DisplayName("findByPostIdAndUserId: いいねが取得できる")
    void findByPostIdAndUserId_found() {
        em.persist(Like.builder().post(post1).user(alice).build());
        em.flush();
        Optional<Like> result = likeRepository.findByPostIdAndUserId(post1.getId(), alice.getId());
        assertThat(result).isPresent();
    }

    @Test
    @DisplayName("findByPostIdAndUserId: いいねがない場合は空")
    void findByPostIdAndUserId_empty() {
        assertThat(likeRepository.findByPostIdAndUserId(post1.getId(), alice.getId())).isEmpty();
    }

    @Test
    @DisplayName("existsByPostIdAndUserEmail: メールでいいね確認できる")
    void existsByPostIdAndUserEmail_true() {
        em.persist(Like.builder().post(post1).user(alice).build());
        em.flush();
        assertThat(likeRepository.existsByPostIdAndUserEmail(post1.getId(), "alice@example.com")).isTrue();
    }

    @Test
    @DisplayName("findLikedPostIdsByEmail: いいね済み投稿IDのリストが返る（ホワイトボックス: バッチ取得）")
    void findLikedPostIdsByEmail_returnsBatch() {
        em.persist(Like.builder().post(post1).user(alice).build());
        em.flush();

        Set<Long> likedIds = likeRepository.findLikedPostIdsByEmail(
                "alice@example.com", List.of(post1.getId(), post2.getId()));

        assertThat(likedIds).containsExactly(post1.getId());
        assertThat(likedIds).doesNotContain(post2.getId());
    }
}
