document.addEventListener('DOMContentLoaded', () => {
    // 要素取得
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const nameInput = document.getElementById('name-input');
    
    // ご提示のHTML内の要素
    const outerFrame = document.querySelector('.outer-frame');
    const playerNameDisplay = document.getElementById('player-name-display');
    const currentNumberDisplay = document.getElementById('num-display');
    const drawBtn = document.getElementById('btn-draw');
    const drawCountDisplay = document.getElementById('draw-count');

    // データ初期化
    let bingoNumbers = [];
    for (let i = 1; i <= 75; i++) {
        bingoNumbers.push(i);
    }
    let totalDraws = 0;
    let isAnimating = false;

    // --- 1. ゲームスタート処理 ---
    startBtn.addEventListener('click', () => {
        const name = nameInput.value;
        if (name.trim() === "") {
            alert("名前を入力してください");
            return;
        }

        // 名前を表示
        playerNameDisplay.textContent = name;
        playerNameDisplay.style.display = "block"; // 表示ON

        // 画面切り替え
        startScreen.style.display = "none";
        outerFrame.style.display = "block"; // ゲーム画面表示
    });

    // --- 2. 抽選ボタン処理（ルーレット演出） ---
    drawBtn.addEventListener('click', () => {
        if (bingoNumbers.length === 0 || isAnimating) return;

        isAnimating = true;
        drawBtn.disabled = true;

        // 正解決定
        const randomIndex = Math.floor(Math.random() * bingoNumbers.length);
        const drawnNumber = bingoNumbers[randomIndex];
        bingoNumbers.splice(randomIndex, 1);

        // ★演出ループ
        let count = 0;
        const maxCount = 20;

        const timer = setInterval(() => {
            const dummyNum = Math.floor(Math.random() * 75) + 1;
            currentNumberDisplay.textContent = dummyNum;
            count++;

            if (count > maxCount) {
                clearInterval(timer);
                
                // 結果表示
                currentNumberDisplay.textContent = drawnNumber;
                
                // 回数更新
                totalDraws++;
                drawCountDisplay.textContent = totalDraws;

                // 終了判定
                if (bingoNumbers.length === 0) {
                    currentNumberDisplay.textContent = "END";
                    drawBtn.textContent = "終了";
                } else {
                    drawBtn.disabled = false;
                }
                
                isAnimating = false;
            }
        }, 50);
    });
});