package com.raisetimeline.repository;

import com.raisetimeline.entity.Follow;
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

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FollowRepositoryTest {

    @PersistenceContext EntityManager em;
    @Autowired FollowRepository followRepository;

    private User alice;
    private User bob;
    private User charlie;

    @BeforeEach
    void setUp() {
        alice   = User.builder().username("alice").displayName("Alice").email("alice@example.com").passwordHash("h").build();
        bob     = User.builder().username("bob").displayName("Bob").email("bob@example.com").passwordHash("h").build();
        charlie = User.builder().username("charlie").displayName("Charlie").email("charlie@example.com").passwordHash("h").build();
        em.persist(alice);
        em.persist(bob);
        em.persist(charlie);
        em.flush();
    }

    @Test
    @DisplayName("existsByFollowerIdAndFolloweeId: フォロー関係が存在する場合 true")
    void existsFollow_true() {
        em.persist(Follow.builder().follower(alice).followee(bob).build());
        em.flush();
        assertThat(followRepository.existsByFollowerIdAndFolloweeId(alice.getId(), bob.getId())).isTrue();
    }

    @Test
    @DisplayName("existsByFollowerIdAndFolloweeId: フォロー関係がない場合 false（同値分割: 無効グループ）")
    void existsFollow_false() {
        assertThat(followRepository.existsByFollowerIdAndFolloweeId(alice.getId(), bob.getId())).isFalse();
    }

    @Test
    @DisplayName("countByFollowerId: フォロー中の数が正しい")
    void countByFollowerId_correct() {
        em.persist(Follow.builder().follower(alice).followee(bob).build());
        em.persist(Follow.builder().follower(alice).followee(charlie).build());
        em.flush();

        assertThat(followRepository.countByFollowerId(alice.getId())).isEqualTo(2L);
    }

    @Test
    @DisplayName("countByFolloweeId: フォロワー数が正しい")
    void countByFolloweeId_correct() {
        em.persist(Follow.builder().follower(alice).followee(bob).build());
        em.persist(Follow.builder().follower(charlie).followee(bob).build());
        em.flush();

        assertThat(followRepository.countByFolloweeId(bob.getId())).isEqualTo(2L);
    }

    @Test
    @DisplayName("findFolloweesByFollowerId: フォロー中ユーザー一覧が返る")
    void findFolloweesByFollowerId_returnsList() {
        em.persist(Follow.builder().follower(alice).followee(bob).build());
        em.persist(Follow.builder().follower(alice).followee(charlie).build());
        em.flush();

        Page<User> result = followRepository.findFolloweesByFollowerId(alice.getId(), PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("findFolloweesByFollowerId: フォローしていない場合は空（境界値: 0件）")
    void findFolloweesByFollowerId_empty() {
        Page<User> result = followRepository.findFolloweesByFollowerId(alice.getId(), PageRequest.of(0, 10));
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("findFollowersByFolloweeId: フォロワー一覧が返る")
    void findFollowersByFolloweeId_returnsList() {
        em.persist(Follow.builder().follower(alice).followee(bob).build());
        em.persist(Follow.builder().follower(charlie).followee(bob).build());
        em.flush();

        Page<User> result = followRepository.findFollowersByFolloweeId(bob.getId(), PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(2);
    }
}
