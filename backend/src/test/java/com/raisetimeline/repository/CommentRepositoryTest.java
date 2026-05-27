package com.raisetimeline.repository;

import com.raisetimeline.entity.Comment;
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

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CommentRepositoryTest {

    @PersistenceContext EntityManager em;
    @Autowired CommentRepository commentRepository;

    private User alice;
    private User bob;
    private Post post;

    @BeforeEach
    void setUp() {
        alice = User.builder().username("alice").displayName("Alice").email("alice@example.com").passwordHash("h").build();
        bob   = User.builder().username("bob").displayName("Bob").email("bob@example.com").passwordHash("h").build();
        em.persist(alice);
        em.persist(bob);
        post = Post.builder().user(alice).content("test post").build();
        em.persist(post);
        em.flush();
    }

    @Test
    @DisplayName("findByPostIdOrderByCreatedAtAsc: 投稿のコメントが時系列順で返る")
    void findComments_orderedByCreatedAtAsc() throws InterruptedException {
        em.persist(Comment.builder().post(post).user(alice).content("first comment").build());
        em.flush();
        Thread.sleep(10);
        em.persist(Comment.builder().post(post).user(bob).content("second comment").build());
        em.flush();

        List<Comment> result = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getContent()).isEqualTo("first comment");
        assertThat(result.get(1).getContent()).isEqualTo("second comment");
    }

    @Test
    @DisplayName("findByPostIdOrderByCreatedAtAsc: コメントなしの投稿は空リスト（境界値: 0件）")
    void findComments_emptyWhenNoComments() {
        List<Comment> result = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByPostIdOrderByCreatedAtAsc: 別投稿のコメントは含まれない（同値分割: 別PostId）")
    void findComments_isolatedByPost() {
        Post otherPost = Post.builder().user(bob).content("other post").build();
        em.persist(otherPost);
        em.persist(Comment.builder().post(otherPost).user(alice).content("other comment").build());
        em.persist(Comment.builder().post(post).user(alice).content("this post comment").build());
        em.flush();

        List<Comment> result = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContent()).isEqualTo("this post comment");
    }

    @Test
    @DisplayName("findByPostIdOrderByCreatedAtAsc: ユーザー情報がフェッチされている（N+1対策確認）")
    void findComments_userIsFetched() {
        em.persist(Comment.builder().post(post).user(alice).content("comment").build());
        em.flush();

        List<Comment> result = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());

        // LazyInitializationException が起きないことを確認
        assertThat(result.get(0).getUser().getUsername()).isEqualTo("alice");
    }
}
