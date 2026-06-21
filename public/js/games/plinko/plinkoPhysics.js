const PlinkoPhysics = (() => {
  // Returns pegRows: an array of rows, each containing {x, y} peg positions.
  // Row 0 has 3 pegs, each subsequent row adds one more peg — standard
  // triangular plinko board shape.
  function calculatePegPositions(rows, width, height) {
    const topMargin = height * 0.10;
    const bottomMargin = height * 0.22; // leaves room above the slot row at 0.92
    const usableHeight = height - topMargin - bottomMargin;
    const rowGap = rows > 1 ? usableHeight / (rows - 1) : 0;

    const pegRows = [];
    for (let r = 0; r < rows; r++) {
      const pegCount = r + 3;
      const rowY = topMargin + r * rowGap;
      const spacing = width / (pegCount + 1);
      const rowPegs = [];
      for (let c = 0; c < pegCount; c++) {
        rowPegs.push({ x: spacing * (c + 1), y: rowY });
      }
      pegRows.push(rowPegs);
    }
    return pegRows;
  }

  return { calculatePegPositions };
})();
