const addWalletBtn = document.querySelector(".add-wallet-btn");
const walletPopup = document.getElementById("wallet-popup");
const cancelPopupBtn = document.getElementById("cancel-popup");
const walletForm = document.getElementById("wallet-form");

addWalletBtn.addEventListener("click", () => {
  walletPopup.style.display = "flex";
});

cancelPopupBtn.addEventListener("click", () => {
  walletPopup.style.display = "none";
});

function setupCustomSelect(wrapperId, optionsArray) {
  const wrapper = document.getElementById(wrapperId);
  const selected = wrapper.querySelector(".selected");
  const optionsList = wrapper.querySelector(".options");

  optionsList.innerHTML = "";
  optionsArray.forEach((opt) => {
    const li = document.createElement("li");
    li.textContent = opt.name;
    li.dataset.value = opt.value;
    li.addEventListener("click", () => {
      selected.textContent = opt.name;
      selected.dataset.value = opt.value;
      optionsList.style.display = "none";
    });
    optionsList.appendChild(li);
  });

  selected.addEventListener("click", () => {
    optionsList.style.display =
      optionsList.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      optionsList.style.display = "none";
    }
  });
}

// Example usage: populate dropdowns (replace with API fetch later)
document.addEventListener("DOMContentLoaded", () => {
  setupCustomSelect("currency-wrapper", currencies);
  setupCustomSelect("wallet-wrapper", walletTypes);
});

// --- Form submission ---
walletForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("wallet-name").value;
  const currency = document
    .getElementById("currency-wrapper")
    .querySelector(".selected").dataset.value;
  const walletType = document
    .getElementById("wallet-wrapper")
    .querySelector(".selected").dataset.value;
  const balance = parseFloat(document.getElementById("balance").value).toFixed(
    2
  );

  console.log({ name, currency, walletType, balance });

  walletPopup.style.display = "none";
});

async function fetchWalletBalances() {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${CONFIG.BASE_URL}wallets/total-balance?currency=2`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch total balance: ${response.status}`);
    }

    const result = await response.json();
    const totalBalance = result.data?.totalBalance ?? 0;
    const wallets = result.data?.walletBalances ?? [];

    // Update "My Balance" card
    const myBalanceCard = document.querySelector(
      ".overview-section .card:nth-child(1) h2"
    );
    myBalanceCard.textContent = `$${totalBalance.toLocaleString()}`;

    // Find Savings Account wallet
    const savingsWallet = wallets.find((w) => w.walletType === "Savings");
    const savingsBalance = savingsWallet?.balance ?? 0;

    // Update "Savings Account" card
    const savingsCard = document.querySelector(
      ".overview-section .card:nth-child(2) h2"
    );
    savingsCard.textContent =
      savingsBalance === 0 ? "0" : `$${savingsBalance.toLocaleString()}`;
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
  }
}

// Set initial loading state
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".overview-section .card h2");
  cards.forEach((card) => (card.textContent = "Loading..."));
  fetchWalletBalances();
});
async function loadEnums() {
  try {
    const token = localStorage.getItem("token");

    // --- Load Currency Types ---
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

    if (!currencyResponse.ok) {
      throw new Error(
        `Failed to fetch currency types: ${currencyResponse.status}`
      );
    }

    const currencyResult = await currencyResponse.json();
    const currencies = currencyResult.data; // Array of { value, name }
    const currencySelect = document.getElementById("currency");
    currencySelect.innerHTML = ""; // Clear existing options
    currencies.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.value;
      option.textContent = c.name;
      currencySelect.appendChild(option);
    });

    // --- Load Wallet Types ---
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

    if (!walletTypeResponse.ok) {
      throw new Error(
        `Failed to fetch wallet types: ${walletTypeResponse.status}`
      );
    }

    const walletTypeResult = await walletTypeResponse.json();
    const walletTypes = walletTypeResult.data; // Array of { value, name }
    const walletTypeSelect = document.getElementById("wallet-type");
    walletTypeSelect.innerHTML = ""; // Clear existing options
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

// Call this function when DOM is ready or when opening the popup
document.addEventListener("DOMContentLoaded", loadEnums);
walletForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("wallet-name").value;
  const currency = document.getElementById("currency").value;
  const walletType = document.getElementById("wallet-type").value;
  const balance = parseFloat(document.getElementById("balance").value);

  const walletData = { name, currency, walletType, balance };

  try {
    const token = localStorage.getItem("token"); // Or wherever your JWT is stored

    const response = await fetch(`${CONFIG.BASE_URL}wallets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(walletData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create wallet: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("Wallet created:", result);

    // Optionally, refresh the wallet balances
    fetchWalletBalances();

    // Close the popup
    walletPopup.style.display = "none";

    // Reset form
    walletForm.reset();
  } catch (error) {
    console.error("Error creating wallet:", error);
    alert("Failed to create wallet. Check console for details.");
  }
});
