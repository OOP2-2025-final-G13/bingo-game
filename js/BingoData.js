// ============================================
// BE② データ管理・状態保持モジュール
// ============================================

/**
 * BingoData
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
    this.currentCard = null;           // 現在のビンゴカード（5x5配列）
    this.drawnNumbers = [];            // すでに抽選された番号のリスト
    this.drawCount = 0;                // 抽選回数
    this.markedPositions = [];         // カード上でマークされた位置 [{row, col}, ...]
    this.bingoLines = [];              // ビンゴが成立したライン情報
  }

  /**
   * setCard(card) - カードデータをセット
   * 役割：BE①から生成されたカードを保存
   * 目的：現在のゲームで使用するカードを管理する
   * @param {Array<Array<number>>} card - 5x5の二次元配列
   */
  setCard(card) {
    this.currentCard = card;
    this.markedPositions = [{row: 2, col: 2}]; // 中央（FREE）を初期マーク
    this.bingoLines = [];
  }

  /**
   * getCard() - 現在のカードを取得
   * 役割：FEにカードデータを提供
   * 目的：画面表示用にカードデータを渡す
   * @returns {Array<Array<number>>|null}
   */
  getCard() {
    return this.currentCard;
  }

  /**
   * addDrawnNumber(number) - 抽選番号を履歴に追加
   * 役割：新たに抽選された番号を記録
   * 目的：重複抽選を防ぎ、履歴表示に使用する
   * @param {number} number - 抽選された番号
   */
  addDrawnNumber(number) {
    if (!this.drawnNumbers.includes(number)) {
      this.drawnNumbers.push(number);
      this.drawCount++;
      this.updateMarkedPositions(number);
    }
  }

  /**
   * updateMarkedPositions(number) - カード上のマーク位置を更新
   * 役割：抽選番号がカードに存在する場合、その位置を記録
   * 目的：ビンゴ判定とUI表示のための位置情報管理
   * @param {number} number - 抽選された番号
   */
  updateMarkedPositions(number) {
    if (!this.currentCard) return;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (this.currentCard[row][col] === number) {
          this.markedPositions.push({row, col});
        }
      }
    }
  }

  /**
   * getDrawnNumbers() - 抽選履歴を取得
   * 役割：これまでに抽選された全番号を返す
   * 目的：FE②の履歴画面表示に使用
   * @returns {Array<number>}
   */
  getDrawnNumbers() {
    return [...this.drawnNumbers]; // 配列のコピーを返す
  }

  /**
   * getDrawCount() - 抽選回数を取得
   * 役割：現在の抽選回数を返す
   * 目的：FEのステータス表示に使用
   * @returns {number}
   */
  getDrawCount() {
    return this.drawCount;
  }

  /**
   * getMarkedPositions() - マーク済み位置を取得
   * 役割：カード上でマークされたマスの位置情報を返す
   * 目的：FEがカード上の穴を表示する際に使用
   * @returns {Array<{row: number, col: number}>}
   */
  getMarkedPositions() {
    return [...this.markedPositions];
  }

  /**
   * setBingoLines(lines) - ビンゴライン情報を保存
   * 役割：BE①の判定結果を保存
   * 目的：ビンゴ達成状態を管理
   * @param {Array<Object>} lines - ビンゴラインの情報配列
   */
  setBingoLines(lines) {
    this.bingoLines = lines;
  }

  /**
   * getBingoLines() - ビンゴライン情報を取得
   * 役割：現在成立しているビンゴラインを返す
   * 目的：FEの演出表示に使用
   * @returns {Array<Object>}
   */
  getBingoLines() {
    return [...this.bingoLines];
  }

  /**
   * reset() - 全データをリセット
   * 役割：ゲームを初期状態に戻す
   * 目的：「リセット」ボタン押下時に呼び出される
   */
  reset() {
    this.init();
    this.clearStorage(); // LocalStorageもクリア
  }

  // ============================================
  // LocalStorage連携（永続化機能）
  // ============================================

  /**
   * saveToStorage() - 現在の状態をLocalStorageに保存
   * 役割：データをブラウザに保存
   * 目的：ページ更新後もデータを復元できるようにする
   */
  saveToStorage() {
    try {
      const state = {
        currentCard: this.currentCard,
        drawnNumbers: this.drawnNumbers,
        drawCount: this.drawCount,
        markedPositions: this.markedPositions,
        bingoLines: this.bingoLines
      };
      localStorage.setItem('bingoGameState', JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorageへの保存に失敗:', e);
    }
  }

  /**
   * loadFromStorage() - LocalStorageから状態を復元
   * 役割：保存されたデータを読み込む
   * 目的：ページ読み込み時に前回のゲーム状態を復元
   * @returns {boolean} - 復元成功時true
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('bingoGameState');
      if (saved) {
        const state = JSON.parse(saved);
        this.currentCard = state.currentCard;
        this.drawnNumbers = state.drawnNumbers || [];
        this.drawCount = state.drawCount || 0;
        this.markedPositions = state.markedPositions || [];
        this.bingoLines = state.bingoLines || [];
        return true;
      }
    } catch (e) {
      console.error('LocalStorageからの読み込みに失敗:', e);
    }
    return false;
  }

  /**
   * clearStorage() - LocalStorageをクリア
   * 役割：保存されたデータを削除
   * 目的：リセット時に永続化データも削除する
   */
  clearStorage() {
    try {
      localStorage.removeItem('bingoGameState');
    } catch (e) {
      console.error('LocalStorageのクリアに失敗:', e);
    }
  }

  // ============================================
  // データ検証・ユーティリティ
  // ============================================

  /**
   * isNumberDrawn(number) - 指定番号が抽選済みか確認
   * 役割：番号の重複チェック
   * 目的：BE①の抽選ロジックで使用
   * @param {number} number - チェックする番号
   * @returns {boolean}
   */
  isNumberDrawn(number) {
    return this.drawnNumbers.includes(number);
  }

  /**
   * hasCard() - カードが存在するか確認
   * 役割：カード生成状態のチェック
   * 目的：抽選実行前の検証に使用
   * @returns {boolean}
   */
  hasCard() {
    return this.currentCard !== null;
  }

  /**
   * getGameState() - ゲーム状態の全データを取得
   * 役割：全データを一括で返す
   * 目的：デバッグや他モジュールでの一括参照に使用
   * @returns {Object}
   */
  getGameState() {
    return {
      card: this.currentCard,
      drawnNumbers: [...this.drawnNumbers],
      drawCount: this.drawCount,
      markedPositions: [...this.markedPositions],
      bingoLines: [...this.bingoLines],
      hasCard: this.hasCard()
    };
  }
}

// シングルトンインスタンスをエクスポート
// 役割：アプリケーション全体で1つのデータ管理インスタンスを共有
// 目的：データの一貫性を保証する
const bingoDataManager = new BingoDataManager();

// グローバルスコープに公開（他のモジュールから利用可能にする）
if (typeof window !== 'undefined') {
  window.BingoDataManager = bingoDataManager;
}