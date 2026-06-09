# アーキテクチャ概要

## 概要

ポモドーロタイマーは、Flask ベースのシンプルな Web アプリケーションです。サーバーサイドは静的ファイルの配信のみを担い、タイマーロジック全体はクライアントサイドの JavaScript で実装されています。

## 技術スタック

| 層 | 技術 |
|---|---|
| サーバー | Python / Flask 3.x |
| フロントエンド | Vanilla JavaScript (ES Modules) |
| スタイル | CSS カスタムプロパティ |
| フォント | Noto Sans JP (Google Fonts) |

## サーバーサイド

`app.py` は Flask アプリケーションのエントリーポイントです。ルートは1つのみです。

```
GET /  →  templates/index.html を返す
```

データベース、API エンドポイント、セッション管理は存在しません。

## クライアントサイド層構造

JavaScript は **ドメイン駆動設計** に基づく4層構造で実装されています。

```
presentation/        ← UI層（DOM操作・イベント処理）
  ├── renderer.js    ← 状態を DOM に反映
  └── events.js      ← ボタンクリックを検知してコントローラへ委譲

application/
  └── timer-controller.js  ← タイマー制御・状態管理

domain/
  └── timer-state.js       ← 状態遷移ロジック（純粋関数）

infrastructure/
  └── clock.js             ← 時刻取得の抽象化（テスト容易性）
```

### 依存関係の方向

```
presentation → application → domain
                           → infrastructure
```

上位層が下位層に依存し、逆方向の依存は存在しません。

## 状態管理

タイマーの状態は `TimerController` が保持し、変更時にリスナー（`Renderer`）へ通知します（Observer パターン）。

状態遷移は `timer-state.js` の純粋関数として定義されており、副作用を持ちません。

## 時刻ベースカウントダウン

タイマーは `setInterval` による定期ポーリングではなく、**時刻差分** でカウントダウンを計算します。

- `endAt`（終了予定時刻）を記録し、`endAt - now` で残り時間を算出
- 一時停止時は `pausedAt` を記録し、再開時に `endAt` を延長
- これによりブラウザのタブ非表示時のドリフトを防止
