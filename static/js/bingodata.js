// ============================================
// BE② データ管理・状態保持モジュール
// ファイル名: bingodata.js
// ============================================

/**
 * BingoDataManager
 * 役割：ビンゴゲームの全データ（カード状態、抽選履歴、回数）を一元管理
 * 目的：データの一貫性を保ち、他モジュール（FE・BE①）にデータを提供する
 */
class BingoDataManager {
  constructor() {
    this.init();
  }

  /**
   * init() - 初期化処理
   * 役割：全データを初期状態にリセット
   * 目的：ゲーム開始時やリセット時に呼び出される
   */
  init() {
    /**
     * cards: Array of objects
     * {
     *   grid: Array<Array<number|string>>, // 5x5配列
     *   markedPositions: Array<{row, col}>,
     *   bingoLines: Array<Object>
     * }
     */
    this.cards = [];
    this.drawnNumbers = [];            // すでに抽選された番号のリスト
    this.drawCount = 0;                // 抽選回数
  }

  /**
   * addCard(grid) - カードを追加
   * 役割：新しいカードデータを管理下に追加
   * @param {Array<Array<number>>} grid - 5x5の二次元配列
   */
  addCard(grid) {
    // 入力検証
    if (!Array.isArray(grid) || grid.length !== 5 ||
      !grid.every(row => Array.isArray(row) && row.length === 5)) {
      console.error('Invalid card format: must be 5x5 array', grid);
      return;
    }

    const cardState = {
      grid: grid,
      markedPositions: [{ row: 2, col: 2 }], // 中央（FREE）を初期マーク
      bingoLines: [],
      bingoAnnounced: false,
    };

    this.cards.push(cardState);
    this.saveToStorage();
  }

  // 後方互換性のため、getCardで最初のカードを返す（または廃止）
  // 今回は複数対応のため、基本は getCards を使うべきだが、
  // 既存コードが壊れないように調整が必要ならラッパーを作る
  // -> 今回はMain.jsを一気に直すので getCards に移行する

  /**
   * getCards() - 全カード情報を取得
   * @returns {Array<Object>}
   */
  getCards() {
    return this.cards;
  }

  /**
   * getCard(index) - 特定のカードを取得
   */
  getCard(index = 0) {
    return this.cards[index] || null;
  }

  /**
   * hasCard() - カードが1枚以上あるか
   */
  hasCard() {
    return this.cards.length > 0;
  }

  /**
   * addDrawnNumber(number) - 抽選番号を履歴に追加
   */
  addDrawnNumber(number) {
    if (!this.drawnNumbers.includes(number)) {
      this.drawnNumbers.push(number);
      this.drawCount++;
      this.saveToStorage();
    }
  }

  /**
   * toggleMarkByPosition(cardIndex, row, col)
   */
  toggleMarkByPosition(cardIndex, row, col) {
    const card = this.cards[cardIndex];
    if (!card) return false;

    const index = card.markedPositions.findIndex(
      pos => pos.row === row && pos.col === col
    );

    if (index !== -1) {
      // 既にマーク済み → 削除
      card.markedPositions.splice(index, 1);
      this.saveToStorage();
      return false;
    } else {
      // 未マーク → 追加
      card.markedPositions.push({ row, col });
      this.saveToStorage();
      return true;
    }
  }

  /**
   * isMarked(cardIndex, row, col)
   */
  isMarked(cardIndex, row, col) {
    const card = this.cards[cardIndex];
    if (!card) return false;
    return card.markedPositions.some(
      pos => pos.row === row && pos.col === col
    );
  }

  getDrawnNumbers() {
    return [...this.drawnNumbers];
  }

  getDrawCount() {
    return this.drawCount;
  }

  getMarkedPositions(cardIndex = 0) {
    const card = this.cards[cardIndex];
    return card ? [...card.markedPositions] : [];
  }

  setBingoLines(cardIndex, lines) {
    if (this.cards[cardIndex]) {
      this.cards[cardIndex].bingoLines = lines;
      this.saveToStorage();
    }
  }

  isBingoAnnounced(cardIndex) {
    if (!this.cards[cardIndex]) return false;
    return this.cards[cardIndex].bingoAnnounced || false;
  }

  setBingoAnnounced(cardIndex, announced) {
    if (this.cards[cardIndex]) {
      this.cards[cardIndex].bingoAnnounced = announced;
      this.saveToStorage();
    }
  }

  getBingoLines(cardIndex = 0) {
    const card = this.cards[cardIndex];
    return card ? [...card.bingoLines] : [];
  }

  reset() {
    this.init();
    this.clearStorage();
  }

  // ============================================
  // LocalStorage連携
  // ============================================

  saveToStorage() {
    try {
      const state = {
        cards: this.cards,
        drawnNumbers: this.drawnNumbers,
        drawCount: this.drawCount
      };
      localStorage.setItem('bingoGameState_v2', JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorageへの保存に失敗:', e);
    }
  }

  loadFromStorage() {
    try {
      // v2キーを確認
      let saved = localStorage.getItem('bingoGameState_v2');

      // なければ旧キーを確認（移行ロジック）
      if (!saved) {
        const oldSaved = localStorage.getItem('bingoGameState');
        if (oldSaved) {
          // 旧データをv2形式に変換
          const oldState = JSON.parse(oldSaved);
          if (oldState.currentCard) {
            const cardState = {
              grid: oldState.currentCard,
              markedPositions: oldState.markedPositions || [],
              bingoLines: oldState.bingoLines || [],
              bingoAnnounced: false
            };
            this.cards = [cardState];
            this.drawnNumbers = oldState.drawnNumbers || [];
            this.drawCount = oldState.drawCount || 0;
            return true;
          }
        }
      }

      if (saved) {
        const state = JSON.parse(saved);
        this.cards = state.cards || [];
        this.drawnNumbers = state.drawnNumbers || [];
        this.drawCount = state.drawCount || 0;
        return true;
      }
    } catch (e) {
      console.error('LocalStorageからの読み込みに失敗:', e);
    }
    return false;
  }

  clearStorage() {
    try {
      localStorage.removeItem('bingoGameState_v2');
      localStorage.removeItem('bingoGameState'); // 旧データも消す
    } catch (e) {
      console.error('LocalStorageのクリアに失敗:', e);
    }
  }
}

const bingoDataManager = new BingoDataManager();
export default bingoDataManager;