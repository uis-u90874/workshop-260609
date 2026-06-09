/**
 * 描画処理（Renderer）
 * 状態に応じたDOM操作を担当
 */

import {
  getModeLabel,
  getButtonLabels,
} from '../domain/timer-state.js';

/**
 * レンダラークラス
 */
export class Renderer {
  constructor() {
    // DOM要素の取得
    this.timeEl = document.getElementById('time-left');
    this.modeEl = document.getElementById('mode-label');
    this.ringEl = document.getElementById('progress-value');
    this.wrapEl = document.getElementById('progress-wrap');
    this.primaryBtn = document.getElementById('primary-btn');
    this.secondaryBtn = document.getElementById('secondary-btn');

    // 要素の存在確認
    if (!this.timeEl || !this.modeEl || !this.ringEl || !this.wrapEl || !this.primaryBtn || !this.secondaryBtn) {
      throw new Error('必須のDOM要素が見つかりません');
    }

    // 円形プログレスの初期化
    this.radius = Number(this.ringEl.getAttribute('r') || 80);
    this.circumference = 2 * Math.PI * this.radius;
    this.ringEl.style.strokeDasharray = String(this.circumference);
    this.focusDurationSeconds = 25 * 60; // デフォルト値
  }

  /**
   * 時刻をフォーマット（mm:ss）
   * @param {number} totalSeconds
   * @returns {string}
   */
  toTimeText(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * フォーカス時間を設定（プログレス計算用）
   * @param {number} seconds
   */
  setFocusDuration(seconds) {
    this.focusDurationSeconds = seconds;
  }

  /**
   * 状態と残り時間をレンダリング
   * @param {string} state
   * @param {number} remainingSeconds
   */
  render(state, remainingSeconds) {
    this.renderTime(remainingSeconds);
    this.renderMode(state);
    this.renderProgress(remainingSeconds);
    this.renderButtons(state);
  }

  /**
   * 残り時間を描画
   * @param {number} remainingSeconds
   */
  renderTime(remainingSeconds) {
    const timeText = this.toTimeText(remainingSeconds);
    this.timeEl.textContent = timeText;
    this.wrapEl.setAttribute('aria-label', `残り時間${timeText}`);
  }

  /**
   * モードラベルを描画
   * @param {string} state
   */
  renderMode(state) {
    this.modeEl.textContent = getModeLabel(state);
  }

  /**
   * 円形プログレスを描画
   * @param {number} remainingSeconds
   */
  renderProgress(remainingSeconds) {
    const progress = (this.focusDurationSeconds - remainingSeconds) / this.focusDurationSeconds;
    const clamped = Math.min(1, Math.max(0, progress));
    this.ringEl.style.strokeDashoffset = String(this.circumference * clamped);
  }

  /**
   * ボタンを描画
   * @param {string} state
   */
  renderButtons(state) {
    const labels = getButtonLabels(state);

    // プライマリボタン
    this.primaryBtn.textContent = labels.primary;

    // セカンダリボタン
    if (labels.secondary) {
      this.secondaryBtn.textContent = labels.secondary;
      this.secondaryBtn.style.display = 'inline-block';
    } else {
      this.secondaryBtn.style.display = 'none';
    }
  }
}
