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
              <button class="transfer-btn" data-id="${wallet.walletId}" data-name="${wallet.name}" data-balance="${wallet.balance}" data-currency="${wallet.currency}">Transfer</button>
              <button class="edit-btn" data-id="${wallet.walletId}">Edit</button>
              <button class="delete-btn" data-id="${wallet.walletId}">Delete</button>
            </div>
          </div>
        `
        )
        .join("");

      // Add event listeners for transfer buttons
      document.querySelectorAll(".transfer-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const walletId = e.target.dataset.id;
          const walletName = e.target.dataset.name;
          const walletBalance = e.target.dataset.balance;
          const walletCurrency = e.target.dataset.currency;
          openTransferPopup(
            walletId,
            walletName,
            walletBalance,
            walletCurrency
          );
        });
      });

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

  // Transfer functionality
  let currentTransferData = {
    sourceWalletId: null,
    fromWalletCurrency: null,
    toWalletCurrency: null,
  };

  // Open transfer popup
  async function openTransferPopup(
    walletId,
    walletName,
    walletBalance,
    walletCurrency
  ) {
    const transferPopup = document.getElementById("transfer-popup");
    const fromWalletName = document.getElementById("from-wallet-name");
    const fromWalletBalance = document.getElementById("from-wallet-balance");
    const toWalletSelect = document.getElementById("to-wallet-select");

    fromWalletName.textContent = walletName;
    fromWalletBalance.textContent = `${walletBalance} ${walletCurrency}`;

    currentTransferData.sourceWalletId = walletId;
    currentTransferData.fromWalletCurrency = walletCurrency;

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

      // Filter out the current wallet
      const otherWallets = wallets.filter((w) => w.walletId !== walletId);

      toWalletSelect.innerHTML = "";
      otherWallets.forEach((wallet) => {
        const option = document.createElement("option");
        option.value = wallet.walletId;
        option.textContent = `${wallet.name} (${wallet.balance} ${wallet.currency})`;
        option.dataset.currency = wallet.currency;
        toWalletSelect.appendChild(option);
      });

      // Set the first wallet as selected by default
      if (otherWallets.length > 0) {
        toWalletSelect.selectedIndex = 0;
        currentTransferData.toWalletCurrency = otherWallets[0].currency;
        updateConvertedAmount();
      }

      transferPopup.classList.add("active");
    } catch (err) {
      console.error("Error loading wallets for transfer:", err);
      alert("Failed to load wallets for transfer");
    }
  }

  // Handle "to" wallet selection change
  document
    .getElementById("to-wallet-select")
    .addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      currentTransferData.toWalletCurrency = selectedOption.dataset.currency;
      updateConvertedAmount();
    });

  // Handle amount input change
  document
    .getElementById("transfer-amount")
    .addEventListener("input", updateConvertedAmount);

  // Update converted amount display with real exchange rates
  async function updateConvertedAmount() {
    const amountInput = document.getElementById("transfer-amount");
    const convertedAmountDisplay = document.getElementById("converted-amount");
    const amount = parseFloat(amountInput.value) || 0;

    // Display the amount with currency information
    if (
      currentTransferData.fromWalletCurrency ===
      currentTransferData.toWalletCurrency
    ) {
      convertedAmountDisplay.textContent = `${amount.toFixed(2)} ${
        currentTransferData.toWalletCurrency
      }`;
    } else {
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${currentTransferData.fromWalletCurrency}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.rates && data.rates[currentTransferData.toWalletCurrency]) {
            const rate = data.rates[currentTransferData.toWalletCurrency];
            const convertedAmount = amount * rate;
            convertedAmountDisplay.textContent = `${amount.toFixed(2)} ${
              currentTransferData.fromWalletCurrency
            } = ${convertedAmount.toFixed(2)} ${
              currentTransferData.toWalletCurrency
            } (Rate: ${rate.toFixed(4)})`;
          } else {
            convertedAmountDisplay.textContent = `${amount.toFixed(2)} ${
              currentTransferData.fromWalletCurrency
            } (Cannot get rate for ${currentTransferData.toWalletCurrency})`;
          }
        } else {
          convertedAmountDisplay.textContent = `${amount.toFixed(2)} ${
            currentTransferData.fromWalletCurrency
          } (Rate service unavailable)`;
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        convertedAmountDisplay.textContent = `${amount.toFixed(2)} ${
          currentTransferData.fromWalletCurrency
        } (Rate service error)`;
      }
    }
  }

  // Confirm transfer
  document
    .getElementById("confirm-transfer")
    .addEventListener("click", async () => {
      const toWalletId = document.getElementById("to-wallet-select").value;
      const amount = parseFloat(
        document.getElementById("transfer-amount").value
      );

      if (!toWalletId) {
        alert("Please select a destination wallet");
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than zero");
        return;
      }

      try {
        // Prepare transfer data according to API specification
        const transferData = {
          sourceWalletId: currentTransferData.sourceWalletId,
          destinationWalletId: toWalletId,
          amount: amount,
        };

        // Send transfer request
        const response = await fetch(`${CONFIG.BASE_URL}wallets/transfer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transferData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Transfer failed: ${errorText}`;

          // Try to parse JSON error response
          try {
            const errorObj = JSON.parse(errorText);
            if (errorObj.message) {
              errorMessage = `Transfer failed: ${errorObj.message}`;
            }
          } catch (e) {
            // If parsing fails, use the raw error text
          }

          throw new Error(errorMessage);
        }

        document.getElementById("transfer-popup").classList.remove("active");
        alert("Transfer completed successfully!");
        loadWallets();

        document.getElementById("transfer-amount").value = "";
        document.getElementById("exchange-rate").value = "";
      } catch (err) {
        console.error("Transfer error:", err);
        alert(`Transfer failed: ${err.message}`);
      }
    });

  document.getElementById("cancel-transfer").addEventListener("click", () => {
    document.getElementById("transfer-popup").classList.remove("active");
  });

  // Close transfer popup when clicking outside
  document.getElementById("transfer-popup").addEventListener("click", (e) => {
    if (e.target.id === "transfer-popup") {
      e.target.classList.remove("active");
    }
  });
});
