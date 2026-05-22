package com.raisetimeline.service;

import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.BadRequestException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.FollowRepository;
import com.raisetimeline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public UserResponse getProfile(String username, String currentEmail) {
        User user = getByUsername(username);
        User current = getByEmail(currentEmail);
        return buildResponse(user, current.getId());
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = getByEmail(email);
        user.setDisplayName(req.getDisplayName());
        user.setBio(req.getBio() != null ? req.getBio() : "");
        return buildResponse(user, user.getId());
    }

    @Transactional
    public UserResponse uploadAvatar(String email, MultipartFile file) {
        validateAvatarFile(file);
        User user = getByEmail(email);
        String oldKey = user.getAvatarKey();

        String ext = resolveExtension(file.getContentType());
        String newKey = "avatars/" + user.getId() + "/" + UUID.randomUUID() + ext;
        s3Service.upload(file, newKey);

        try {
            user.setAvatarKey(newKey);
            userRepository.save(user);
        } catch (Exception e) {
            s3Service.delete(newKey);
            throw e;
        }

        if (oldKey != null) {
            try {
                s3Service.delete(oldKey);
            } catch (Exception e) {
                log.warn("旧アバターの S3 削除に失敗しました: {}", oldKey, e);
            }
        }

        return buildResponse(user, user.getId());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String keyword, String currentEmail) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }
        User current = getByEmail(currentEmail);
        List<User> users = userRepository.searchByKeyword(keyword.trim(), current.getId(), PageRequest.of(0, 20));
        return buildResponseList(users, current.getId());
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getFollowing(String username, String currentEmail, int page, int size) {
        int effectiveSize = Math.min(size, 20);
        User target = getByUsername(username);
        User current = getByEmail(currentEmail);
        Page<User> usersPage = followRepository.findFolloweesByFollowerId(target.getId(), PageRequest.of(page, effectiveSize));
        List<UserResponse> responses = buildResponseList(usersPage.getContent(), current.getId());
        return new PageImpl<>(responses, usersPage.getPageable(), usersPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getFollowers(String username, String currentEmail, int page, int size) {
        int effectiveSize = Math.min(size, 20);
        User target = getByUsername(username);
        User current = getByEmail(currentEmail);
        Page<User> usersPage = followRepository.findFollowersByFolloweeId(target.getId(), PageRequest.of(page, effectiveSize));
        List<UserResponse> responses = buildResponseList(usersPage.getContent(), current.getId());
        return new PageImpl<>(responses, usersPage.getPageable(), usersPage.getTotalElements());
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません: " + username));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません"));
    }

    private UserResponse buildResponse(User user, Long currentUserId) {
        long following = followRepository.countByFollowerId(user.getId());
        long followers = followRepository.countByFolloweeId(user.getId());
        boolean followedByMe = currentUserId != null
                && !user.getId().equals(currentUserId)
                && followRepository.existsByFollowerIdAndFolloweeId(currentUserId, user.getId());
        String avatarUrl = user.getAvatarKey() != null
                ? s3Service.generatePresignedUrl(user.getAvatarKey())
                : null;
        return new UserResponse(user, following, followers, followedByMe, avatarUrl);
    }

    private List<UserResponse> buildResponseList(List<User> users, Long currentUserId) {
        if (users.isEmpty()) {
            return List.of();
        }
        List<Long> userIds = users.stream().map(User::getId).toList();

        Set<Long> followedIds = currentUserId != null
                ? followRepository.findFollowedUserIds(currentUserId, userIds)
                : Set.of();

        Map<Long, Long> followingCountMap = followRepository.countFollowingByUserIds(userIds)
                .stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        Map<Long, Long> followerCountMap = followRepository.countFollowersByUserIds(userIds)
                .stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        return users.stream().map(u -> {
            String avatarUrl = u.getAvatarKey() != null
                    ? s3Service.generatePresignedUrl(u.getAvatarKey())
                    : null;
            return new UserResponse(
                    u,
                    followingCountMap.getOrDefault(u.getId(), 0L),
                    followerCountMap.getOrDefault(u.getId(), 0L),
                    followedIds.contains(u.getId()),
                    avatarUrl
            );
        }).toList();
    }

    private void validateAvatarFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("ファイルが空です");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new BadRequestException("アバター画像は5MB以内にしてください");
        }
        String ct = file.getContentType();
        if (!"image/jpeg".equals(ct) && !"image/png".equals(ct)) {
            throw new BadRequestException("JPEG または PNG 形式の画像のみ使用できます");
        }
    }

    private String resolveExtension(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png"  -> ".png";
            default -> throw new BadRequestException("対応していない画像形式です");
        };
    }
}
