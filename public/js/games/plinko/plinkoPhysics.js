// Plinko physics — generates the peg layout for a given row count
// and simulates a ball's path bouncing down through the pegs to
// land in a final multiplier slot. This is a weighted-random
// binomial walk that LOOKS like physics on screen but is fast
// and predictable for force-win purposes.

const PlinkoPhysics = (() => {
  // Multiplier tables per row count — classic Plinko shape:
  // edges pay big, center pays small. 16 rows is the only config
  // that reaches 1000x.
  const MULTIPLIER_TABLES = {
    8:  [29, 4, 1.5, 0.4, 0.3, 0.4, 1.5, 4, 29],
    12: [170, 24, 8, 2, 1.1, 0.5, 0.3, 0.5, 1.1, 2, 8, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 1.4, 0.6, 0.3, 0.6, 1.4, 2, 4, 9, 26, 130, 1000]
  };

  function getMultiplierTable(rows) {
    return MULTIPLIER_TABLES[rows] || MULTIPLIER_TABLES[12];
  }

  function simulateDrop(rows) {
    const path = [];
    let rightCount = 0;

    for (let i = 0; i < rows; i++) {
      const goesRight = Math.random() < 0.5 ? 0 : 1;
      path.push(goesRight);
      if (goesRight) rightCount++;
    }

    return { path, finalSlot: rightCount };
  }

  function simulateForcedDrop(rows, targetSlot) {
    const clampedTarget = Math.max(0, Math.min(rows, targetSlot));

    const path = Array.from({ length: rows }, (_, i) => (i < clampedTarget ? 1 : 0));

    for (let i = path.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [path[i], path[j]] = [path[j], path[i]];
    }

    return { path, finalSlot: clampedTarget };
  }

  function calculatePegPositions(rows, width, height) {
    const pegRows = [];
    const topMargin = height * 0.08;
    const bottomMargin = height * 0.18;
    const usableHeight = height - topMargin - bottomMargin;
    const rowSpacing = usableHeight / rows;

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowPegs = [];
      const spacing = width / (pegsInRow + 1);

      for (let p = 0; p < pegsInRow; p++) {
        rowPegs.push({
          x: spacing * (p + 1),
          y: topMargin + rowSpacing * row
        });
      }
      pegRows.push(rowPegs);
    }

    return pegRows;
  }

  return {
    getMultiplierTable,
    simulateDrop,
    simulateForcedDrop,
    calculatePegPositions
  };
})();