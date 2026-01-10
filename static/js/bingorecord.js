// ============================================
// BE② 最短ビンゴ記録管理モジュール
// ファイル名: bingorecord.js
// ============================================

/**
 * BingoRecordManager
 * 役割：最短ビンゴ記録（回数・タイムスタンプ）を管理
 * 目的：歴代最短記録をDBのように保存・提供する
 */
class BingoRecordManager {
  constructor() {
    this.init();
    this.loadFromStorage(); // 起動時に保存データを読み込み
  }

  /**
   * init() - 初期化処理
   * 役割：記録データを初期状態にリセット
   * 目的：初回起動時やリセット時に呼び出される
   */
  init() {
    this.bestRecord = null; // 最短ビンゴ記録 {drawCount, timestamp, dateString}
  }

  /**
   * updateRecord(drawCount) - 最短記録を更新
   * 役割：新しいビンゴ達成時に記録を更新（最短のみ保存）
   * 目的：BE①がビンゴ達成時に呼び出す
   * @param {number} drawCount - ビンゴ達成時の抽選回数
   * @returns {boolean} - 記録更新された場合true
   */
  updateRecord(drawCount) {
    // 記録が存在しない、または新記録の場合のみ更新
    if (!this.bestRecord || drawCount < this.bestRecord.drawCount) {
      const now = new Date();
      
      this.bestRecord = {
        drawCount: drawCount,                    // 抽選回数
        timestamp: now.getTime(),                // UNIXタイムスタンプ（ミリ秒）
        dateString: this.formatDateTime(now)     // 人間が読める形式
      };
      
      this.saveToStorage(); // 自動保存
      return true; // 記録更新された
    }
    
    return false; // 記録更新されなかった
  }

  /**
   * formatDateTime(date) - 日時を読みやすい形式にフォーマット
   * 役割：Dateオブジェクトを「YYYY年MM月DD日 HH:MM:SS」形式に変換
   * 目的：表示用の日時文字列を生成
   * @param {Date} date - Dateオブジェクト
   * @returns {string} - フォーマット済み日時文字列
   */
  formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
  }

  /**
   * getBestRecord() - 最短記録を取得
   * 役割：現在の最短ビンゴ記録を返す
   * 目的：FEが記録を表示する際に使用
   * @returns {Object|null} - {drawCount, timestamp, dateString} または null（記録なし）
   */
  getBestRecord() {
    if (!this.bestRecord) {
      return null;
    }
    
    // オブジェクトのコピーを返す（元データの保護）
    return {
      drawCount: this.bestRecord.drawCount,
      timestamp: this.bestRecord.timestamp,
      dateString: this.bestRecord.dateString
    };
  }

  /**
   * hasBestRecord() - 記録が存在するか確認
   * 役割：最短記録が保存されているか判定
   * 目的：FEが「記録なし」表示をするかの判断に使用
   * @returns {boolean}
   */
  hasBestRecord() {
    return this.bestRecord !== null;
  }

  /**
   * getRecordDrawCount() - 最短回数のみを取得
   * 役割：抽選回数だけを返す（簡易版）
   * 目的：数値のみ必要な場合に使用
   * @returns {number|null}
   */
  getRecordDrawCount() {
    return this.bestRecord ? this.bestRecord.drawCount : null;
  }

  /**
   * getRecordTimestamp() - タイムスタンプのみを取得
   * 役割：UNIXタイムスタンプを返す
   * 目的：時系列ソートや計算に使用
   * @returns {number|null}
   */
  getRecordTimestamp() {
    return this.bestRecord ? this.bestRecord.timestamp : null;
  }

  /**
   * getRecordDateString() - 日時文字列のみを取得
   * 役割：フォーマット済み日時を返す
   * 目的：FEが直接表示する際に使用
   * @returns {string|null}
   */
  getRecordDateString() {
    return this.bestRecord ? this.bestRecord.dateString : null;
  }

  /**
   * resetRecord() - 記録をリセット
   * 役割：保存されている記録を削除
   * 目的：「記録リセット」ボタン押下時に呼び出される
   */
  resetRecord() {
    this.init();
    this.clearStorage();
  }

  // ============================================
  // LocalStorage連携（永続化機能）
  // ============================================

  /**
   * saveToStorage() - 記録をLocalStorageに保存
   * 役割：最短記録をブラウザに保存
   * 目的：ページ更新後も記録を保持
   */
  saveToStorage() {
    try {
      const data = {
        bestRecord: this.bestRecord
      };
      localStorage.setItem('bingoRecordData', JSON.stringify(data));
    } catch (e) {
      console.error('記録の保存に失敗:', e);
    }
  }

  /**
   * loadFromStorage() - LocalStorageから記録を復元
   * 役割：保存された記録を読み込む
   * 目的：ページ読み込み時に前回の記録を復元
   * @returns {boolean} - 復元成功時true
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('bingoRecordData');
      if (saved) {
        const data = JSON.parse(saved);
        this.bestRecord = data.bestRecord || null;
        return true;
      }
    } catch (e) {
      console.error('記録の読み込みに失敗:', e);
    }
    return false;
  }

  /**
   * clearStorage() - LocalStorageをクリア
   * 役割：保存された記録を削除
   * 目的：記録リセット時に使用
   */
  clearStorage() {
    try {
      localStorage.removeItem('bingoRecordData');
    } catch (e) {
      console.error('記録のクリアに失敗:', e);
    }
  }

  // ============================================
  // デバッグ・ユーティリティ
  // ============================================

  /**
   * getAllData() - すべてのデータを取得
   * 役割：記録データの全情報を返す
   * 目的：デバッグやデータ確認に使用
   * @returns {Object}
   */
  getAllData() {
    return {
      bestRecord: this.bestRecord ? {...this.bestRecord} : null,
      hasBestRecord: this.hasBestRecord()
    };
  }

  /**
   * forceUpdateRecord(drawCount, timestamp) - 強制的に記録を更新
   * 役割：任意の回数・日時で記録を上書き
   * 目的：テストやデータ修正に使用（通常は使用しない）
   * @param {number} drawCount - 抽選回数
   * @param {number} timestamp - UNIXタイムスタンプ（ミリ秒）
   */
  forceUpdateRecord(drawCount, timestamp) {
    const date = new Date(timestamp);
    
    this.bestRecord = {
      drawCount: drawCount,
      timestamp: timestamp,
      dateString: this.formatDateTime(date)
    };
    
    this.saveToStorage();
  }
}

// シングルトンインスタンスを作成してエクスポート
// 役割：アプリケーション全体で1つの記録管理インスタンスを共有
// 目的：記録の一貫性を保証する
const bingoRecordManager = new BingoRecordManager();

export default bingoRecordManager;