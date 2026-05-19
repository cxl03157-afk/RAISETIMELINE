package com.raisetimeline.service;

import com.raisetimeline.entity.Like;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.DuplicateException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.LikeRepository;
import com.raisetimeline.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserService userService;

    @Transactional
    public void like(String email, Long postId) {
        Post post = findPost(postId);
        User user = userService.getByEmail(email);
        if (likeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            throw new DuplicateException("既にいいねしています");
        }
        likeRepository.save(Like.builder().post(post).user(user).build());
    }

    @Transactional
    public void unlike(String email, Long postId) {
        User user = userService.getByEmail(email);
        Like like = likeRepository.findByPostIdAndUserId(postId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("いいねが見つかりません"));
        likeRepository.delete(like);
    }

    private Post findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("投稿が見つかりません: " + postId));
    }
}
