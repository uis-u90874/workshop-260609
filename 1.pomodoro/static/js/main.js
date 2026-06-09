/**
 * メインエントリーポイント
 * アプリケーション初期化とコンポーネント連携
 */

import { TimerController } from './application/timer-controller.js';
import { Renderer } from './presentation/renderer.js';
import { EventManager } from './presentation/events.js';

/**
 * アプリケーション初期化
 */
function initializeApp() {
  try {
    // コンポーネント作成
    const controller = new TimerController(25 * 60); // 25分 = 1500秒
    const renderer = new Renderer();
    const eventManager = new EventManager(controller, renderer);

    // フォーカス時間の設定
    renderer.setFocusDuration(25 * 60);

    // 初期描画
    renderer.render(controller.getState(), controller.getRemainingSeconds());

    // 状態変更時のリスナーを登録
    controller.onStateChange((state, remainingSeconds) => {
      renderer.render(state, remainingSeconds);
    });

    // イベントリスナーを登録
    eventManager.attachListeners();

    // グローバルに公開（デバッグ用）
    window.__timerApp = {
      controller,
      renderer,
      eventManager,
    };
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
  }
}

// DOMが準備完了時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
