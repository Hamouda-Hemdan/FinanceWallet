document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You must log in first!");
    window.location.href = "../login.html";
    return;
  }

  try {
    const walletsRes = await fetch(`${CONFIG.BASE_URL}wallets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!walletsRes.ok) throw new Error("Failed to load wallets");
    const walletsJson = await walletsRes.json();
    const wallets = walletsJson.data || [];

    const totalWalletsEl = document.getElementById("total-wallets");
    if (totalWalletsEl) {
      totalWalletsEl.textContent = wallets.length;
    }

    const totalRes = await fetch(
      `${CONFIG.BASE_URL}wallets/total-balance?currency=USD`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!totalRes.ok) throw new Error("Failed to load total balance");
    const totalJson = await totalRes.json();
    const totalData = totalJson.data;

    const totalBalanceEl = document.getElementById("total-balance");
    if (totalBalanceEl) {
      totalBalanceEl.textContent = `${totalData.totalBalance.toFixed(2)}`;
    }

    let totalSavingsUSD = 0;
    totalData.walletBalances.forEach((w) => {
      if (w.walletType === "Savings") totalSavingsUSD += w.convertedBalance;
    });
    
    const totalSavingsEl = document.getElementById("total-savings");
    if (totalSavingsEl) {
      totalSavingsEl.textContent = `${totalSavingsUSD.toFixed(2)}`;
    }
  } catch (err) {
    console.error("Wallet load error:", err);
    
    const totalBalanceEl = document.getElementById("total-balance");
    const totalWalletsEl = document.getElementById("total-wallets");
    const totalSavingsEl = document.getElementById("total-savings");
    
    if (totalBalanceEl) totalBalanceEl.textContent = "$0.00";
    if (totalWalletsEl) totalWalletsEl.textContent = "0";
    if (totalSavingsEl) totalSavingsEl.textContent = "$0.00";
  }

  try {
    const now = new Date();
    const loginHistory = JSON.parse(
      localStorage.getItem("loginHistory") || "[]"
    );
    loginHistory.unshift({
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    });
    localStorage.setItem(
      "loginHistory",
      JSON.stringify(loginHistory.slice(0, 5))
    );

    const list = document.getElementById("login-history-list");
    if (list) {
      list.innerHTML = "";

      if (loginHistory.length === 0) {
        list.innerHTML = "<li>No login history</li>";
      } else {
        loginHistory.forEach((item) => {
          const li = document.createElement("li");
          li.innerHTML = `<span>${item.date}</span><span>${item.time}</span>`;
          list.appendChild(li);
        });
      }
    }
  } catch (err) {
    console.error("Login history error:", err);
  }
});