class BingoLogic {
  constructor() {
    this.maxNumber = 75;
    this.drawnNumbers = [];
    this.cards = []; // 複数カード管理用
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

  // 複数カード対応メソッド
  // 既存の generateCard() を使って複数枚生成して内部配列に追加する
  generateCards(count) {
    const created = [];
    for (let i = 0; i < count; i++) {
      const c = this.generateCard();
      this.cards.push(c);
      created.push(c);
    }
    return created;
  }

  // 任意のカードを追加（外部で作ったカードを渡せる）
  addCard(card) {
    this.cards.push(card);
    return this.cards.length - 1; // 追加したカードのインデックス
  }

  // 登録済みカードを返す
  getCards() {
    return this.cards;
  }

  // 全カードをチェックしてビンゴの有無を返す
  // 返り値: [{ index: 0, bingo: true }, ...]
  checkAllBingos() {
    return this.cards.map((card, idx) => ({ index: idx, bingo: this.hasBingo(card) }));
  }

  // 抽選を行い、その結果でビンゴになったカードを返すユーティリティ
  drawAndCheck() {
    const num = this.drawNumber();
    const results = this.checkAllBingos().filter(r => r.bingo);
    return { number: num, winners: results };
  }

  // 判定：与えられたカードがビンゴかを判定する（縦・横・斜め）
  // card は 5x5 の配列。中央は "FREE" として扱われる。
  hasBingo(card) {
    const isMarked = (v) => v === "FREE" || this.drawnNumbers.includes(v);

    // 横チェック
    for (let r = 0; r < 5; r++) {
      let ok = true;
      for (let c = 0; c < 5; c++) {
        if (!isMarked(card[r][c])) { ok = false; break; }
      }
      if (ok) return true;
    }

    // 縦チェック
    for (let c = 0; c < 5; c++) {
      let ok = true;
      for (let r = 0; r < 5; r++) {
        if (!isMarked(card[r][c])) { ok = false; break; }
      }
      if (ok) return true;
    }

    // 斜めチェック (左上→右下)
    let ok = true;
    for (let i = 0; i < 5; i++) {
      if (!isMarked(card[i][i])) { ok = false; break; }
    }
    if (ok) return true;

    // 斜めチェック (右上→左下)
    ok = true;
    for (let i = 0; i < 5; i++) {
      if (!isMarked(card[i][4 - i])) { ok = false; break; }
    }
    if (ok) return true;

    return false;
  }
}

module.exports = BingoLogic;