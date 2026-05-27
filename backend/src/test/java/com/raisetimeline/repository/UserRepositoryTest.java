package com.raisetimeline.repository;

import com.raisetimeline.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTest {

    @PersistenceContext EntityManager em;
    @Autowired UserRepository userRepository;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder()
                .username("alice").displayName("Alice Smith").email("alice@example.com")
                .passwordHash("hash").build();
        bob = User.builder()
                .username("bob_dev").displayName("Bob Developer").email("bob@example.com")
                .passwordHash("hash").build();
        em.persist(alice);
        em.persist(bob);
        em.flush();
    }

    @Test
    @DisplayName("findByEmail: 正しいメールで取得できる")
    void findByEmail_success() {
        Optional<User> result = userRepository.findByEmail("alice@example.com");
        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("alice");
    }

    @Test
    @DisplayName("findByEmail: 存在しないメールは空")
    void findByEmail_notFound() {
        assertThat(userRepository.findByEmail("ghost@example.com")).isEmpty();
    }

    @Test
    @DisplayName("findByUsername: 正しいユーザー名で取得できる")
    void findByUsername_success() {
        Optional<User> result = userRepository.findByUsername("bob_dev");
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("bob@example.com");
    }

    @Test
    @DisplayName("existsByEmail: 存在するメールは true")
    void existsByEmail_true() {
        assertThat(userRepository.existsByEmail("alice@example.com")).isTrue();
    }

    @Test
    @DisplayName("existsByEmail: 存在しないメールは false")
    void existsByEmail_false() {
        assertThat(userRepository.existsByEmail("unknown@example.com")).isFalse();
    }

    @Test
    @DisplayName("existsByUsername: 存在するユーザー名は true")
    void existsByUsername_true() {
        assertThat(userRepository.existsByUsername("alice")).isTrue();
    }

    // ─── searchByKeyword ──────────────────────────────────────────────────

    @Test
    @DisplayName("searchByKeyword: username に一致するユーザーが返る（同値分割: 有効キーワード）")
    void searchByKeyword_matchUsername() {
        List<User> result = userRepository.searchByKeyword("alice", alice.getId(), PageRequest.of(0, 20));
        // alice は excludeId なので除外、bob は "alice" を含まない
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("searchByKeyword: 部分一致で bob_dev が返る")
    void searchByKeyword_partialMatch() {
        // alice が「bob」で検索、alice 自身は excludeId で除外されない（bob が excludeId）
        List<User> result = userRepository.searchByKeyword("bob", alice.getId(), PageRequest.of(0, 20));
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("bob_dev");
    }

    @Test
    @DisplayName("searchByKeyword: displayName に一致するユーザーが返る")
    void searchByKeyword_matchDisplayName() {
        List<User> result = userRepository.searchByKeyword("Developer", alice.getId(), PageRequest.of(0, 20));
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("bob_dev");
    }

    @Test
    @DisplayName("searchByKeyword: 自分自身（excludeId）は除外される（ホワイトボックス: 分岐検証）")
    void searchByKeyword_excludesSelf() {
        List<User> result = userRepository.searchByKeyword("alice", bob.getId(), PageRequest.of(0, 20));
        // alice を bob が検索 → alice が返るが alice は自分ではないので除外されない
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("alice");
    }

    @Test
    @DisplayName("searchByKeyword: 大文字・小文字を区別しない")
    void searchByKeyword_caseInsensitive() {
        List<User> result = userRepository.searchByKeyword("ALICE", bob.getId(), PageRequest.of(0, 20));
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("alice");
    }

    @Test
    @DisplayName("searchByKeyword: ページネーション size=1 で 1 件のみ返る（境界値）")
    void searchByKeyword_pagination() {
        User charlie = User.builder()
                .username("charlie").displayName("Charlie").email("charlie@example.com")
                .passwordHash("hash").build();
        em.persist(charlie);
        em.flush();

        List<User> result = userRepository.searchByKeyword("a", bob.getId(), PageRequest.of(0, 1));
        assertThat(result).hasSize(1);
    }
}
