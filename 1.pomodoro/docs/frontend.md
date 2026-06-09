# フロントエンド ドキュメント

## 概要

フロントエンドは ES Modules 形式の Vanilla JavaScript で実装されています。外部ライブラリへの依存はありません。

## ファイル構成

```
static/
├── css/
│   └── style.css                        # スタイルシート
└── js/
    ├── main.js                          # エントリーポイント
    ├── domain/
    │   └── timer-state.js               # 状態定義・遷移ロジック
    ├── application/
    │   └── timer-controller.js          # タイマー制御
    ├── presentation/
    │   ├── renderer.js                  # DOM 描画
    │   └── events.js                    # イベント処理
    └── infrastructure/
        └── clock.js                     # 時刻抽象化
```

---

## JavaScript モジュール

### `main.js` — エントリーポイント

DOMContentLoaded 後にアプリケーションを初期化します。

**処理の流れ**

1. `TimerController(25 * 60)` を生成（25分設定）
2. `Renderer` を生成
3. `EventManager(controller, renderer)` を生成
4. `renderer.setFocusDuration(25 * 60)` でプログレス計算用の時間を設定
5. 初期描画を実行
6. `controller.onStateChange()` でリスナーを登録
7. `eventManager.attachListeners()` でボタンイベントを登録
8. `window.__timerApp` にデバッグ用オブジェクトを公開

---

### `domain/timer-state.js` — 状態遷移ロジック

副作用を持たない純粋関数のモジュールです。

#### エクスポート

| 名前 | 種類 | 説明 |
|---|---|---|
| `STATES` | 定数オブジェクト | 状態定数（`IDLE`, `RUNNING_FOCUS`, `PAUSED_FOCUS`, `COMPLETED`） |
| `ACTIONS` | 定数オブジェクト | アクション定数（`START`, `PAUSE`, `RESUME`, `RESET`, `COMPLETE`） |
| `getNextState(currentState, action)` | 関数 | 次の状態を返す |
| `getModeLabel(state)` | 関数 | 状態に対応する表示ラベルを返す |
| `getButtonLabels(state)` | 関数 | `{ primary, secondary }` のボタンラベルを返す |
| `isRunning(state)` | 関数 | `RUNNING_FOCUS` なら `true` |
| `getPrimaryAction(state)` | 関数 | 状態に対応するプライマリアクションを返す |
| `isOperational(state)` | 関数 | `COMPLETED` 以外なら `true` |

---

### `infrastructure/clock.js` — 時刻抽象化

`Date.now()` をラップして、テスト時にモック差し替えを可能にします。

#### `Clock` クラス

```javascript
const clock = new Clock();
clock.now(); // => number（ミリ秒）
```

#### デフォルトインスタンス

```javascript
export const defaultClock = new Clock();
```

`TimerController` はデフォルトでこのインスタンスを使用します。テスト時はコンストラクタの第2引数に差し替え用の Clock を渡せます。

---

### `application/timer-controller.js` — タイマーコントローラ

タイマーの実行制御と状態管理を担います。

#### コンストラクタ

```javascript
new TimerController(focusDurationSeconds = 1500, clock = defaultClock)
```

#### パブリックメソッド

| メソッド | 説明 |
|---|---|
| `start()` | タイマーを開始する（`IDLE → RUNNING_FOCUS`） |
| `pause()` | 一時停止する（`RUNNING_FOCUS → PAUSED_FOCUS`） |
| `resume()` | 再開する（`PAUSED_FOCUS → RUNNING_FOCUS`） |
| `reset()` | 任意の状態からリセットする（`→ IDLE`） |
| `dispatch(action)` | アクションを直接ディスパッチする |
| `getState()` | 現在の状態文字列を返す |
| `getRemainingSeconds()` | 残り秒数を返す（0以上の整数） |
| `getStateData()` | デバッグ用の内部状態オブジェクトを返す |
| `onStateChange(callback)` | 状態変更リスナーを登録する |
| `destroy()` | インターバルを停止してリスナーをクリア |

#### 時刻ベースカウントダウンの仕組み

- **開始時**: `endAt = now + focusDurationSeconds * 1000` を設定
- **残り時間計算**: `Math.ceil((endAt - now) / 1000)`
- **一時停止**: `pausedAt = now` を記録し interval を停止
- **再開時**: `endAt += (now - pausedAt)` で終了時刻を延長
- **完了判定**: `getRemainingSeconds() <= 0` で `COMPLETE` アクションを自動ディスパッチ

---

### `presentation/renderer.js` — DOM レンダラー

状態と残り時間を受け取り、DOM を更新します。

#### コンストラクタ

DOM 要素を取得して初期化します。以下の ID が必要です。

| 要素 ID | 説明 |
|---|---|
| `time-left` | 残り時間テキスト（`25:00` 形式） |
| `mode-label` | モードラベルテキスト |
| `progress-value` | SVG 円形プログレスバー |
| `progress-wrap` | プログレスのラッパー（aria-label を更新） |
| `primary-btn` | プライマリボタン |
| `secondary-btn` | セカンダリボタン |

#### パブリックメソッド

| メソッド | 説明 |
|---|---|
| `render(state, remainingSeconds)` | 全 UI 要素を更新する |
| `setFocusDuration(seconds)` | プログレス計算用の総時間を設定する |
| `toTimeText(totalSeconds)` | 秒数を `mm:ss` 形式の文字列に変換する |

#### 円形プログレスの計算

```javascript
progress = (focusDurationSeconds - remainingSeconds) / focusDurationSeconds
strokeDashoffset = circumference * progress
```

`progress` は 0〜1 にクランプされます。半径は SVG の `r` 属性から取得します（デフォルト: 80）。

---

### `presentation/events.js` — イベントマネージャー

ボタンクリックイベントを処理してコントローラに委譲します。

#### コンストラクタ

```javascript
new EventManager(controller, renderer)
```

#### パブリックメソッド

| メソッド | 説明 |
|---|---|
| `attachListeners()` | プライマリ・セカンダリボタンにクリックイベントを登録する |

#### ボタン動作

| 状態 | プライマリボタン | セカンダリボタン |
|---|---|---|
| `idle` | `controller.start()` | `controller.reset()` |
| `running_focus` | `controller.pause()` | `controller.reset()` |
| `paused_focus` | `controller.resume()` | `controller.reset()` |
| `completed` | `controller.reset()` | `controller.reset()` |

---

## スタイルシート（`css/style.css`）

CSS カスタムプロパティで色を管理しています。

### CSS 変数

| 変数 | デフォルト値 | 説明 |
|---|---|---|
| `--bg-start` | `#6c66ca` | 背景グラデーション開始色 |
| `--bg-end` | `#5b4cbf` | 背景グラデーション終了色 |
| `--window-bg` | `#ededf2` | タイマーウィンドウ背景色 |
| `--text-main` | `#2f2f35` | メインテキスト色 |
| `--text-subtle` | `#646472` | サブテキスト色 |
| `--brand` | `#6874e3` | ブランドカラー（ボタン・プログレスリング） |
| `--card-bg` | `#dfe1ef` | 今日の進捗カードの背景色 |
| `--ring-bg` | `#e2e4ea` | プログレスリングの背景色 |

### レスポンシブ対応

`@media (max-width: 520px)` で小画面向けのフォントサイズ縮小が適用されます。

---

## HTML テンプレート（`templates/index.html`）

Flask の `render_template` で描画されます。

### 主要な DOM 構造

```html
<main class="page">
  <section class="timer-window">
    <header class="window-header">...</header>
    <p id="mode-label">作業中</p>
    <div id="progress-wrap">
      <svg class="progress-ring">
        <circle class="progress-bg" />
        <circle class="progress-value" id="progress-value" />
      </svg>
      <p id="time-left">25:00</p>
    </div>
    <div class="actions">
      <button id="primary-btn">開始</button>
      <button id="secondary-btn">リセット</button>
    </div>
    <section class="daily-card">...</section>
  </section>
</main>
```

> **注意**: 「今日の進捗」セクション（`.daily-card`）の「完了」数と「集中時間」は現在ハードコードされており（それぞれ `4`、`1時間40分`）、JavaScript による動的な更新は実装されていません。
