package com.raisetimeline.repository;

import com.raisetimeline.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p JOIN FETCH p.user LEFT JOIN FETCH p.images ORDER BY p.createdAt DESC")
    Page<Post> findAllWithUser(Pageable pageable);

    @Query("""
            SELECT p FROM Post p JOIN FETCH p.user LEFT JOIN FETCH p.images
            WHERE p.user.id IN (
                SELECT f.followee.id FROM Follow f WHERE f.follower.id = :userId
            )
            ORDER BY p.createdAt DESC
            """)
    Page<Post> findFollowingPosts(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN FETCH p.user LEFT JOIN FETCH p.images WHERE p.user.username = :username ORDER BY p.createdAt DESC")
    List<Post> findByUsernameWithImages(@Param("username") String username);
}
