/* ============================================================
   RAISETIMELINE – Static Prototype Mock
   All data lives in memory; no backend required.
   ============================================================ */

// ─── Avatar color palette ───────────────────────────────────
const AVATAR_COLORS = [
  '#1D9BF0','#17A589','#E74C3C','#8E44AD','#E67E22',
  '#2ECC71','#E91E8C','#F39C12','#2C3E50','#16A085',
];
function avatarColor(username) {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function avatarInitial(user) { return (user.displayName || user.username)[0].toUpperCase(); }
function renderAvatar(user, size = 'sm', clickFn = null) {
  const cls = `avatar avatar-${size}`;
  const onclick = clickFn ? `onclick="${clickFn}"` : `onclick="navigate('profile/${user.username}')"`;
  if (user.avatarUrl) {
    return `<div class="${cls}" style="background:${avatarColor(user.username)}" ${onclick} title="${user.displayName}"><img src="${escHtml(user.avatarUrl)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"></div>`;
  }
  return `<div class="${cls}" style="background:${avatarColor(user.username)};" ${onclick} title="${user.displayName}">${avatarInitial(user)}</div>`;
}

// ─── Mock Data ──────────────────────────────────────────────
let users = [
  { id: 1, username: 'alice', displayName: 'Alice Yamamoto', email: 'alice@example.com', password: 'password', bio: '学習目的で作ったSNSアプリです。Spring Boot + React で実装中！', followingCount: 2, followerCount: 1 },
  { id: 2, username: 'bob', displayName: 'Bob Tanaka', email: 'bob@example.com', password: 'password', bio: 'バックエンドエンジニア志望。Javaが好きです。', followingCount: 1, followerCount: 2 },
  { id: 3, username: 'carol', displayName: 'Carol Suzuki', email: 'carol@example.com', password: 'password', bio: 'フロントエンド・デザイン担当。ReactとTypeScriptをメインに勉強中。', followingCount: 0, followerCount: 2 },
  { id: 4, username: 'dave', displayName: 'Dave Ito', email: 'dave@example.com', password: 'password', bio: 'インフラ・AWS担当。Terraformで構築を自動化しています。', followingCount: 1, followerCount: 0 },
  { id: 5, username: 'eve', displayName: 'Eve Nakamura', email: 'eve@example.com', password: 'password', bio: '', followingCount: 0, followerCount: 0 },
];

let posts = [
  { id: 1,  userId: 2, content: 'Spring Boot 4.0 で REST API を作り始めました！JPA の設定が意外と簡単でびっくり。', images: [], createdAt: new Date(Date.now() - 5*60*1000) },
  { id: 2,  userId: 3, content: 'Material UI v7 のコンポーネントが使いやすくて最高です。タイムライン画面のカード部分を実装しました！', images: ['https://picsum.photos/seed/react1/600/400','https://picsum.photos/seed/react2/600/400'], createdAt: new Date(Date.now() - 30*60*1000) },
  { id: 3,  userId: 1, content: 'RAISETIMELINEプロジェクト始動！X（Twitter）クローンをフルスタックで作るぞ〜🚀\n\n#SpringBoot #React #AWS', images: [], createdAt: new Date(Date.now() - 2*60*60*1000) },
  { id: 4,  userId: 4, content: 'Terraform で VPC・EC2・RDS を一発で構築できた！IaC は本当に便利ですね。\n`terraform apply` 完了🎉', images: ['https://picsum.photos/seed/aws1/600/400'], createdAt: new Date(Date.now() - 3*60*60*1000) },
  { id: 5,  userId: 2, content: 'JWT 認証の実装が完成しました。Spring Security の設定がちょっと複雑でしたが、なんとか動きました！', images: [], createdAt: new Date(Date.now() - 5*60*60*1000) },
  { id: 6,  userId: 3, content: 'CSSグリッドで画像の 1枚・2枚・3枚・4枚レイアウトを実装。要件通りに動いてます！', images: ['https://picsum.photos/seed/css1/600/400','https://picsum.photos/seed/css2/600/400','https://picsum.photos/seed/css3/600/400'], createdAt: new Date(Date.now() - 8*60*60*1000) },
  { id: 7,  userId: 1, content: 'PostgreSQL のスキーマ設計完了。Flyway でマイグレーション管理します。', images: [], createdAt: new Date(Date.now() - 12*60*60*1000) },
  { id: 8,  userId: 2, content: 'いいね機能の楽観的 UI 更新を実装しました。クリックが即座に反映されて気持ちいい！', images: [], createdAt: new Date(Date.now() - 18*60*60*1000) },
  { id: 9,  userId: 4, content: 'AWS S3 への画像アップロード、IAM ロールだけで実現できました。アクセスキー不要なのでセキュアです。', images: ['https://picsum.photos/seed/s3a/600/400','https://picsum.photos/seed/s3b/600/400','https://picsum.photos/seed/s3c/600/400','https://picsum.photos/seed/s3d/600/400'], createdAt: new Date(Date.now() - 24*60*60*1000) },
  { id: 10, userId: 3, content: 'ユーザー検索に debounce を実装。300ms 待ってから API コールするようにしました。UX 向上！', images: [], createdAt: new Date(Date.now() - 30*60*60*1000) },
  { id: 11, userId: 1, content: 'フォロー機能の実装完了。フォロー中タイムラインも動くようになりました。', images: [], createdAt: new Date(Date.now() - 36*60*60*1000) },
  { id: 12, userId: 5, content: 'はじめまして！Eve と申します。このプロジェクトに参加しました！', images: [], createdAt: new Date(Date.now() - 48*60*60*1000) },
];
let nextPostId = 13;

let comments = {
  1: [{ id: 1, postId: 1, userId: 1, content: 'すごい！JPA 使いやすいですよね。N+1 問題には気をつけて！', createdAt: new Date(Date.now() - 3*60*1000) }],
  2: [{ id: 2, postId: 2, userId: 2, content: 'デザイン綺麗ですね。コンポーネント設計はどうしていますか？', createdAt: new Date(Date.now() - 20*60*1000) }, { id: 3, postId: 2, userId: 1, content: 'カードコンポーネントを再利用できるように設計しました！', createdAt: new Date(Date.now() - 15*60*1000) }],
  3: [{ id: 4, postId: 3, userId: 2, content: '楽しみにしてます！一緒に頑張りましょう！', createdAt: new Date(Date.now() - 90*60*1000) }],
  4: [],
  5: [{ id: 5, postId: 5, userId: 3, content: 'Spring Security 最初は難しいですよね。設定ファイル共有してもらえますか？', createdAt: new Date(Date.now() - 4*60*60*1000) }],
  6: [],
  7: [{ id: 6, postId: 7, userId: 4, content: 'DB 設計は一番大事ですね。インデックスの設計も忘れずに！', createdAt: new Date(Date.now() - 10*60*60*1000) }],
  8: [],
  9: [],
  10: [],
  11: [],
  12: [{ id: 7, postId: 12, userId: 1, content: 'ようこそ！よろしくお願いします！', createdAt: new Date(Date.now() - 45*60*60*1000) }],
};
let nextCommentId = 8;

let likes = {
  1:  [1, 3],
  2:  [1, 2, 4],
  3:  [2, 3, 4, 5],
  4:  [1, 2],
  5:  [3],
  6:  [1, 2, 4],
  7:  [2, 3],
  8:  [1, 3, 5],
  9:  [2, 3],
  10: [1, 4],
  11: [2, 3],
  12: [1, 2, 3, 4, 5],
};

// follows[followerId] = Set of followeeIds
let follows = {
  1: new Set([2, 3]),
  2: new Set([3]),
  4: new Set([2]),
};
function getFollows(uid) { return follows[uid] || (follows[uid] = new Set()); }
function isFollowing(followerId, followeeId) { return getFollows(followerId).has(followeeId); }
function followUser(followerId, followeeId) {
  if (followerId === followeeId) return;
  getFollows(followerId).add(followeeId);
  const follower = getUserById(followerId);
  const followee = getUserById(followeeId);
  if (follower) follower.followingCount++;
  if (followee) followee.followerCount++;
}
function unfollowUser(followerId, followeeId) {
  if (!getFollows(followerId).has(followeeId)) return;
  getFollows(followerId).delete(followeeId);
  const follower = getUserById(followerId);
  const followee = getUserById(followeeId);
  if (follower) follower.followingCount = Math.max(0, follower.followingCount - 1);
  if (followee) followee.followerCount = Math.max(0, followee.followerCount - 1);
}

// ─── Auth state ─────────────────────────────────────────────
let currentUser = null;

function getUserById(id) { return users.find(u => u.id === id); }
function getUserByUsername(username) { return users.find(u => u.username === username); }

// ─── Routing ────────────────────────────────────────────────
function navigate(hash) {
  window.location.hash = hash;
}
window.addEventListener('hashchange', router);

function router() {
  const hash = window.location.hash.replace('#', '') || 'login';
  closeAllMenus();

  if (!currentUser && hash !== 'login' && hash !== 'register') {
    navigate('login');
    return;
  }

  const app = document.getElementById('app');
  if (hash === 'login') { app.innerHTML = renderLoginPage(); return; }
  if (hash === 'register') { app.innerHTML = renderRegisterPage(); return; }
  if (hash === 'timeline') { app.innerHTML = renderTimelinePage(); return; }
  if (hash === 'search') { app.innerHTML = renderSearchPage(); return; }
  if (hash.startsWith('post/')) {
    const id = parseInt(hash.split('/')[1]);
    app.innerHTML = renderPostDetailPage(id);
    return;
  }
  if (hash.startsWith('profile/')) {
    const username = hash.split('/')[1];
    app.innerHTML = renderProfilePage(username);
    return;
  }
  if (hash.startsWith('following/')) {
    const username = hash.split('/')[1];
    app.innerHTML = renderFollowListPage(username, 'following');
    return;
  }
  if (hash.startsWith('followers/')) {
    const username = hash.split('/')[1];
    app.innerHTML = renderFollowListPage(username, 'followers');
    return;
  }
  navigate('login');
}

// ─── Helpers ────────────────────────────────────────────────
function formatTime(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return '今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`;
  return date.toLocaleDateString('ja-JP');
}
function formatDateTime(date) {
  return date.toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ─── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden', 'fade-out');
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, 2000);
}

// ─── Lightbox ───────────────────────────────────────────────
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  lb.classList.remove('hidden');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}

// ─── Image Grid HTML ─────────────────────────────────────────
function renderImageGrid(images) {
  if (!images || images.length === 0) return '';
  const count = images.length;
  const items = images.map(src =>
    `<div class="img-item"><img src="${escHtml(src)}" alt="" loading="lazy" onclick="event.stopPropagation();openLightbox('${escHtml(src)}')"></div>`
  ).join('');
  return `<div class="image-grid count-${count}">${items}</div>`;
}

// ─── Post Card HTML ──────────────────────────────────────────
function renderPostCard(post) {
  const author = getUserById(post.userId);
  if (!author) return '';
  const liked = (likes[post.id] || []).includes(currentUser.id);
  const likeCount = (likes[post.id] || []).length;
  const commentCount = (comments[post.id] || []).length;
  const isOwn = post.userId === currentUser.id;
  const contentHtml = escHtml(post.content).replace(/\n/g, '<br>');

  return `
<div class="post-card" onclick="navigate('post/${post.id}')" id="post-card-${post.id}">
  ${renderAvatar(author, 'sm', `event.stopPropagation();navigate('profile/${author.username}')`)}
  <div class="post-card-body">
    <div class="post-card-header">
      <span class="post-author-name" onclick="event.stopPropagation();navigate('profile/${author.username}')">${escHtml(author.displayName)}</span>
      <span class="post-author-username">@${escHtml(author.username)}</span>
      <span class="post-time dot-separator">${formatTime(post.createdAt)}</span>
      ${isOwn ? `
      <div style="position:relative" onclick="event.stopPropagation()">
        <button class="post-menu-btn" onclick="togglePostMenu(${post.id})">···</button>
        <div class="post-ctx-menu" id="post-menu-${post.id}">
          <div class="ctx-item" onclick="openEditPost(${post.id})">編集</div>
          <div class="ctx-item danger" onclick="openDeletePost(${post.id})">削除</div>
        </div>
      </div>` : ''}
    </div>
    <div class="post-content">${contentHtml}</div>
    ${renderImageGrid(post.images)}
    <div class="post-actions" onclick="event.stopPropagation()">
      <button class="action-btn ${liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
        <span class="heart-icon">${liked ? '♥' : '♡'}</span>
        <span id="like-count-${post.id}">${likeCount}</span>
      </button>
      <button class="action-btn" onclick="navigate('post/${post.id}')">
        💬 <span>${commentCount}</span>
      </button>
    </div>
  </div>
</div>`;
}

// ─── LOGIN PAGE ──────────────────────────────────────────────
function renderLoginPage() {
  return `
<div class="page-wrapper auth-page">
  <div class="auth-logo">RAISETIMELINE</div>
  <div class="auth-subtitle">学習用SNSアプリのプロトタイプ</div>
  <div class="auth-form">
    <h2>ログイン</h2>
    <div id="login-error" class="error-msg"></div>
    <div class="form-group">
      <label>メールアドレス</label>
      <input type="email" id="login-email" placeholder="you@example.com" value="alice@example.com">
    </div>
    <div class="form-group">
      <label>パスワード</label>
      <input type="password" id="login-password" placeholder="8文字以上" value="password">
    </div>
    <button class="btn-primary" onclick="doLogin()">ログイン</button>
    <div class="auth-link">アカウントをお持ちでない方は <span onclick="navigate('register')">新規登録はこちら</span></div>
  </div>
</div>`;
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.remove('visible');

  if (!email || !password) {
    errEl.textContent = 'メールアドレスとパスワードを入力してください。';
    errEl.classList.add('visible');
    return;
  }
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) {
    errEl.textContent = 'メールアドレスまたはパスワードが正しくありません。';
    errEl.classList.add('visible');
    return;
  }
  currentUser = user;
  navigate('timeline');
}

// ─── REGISTER PAGE ───────────────────────────────────────────
function renderRegisterPage() {
  return `
<div class="page-wrapper auth-page">
  <div class="auth-logo">RAISETIMELINE</div>
  <div class="auth-subtitle">学習用SNSアプリのプロトタイプ</div>
  <div class="auth-form">
    <h2>アカウント作成</h2>
    <div id="reg-error" class="error-msg"></div>
    <div class="form-group">
      <label>ユーザー名</label>
      <input type="text" id="reg-username" placeholder="alice_01">
      <div class="form-hint">3〜20文字、英数字とアンダースコアのみ</div>
    </div>
    <div class="form-group">
      <label>表示名</label>
      <input type="text" id="reg-displayname" placeholder="Alice Yamamoto">
      <div class="form-hint">1〜50文字</div>
    </div>
    <div class="form-group">
      <label>メールアドレス</label>
      <input type="email" id="reg-email" placeholder="you@example.com">
    </div>
    <div class="form-group">
      <label>パスワード</label>
      <input type="password" id="reg-password" placeholder="8文字以上">
    </div>
    <div class="form-group">
      <label>パスワード（確認）</label>
      <input type="password" id="reg-password-confirm" placeholder="もう一度入力してください">
    </div>
    <button class="btn-dark" onclick="doRegister()">登録する</button>
    <div class="auth-link">すでにアカウントをお持ちの方は <span onclick="navigate('login')">ログインはこちら</span></div>
  </div>
</div>`;
}

function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const displayName = document.getElementById('reg-displayname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const passwordConfirm = document.getElementById('reg-password-confirm').value;
  const errEl = document.getElementById('reg-error');
  errEl.classList.remove('visible');

  if (!username || !displayName || !email || !password || !passwordConfirm) {
    errEl.textContent = 'すべての項目を入力してください。';
    errEl.classList.add('visible');
    return;
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    errEl.textContent = 'ユーザー名は3〜20文字の英数字とアンダースコアのみ使えます。';
    errEl.classList.add('visible');
    return;
  }
  if (displayName.length > 50) {
    errEl.textContent = '表示名は50文字以内にしてください。';
    errEl.classList.add('visible');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = '正しいメールアドレスを入力してください。';
    errEl.classList.add('visible');
    return;
  }
  if (password.length < 8) {
    errEl.textContent = 'パスワードは8文字以上にしてください。';
    errEl.classList.add('visible');
    return;
  }
  if (password !== passwordConfirm) {
    errEl.textContent = 'パスワードが一致しません。もう一度確認してください。';
    errEl.classList.add('visible');
    return;
  }
  if (users.find(u => u.username === username)) {
    errEl.textContent = 'このユーザー名は既に使われています。';
    errEl.classList.add('visible');
    return;
  }
  if (users.find(u => u.email === email)) {
    errEl.textContent = 'このメールアドレスは既に登録されています。';
    errEl.classList.add('visible');
    return;
  }
  const newUser = {
    id: users.length + 1,
    username,
    displayName,
    email,
    password,
    bio: '',
    followingCount: 0,
    followerCount: 0,
  };
  users.push(newUser);
  currentUser = newUser;
  navigate('timeline');
}

// ─── TIMELINE PAGE ───────────────────────────────────────────
let timelineTab = 'all';
let timelinePage = 1;
const PAGE_SIZE = 20;

function renderTimelinePage() {
  timelinePage = 1;
  const allPosts = getTimelinePosts(timelineTab);
  const shown = allPosts.slice(0, PAGE_SIZE);
  const hasMore = allPosts.length > PAGE_SIZE;

  return `
<div class="page-wrapper" id="timeline-page">
  ${renderNavbar()}
  <div class="tabs">
    <div class="tab ${timelineTab === 'all' ? 'active' : ''}" onclick="switchTab('all')">全体</div>
    <div class="tab ${timelineTab === 'following' ? 'active' : ''}" onclick="switchTab('following')">フォロー中</div>
  </div>
  <div id="timeline-posts">
    ${shown.map(renderPostCard).join('') || '<div class="empty-state"><div class="empty-icon">📭</div><h3>投稿がありません</h3><p>フォローしているユーザーの投稿がここに表示されます</p></div>'}
  </div>
  ${hasMore ? `<button class="load-more-btn" id="load-more-btn" onclick="loadMorePosts()">もっと見る</button>` : ''}
  <button class="fab" onclick="openPostModal()" title="投稿する">＋</button>
</div>`;
}

function getTimelinePosts(tab) {
  const sorted = [...posts].sort((a, b) => b.createdAt - a.createdAt);
  if (tab === 'all') return sorted;
  const followingIds = [...getFollows(currentUser.id)];
  return sorted.filter(p => followingIds.includes(p.userId) || p.userId === currentUser.id);
}

function switchTab(tab) {
  timelineTab = tab;
  timelinePage = 1;
  document.getElementById('app').innerHTML = renderTimelinePage();
}

function loadMorePosts() {
  timelinePage++;
  const allPosts = getTimelinePosts(timelineTab);
  const start = (timelinePage - 1) * PAGE_SIZE;
  const more = allPosts.slice(start, start + PAGE_SIZE);
  const container = document.getElementById('timeline-posts');
  container.insertAdjacentHTML('beforeend', more.map(renderPostCard).join(''));
  if (start + PAGE_SIZE >= allPosts.length) {
    const btn = document.getElementById('load-more-btn');
    if (btn) btn.remove();
  }
}

// ─── NAVBAR ──────────────────────────────────────────────────
function renderNavbar() {
  return `
<nav class="navbar">
  <div class="navbar-logo" onclick="navigate('timeline')">RT</div>
  <div class="navbar-search">
    <span class="search-icon">🔍</span>
    <input type="text" placeholder="ユーザーを検索..." onclick="navigate('search')" readonly>
  </div>
  <div class="navbar-user">
    <div onclick="toggleDropdown()" style="cursor:pointer">
      ${renderAvatar(currentUser, 'sm', 'event.stopPropagation();toggleDropdown()')}
    </div>
    <div class="dropdown-menu" id="main-dropdown">
      <div class="dropdown-user-info">
        <div class="name">${escHtml(currentUser.displayName)}</div>
        <div class="username">@${escHtml(currentUser.username)}</div>
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item" onclick="navigate('profile/${currentUser.username}')">👤 プロフィール</div>
      <div class="dropdown-item" onclick="navigate('search')">🔍 ユーザー検索</div>
      <div class="dropdown-item" onclick="openEditProfileModal()">✏️ プロフィール編集</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item danger" onclick="doLogout()">🚪 ログアウト</div>
    </div>
  </div>
</nav>`;
}

function toggleDropdown() {
  const menu = document.getElementById('main-dropdown');
  if (menu) menu.classList.toggle('open');
}

function doLogout() {
  currentUser = null;
  navigate('login');
}

// ─── POST MODAL ──────────────────────────────────────────────
let pendingImages = [];

function openPostModal(editPostId = null) {
  closeAllMenus();
  pendingImages = [];
  const editPost = editPostId ? posts.find(p => p.id === editPostId) : null;
  const title = editPost ? '投稿を編集' : '新規投稿';
  const btnLabel = editPost ? '更新' : '投稿';
  const initialText = editPost ? editPost.content : '';
  if (editPost) pendingImages = [...(editPost.images || [])];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'post-modal-overlay';
  overlay.innerHTML = `
<div class="modal" onclick="event.stopPropagation()">
  <div class="modal-header">
    <h3>${title}</h3>
    <button class="modal-close" onclick="closePostModal()">✕</button>
  </div>
  <div class="modal-body">
    <div class="post-compose">
      ${renderAvatar(currentUser, 'sm', 'void(0)')}
      <div class="post-compose-main">
        <textarea class="compose-textarea" id="compose-text" placeholder="いまどうしてる？" maxlength="280" oninput="updateComposeState()">${escHtml(initialText)}</textarea>
        <div id="image-preview-grid" class="image-preview-grid"></div>
        <div class="compose-footer">
          <label class="btn-image-add" title="画像を追加">
            📷
            <input type="file" accept="image/*" multiple style="display:none" onchange="addImages(this)">
          </label>
          <span class="compose-counter" id="compose-counter">${initialText.length} / 280</span>
          <button class="btn-post" id="compose-submit-btn" onclick="submitPost(${editPostId || 'null'})">${btnLabel}</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
  overlay.addEventListener('click', closePostModal);
  document.body.appendChild(overlay);
  renderImagePreviews();
  updateComposeState();
  document.getElementById('compose-text').focus();
}

function closePostModal() {
  const el = document.getElementById('post-modal-overlay');
  if (el) el.remove();
  pendingImages = [];
}

function updateComposeState() {
  const text = document.getElementById('compose-text')?.value || '';
  const counter = document.getElementById('compose-counter');
  const btn = document.getElementById('compose-submit-btn');
  const len = text.length;
  if (counter) {
    counter.textContent = `${len} / 280`;
    counter.className = 'compose-counter' + (len > 260 ? ' warning' : '') + (len > 280 ? ' error' : '');
  }
  if (btn) btn.disabled = len === 0 && pendingImages.length === 0;
}

function addImages(input) {
  const files = Array.from(input.files);
  const remaining = 4 - pendingImages.length;
  if (files.length > remaining) { showToast(`最大4枚まで追加できます`); }
  const toAdd = files.slice(0, remaining);
  toAdd.forEach(file => {
    const url = URL.createObjectURL(file);
    pendingImages.push(url);
  });
  renderImagePreviews();
  updateComposeState();
  input.value = '';
}

function removeImage(idx) {
  pendingImages.splice(idx, 1);
  renderImagePreviews();
  updateComposeState();
}

function renderImagePreviews() {
  const grid = document.getElementById('image-preview-grid');
  if (!grid) return;
  grid.innerHTML = pendingImages.map((src, i) =>
    `<div class="img-preview-item">
      <img src="${escHtml(src)}" alt="">
      <span class="img-preview-remove" onclick="removeImage(${i})">✕</span>
    </div>`
  ).join('');
}

function submitPost(editPostId) {
  const text = document.getElementById('compose-text').value.trim();
  if (!text && pendingImages.length === 0) return;

  if (editPostId) {
    const post = posts.find(p => p.id === editPostId);
    if (post) {
      post.content = text;
      post.images = [...pendingImages];
    }
    closePostModal();
    showToast('投稿を更新しました');
    const page = window.location.hash.replace('#', '');
    if (page === 'timeline') document.getElementById('app').innerHTML = renderTimelinePage();
    else router();
  } else {
    const newPost = {
      id: nextPostId++,
      userId: currentUser.id,
      content: text,
      images: [...pendingImages],
      createdAt: new Date(),
    };
    likes[newPost.id] = [];
    comments[newPost.id] = [];
    posts.unshift(newPost);
    closePostModal();
    showToast('投稿しました');
    document.getElementById('app').innerHTML = renderTimelinePage();
  }
}

// ─── POST CONTEXT MENU ───────────────────────────────────────
function togglePostMenu(postId) {
  const menu = document.getElementById(`post-menu-${postId}`);
  if (!menu) return;
  const wasOpen = menu.classList.contains('open');
  closeAllMenus();
  if (!wasOpen) menu.classList.add('open');
}

function openEditPost(postId) {
  closeAllMenus();
  openPostModal(postId);
}

function openDeletePost(postId) {
  closeAllMenus();
  openConfirmModal(
    '投稿を削除しますか？',
    'この操作は元に戻せません。',
    () => {
      posts = posts.filter(p => p.id !== postId);
      delete likes[postId];
      delete comments[postId];
      showToast('投稿を削除しました');
      const page = window.location.hash.replace('#', '');
      if (page === `post/${postId}`) navigate('timeline');
      else { document.getElementById('app').innerHTML = renderTimelinePage(); }
    }
  );
}

// ─── LIKE ────────────────────────────────────────────────────
function toggleLike(postId) {
  if (!likes[postId]) likes[postId] = [];
  const idx = likes[postId].indexOf(currentUser.id);
  if (idx === -1) {
    likes[postId].push(currentUser.id);
  } else {
    likes[postId].splice(idx, 1);
  }
  const liked = idx === -1;
  const countEl = document.getElementById(`like-count-${postId}`);
  if (countEl) countEl.textContent = likes[postId].length;
  const btn = countEl?.parentElement;
  if (btn) {
    btn.className = `action-btn ${liked ? 'liked' : ''}`;
    const icon = btn.querySelector('.heart-icon');
    if (icon) { icon.textContent = liked ? '♥' : '♡'; }
  }
  // Update detail page if open
  const detailLikeBtn = document.getElementById(`detail-like-btn`);
  if (detailLikeBtn) {
    detailLikeBtn.className = `action-btn ${liked ? 'liked' : ''}`;
    detailLikeBtn.querySelector('.heart-icon').textContent = liked ? '♥' : '♡';
    detailLikeBtn.querySelector('span:last-child').textContent = likes[postId].length;
  }
}

// ─── POST DETAIL PAGE ────────────────────────────────────────
function renderPostDetailPage(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return `<div class="page-wrapper">${renderBackHeader('投稿')}<div class="empty-state"><p>投稿が見つかりません</p></div></div>`;
  const author = getUserById(post.userId);
  const liked = (likes[postId] || []).includes(currentUser.id);
  const likeCount = (likes[postId] || []).length;
  const postComments = (comments[postId] || []).sort((a, b) => a.createdAt - b.createdAt);
  const isOwn = post.userId === currentUser.id;
  const contentHtml = escHtml(post.content).replace(/\n/g, '<br>');

  return `
<div class="page-wrapper">
  ${renderBackHeader('投稿')}
  <div class="post-detail-card">
    <div class="post-detail-header">
      ${renderAvatar(author, 'md')}
      <div style="flex:1">
        <div class="post-author-name" onclick="navigate('profile/${author.username}')" style="cursor:pointer">${escHtml(author.displayName)}</div>
        <div class="post-author-username">@${escHtml(author.username)}</div>
      </div>
      ${isOwn ? `
      <div style="position:relative">
        <button class="post-menu-btn" onclick="togglePostMenu(${post.id})">···</button>
        <div class="post-ctx-menu" id="post-menu-${post.id}">
          <div class="ctx-item" onclick="openEditPost(${post.id})">編集</div>
          <div class="ctx-item danger" onclick="openDeletePost(${post.id})">削除</div>
        </div>
      </div>` : ''}
    </div>
    <div class="post-detail-content">${contentHtml}</div>
    ${renderImageGrid(post.images)}
    <div class="post-detail-meta">${formatDateTime(post.createdAt)}</div>
    <div class="post-detail-actions">
      <button class="action-btn ${liked ? 'liked' : ''}" id="detail-like-btn" onclick="toggleLike(${postId})">
        <span class="heart-icon">${liked ? '♥' : '♡'}</span>
        <span>${likeCount}</span>
      </button>
      <button class="action-btn">💬 <span>${postComments.length}</span></button>
    </div>
  </div>
  <div class="comments-section">
    <div class="comments-header">コメント（${postComments.length}）</div>
    <div class="comment-form">
      ${renderAvatar(currentUser, 'sm', 'void(0)')}
      <div class="comment-form-main">
        <textarea class="comment-textarea" id="comment-input" placeholder="コメントを追加..." maxlength="280"></textarea>
        <div class="comment-form-footer">
          <button class="btn-post" onclick="submitComment(${postId})">コメント</button>
        </div>
      </div>
    </div>
    <div id="comments-list">
      ${postComments.map(c => renderCommentCard(c, postId)).join('')}
    </div>
  </div>
</div>`;
}

function renderCommentCard(comment, postId) {
  const author = getUserById(comment.userId);
  if (!author) return '';
  const isOwn = comment.userId === currentUser.id;
  return `
<div class="comment-card" id="comment-${comment.id}">
  ${renderAvatar(author, 'sm')}
  <div class="comment-body">
    <div class="comment-header">
      <span class="post-author-name" style="cursor:pointer" onclick="navigate('profile/${author.username}')">${escHtml(author.displayName)}</span>
      <span class="post-author-username">@${escHtml(author.username)}</span>
      <span class="text-secondary dot-separator" style="font-size:13px">${formatTime(comment.createdAt)}</span>
      ${isOwn ? `<button class="comment-delete-btn" onclick="deleteComment(${postId},${comment.id})">削除</button>` : ''}
    </div>
    <div class="comment-content">${escHtml(comment.content)}</div>
  </div>
</div>`;
}

function submitComment(postId) {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;
  const newComment = {
    id: nextCommentId++,
    postId,
    userId: currentUser.id,
    content: text,
    createdAt: new Date(),
  };
  if (!comments[postId]) comments[postId] = [];
  comments[postId].push(newComment);
  input.value = '';
  const list = document.getElementById('comments-list');
  list.insertAdjacentHTML('beforeend', renderCommentCard(newComment, postId));
  const header = document.querySelector('.comments-header');
  if (header) header.textContent = `コメント（${comments[postId].length}）`;
  const detailAction = document.querySelector('.post-detail-actions .action-btn:last-child span');
  if (detailAction) detailAction.textContent = comments[postId].length;
  showToast('コメントしました');
}

function deleteComment(postId, commentId) {
  comments[postId] = (comments[postId] || []).filter(c => c.id !== commentId);
  const el = document.getElementById(`comment-${commentId}`);
  if (el) el.remove();
  const header = document.querySelector('.comments-header');
  if (header) header.textContent = `コメント（${comments[postId].length}）`;
  showToast('コメントを削除しました');
}

// ─── PROFILE PAGE ────────────────────────────────────────────
function renderProfilePage(username) {
  const user = getUserByUsername(username);
  if (!user) return `<div class="page-wrapper">${renderBackHeader('@' + username)}<div class="empty-state"><p>ユーザーが見つかりません</p></div></div>`;
  const isMe = user.id === currentUser.id;
  const following = !isMe && isFollowing(currentUser.id, user.id);
  const userPosts = posts.filter(p => p.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);

  return `
<div class="page-wrapper">
  ${renderBackHeader('@' + user.username)}
  <div class="profile-cover"></div>
  <div class="profile-info">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div class="profile-avatar-wrap">
        <div class="avatar avatar-lg" style="background:${avatarColor(user.username)}">
          ${user.avatarUrl ? `<img src="${escHtml(user.avatarUrl)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : avatarInitial(user)}
        </div>
      </div>
      <div class="profile-actions" style="margin-top:12px">
        ${isMe
          ? `<button class="btn-edit-profile" onclick="openEditProfileModal()">プロフィール編集</button>`
          : `<button class="${following ? 'btn-following' : 'btn-follow'}" id="follow-btn-${user.username}" onclick="toggleFollow('${user.username}')">${following ? 'フォロー中' : 'フォローする'}</button>`
        }
      </div>
    </div>
    <div class="profile-name">${escHtml(user.displayName)}</div>
    <div class="profile-username">@${escHtml(user.username)}</div>
    ${user.bio ? `<div class="profile-bio">${escHtml(user.bio)}</div>` : ''}
    <div class="profile-stats">
      <span class="stat-link" onclick="navigate('following/${user.username}')"><strong>${user.followingCount}</strong> <span>フォロー中</span></span>
      <span class="stat-link" onclick="navigate('followers/${user.username}')"><strong>${user.followerCount}</strong> <span>フォロワー</span></span>
    </div>
  </div>
  <div id="profile-posts">
    ${userPosts.map(renderPostCard).join('') || '<div class="empty-state"><div class="empty-icon">📝</div><h3>投稿がありません</h3></div>'}
  </div>
</div>`;
}

function toggleFollow(username) {
  const user = getUserByUsername(username);
  if (!user || user.id === currentUser.id) return;
  if (isFollowing(currentUser.id, user.id)) {
    unfollowUser(currentUser.id, user.id);
    showToast(`@${username} のフォローを解除しました`);
  } else {
    followUser(currentUser.id, user.id);
    showToast(`@${username} をフォローしました`);
  }
  const btn = document.getElementById(`follow-btn-${username}`);
  if (btn) {
    const nowFollowing = isFollowing(currentUser.id, user.id);
    btn.className = nowFollowing ? 'btn-following' : 'btn-follow';
    btn.textContent = nowFollowing ? 'フォロー中' : 'フォローする';
  }
  // update stats
  const stats = document.querySelectorAll('.stat-link strong');
  if (stats.length >= 2) {
    stats[0].textContent = user.followingCount;
    stats[1].textContent = user.followerCount;
  }
}

// ─── EDIT PROFILE MODAL ──────────────────────────────────────
function openEditProfileModal() {
  closeAllMenus();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'edit-profile-overlay';
  overlay.innerHTML = `
<div class="modal" onclick="event.stopPropagation()">
  <div class="modal-header">
    <h3>プロフィール編集</h3>
    <button class="modal-close" onclick="closeEditProfileModal()">✕</button>
  </div>
  <div class="modal-body">
    <div class="edit-profile-form">
      <div id="edit-profile-error" class="error-msg"></div>
      <div class="form-group" style="align-items:center">
        <label>アイコン画像</label>
        <div style="display:flex;align-items:center;gap:16px">
          <div class="avatar avatar-lg" id="avatar-preview" style="background:${avatarColor(currentUser.username)}">
            ${currentUser.avatarUrl ? `<img src="${escHtml(currentUser.avatarUrl)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : avatarInitial(currentUser)}
          </div>
          <label class="btn-edit-profile" style="cursor:pointer">
            画像を選択
            <input type="file" accept="image/jpeg,image/png" style="display:none" onchange="previewAvatarImage(this)">
          </label>
          ${currentUser.avatarUrl ? `<button class="btn-cancel" style="font-size:13px;padding:6px 12px" onclick="removeAvatarImage()">削除</button>` : ''}
        </div>
        <div class="form-hint">JPEG / PNG、最大5MB</div>
      </div>
      <div class="form-group">
        <label>表示名</label>
        <input type="text" id="edit-displayname" value="${escHtml(currentUser.displayName)}" maxlength="50">
      </div>
      <div class="form-group">
        <label>自己紹介</label>
        <textarea id="edit-bio" maxlength="160" placeholder="自己紹介（160文字以内）">${escHtml(currentUser.bio || '')}</textarea>
        <div class="form-hint">最大160文字</div>
      </div>
      <button class="btn-primary" onclick="saveEditProfile()">保存</button>
    </div>
  </div>
</div>`;
  overlay.addEventListener('click', closeEditProfileModal);
  document.body.appendChild(overlay);
}

function closeEditProfileModal() {
  const el = document.getElementById('edit-profile-overlay');
  if (el) el.remove();
}

let pendingAvatarUrl = undefined; // undefined = 変更なし, null = 削除, string = 新URL

function previewAvatarImage(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('画像は5MB以下にしてください');
    input.value = '';
    return;
  }
  pendingAvatarUrl = URL.createObjectURL(file);
  const preview = document.getElementById('avatar-preview');
  if (preview) {
    preview.innerHTML = `<img src="${escHtml(pendingAvatarUrl)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  }
  input.value = '';
}

function removeAvatarImage() {
  pendingAvatarUrl = null;
  const preview = document.getElementById('avatar-preview');
  if (preview) {
    preview.innerHTML = avatarInitial(currentUser);
  }
}

function saveEditProfile() {
  const displayName = document.getElementById('edit-displayname').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const errEl = document.getElementById('edit-profile-error');

  if (!displayName) {
    errEl.textContent = '表示名を入力してください。';
    errEl.classList.add('visible');
    return;
  }
  if (displayName.length > 50) {
    errEl.textContent = '表示名は50文字以内にしてください。';
    errEl.classList.add('visible');
    return;
  }
  currentUser.displayName = displayName;
  currentUser.bio = bio;
  if (pendingAvatarUrl !== undefined) {
    currentUser.avatarUrl = pendingAvatarUrl || undefined;
  }
  pendingAvatarUrl = undefined;
  closeEditProfileModal();
  showToast('プロフィールを更新しました');
  router();
}

// ─── SEARCH PAGE ─────────────────────────────────────────────
function renderSearchPage() {
  return `
<div class="page-wrapper">
  ${renderBackHeader('ユーザーを検索')}
  <div class="search-bar">
    <div class="search-input-wrap">
      <span class="icon">🔍</span>
      <input type="text" id="search-input" placeholder="ユーザー名または表示名で検索..." oninput="onSearchInput(this.value)" autofocus>
    </div>
  </div>
  <div id="search-results"></div>
</div>`;
}

const doSearch = debounce((query) => {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;
  if (!query) { resultsEl.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const results = users.filter(u =>
    u.id !== currentUser.id &&
    (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
  );
  if (results.length === 0) {
    resultsEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>ユーザーが見つかりません</h3><p>別のキーワードで検索してみてください</p></div>`;
    return;
  }
  resultsEl.innerHTML = results.map(u => renderUserCard(u, true)).join('');
}, 300);

function onSearchInput(value) { doSearch(value.trim()); }

function renderUserCard(user, showFollowBtn = true) {
  const following = isFollowing(currentUser.id, user.id);
  return `
<div class="user-card" onclick="navigate('profile/${user.username}')">
  ${renderAvatar(user, 'md', `event.stopPropagation();navigate('profile/${user.username}')`)}
  <div class="user-card-info">
    <div class="user-card-name">${escHtml(user.displayName)}</div>
    <div class="user-card-username">@${escHtml(user.username)}</div>
  </div>
  ${showFollowBtn ? `
  <button class="${following ? 'btn-following' : 'btn-follow'}" id="follow-btn-${user.username}" onclick="event.stopPropagation();toggleFollowCard('${user.username}')" style="flex-shrink:0">
    ${following ? 'フォロー中' : 'フォローする'}
  </button>` : ''}
</div>`;
}

function toggleFollowCard(username) {
  const user = getUserByUsername(username);
  if (!user) return;
  if (isFollowing(currentUser.id, user.id)) {
    unfollowUser(currentUser.id, user.id);
    showToast(`@${username} のフォローを解除しました`);
  } else {
    followUser(currentUser.id, user.id);
    showToast(`@${username} をフォローしました`);
  }
  const btn = document.getElementById(`follow-btn-${username}`);
  if (btn) {
    const nowFollowing = isFollowing(currentUser.id, user.id);
    btn.className = nowFollowing ? 'btn-following' : 'btn-follow';
    btn.textContent = nowFollowing ? 'フォロー中' : 'フォローする';
  }
}

// ─── FOLLOW LIST PAGES ───────────────────────────────────────
function renderFollowListPage(username, type) {
  const user = getUserByUsername(username);
  if (!user) return `<div class="page-wrapper">${renderBackHeader(type === 'following' ? 'フォロー中' : 'フォロワー')}<div class="empty-state"><p>ユーザーが見つかりません</p></div></div>`;

  let listUsers = [];
  if (type === 'following') {
    const ids = [...getFollows(user.id)];
    listUsers = ids.map(id => getUserById(id)).filter(Boolean);
  } else {
    listUsers = users.filter(u => isFollowing(u.id, user.id));
  }

  const title = type === 'following' ? 'フォロー中' : 'フォロワー';
  return `
<div class="page-wrapper">
  ${renderBackHeader(title)}
  <div id="follow-list">
    ${listUsers.length === 0
      ? `<div class="empty-state"><div class="empty-icon">👥</div><h3>${type === 'following' ? 'フォロー中のユーザーはいません' : 'フォロワーはいません'}</h3></div>`
      : listUsers.map(u => renderUserCard(u, u.id !== currentUser.id)).join('')
    }
  </div>
</div>`;
}

// ─── BACK HEADER ─────────────────────────────────────────────
function renderBackHeader(title) {
  return `
<div class="back-header">
  <button class="back-btn" onclick="history.back()">←</button>
  <h2>${escHtml(title)}</h2>
</div>`;
}

// ─── CONFIRM MODAL ───────────────────────────────────────────
function openConfirmModal(title, desc, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'confirm-modal-overlay';
  overlay.innerHTML = `
<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">
  <div class="modal-header">
    <h3>${escHtml(title)}</h3>
    <button class="modal-close" onclick="closeConfirmModal()">✕</button>
  </div>
  <div class="modal-body">
    <div class="confirm-dialog">
      <p>${escHtml(desc)}</p>
      <div class="confirm-dialog-actions">
        <button class="btn-cancel" onclick="closeConfirmModal()">キャンセル</button>
        <button class="btn-danger" id="confirm-ok-btn">削除する</button>
      </div>
    </div>
  </div>
</div>`;
  overlay.addEventListener('click', closeConfirmModal);
  document.body.appendChild(overlay);
  document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    closeConfirmModal();
    onConfirm();
  });
}

function closeConfirmModal() {
  const el = document.getElementById('confirm-modal-overlay');
  if (el) el.remove();
}

// ─── Close all menus on outside click ───────────────────────
function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu.open, .post-ctx-menu.open')
    .forEach(el => el.classList.remove('open'));
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar-user') && !e.target.closest('.post-menu-btn')) {
    closeAllMenus();
  }
});

// ─── Bootstrap ───────────────────────────────────────────────
if (!window.location.hash || window.location.hash === '#') {
  window.location.hash = 'login';
} else {
  router();
}
