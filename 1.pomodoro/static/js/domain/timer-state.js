/**
 * ポモドーロタイマーの状態遷移ロジック
 * 純粋関数として実装し、外部副作用に依存しない
 */

// 状態定義
export const STATES = {
  IDLE: 'idle',
  RUNNING_FOCUS: 'running_focus',
  PAUSED_FOCUS: 'paused_focus',
  COMPLETED: 'completed',
};

// アクション定義
export const ACTIONS = {
  START: 'start',
  PAUSE: 'pause',
  RESUME: 'resume',
  RESET: 'reset',
  COMPLETE: 'complete',
};

/**
 * 状態遷移テーブル
 * 現在状態とアクションから次状態を決定する
 */
const stateTransitions = {
  [STATES.IDLE]: {
    [ACTIONS.START]: STATES.RUNNING_FOCUS,
  },
  [STATES.RUNNING_FOCUS]: {
    [ACTIONS.PAUSE]: STATES.PAUSED_FOCUS,
    [ACTIONS.COMPLETE]: STATES.COMPLETED,
  },
  [STATES.PAUSED_FOCUS]: {
    [ACTIONS.RESUME]: STATES.RUNNING_FOCUS,
    [ACTIONS.RESET]: STATES.IDLE,
  },
  [STATES.COMPLETED]: {
    [ACTIONS.RESET]: STATES.IDLE,
  },
};

/**
 * 任意の状態からのリセット処理
 */
const universalActions = {
  [ACTIONS.RESET]: STATES.IDLE,
};

/**
 * 現在の状態とアクションから次の状態を決定する
 * @param {string} currentState - 現在の状態
 * @param {string} action - 実行するアクション
 * @returns {string} 次の状態（遷移不可の場合は現在状態）
 */
export function getNextState(currentState, action) {
  // リセットはどの状態からも実行可能
  if (action === ACTIONS.RESET) {
    return universalActions[action];
  }

  // 状態遷移テーブルから次状態を取得
  const transitions = stateTransitions[currentState] || {};
  const nextState = transitions[action];

  // 遷移不可の場合は現在状態を返す
  return nextState !== undefined ? nextState : currentState;
}

/**
 * 状態に応じた表示テキストを取得
 * @param {string} state - 状態
 * @returns {string} 表示用テキスト
 */
export function getModeLabel(state) {
  const labels = {
    [STATES.IDLE]: '作業中',
    [STATES.RUNNING_FOCUS]: '作業中',
    [STATES.PAUSED_FOCUS]: '一時停止中',
    [STATES.COMPLETED]: '完了',
  };
  return labels[state] || '不明';
}

/**
 * 状態に応じたボタンテキストを取得
 * @param {string} state - 状態
 * @returns {object} { primary: string, secondary: string }
 */
export function getButtonLabels(state) {
  const labels = {
    [STATES.IDLE]: { primary: '開始', secondary: 'リセット' },
    [STATES.RUNNING_FOCUS]: { primary: '一時停止', secondary: 'リセット' },
    [STATES.PAUSED_FOCUS]: { primary: '再開', secondary: 'リセット' },
    [STATES.COMPLETED]: { primary: 'リセット', secondary: '' },
  };
  return labels[state] || { primary: '開始', secondary: 'リセット' };
}

/**
 * 状態がタイマー実行中かどうかを判定
 * @param {string} state - 状態
 * @returns {boolean} タイマー実行中なら true
 */
export function isRunning(state) {
  return state === STATES.RUNNING_FOCUS;
}

/**
 * 状態から次のアクションに対応するボタンが押された時のアクションを取得
 * @param {string} state - 状態
 * @returns {string} アクション
 */
export function getPrimaryAction(state) {
  const actions = {
    [STATES.IDLE]: ACTIONS.START,
    [STATES.RUNNING_FOCUS]: ACTIONS.PAUSE,
    [STATES.PAUSED_FOCUS]: ACTIONS.RESUME,
    [STATES.COMPLETED]: ACTIONS.RESET,
  };
  return actions[state] || ACTIONS.START;
}

/**
 * タイマーが実行中か判定
 * @param {string} state - 状態
 * @returns {boolean}
 */
export function isRunning(state) {
  return state === STATES.RUNNING_FOCUS;
}

/**
 * タイマーが操作可能な状態か判定
 * @param {string} state - 状態
 * @returns {boolean}
 */
export function isOperational(state) {
  return state !== STATES.COMPLETED;
}
