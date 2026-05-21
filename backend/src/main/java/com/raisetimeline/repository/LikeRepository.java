package com.raisetimeline.repository;

import com.raisetimeline.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface LikeRepository extends JpaRepository<Like, Long> {

    Optional<Like> findByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserEmail(Long postId, String email);

    @Query("SELECT l.post.id FROM Like l WHERE l.user.email = :email AND l.post.id IN :postIds")
    Set<Long> findLikedPostIdsByEmail(@Param("email") String email,
                                      @Param("postIds") List<Long> postIds);
}
