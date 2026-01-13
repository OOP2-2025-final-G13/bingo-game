/**
 * FE②担当: エフェクト・演出・履歴表示の制御
 */

// 履歴リストを描画する関数
// 引数 historyArray: 出た数字の配列 (例: [1, 5, 22])
const Effects = {
    // 履歴リストを描画する関数
    renderHistory(historyArray) {
        const listElement = document.getElementById('history-list');

        if (!listElement) return;

        listElement.innerHTML = ''; // 一旦クリア

        if (!historyArray || historyArray.length === 0) {
            // グリッドのスタイルを崩さないようにセルに入れてメッセージを表示
            listElement.style.display = 'block';
            listElement.style.border = 'none';
            listElement.innerHTML = '<p style="text-align:center; padding:20px;">まだ履歴がありません</p>';
            return;
        }

        // グリッドスタイルを適用
        listElement.style.display = 'grid';
        listElement.style.border = '2px solid #333';

        // 最新のいくつかを強調するか（例: 最新の3つ）
        const highlightCount = 3;
        const startIndexToHighlight = Math.max(0, historyArray.length - highlightCount);

        // 履歴をループして表示
        // ※画像に合わせて、古い順（配列の最初から）に表示します
        historyArray.forEach((num, index) => {
            const cell = document.createElement('div');
            cell.className = 'history-cell'; // クラス名を変更
            cell.textContent = num;

            // 最新の数字（配列の最後の方）だけ赤くするクラスを追加
            if (index >= startIndexToHighlight) {
                cell.classList.add('highlight-red');
            }

            // 派手なアニメーションは削除しました
            // cell.style.animationDelay = `${index * 0.05}s`;

            listElement.appendChild(cell);
        });

        // グリッドを綺麗に見せるための空セル埋め（オプション）
        // 10の倍数になるまで空のセルを追加して見た目を整える
        const cellsPerRow = 10; // CSSのgrid-template-columnsと合わせる
        const emptyCellsNeeded = cellsPerRow - (historyArray.length % cellsPerRow);
        if (emptyCellsNeeded < cellsPerRow) {
            for (let i = 0; i < emptyCellsNeeded; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'history-cell';
                // 空セルは少し色を変えるなどの調整も可能
                emptyCell.style.backgroundColor = '#a6c2de';
                listElement.appendChild(emptyCell);
            }
        }
    },
};

export default Effects;