package com.raisetimeline.service;

import com.raisetimeline.entity.Follow;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.BadRequestException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserService userService;

    @Transactional
    public void follow(String followerEmail, String followeeUsername) {
        User follower = userService.getByEmail(followerEmail);
        User followee = userService.getByUsername(followeeUsername);
        if (follower.getId().equals(followee.getId())) {
            throw new BadRequestException("自分自身はフォローできません");
        }
        if (followRepository.existsByFollowerIdAndFolloweeId(follower.getId(), followee.getId())) {
            throw new BadRequestException("既にフォロー済みです");
        }
        followRepository.save(Follow.builder().follower(follower).followee(followee).build());
    }

    @Transactional
    public void unfollow(String followerEmail, String followeeUsername) {
        User follower = userService.getByEmail(followerEmail);
        User followee = userService.getByUsername(followeeUsername);
        Follow follow = followRepository.findByFollowerIdAndFolloweeId(follower.getId(), followee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("フォローしていません"));
        followRepository.delete(follow);
    }
}
