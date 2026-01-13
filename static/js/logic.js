// ============================================
// BE① 抽選・判定ロジックモジュール
// ファイル名: logic.js
// ============================================

/**
 * BingoGameLogic
 * 役割：ビンゴゲームの計算ロジックを提供
 * 目的：状態を持たず、入力に対して結果を返す純粋な関数群として機能させる
 */
class BingoGameLogic {

    /**
     * generateCard() - ビンゴカード生成
     * 役割：5x5の有効なビンゴカード配列を作成
     * 目的：ルールに基づいたランダムなカードを提供する
     * ルール：
     *  B列: 1-15
     *  I列: 16-30
     *  N列: 31-45 (中央はFREE)
     *  G列: 46-60
     *  O列: 61-75
     * @returns {Array<Array<number|string>>} 5x5配列
     */
    static generateCard() {
        const card = [];
        const ranges = [
            { min: 1, max: 15 },
            { min: 16, max: 30 },
            { min: 31, max: 45 },
            { min: 46, max: 60 },
            { min: 61, max: 75 }
        ];

        // 各列の数字を生成
        const columns = ranges.map(range => {
            const nums = [];
            while (nums.length < 5) {
                const n = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                if (!nums.includes(n)) {
                    nums.push(n);
                }
            }
            return nums;
        });

        // 行と列を入れ替えて5x5の形にする (Transposing)
        for (let r = 0; r < 5; r++) {
            const row = [];
            for (let c = 0; c < 5; c++) {
                row.push(columns[c][r]);
            }
            card.push(row);
        }

        // 中央をFREEにする
        card[2][2] = "FREE";

        return card;
    }

    /**
     * drawNumber(excludedNumbers) - 抽選処理
     * 役割：まだ出ていない番号からランダムに1つ選ぶ
     * 目的：抽選ボタン押下時の数値を決定する
     * @param {Array<number>} excludedNumbers - 既に出た番号のリスト
     * @returns {number|null} 抽選された番号。全て出尽くした場合はnull
     */
    static drawNumber(excludedNumbers) {
        const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
        const availableNumbers = allNumbers.filter(n => !excludedNumbers.includes(n));

        if (availableNumbers.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        return availableNumbers[randomIndex];
    }

    /**
     * checkBingo(card, markedPositions) - ビンゴ判定
     * 役割：現在のカードと穴あけ状態でビンゴがあるか判定
     * 目的：ビンゴ成立時に演出を行うための情報を返す
     * @param {Array<Array<number|string>>} card - 現在のカード
     * @param {Array<{row: number, col: number}>} markedPositions - マーク済み位置
     * @returns {Array<Object>} 成立したライン情報の配列
     */
    static checkBingo(card, markedPositions) {
        const bingoLines = [];
        if (!card) return bingoLines;

        // ヘルパー: 指定位置がマークされているか
        const isMarked = (r, c) => markedPositions.some(p => p.row === r && p.col === c);

        // 横列のチェック
        for (let r = 0; r < 5; r++) {
            if ([0, 1, 2, 3, 4].every(c => isMarked(r, c))) {
                bingoLines.push({ type: 'row', index: r });
            }
        }

        // 縦列のチェック
        for (let c = 0; c < 5; c++) {
            if ([0, 1, 2, 3, 4].every(r => isMarked(r, c))) {
                bingoLines.push({ type: 'col', index: c });
            }
        }

        // 斜めのチェック (左上-右下)
        if ([0, 1, 2, 3, 4].every(i => isMarked(i, i))) {
            bingoLines.push({ type: 'diagonal', direction: 'main' });
        }

        // 斜めのチェック (右上-左下)
        if ([0, 1, 2, 3, 4].every(i => isMarked(i, 4 - i))) {
            bingoLines.push({ type: 'diagonal', direction: 'antimain' });
        }

        return bingoLines;
    }
}

export default BingoGameLogic;
