// ============================================
// 最短ビンゴ記録管理モジュール（サーバー通信版）
// ファイル名: bingorecord.js
// ============================================

/**
 * BingoRecordManager
 * 役割：Flask APIと通信して最短ビンゴ記録を管理
 * 目的：サーバー側のDBに記録を保存・取得する
 */
class BingoRecordManager {
  constructor() {
    this.apiBaseUrl = '/api/record'; // FlaskのAPIベースURL
    this.cachedBestRecord = null;    // キャッシュ（サーバー通信を減らすため）
  }

  // ============================================
  // サーバー通信（API呼び出し）
  // ============================================

  /**
   * fetchBestRecord() - サーバーから最短記録を取得
   * 役割：GET /api/record/best を呼び出してDBから最短記録を取得
   * 目的：フロントエンドで記録を表示する際に使用
   * @returns {Promise<Object|null>} - {id, draw_count, timestamp} または null
   */
  async fetchBestRecord() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/best`);
      const result = await response.json();
      
      if (result.success) {
        this.cachedBestRecord = result.data; // キャッシュに保存
        return result.data;
      } else {
        console.error('最短記録の取得に失敗:', result.error);
        return null;
      }
    } catch (error) {
      console.error('サーバー通信エラー:', error);
      return null;
    }
  }

  /**
   * addRecord(drawCount) - サーバーに新しい記録を追加
   * 役割：POST /api/record/add を呼び出してDBに記録を保存
   * 目的：BE①がビンゴ達成時に呼び出す
   * @param {number} drawCount - ビンゴ達成時の抽選回数
   * @returns {Promise<Object|null>} - {id, draw_count, timestamp, is_new_record}
   */
  async addRecord(drawCount) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          draw_count: drawCount
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 新記録の場合、キャッシュを更新
        if (result.data.is_new_record) {
          this.cachedBestRecord = {
            id: result.data.id,
            draw_count: result.data.draw_count,
            timestamp: result.data.timestamp
          };
        }
        return result.data;
      } else {
        console.error('記録の追加に失敗:', result.error);
        return null;
      }
    } catch (error) {
      console.error('サーバー通信エラー:', error);
      return null;
    }
  }

  /**
   * fetchAllRecords() - サーバーから全記録を取得
   * 役割：GET /api/record/all を呼び出してDBから全記録を取得
   * 目的：履歴画面での一覧表示に使用
   * @returns {Promise<Array>} - 記録のリスト
   */
  async fetchAllRecords() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/all`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        console.error('全記録の取得に失敗:', result.error);
        return [];
      }
    } catch (error) {
      console.error('サーバー通信エラー:', error);
      return [];
    }
  }

  /**
   * resetRecords() - サーバーの全記録を削除
   * 役割：DELETE /api/record/reset を呼び出してDBをクリア
   * 目的：リセットボタン押下時に使用
   * @returns {Promise<boolean>} - 成功時true
   */
  async resetRecords() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/reset`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.cachedBestRecord = null; // キャッシュをクリア
        return true;
      } else {
        console.error('記録のリセットに失敗:', result.error);
        return false;
      }
    } catch (error) {
      console.error('サーバー通信エラー:', error);
      return false;
    }
  }

  // ============================================
  // 簡易アクセスメソッド（キャッシュ利用）
  // ============================================

  /**
   * getBestRecord() - 最短記録を取得（キャッシュ優先）
   * 役割：キャッシュがあればそれを返し、なければサーバーから取得
   * 目的：頻繁に呼ばれる場合の通信削減
   * @returns {Promise<Object|null>}
   */
  async getBestRecord() {
    if (this.cachedBestRecord) {
      return this.cachedBestRecord;
    }
    return await this.fetchBestRecord();
  }

  /**
   * refreshBestRecord() - 最短記録を強制的に再取得
   * 役割：キャッシュを無視してサーバーから取得
   * 目的：データの最新化が必要な場合に使用
   * @returns {Promise<Object|null>}
   */
  async refreshBestRecord() {
    return await this.fetchBestRecord();
  }

  // ============================================
  // ユーティリティメソッド
  // ============================================

  /**
   * hasCachedRecord() - キャッシュに記録があるか確認
   * 役割：サーバー通信なしで記録の有無を確認
   * 目的：高速な判定が必要な場合に使用
   * @returns {boolean}
   */
  hasCachedRecord() {
    return this.cachedBestRecord !== null;
  }

  /**
   * formatDateTime(dateString) - 日時文字列を整形
   * 役割：サーバーから受け取った日時を表示用に整形
   * 目的：UI表示の統一
   * @param {string} dateString - 日時文字列
   * @returns {string}
   */
  formatDateTime(dateString) {
    // サーバー側で既にフォーマット済みなのでそのまま返す
    return dateString;
  }
}

// シングルトンインスタンスを作成してエクスポート
// 役割：アプリケーション全体で1つの記録管理インスタンスを共有
// 目的：記録の一貫性を保証する
const bingoRecordManager = new BingoRecordManager();

export default bingoRecordManager;