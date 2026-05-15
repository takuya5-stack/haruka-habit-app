# Haruka習慣アプリ

毎日の勉強を記録し、21:00にLINEでリマインダーを送る習慣トラッカーアプリです。

## 機能

| タブ | 内容 |
|------|------|
| 📅 カレンダー | 月別カレンダーで学習日（⭐）を確認、科目別集計 |
| ✏️ きょう | 「今日やったよ！」で勉強を記録、ひとことメモ |
| 📚 ワーク | 科目・ワーク名の追加・削除 |
| 📊 きろく | バッジ・累計実績・科目別進捗グラフ |

毎日 **21:00 JST** に未記録の場合、LINEにリマインダーが届きます。

---

## セットアップ

### 1. Supabase データベースを作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. **Project Settings → Database → Connection string** から以下を取得：
   - `DATABASE_URL`（Transaction pooler / Port 6543）
   - `DIRECT_URL`（Session pooler / Port 5432）

### 2. LINE Messaging API を設定

1. [LINE Developers](https://developers.line.biz/) でチャネルを作成
2. **Messaging API** タブから **Channel access token** を発行
3. **Basic information** から **Your user ID** をコピー

### 3. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各値を入力してください。

### 4. ローカルで起動

```bash
npm install
npm run db:push    # DBにテーブルを作成
npm run dev
```

http://localhost:3000 で確認できます。

---

## Vercel へのデプロイ

### 1. GitHub にプッシュ

```bash
git init
git add .
git commit -m "initial commit"
gh repo create haruka-habit-app --public --source=. --push
```

### 2. Vercel で新規プロジェクトを作成

1. [vercel.com](https://vercel.com) → **New Project** → GitHubリポジトリを選択
2. **Environment Variables** に `.env.example` の各変数を入力
3. **Deploy**

### 3. Cron の動作確認

Vercel ダッシュボード → **Settings → Cron Jobs** で
`0 12 * * *`（= 毎日 21:00 JST）が登録されていることを確認。

> **注意**: Vercel Cron は Hobby プランでは 1日1回まで無料で使えます。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フロントエンド | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| バックエンド | Next.js API Routes |
| データベース | Supabase (PostgreSQL) + Prisma ORM |
| 通知 | LINE Messaging API |
| スケジューラー | Vercel Cron Jobs |
| デプロイ | Vercel |
