/**
 * FE②担当: エフェクト・演出・履歴表示の制御
 */

// 履歴リストを描画する関数
// 引数 historyArray: 出た数字の配列 (例: [1, 5, 22])
function renderHistory(historyArray) {
    const listElement = document.getElementById('history-list');
    
    // 要素がない場合（index.htmlなどで読み込まれた場合）のエラー回避
    if (!listElement) return;

    listElement.innerHTML = ''; // 一旦クリア

    // 履歴がない場合
    if (!historyArray || historyArray.length === 0) {
        listElement.innerHTML = '<p>まだ履歴がありません</p>';
        return;
    }

    // 履歴をループして表示（順番を逆にして最新を最初にする等の調整もここで可能）
    historyArray.forEach((num, index) => {
        const ball = document.createElement('div');
        ball.className = 'history-ball';
        ball.textContent = num;
        
        // アニメーションを少しずらす（stagger効果）
        ball.style.animationDelay = `${index * 0.1}s`;
        
        listElement.appendChild(ball);
    });
}

// リーチやビンゴの時に呼び出すエフェクト関数（index.htmlで使用想定）
function triggerConfettiEffect() {
    console.log("FE2: 紙吹雪エフェクト発動！(ここにライブラリ等の処理を書く)");
    // もし canvas-confetti などのライブラリを使うならここで実行
    // 例: confetti({ particleCount: 100, spread: 70 });
    
    // 仮のエフェクト: 背景を一瞬フラッシュさせる
    document.body.style.backgroundColor = '#555';
    setTimeout(() => {
        document.body.style.backgroundColor = ''; // 元に戻す
    }, 200);
}

// 数字が選ばれた時の強調エフェクト
function highlightNewNumber(element) {
    element.classList.add('animate-pop');
    // CSS側で .animate-pop { animation: ... } を定義しておくと動く
}