const BalanceManager = (() => {
  let balance   = 1000;
  let wagered   = 0;
  let totalWins = 0;
  let totalLoss = 0;

  function getBalance() { return balance; }

  function deduct(amount) {
    balance = parseFloat((balance - amount).toFixed(2));
    wagered = parseFloat((wagered + amount).toFixed(2));
    updateUI();
  }

  function add(amount) {
    balance = parseFloat((balance + amount).toFixed(2));
    updateUI();
  }

  function recordWin(payout, bet) {
    totalWins = parseFloat((totalWins + payout).toFixed(2));
    updateProfileUI();
  }

  function recordLoss(bet) {
    totalLoss = parseFloat((totalLoss + bet).toFixed(2));
    updateProfileUI();
  }

  function updateUI() {
    const el = document.getElementById("balance-amount");
    if (el) el.textContent = balance.toLocaleString("en-US", { minimumFractionDigits: 2 });
  }

  function updateProfileUI() {
    const net = parseFloat((balance - 1000).toFixed(2));
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `$${Math.abs(val).toFixed(2)}`;
    };
    set("profile-wagered",  wagered);
    set("profile-wins",     totalWins);
    set("profile-losses",   totalLoss);
    set("profile-networth", balance);
  }

  return { getBalance, deduct, add, recordWin, recordLoss };
})();