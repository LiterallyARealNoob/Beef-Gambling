const PlinkoPhysics = (() => {
  function calculatePegPositions(rows, W, H) {
    const topPad    = H * 0.06;
    const botPad    = H * 0.16;
    const usableH   = H - topPad - botPad;
    const rowGap    = rows > 1 ? usableH / (rows - 1) : 0;
    const pegRows   = [];

    for (let r = 0; r < rows; r++) {
      const count   = r + 3;
      const y       = topPad + r * rowGap;
      const spacing = W / (count + 1);
      pegRows.push(
        Array.from({ length: count }, (_, c) => ({ x: spacing * (c + 1), y }))
      );
    }
    return pegRows;
  }

  // Build waypoints that arc BETWEEN pegs — ball curves left or right
  // naturally, like a real plinko ball bouncing off pegs
  function buildWaypoints(rows, pegRows, bucket, W, H) {
    const waypoints = [];
    const slotW     = W / (rows + 1);

    // drop point — slightly random horizontally near center
    waypoints.push({ x: W / 2 + (Math.random() - 0.5) * 8, y: H * 0.01 });

    let col = 0; // current column index within row
    for (let r = 0; r < rows; r++) {
      // Determine direction to eventually reach target bucket
      // Use a biased coin — steered toward bucket but still random-ish
      const remaining   = rows - r;
      const needed      = bucket - col;
      const bias        = 0.5 + (needed / remaining) * 0.3;
      const goRight     = Math.random() < Math.min(Math.max(bias, 0.15), 0.85);
      if (goRight) col++;

      const rowPegs     = pegRows[r];
      const pegIdx      = Math.min(Math.max(col, 0), rowPegs.length - 1);
      const peg         = rowPegs[pegIdx];

      // Arc midpoint slightly offset in direction traveled
      const prevWP      = waypoints[waypoints.length - 1];
      const midX        = (prevWP.x + peg.x) / 2 + (goRight ? 4 : -4);
      const midY        = (prevWP.y + peg.y) / 2 - 3;
      waypoints.push({ x: midX, y: midY, arc: true });
      waypoints.push({ x: peg.x, y: peg.y, isPeg: true });
    }

    // glide into final slot
    const finalX = slotW * bucket + slotW / 2;
    const finalY = H * 0.88;
    const lastWP = waypoints[waypoints.length - 1];
    waypoints.push({ x: (lastWP.x + finalX) / 2, y: (lastWP.y + finalY) / 2 });
    waypoints.push({ x: finalX, y: finalY, isSlot: true });

    return waypoints;
  }

  return { calculatePegPositions, buildWaypoints };
})();