/**
 * FE②担当: エフェクト・演出・履歴表示の制御
 */

// 履歴リストを描画する関数
// 引数 historyArray: 出た数字の配列 (例: [1, 5, 22])
const Effects = {
    // 履歴リストを描画する関数
    renderHistory(historyArray) {
        const listElement = document.getElementById('history-list');

        // 要素がない場合（index.htmlなどで読み込まれた場合）のエラー回避
        if (!listElement) return;

        listElement.innerHTML = ''; // 一旦クリア

        // 履歴がない場合
        if (!historyArray || historyArray.length === 0) {
            listElement.innerHTML = '<p>まだ履歴がありません</p>';
            return;
        }

        // 履歴をループして表示
        historyArray.forEach((num, index) => {
            const ball = document.createElement('div');
            ball.className = 'history-ball';
            ball.textContent = num;
            ball.style.animationDelay = `${index * 0.1}s`;
            listElement.appendChild(ball);
        });
    }
};

export default Effects;