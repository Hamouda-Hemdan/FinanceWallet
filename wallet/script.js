document.addEventListener("DOMContentLoaded", async () => {
  const walletGrid = document.getElementById("wallet-grid");
  const token = localStorage.getItem("token");

  // Load enums for popup selects
  async function loadEnums() {
    try {
      const currencyResponse = await fetch(
        `${CONFIG.BASE_URL}api/enums/currency-types`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!currencyResponse.ok)
        throw new Error(
          `Failed to fetch currency types: ${currencyResponse.status}`
        );
      const currencyResult = await currencyResponse.json();
      const currencies = currencyResult.data || [];
      const currencySelect = document.getElementById("popup-currency-select");
      currencySelect.innerHTML = "";
      currencies.forEach((c) => {
        const option = document.createElement("option");
        option.value = c.value;
        option.textContent = c.name;
        currencySelect.appendChild(option);
      });

      const walletTypeResponse = await fetch(
        `${CONFIG.BASE_URL}api/enums/wallet-types`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!walletTypeResponse.ok)
        throw new Error(
          `Failed to fetch wallet types: ${walletTypeResponse.status}`
        );
      const walletTypeResult = await walletTypeResponse.json();
      const walletTypes = walletTypeResult.data || [];
      const walletTypeSelect = document.getElementById("popup-type-select");
      walletTypeSelect.innerHTML = "";
      walletTypes.forEach((w) => {
        const option = document.createElement("option");
        option.value = w.value;
        option.textContent = w.name;
        walletTypeSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading enums:", error);
    }
  }

  await loadEnums();

  // Load wallets
  async function loadWallets() {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}wallets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      const wallets = Array.isArray(data) ? data : data.data || [];

      if (!wallets.length) {
        walletGrid.innerHTML = `<p style="text-align:center;color:#555;">No wallets found.</p>`;
        return;
      }

      walletGrid.innerHTML = wallets
        .map(
          (wallet) => `
          <div class="wallet-card" data-id="${wallet.walletId}">
            <h3 class="wallet-name">${wallet.name}</h3>
            <p class="wallet-balance">Balance: <span>${wallet.balance}</span></p>
            <p class="wallet-currency">Currency: <span>${wallet.currency}</span></p>
            <p class="wallet-type">Type: <span>${wallet.walletType}</span></p>
            <div class="wallet-actions">
              <button class="edit-btn" data-id="${wallet.walletId}">Edit</button>
              <button class="delete-btn" data-id="${wallet.walletId}">Delete</button>
            </div>
          </div>
        `
        )
        .join("");

      document.querySelectorAll(".wallet-card").forEach((card) => {
        card.addEventListener("click", async (e) => {
          if (e.target.tagName === "BUTTON") return;
          const walletId = card.dataset.id;
          openPopup(walletId, false);
        });
      });

      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const walletId = e.target.dataset.id;
          openPopup(walletId, true);
        });
      });

      // Delete button click
      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const walletId = e.target.dataset.id;
          if (confirm("Are you sure you want to delete this wallet?")) {
            try {
              const res = await fetch(`${CONFIG.BASE_URL}wallets/${walletId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error("Failed to delete wallet");
              alert("Wallet deleted!");
              loadWallets();
            } catch (err) {
              console.error(err);
              alert("Failed to delete wallet");
            }
          }
        });
      });
    } catch (err) {
      console.error("Error loading wallets:", err);
      walletGrid.innerHTML = `<p style="text-align:center;color:red;">Failed to load wallets.</p>`;
    }
  }

  await loadWallets();

  // Open popup (view/edit)
  async function openPopup(walletId, isEditMode) {
    const popup = document.getElementById("wallet-popup");
    try {
      const response = await fetch(`${CONFIG.BASE_URL}wallets/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      const wallet = result.data;

      document.getElementById("popup-wallet-name").textContent = wallet.name;
      document.getElementById("popup-name").value = wallet.name;
      document.getElementById("popup-balance-input").value = wallet.balance;
      document.getElementById("popup-currency-select").value = wallet.currency;
      document.getElementById("popup-type-select").value = wallet.walletType;
      document.getElementById("popup-created").textContent = new Date(
        wallet.createdAt
      ).toLocaleString();

      // Enable/disable fields based on mode
      document.getElementById("popup-name").disabled = !isEditMode;
      document.getElementById("popup-balance-input").disabled = !isEditMode;
      document.getElementById("popup-currency-select").disabled = !isEditMode;
      document.getElementById("popup-type-select").disabled = !isEditMode;

      document.getElementById("save-wallet").style.display = isEditMode
        ? "inline-block"
        : "none";

      popup.dataset.editId = walletId;
      popup.classList.add("active");
    } catch (err) {
      console.error(err);
      alert("Failed to load wallet");
    }
  }

  // Save wallet changes
  document.getElementById("save-wallet").addEventListener("click", async () => {
    const popup = document.getElementById("wallet-popup");
    const walletId = popup.dataset.editId;

    const updatedWallet = {
      name: document.getElementById("popup-name").value,
      balance: parseFloat(document.getElementById("popup-balance-input").value),
      currency: document.getElementById("popup-currency-select").value,
      walletType: document.getElementById("popup-type-select").value,
    };

    try {
      const res = await fetch(`${CONFIG.BASE_URL}wallets/${walletId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedWallet),
      });
      if (!res.ok) throw new Error("Failed to update wallet");

      popup.classList.remove("active");
      alert("Wallet updated!");
      loadWallets();
    } catch (err) {
      console.error(err);
      alert("Failed to update wallet");
    }
  });

  document.getElementById("close-popup").addEventListener("click", () => {
    document.getElementById("wallet-popup").classList.remove("active");
  });

  document.getElementById("wallet-popup").addEventListener("click", (e) => {
    if (e.target.id === "wallet-popup") e.target.classList.remove("active");
  });
});
