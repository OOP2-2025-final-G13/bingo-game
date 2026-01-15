// ============================================
// FE コントローラー・UIモジュール
// ファイル名: main.js
// ============================================

import bingoDataManager from './bingodata.js';
import BingoGameLogic from './logic.js';
import bingoRecordManager from './bingorecord.js';


/**
 * Main App Controller
 */
const App = {
    init() {
        this.cacheDOM();
        this.bindEvents();

        // データマネージャーの初期化（ロード）
        const loaded = bingoDataManager.loadFromStorage();
        if (loaded && bingoDataManager.hasCard()) {
            this.render();
        } else {
            // データがない場合は何もしない（「カード生成」待ち）
            // あるいは、最初の1枚を自動生成するか？
            // 既存仕様ではボタンで生成なので待機。
            this.render();
        }
        // ===============================
        // ページ読み込み時に最短ビンゴ記録をHTMLに表示
        // ===============================
        bingoRecordManager.getBestRecord().then(record => {
        if (record) {
             document.getElementById('record-number').textContent = record.draw_count;
             document.getElementById('record-date').textContent = bingoRecordManager.formatDateTime(record.timestamp);
        }
});
    },

    cacheDOM() {
        this.dom = {
            numDisplay: document.getElementById('num-display'),
            drawCount: document.getElementById('draw-count'),
            // Container for cards (we will output multiple cards here)
            // 既存のHTML構造: .main-layout > .card-border > #bingo-card
            // 複数枚並べるために、.main-layout をコンテナとして使う
            mainLayout: document.querySelector('.main-layout'), // カード追加場所の親

            btnDraw: document.getElementById('btn-draw'),
            btnHistory: document.getElementById('btn-history'),
            btnAddCard: document.getElementById('btn-add-card'),
            // btnGenerate: document.getElementById('btn-generate-card'),
            btnReset: document.getElementById('btn-reset'),

            // Modal elements
            modal: document.getElementById('bingo-modal'),
            btnContinue: document.getElementById('btn-continue'),
            btnEnd: document.getElementById('btn-end'),
        };
    },

    bindEvents() {
        this.dom.btnDraw.addEventListener('click', () => this.handleDraw());
        // this.dom.btnGenerate.addEventListener('click', () => this.handleGenerateCard()); // Reset & Generate 1st card
        this.dom.btnReset.addEventListener('click', () => this.handleReset());
        this.dom.btnHistory.addEventListener('click', () => this.handleShowHistory());

        this.dom.btnAddCard.addEventListener('click', () => this.handleAddCard());

        // Modal events
        this.dom.btnContinue.addEventListener('click', () => this.hideModal());
        this.dom.btnEnd.addEventListener('click', () => {
            this.hideModal();
            alert('ゲーム終了！リセットします。');
            this.handleReset();
        });
    },

    showModal() {
        this.dom.modal.classList.add('active');
    },

    hideModal() {
        this.dom.modal.classList.remove('active');
    },

    /**
     * "カード生成" (Initial Generate / Reset)
     */
    handleGenerateCard() {
        // 確認ダイアログ（既存データがある場合）
        if (bingoDataManager.hasCard() && !confirm('新しいカードを生成しますか？現在の進行状況はリセットされます。')) {
            return;
        }

        const newCard = BingoGameLogic.generateCard();
        bingoDataManager.init(); // 全データリセット
        bingoDataManager.addCard(newCard); // 1枚目追加

        this.render();
    },

    /**
     * "＋" (Add Card)
     */
    handleAddCard() {
        if (bingoDataManager.getCards().length >= 2) {
            alert('カードはこれ以上追加できません（最大2枚まで）。');
            return;
        }

        // カードデータ生成
        const newCard = BingoGameLogic.generateCard();
        bingoDataManager.addCard(newCard);

        // 既存の抽選済み番号があれば、新しいカードにも適用すべき？
        // 普通ビンゴでは途中参加の場合、過去の番号は埋めることが多い
        // ここでは「手動」マーク or 自動マーク（廃止済み）
        // ユーザーが手動で埋める運用なので、何もしない。

        this.render();
    },

    handleDraw() {
        if (!bingoDataManager.hasCard()) {
            alert('先にカードを生成してください。');
            return;
        }

        const currentDrawn = bingoDataManager.getDrawnNumbers();
        // アニメーション演出
        let count = 0;
        const maxCount = 10;
        const interval = setInterval(() => {
            this.dom.numDisplay.textContent = Math.floor(Math.random() * 75) + 1;
            count++;
            if (count > maxCount) {
                clearInterval(interval);
                this.finalizeDraw(currentDrawn);
            }
        }, 50);
    },

    finalizeDraw(currentDrawn) {
        const newNumber = BingoGameLogic.drawNumber(currentDrawn);

        if (newNumber === null) {
            alert('全ての数字が出ました！');
            return;
        }

        bingoDataManager.addDrawnNumber(newNumber);
        this.render();
    },

    handleReset() {
        if (!confirm('本当にリセットしますか？')) return;

        bingoDataManager.reset();
        this.render();
    },

    handleShowHistory() {
        window.location.href = 'history.html';
    },

    handleCardClick(cardIndex, row, col) {
        const cardState = bingoDataManager.getCard(cardIndex);
        const number = cardState.grid[row][col];

        // FREEは常にクリック可能（または無視）だが、数字の場合は抽選済みかチェック
        if (number !== 'FREE') {
            const drawnNumbers = bingoDataManager.getDrawnNumbers();
            if (!drawnNumbers.includes(number)) {
                console.log(`Number ${number} has not been drawn yet.`);
                return; // 抽選されていない数字はマークできない
            }
        }

        // 手動マーク切り替え
        bingoDataManager.toggleMarkByPosition(cardIndex, row, col);

        // ビンゴ判定 (特定カードのみ)
        const lines = BingoGameLogic.checkBingo(
            cardState.grid,
            cardState.markedPositions
        );
        bingoDataManager.setBingoLines(cardIndex, lines);

        // ビンゴ通知制御 (1回だけ)
        const isAnnounced = bingoDataManager.isBingoAnnounced(cardIndex);

        // ===============================
        // ビンゴ達成時：最短記録をサーバーに送信＆HTML更新
        // ===============================
        if (lines.length > 0 && !isAnnounced) {
            this.showModal();
            bingoDataManager.setBingoAnnounced(cardIndex, true);

            const drawCount = bingoDataManager.getDrawCount();

            bingoRecordManager.addRecord(drawCount)
                .then(record => {
                if (record) {
                    document.getElementById('record-number').textContent = record.draw_count;
                    document.getElementById('record-date').textContent = bingoRecordManager.formatDateTime(record.timestamp);
                }
            })
            .catch(err => console.error(err));
        }

        this.render();
    },

    render() {
        // 抽選番号
        const drawnNumbers = bingoDataManager.getDrawnNumbers();
        const lastNumber = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : '--';
        this.dom.numDisplay.textContent = lastNumber;

        // 回数
        this.dom.drawCount.textContent = bingoDataManager.getDrawCount();

        // カード描画 (複数対応)
        this.renderCards();
    },

    renderCards() {
        // カードエリアをリセットするが、ボタン(.plus-area)とサイドパネル(.side-panel)は残したい
        // しかし構造上、.main-layout の直下にカード枠、プラスボタン、サイドパネルがある。
        // なので、一度 .main-layout の中身を整理する必要がある。

        // 簡易的な方法：既存の .card-border を全て削除し、再生成して insertBefore する。
        const existingCards = this.dom.mainLayout.querySelectorAll('.card-border');
        existingCards.forEach(el => el.remove());

        const cards = bingoDataManager.getCards();
        const refElement = this.dom.btnAddCard; // プラスボタンの前に挿入

        cards.forEach((cardState, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.classList.add('card-border');

            const grid = document.createElement('div');
            grid.classList.add('bingo-grid');
            grid.id = `bingo-card-${index}`; // Unique ID helper

            cardState.grid.forEach((row, rIndex) => {
                row.forEach((value, cIndex) => {
                    const cell = document.createElement("div");
                    cell.classList.add("cell");
                    cell.textContent = value;

                    // マーク状態
                    const isMarked = cardState.markedPositions.some(p => p.row === rIndex && p.col === cIndex);
                    if (isMarked) {
                        cell.classList.add("hit");
                    }

                    if (value === "FREE") {
                        cell.classList.add("free");
                    }

                    // Click w/ card index
                    cell.addEventListener("click", () => this.handleCardClick(index, rIndex, cIndex));

                    grid.appendChild(cell);
                });
            });

            cardWrapper.appendChild(grid);
            this.dom.mainLayout.insertBefore(cardWrapper, refElement);
        });

        // 2枚以上の場合は追加ボタンを非表示にする
        if (cards.length >= 2) {
            this.dom.btnAddCard.style.display = 'none';
        } else {
            this.dom.btnAddCard.style.display = 'flex'; // or block/inline-flex depending on CSS. .plus-area is flex.
        }
    }
};

// アプリ起動
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
