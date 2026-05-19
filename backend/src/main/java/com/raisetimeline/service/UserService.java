package com.raisetimeline.service;

import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません: " + username));
        return new UserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません"));
        user.setDisplayName(req.getDisplayName());
        user.setBio(req.getBio() != null ? req.getBio() : "");
        return new UserResponse(user);
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません"));
    }
}
