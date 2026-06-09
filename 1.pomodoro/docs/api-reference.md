# API リファレンス

## 概要

本アプリケーションが提供する HTTP エンドポイントは1つのみです。タイマー機能はすべてクライアントサイドで動作するため、REST API は存在しません。

## エンドポイント一覧

### `GET /`

ポモドーロタイマーのメインページを返します。

**レスポンス**

| 項目 | 値 |
|---|---|
| ステータスコード | `200 OK` |
| Content-Type | `text/html; charset=utf-8` |
| ボディ | `templates/index.html` のレンダリング結果 |

**例**

```
GET / HTTP/1.1
Host: localhost:5000
```

```html
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!doctype html>
<html lang="ja">
...
</html>
```

## 静的ファイル

Flask の標準的な静的ファイル配信機能を利用しています。

| パス | 内容 |
|---|---|
| `/static/css/style.css` | アプリケーションスタイルシート |
| `/static/js/main.js` | JavaScript エントリーポイント |
| `/static/js/domain/timer-state.js` | 状態遷移ロジック |
| `/static/js/application/timer-controller.js` | タイマーコントローラ |
| `/static/js/presentation/renderer.js` | DOM レンダラー |
| `/static/js/presentation/events.js` | イベントマネージャー |
| `/static/js/infrastructure/clock.js` | 時刻抽象化 |
