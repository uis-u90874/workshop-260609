/**
 * イベントハンドリング
 * ボタンクリックなどのUI イベントを処理
 */

import { STATES } from '../domain/timer-state.js';

/**
 * イベントマネージャークラス
 */
export class EventManager {
  constructor(controller, renderer) {
    this.controller = controller;
    this.renderer = renderer;
  }

  /**
   * イベントリスナーを登録
   */
  attachListeners() {
    const primaryBtn = document.getElementById('primary-btn');
    const secondaryBtn = document.getElementById('secondary-btn');

    if (!primaryBtn || !secondaryBtn) {
      throw new Error('ボタン要素が見つかりません');
    }

    // プライマリボタンのクリックイベント
    primaryBtn.addEventListener('click', () => {
      this.handlePrimaryButtonClick();
    });

    // セカンダリボタンのクリックイベント
    secondaryBtn.addEventListener('click', () => {
      this.handleSecondaryButtonClick();
    });
  }

  /**
   * プライマリボタンのクリック処理
   */
  handlePrimaryButtonClick() {
    const state = this.controller.getState();

    switch (state) {
      case STATES.IDLE:
        this.controller.start();
        break;
      case STATES.RUNNING_FOCUS:
        this.controller.pause();
        break;
      case STATES.PAUSED_FOCUS:
        this.controller.resume();
        break;
      case STATES.COMPLETED:
        this.controller.reset();
        break;
      default:
        break;
    }
  }

  /**
   * セカンダリボタンのクリック処理
   */
  handleSecondaryButtonClick() {
    this.controller.reset();
  }
}
