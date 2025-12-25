class BingoLogic {
  constructor() {
    this.maxNumber = 75;
    this.drawnNumbers = [];
  }

  // カード生成：5x5の2次元配列を返す
  generateCard() {
    const card = [];
    for (let i = 0; i < 5; i++) {
      const startNum = i * 15 + 1;
      const pool = Array.from({ length: 15 }, (_, idx) => startNum + idx);
      const column = [];
      for (let j = 0; j < 5; j++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        column.push(pool.splice(randomIndex, 1)[0]);
      }
      card.push(column);
    }
    // 行列入れ替え
    const transposed = card[0].map((_, i) => card.map(row => row[i]));
    transposed[2][2] = "FREE"; // 中央をFREEに
    return transposed;
  }

  // 抽選：1〜75の重複しない数字を1つ返す
  drawNumber() {
    if (this.drawnNumbers.length >= this.maxNumber) return "終了";
    let num;
    do {
      num = Math.floor(Math.random() * this.maxNumber) + 1;
    } while (this.drawnNumbers.includes(num));
    this.drawnNumbers.push(num);
    return num;
  }
}