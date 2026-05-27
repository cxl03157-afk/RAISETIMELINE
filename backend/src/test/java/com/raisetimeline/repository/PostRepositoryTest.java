package com.raisetimeline.repository;

import com.raisetimeline.entity.Follow;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.PostImage;
import com.raisetimeline.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PostRepositoryTest {

    @PersistenceContext EntityManager em;
    @Autowired PostRepository postRepository;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder()
                .username("alice").displayName("Alice").email("alice@example.com")
                .passwordHash("hash").build();
        bob = User.builder()
                .username("bob").displayName("Bob").email("bob@example.com")
                .passwordHash("hash").build();
        em.persist(alice);
        em.persist(bob);
        em.flush();
    }

    @Test
    @DisplayName("findAllWithUser: 全投稿が取得できる")
    void findAllWithUser_returnsAllPosts() throws InterruptedException {
        em.persist(Post.builder().user(alice).content("post1").build());
        em.flush();
        Thread.sleep(10);
        em.persist(Post.builder().user(bob).content("post2").build());
        em.flush();

        Page<Post> result = postRepository.findAllWithUser(PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("findAllWithUser: 新しい投稿が先頭に来る（DESC順）")
    void findAllWithUser_descendingOrder() throws InterruptedException {
        em.persist(Post.builder().user(alice).content("older").build());
        em.flush();
        Thread.sleep(10);
        em.persist(Post.builder().user(alice).content("newer").build());
        em.flush();

        Page<Post> result = postRepository.findAllWithUser(PageRequest.of(0, 10));

        assertThat(result.getContent().get(0).getContent()).isEqualTo("newer");
        assertThat(result.getContent().get(1).getContent()).isEqualTo("older");
    }

    @Test
    @DisplayName("findAllWithUser: ページネーション size=1 で 1 件のみ返る（境界値）")
    void findAllWithUser_pagination() throws InterruptedException {
        em.persist(Post.builder().user(alice).content("post1").build());
        em.flush();
        Thread.sleep(10);
        em.persist(Post.builder().user(alice).content("post2").build());
        em.flush();

        Page<Post> page0 = postRepository.findAllWithUser(PageRequest.of(0, 1));
        Page<Post> page1 = postRepository.findAllWithUser(PageRequest.of(1, 1));

        assertThat(page0.getContent()).hasSize(1);
        assertThat(page1.getContent()).hasSize(1);
        assertThat(page0.getContent().get(0).getContent())
                .isNotEqualTo(page1.getContent().get(0).getContent());
    }

    @Test
    @DisplayName("findFollowingPosts: フォロー中ユーザーの投稿のみ返る（ホワイトボックス: WHERE サブクエリ分岐）")
    void findFollowingPosts_onlyFollowedPosts() {
        em.persist(Post.builder().user(alice).content("alice post").build());
        em.persist(Post.builder().user(bob).content("bob post").build());
        em.persist(Follow.builder().follower(alice).followee(bob).build());
        em.flush();

        Page<Post> result = postRepository.findFollowingPosts(alice.getId(), PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getContent()).isEqualTo("bob post");
    }

    @Test
    @DisplayName("findFollowingPosts: フォローしていない場合は空を返す")
    void findFollowingPosts_emptyWhenNotFollowing() {
        em.persist(Post.builder().user(bob).content("bob post").build());
        em.flush();

        Page<Post> result = postRepository.findFollowingPosts(alice.getId(), PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("findByUsernameWithImages: 画像を含む投稿が取得できる")
    void findByUsernameWithImages_includesImages() {
        Post post = Post.builder().user(alice).content("with image").build();
        em.persist(post);
        em.persist(PostImage.builder()
                .post(post).imageKey("avatars/1/img.jpg").displayOrder(0).build());
        em.flush();
        em.clear(); // evict from first-level cache so JPQL JOIN FETCH loads images from DB

        List<Post> result = postRepository.findByUsernameWithImages("alice");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getImages()).hasSize(1);
    }

    @Test
    @DisplayName("findByUsernameWithImages: 画像なし投稿も取得できる")
    void findByUsernameWithImages_noImages() {
        em.persist(Post.builder().user(alice).content("no image").build());
        em.flush();

        List<Post> result = postRepository.findByUsernameWithImages("alice");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getImages()).isEmpty();
    }
}
