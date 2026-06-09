/**
 * タイマーコントローラ
 * タイマーの実行制御、状態管理を行う
 * 
 * 時刻ベースのカウントダウンを実装
 * - startedAt: タイマー開始時刻（ミリ秒）
 * - endAt: タイマー終了予定時刻（ミリ秒）
 * - pausedAt: 一時停止時刻（ミリ秒）
 * - durationSeconds: タイマーの設定秒数
 */

import {
  STATES,
  ACTIONS,
  getNextState,
  isRunning,
} from '../domain/timer-state.js';
import { defaultClock } from '../infrastructure/clock.js';

/**
 * タイマーコントローラクラス
 */
export class TimerController {
  constructor(focusDurationSeconds = 25 * 60, clock = defaultClock) {
    // 設定値
    this.focusDurationSeconds = focusDurationSeconds;
    this.clock = clock;

    // 状態
    this.state = STATES.IDLE;

    // 時刻ベース管理
    // idle 状態では null、running/paused 時に設定
    this.startedAt = null;      // タイマー開始時刻
    this.endAt = null;          // タイマー終了予定時刻
    this.pausedAt = null;       // 一時停止時刻

    // タイマー制御
    this.intervalId = null;

    // リスナー
    this.listeners = [];
  }

  /**
   * 状態変更のリスナーを登録
   * @param {function} callback - (state, remainingSeconds) => void
   */
  onStateChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * すべてのリスナーに通知
   */
  notifyListeners() {
    this.listeners.forEach((callback) => {
      callback(this.state, this.getRemainingSeconds());
    });
  }

  /**
   * 残り秒数を計算（時刻差分から算出）
   * @returns {number} 残り秒数（0以上）
   */
  getRemainingSeconds() {
    if (this.state === STATES.IDLE || this.endAt === null) {
      return this.focusDurationSeconds;
    }

    if (this.state === STATES.PAUSED_FOCUS) {
      // 一時停止中は pausedAt から endAt までの差分
      const remainingMs = this.endAt - this.pausedAt;
      return Math.max(0, Math.ceil(remainingMs / 1000));
    }

    // running 状態では現在時刻から endAt までの差分
    const now = this.clock.now();
    const remainingMs = this.endAt - now;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  /**
   * アクションを実行し、状態を更新する
   * @param {string} action - 実行するアクション
   */
  dispatch(action) {
    // 残り時間が0の場合、COMPLETEアクションを自動実行
    if (this.getRemainingSeconds() <= 0 && action !== ACTIONS.RESET) {
      action = ACTIONS.COMPLETE;
    }

    // 次の状態を決定
    const nextState = getNextState(this.state, action);

    // 状態が変わった場合、制御を実行
    if (nextState !== this.state) {
      const now = this.clock.now();
      const prevState = this.state;
      this.state = nextState;

      // 状態に応じた時刻計算を実行
      if (isRunning(nextState)) {
        // 再開時は pausedAt 分だけ endAt を延長し、開始時刻は維持する
        if (prevState === STATES.PAUSED_FOCUS && this.pausedAt !== null && this.endAt !== null) {
          const pausedDuration = now - this.pausedAt;
          this.endAt += pausedDuration;
        } else {
          // running 状態：startedAt と endAt を設定
          this.startedAt = now;
          this.endAt = now + this.focusDurationSeconds * 1000;
        }
        this.pausedAt = null;
        this.startInterval();
      } else if (nextState === STATES.PAUSED_FOCUS) {
        // paused 状態：pausedAt を設定（endAt は保持）
        this.pausedAt = now;
        this.stopInterval();
      } else if (nextState === STATES.IDLE) {
        // idle 状態：時刻をクリア
        this.startedAt = null;
        this.endAt = null;
        this.pausedAt = null;
        this.stopInterval();
      } else {
        // completed など：interval を停止
        this.stopInterval();
      }

      // リセット時：次のタイマー開始に備える
      if (action === ACTIONS.RESET) {
        this.startedAt = null;
        this.endAt = null;
        this.pausedAt = null;
      }
    } else if (nextState === STATES.RUNNING_FOCUS && this.state === STATES.PAUSED_FOCUS) {
      // 再開時：pausedAt から endAt を延長する
      const now = this.clock.now();
      const pausedDuration = now - this.pausedAt;
      this.endAt += pausedDuration;
      this.pausedAt = null;
      this.startInterval();
    }

    // リスナーに通知
    this.notifyListeners();
  }

  /**
   * タイマー interval を開始
   */
  startInterval() {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 1000);
  }

  /**
   * タイマー interval を停止
   */
  stopInterval() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 1秒経過時の処理
   */
  tick() {
    // 残り時間が0に達したか確認
    if (this.getRemainingSeconds() <= 0) {
      this.dispatch(ACTIONS.COMPLETE);
      return;
    }

    // リスナーに通知（UI 更新）
    this.notifyListeners();
  }

  /**
   * 開始アクション
   */
  start() {
    this.dispatch(ACTIONS.START);
  }

  /**
   * 一時停止アクション
   */
  pause() {
    this.dispatch(ACTIONS.PAUSE);
  }

  /**
   * 再開アクション
   */
  resume() {
    this.dispatch(ACTIONS.RESUME);
  }

  /**
   * リセットアクション
   */
  reset() {
    this.dispatch(ACTIONS.RESET);
  }

  /**
   * 現在の状態を取得
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * 状態の内部データを取得（デバッグ・テスト用）
   * @returns {object}
   */
  getStateData() {
    return {
      state: this.state,
      startedAt: this.startedAt,
      endAt: this.endAt,
      pausedAt: this.pausedAt,
      remainingSeconds: this.getRemainingSeconds(),
    };
  }

  /**
   * クリーンアップ（コントローラ破棄時）
   */
  destroy() {
    this.stopInterval();
    this.listeners = [];
  }
}
