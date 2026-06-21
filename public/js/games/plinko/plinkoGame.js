const PlinkoGame = (() => {
  // Exact Stake-style multiplier tables per risk + rows
  const TABLES = {
    low: {
      8:  [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
      12: [8.1, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 8.1],
      16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
    },
    medium: {
      8:  [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      12: [24, 6, 2, 1.4, 0.6, 0.4, 0.2, 0.4, 0.6, 1.4, 2, 6, 24],
      16: [170, 24, 8, 3, 1.5, 0.8, 0.4, 0.2, 0.2, 0.4, 0.8, 1.5, 3, 8, 24, 170]
    },
    high: {
      8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
      12: [33, 11, 4, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 4, 11, 33],
      16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
    }
  };

  // Slot colors: purple/red = high mult, green = safe, gray = low
  const COLORS = {
    low: {
      8:  ["#c84b11","#e07020","#c8a020","#a0b020","#557722","#a0b020","#c8a020","#e07020","#c84b11"],
      12: ["#c84b11","#d05010","#e07020","#d08020","#b0a020","#809020","#557722","#809020","#b0a020","#d08020","#e07020","#d05010","#c84b11"],
      16: ["#c84b11","#c84b11","#d06010","#e07820","#e07820","#c8a020","#b0b020","#809020","#557722","#809020","#b0b020","#c8a020","#e07820","#e07820","#d06010","#c84b11","#c84b11"]
    },
    medium: {
      8:  ["#9c1515","#c84b11","#d08020","#808020","#4a6622","#808020","#d08020","#c84b11","#9c1515"],
      12: ["#7b1010","#9c1515","#c84b11","#d08020","#808020","#4a6020","#2d5022","#4a6020","#808020","#d08020","#c84b11","#9c1515","#7b1010"],
      16: ["#6a0080","#7b1010","#9c1515","#c84b11","#d06010","#c08020","#808020","#4a6020","#4a6020","#808020","#c08020","#d06010","#c84b11","#9c1515","#7b1010","#6a0080"]
    },
    high: {
      8:  ["#7b1010","#c84b11","#d08020","#4a6020","#2d5022","#4a6020","#d08020","#c84b11","#7b1010"],
      12: ["#6a0000","#7b1010","#c84b11","#d06010","#808020","#4a6020","#2d5022","#4a6020","#808020","#d06010","#c84b11","#7b1010","#6a0000"],
      16: ["#4a0060","#6a0000","#7b1010","#c84b11","#c84b11","#d06010","#4a6020","#2d5022","#2d5022","#4a6020","#d06010","#c84b11","#c84b11","#7b1010","#6a0000","#4a0060","#4a0060"]
    }
  };

  function getRiskOptions()  { return ["low","medium","high"]; }
  function getRowOptions()   { return [8, 12, 16]; }

  function getMultiplierTable(risk, rows) {
    return TABLES[risk]?.[rows] || TABLES.high[16];
  }

  function getColorTable(risk, rows) {
    return COLORS[risk]?.[rows] || COLORS.high[16];
  }

  function simulateBucket(rows) {
    let pos = 0;
    for (let i = 0; i < rows; i++) pos += Math.random() < 0.5 ? 0 : 1;
    return pos;
  }

  async function drop({ risk, rows, betAmount }) {
    if (!TABLES[risk]?.[rows]) throw new Error("Invalid settings");
    if (!betAmount || betAmount <= 0) throw new Error("Enter a valid bet amount");
    if (betAmount > BalanceManager.getBalance()) throw new Error("Insufficient balance!");

    BalanceManager.deduct(betAmount);

    const bucket     = simulateBucket(rows);
    const multiplier = TABLES[risk][rows][bucket];
    const payout     = parseFloat((betAmount * multiplier).toFixed(2));

    if (payout > 0) BalanceManager.add(payout);
    if (multiplier >= 1) BalanceManager.recordWin(payout, betAmount);
    else BalanceManager.recordLoss(betAmount - payout);

    return { risk, rows, bucket, multiplier, payout, betAmount };
  }

  return { getRiskOptions, getRowOptions, getMultiplierTable, getColorTable, drop };
})();