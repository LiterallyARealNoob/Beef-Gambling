const PlinkoGame = (() => {
  // Multiplier tables indexed by landing bucket (0 = far left edge).
  // Center buckets pay least (most likely outcome), edges pay most (rarest).
  const TABLES = {
    8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [33, 11, 4, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 4, 11, 33],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  };

  function getRowOptions() {
    return Object.keys(TABLES).map(Number);
  }

  function getMultiplierTable(rows) {
    return TABLES[rows];
  }

  // Simulates the ball bouncing left/right at each peg row.
  // Returns the full path (for animation) plus the resulting bucket/multiplier/payout.
  function simulateDrop(rows) {
    const path = [];
    let bucket = 0;
    for (let i = 0; i < rows; i++) {
      const goRight = Math.random() < 0.5 ? 0 : 1;
      path.push(goRight);
      bucket += goRight;
    }
    return { path, bucket };
  }

  async function drop({ rows, betAmount }) {
    if (!TABLES[rows]) throw new Error("Invalid row count");
    if (!betAmount || betAmount <= 0) throw new Error("Enter a valid bet amount");
    if (betAmount > BalanceManager.getBalance()) throw new Error("Insufficient balance!");

    BalanceManager.deduct(betAmount);

    const { path, bucket } = simulateDrop(rows);
    const multiplier = TABLES[rows][bucket];
    const payout = parseFloat((betAmount * multiplier).toFixed(2));

    if (payout > 0) BalanceManager.add(payout);

    if (multiplier >= 1) {
      BalanceManager.recordWin(payout, betAmount);
    } else {
      BalanceManager.recordLoss(betAmount - payout);
    }

    return { rows, path, bucket, multiplier, payout, betAmount };
  }

  return { getRowOptions, getMultiplierTable, drop };
})();
