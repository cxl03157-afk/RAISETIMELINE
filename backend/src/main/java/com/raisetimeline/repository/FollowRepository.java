package com.raisetimeline.repository;

import com.raisetimeline.entity.Follow;
import com.raisetimeline.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerIdAndFolloweeId(Long followerId, Long followeeId);

    Optional<Follow> findByFollowerIdAndFolloweeId(Long followerId, Long followeeId);

    long countByFollowerId(Long followerId);

    long countByFolloweeId(Long followeeId);

    // User を直接取得してフォロー→User の追加クエリを防ぐ
    @Query(value = "SELECT f.followee FROM Follow f WHERE f.follower.id = :followerId ORDER BY f.createdAt DESC",
           countQuery = "SELECT COUNT(f) FROM Follow f WHERE f.follower.id = :followerId")
    Page<User> findFolloweesByFollowerId(@Param("followerId") Long followerId, Pageable pageable);

    @Query(value = "SELECT f.follower FROM Follow f WHERE f.followee.id = :followeeId ORDER BY f.createdAt DESC",
           countQuery = "SELECT COUNT(f) FROM Follow f WHERE f.followee.id = :followeeId")
    Page<User> findFollowersByFolloweeId(@Param("followeeId") Long followeeId, Pageable pageable);

    // followedByMe バッチ取得
    @Query("SELECT f.followee.id FROM Follow f WHERE f.follower.id = :followerId AND f.followee.id IN :userIds")
    Set<Long> findFollowedUserIds(@Param("followerId") Long followerId, @Param("userIds") List<Long> userIds);

    // followingCount バッチ取得
    @Query("SELECT f.follower.id, COUNT(f) FROM Follow f WHERE f.follower.id IN :userIds GROUP BY f.follower.id")
    List<Object[]> countFollowingByUserIds(@Param("userIds") List<Long> userIds);

    // followersCount バッチ取得
    @Query("SELECT f.followee.id, COUNT(f) FROM Follow f WHERE f.followee.id IN :userIds GROUP BY f.followee.id")
    List<Object[]> countFollowersByUserIds(@Param("userIds") List<Long> userIds);
}
