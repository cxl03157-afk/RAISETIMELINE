# 開発ワークフロールール

## 作業開始前の必須手順

1. **Issue を作成する**（GitHub Issues）
   - 機能追加・バグ修正・リファクタリングを問わず、すべての作業に Issue が必要
   - Issue には「目的」「完了条件」を記載する

2. **ブランチを作成する**
   - main ブランチから作業ブランチを切る
   - 命名規則：

     | 種別 | パターン |
     |------|---------|
     | 機能追加 | `feature/issue-{番号}-{内容}` |
     | バグ修正 | `fix/issue-{番号}-{内容}` |
     | ドキュメント | `docs/issue-{番号}-{内容}` |
     | リファクタリング | `refactor/issue-{番号}-{内容}` |

## コミットメッセージ規則（Conventional Commits）

```
<type>: <概要>
```

type: `feat` / `fix` / `docs` / `refactor` / `test` / `chore`

## main ブランチへの直接プッシュ禁止

- **main に直接 push しない**（ブランチ保護で強制）
- 作業完了後は PR を作成して main にマージする
- PR 本文には必ず `Closes #イシュー番号` を記載する

## Claude Code がこのルールを適用するタイミング

- 新しい機能・修正の実装を依頼されたとき → Issue 作成を提案する
- コミット・プッシュを依頼されたとき → 作業ブランチ上にいるか確認する
- PR 作成を依頼されたとき → Issue 番号を PR に紐付ける

---

## インフラ・デプロイ関連ルール

### PR マージ前の確認
- **CI（Backend CI / Frontend CI / E2E Tests）が通ってからマージする**
- インフラ変更（`infra/**`）は `terraform apply` 成功を確認してからマージする
- Dockerfile を変更した場合は必ずローカルで `docker build` を実行してから PR を出す

### ECS デプロイ競合が発生した場合
1. まず状況確認: `aws ecs describe-services --cluster raisetimeline --services raisetimeline-backend`
2. 旧デプロイが残っている場合: `aws ecs update-service --cluster raisetimeline --service raisetimeline-backend --force-new-deployment`
3. それでも解消しない場合: `--deployment-configuration minimumHealthyPercent=0,maximumPercent=200` を追加
4. 復旧後は `terraform apply -target=aws_ecs_service.backend` で設定を元に戻す

### terraform apply の手順
```bash
cd infra/terraform
terraform init -backend-config=backend.hcl
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```
