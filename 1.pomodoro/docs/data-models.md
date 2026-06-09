# データモデル

## 概要

本アプリケーションはデータベースを使用しません。状態はすべてクライアントサイドの JavaScript オブジェクト（メモリ上）で管理されます。ページをリロードすると状態はリセットされます。

## タイマー状態（TimerController）

`TimerController` クラスが保持する内部データです。

```javascript
{
  state: string,             // 現在の状態（後述の STATES を参照）
  focusDurationSeconds: number, // 作業時間（秒）。デフォルト: 1500（25分）
  startedAt: number | null,  // タイマー開始時刻（ミリ秒、UNIX タイムスタンプ）
  endAt: number | null,      // タイマー終了予定時刻（ミリ秒）
  pausedAt: number | null,   // 一時停止時刻（ミリ秒）
  intervalId: number | null, // setInterval の ID
}
```

`getStateData()` メソッドで以下のデバッグ用オブジェクトを取得できます。

```javascript
{
  state: string,
  startedAt: number | null,
  endAt: number | null,
  pausedAt: number | null,
  remainingSeconds: number,
}
```

## 状態定義（STATES）

`domain/timer-state.js` で定義されます。

| 定数 | 値 | 説明 |
|---|---|---|
| `STATES.IDLE` | `'idle'` | 初期状態・リセット後 |
| `STATES.RUNNING_FOCUS` | `'running_focus'` | 作業タイマー実行中 |
| `STATES.PAUSED_FOCUS` | `'paused_focus'` | 一時停止中 |
| `STATES.COMPLETED` | `'completed'` | タイマー完了 |

## アクション定義（ACTIONS）

`domain/timer-state.js` で定義されます。

| 定数 | 値 | 説明 |
|---|---|---|
| `ACTIONS.START` | `'start'` | タイマー開始 |
| `ACTIONS.PAUSE` | `'pause'` | 一時停止 |
| `ACTIONS.RESUME` | `'resume'` | 再開 |
| `ACTIONS.RESET` | `'reset'` | リセット（任意の状態から実行可能） |
| `ACTIONS.COMPLETE` | `'complete'` | タイマー完了（内部から自動発火） |

## 状態遷移テーブル

```
IDLE          --[START]-->   RUNNING_FOCUS
RUNNING_FOCUS --[PAUSE]-->   PAUSED_FOCUS
RUNNING_FOCUS --[COMPLETE]--> COMPLETED
PAUSED_FOCUS  --[RESUME]--> RUNNING_FOCUS
PAUSED_FOCUS  --[RESET]-->  IDLE
COMPLETED     --[RESET]-->  IDLE
（任意の状態） --[RESET]-->  IDLE
```

## モードラベルマッピング

状態に応じて UI に表示されるラベルです。

| 状態 | モードラベル | プライマリボタン | セカンダリボタン |
|---|---|---|---|
| `idle` | 作業中 | 開始 | リセット |
| `running_focus` | 作業中 | 一時停止 | リセット |
| `paused_focus` | 一時停止中 | 再開 | リセット |
| `completed` | 完了 | リセット | （非表示） |
