package com.raisetimeline.controller;

import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.service.FollowService;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "user", description = "ユーザー (プロフィール/フォロー/検索/アイコン)")
public class UserController {

    private final UserService userService;
    private final PostService postService;
    private final FollowService followService;

    @Operation(summary = "ユーザープロフィール取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @ApiResponse(responseCode = "404", description = "ユーザーが見つからない")
    @GetMapping("/{username}")
    public UserResponse getProfile(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        return userService.getProfile(username, principal.getUsername());
    }

    @Operation(summary = "自分のプロフィール更新")
    @ApiResponse(responseCode = "200", description = "更新成功")
    @PutMapping("/me")
    public UserResponse updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        return userService.updateProfile(principal.getUsername(), req);
    }

    @Operation(summary = "アバター画像アップロード",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)))
    @ApiResponse(responseCode = "200", description = "アップロード成功")
    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse uploadAvatar(
            @AuthenticationPrincipal UserDetails principal,
            @Parameter(description = "アバター画像ファイル") @RequestParam MultipartFile avatar) {
        return userService.uploadAvatar(principal.getUsername(), avatar);
    }

    @Operation(summary = "ユーザー検索")
    @ApiResponse(responseCode = "200", description = "検索成功")
    @GetMapping("/search")
    public List<UserResponse> searchUsers(
            @AuthenticationPrincipal UserDetails principal,
            @Parameter(description = "検索キーワード") @RequestParam String q) {
        return userService.searchUsers(q, principal.getUsername());
    }

    @Operation(summary = "フォロー中ユーザー一覧取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping("/{username}/following")
    public Page<UserResponse> getFollowing(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username,
            @Parameter(description = "ページ番号") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "1ページあたりの件数") @RequestParam(defaultValue = "20") int size) {
        return userService.getFollowing(username, principal.getUsername(), page, size);
    }

    @Operation(summary = "フォロワー一覧取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping("/{username}/followers")
    public Page<UserResponse> getFollowers(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username,
            @Parameter(description = "ページ番号") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "1ページあたりの件数") @RequestParam(defaultValue = "20") int size) {
        return userService.getFollowers(username, principal.getUsername(), page, size);
    }

    @Operation(summary = "ユーザーをフォロー")
    @ApiResponse(responseCode = "201", description = "フォロー成功")
    @ApiResponse(responseCode = "409", description = "すでにフォロー済み")
    @PostMapping("/{username}/follow")
    @ResponseStatus(HttpStatus.CREATED)
    public void follow(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        followService.follow(principal.getUsername(), username);
    }

    @Operation(summary = "フォロー解除")
    @ApiResponse(responseCode = "204", description = "フォロー解除成功")
    @DeleteMapping("/{username}/follow")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        followService.unfollow(principal.getUsername(), username);
    }

    @Operation(summary = "ユーザーの投稿一覧取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping("/{username}/posts")
    public List<PostResponse> getUserPosts(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        return postService.getUserPosts(username, principal.getUsername());
    }
}
