/**
 * Clock - 時刻取得の抽象化
 * テスト容易性を高めるため、Date.now() をラップする
 */

export class Clock {
  /**
   * 現在時刻をミリ秒で返す
   * @returns {number} 現在時刻（ミリ秒）
   */
  now() {
    return Date.now();
  }
}

/**
 * デフォルト Clock インスタンス
 */
export const defaultClock = new Clock();
