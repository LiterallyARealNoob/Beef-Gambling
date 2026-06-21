// Plinko game — core state and drop logic. Talks to PlinkoPhysics
// for the actual bounce simulation and exposes results for the
// renderer/VFX layer to animate.

const PlinkoGame = (() => {
  const ROW_OPTIONS = [8, 12, 16];

  let state = {
    rows: 12,
    betAmount: 10,
    history: [],       // every result this session: { multiplier, payout, slot }
    lastBigWin: null   // { multiplier, payout } — only the most recent big win
  };

  function getRowOptions() {
    return ROW_OPTIONS;
  }

  function getMultiplierTable(rows) {
    return PlinkoPhysics.getMultiplierTable(rows);
  }

  function getState() {
    return { ...state, history: [...state.history] };
  }

  function setRows(rows) {
    if (!ROW_OPTIONS.includes(rows)) throw new Error("Invalid row count");
    state.rows = rows;
  }

  function dropBall(betAmount, forcedSlot = null) {
    if (!betAmount || betAmount <= 0) {
      throw new Error("Enter a valid bet amount");
    }

    const table = PlinkoPhysics.getMultiplierTable(state.rows);
    const sim = forcedSlot !== null
      ? PlinkoPhysics.simulateForcedDrop(state.rows, forcedSlot)
      : PlinkoPhysics.simulateDrop(state.rows);

    const multiplier = table[sim.finalSlot];
    const payout = parseFloat((betAmount * multiplier).toFixed(2));

    const result = {
      path: sim.path,
      slot: sim.finalSlot,
      multiplier,
      payout,
      betAmount,
      isTopSlot: sim.finalSlot === 0 || sim.finalSlot === table.length - 1,
      isMaxMultiplier: multiplier === Math.max(...table)
    };

    state.history.unshift({ multiplier, payout, slot: sim.finalSlot });
    if (state.history.length > 50) state.history.pop();

    if (result.isTopSlot) {
      state.lastBigWin = { multiplier, payout };
    }

    return result;
  }

  return {
    getRowOptions,
    getMultiplierTable,
    getState,
    setRows,
    dropBall
  };
})();