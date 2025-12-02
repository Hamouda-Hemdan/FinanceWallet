let currencies = [
  { name: "US Dollar", value: "USD" },
  { name: "Euro", value: "EUR" },
  { name: "British Pound", value: "GBP" },
  { name: "Japanese Yen", value: "JPY" },
];

let walletTypes = [
  { name: "Checking", value: "Checking" },
  { name: "Savings", value: "Savings" },
  { name: "Credit Card", value: "CreditCard" },
  { name: "Investment", value: "Investment" },
];

const addWalletBtn = document.querySelector(".add-wallet-btn");
const walletPopup = document.getElementById("wallet-popup");
const cancelPopupBtn = document.getElementById("cancel-popup");
const walletForm = document.getElementById("wallet-form");

// Budget elements
const budgetPopup = document.getElementById("budget-popup");
const setBudgetBtn = document.getElementById("set-budget-btn");
const cancelBudgetPopupBtn = document.getElementById("cancel-budget-popup");
const budgetForm = document.getElementById("budget-form");
const budgetAmountEl = document.getElementById("budget-amount");
const spentAmountEl = document.getElementById("spent-amount");
const remainingAmountEl = document.getElementById("remaining-amount");
const progressFillEl = document.getElementById("progress-fill");
const progressTextEl = document.getElementById("progress-text");

// Category budget elements
const categoryBudgetPopup = document.getElementById("category-budget-popup");
const setCategoryBudgetBtn = document.getElementById("set-category-budget-btn");
const cancelCategoryBudgetPopupBtn = document.getElementById(
  "cancel-category-budget-popup"
);
const categoryBudgetForm = document.getElementById("category-budget-form");
const categoryBudgetsList = document.getElementById("category-budgets-list");
const categorySelect = document.getElementById("category-select");

// Add event listeners only if elements exist
if (addWalletBtn && walletPopup) {
  addWalletBtn.addEventListener("click", () => {
    walletPopup.style.display = "flex";
  });
}

if (cancelPopupBtn && walletPopup) {
  cancelPopupBtn.addEventListener("click", () => {
    walletPopup.style.display = "none";
  });
}

// Budget event listeners
if (setBudgetBtn && budgetPopup) {
  setBudgetBtn.addEventListener("click", () => {
    const currentBudget = getBudgetFromStorage();
    if (currentBudget > 0) {
      const budgetAmountInput = document.getElementById("budget-amount-input");
      if (budgetAmountInput) {
        budgetAmountInput.value = currentBudget;
      }
    }
    budgetPopup.style.display = "flex";
  });
}

if (cancelBudgetPopupBtn && budgetPopup) {
  cancelBudgetPopupBtn.addEventListener("click", () => {
    budgetPopup.style.display = "none";
  });
}

// Category budget event listeners
if (setCategoryBudgetBtn && categoryBudgetPopup) {
  setCategoryBudgetBtn.addEventListener("click", async () => {
    await loadCategoryOptions();
    categoryBudgetPopup.style.display = "flex";
  });
}

if (cancelCategoryBudgetPopupBtn && categoryBudgetPopup) {
  cancelCategoryBudgetPopupBtn.addEventListener("click", () => {
    categoryBudgetPopup.style.display = "none";
  });
}

function setupCustomSelect(wrapperId, optionsArray) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const selected = wrapper.querySelector(".selected");
  const optionsList = wrapper.querySelector(".options");
  if (!selected || !optionsList) return;

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

if (budgetForm) {
  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const budgetAmount = parseFloat(
      document.getElementById("budget-amount-input").value
    );

    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      alert("Please enter a valid budget amount greater than zero.");
      return;
    }

    saveBudgetToStorage(budgetAmount);

    updateBudgetDisplay();

    budgetPopup.style.display = "none";

    alert(`Monthly budget set to $${budgetAmount.toFixed(2)}`);
  });
}

// Category budget form submission
if (categoryBudgetForm) {
  categoryBudgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoryId = document.getElementById("category-select").value;
    const categoryName =
      document.getElementById("category-select").selectedOptions[0]?.text || "";
    const budgetAmount = parseFloat(
      document.getElementById("category-budget-amount-input").value
    );

    if (!categoryId) {
      alert("Please select a category.");
      return;
    }

    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      alert("Please enter a valid budget amount greater than zero.");
      return;
    }

    saveCategoryBudgetToStorage(categoryId, categoryName, budgetAmount);

    await loadCategoryBudgets();

    categoryBudgetPopup.style.display = "none";

    categoryBudgetForm.reset();

    alert(
      `Category budget for ${categoryName} set to $${budgetAmount.toFixed(2)}`
    );
  });
}

function saveBudgetToStorage(amount) {
  const budgetData = {
    amount: amount,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  };
  localStorage.setItem("monthlyBudget", JSON.stringify(budgetData));
}

function getBudgetFromStorage() {
  const budgetData = localStorage.getItem("monthlyBudget");
  if (!budgetData) return 0;

  const parsed = JSON.parse(budgetData);
  const now = new Date();

  // Check if budget is for current month/year
  if (parsed.month === now.getMonth() && parsed.year === now.getFullYear()) {
    return parsed.amount;
  } else {
    localStorage.removeItem("monthlyBudget");
    return 0;
  }
}

function getSpentAmount() {
  const spentData = localStorage.getItem("monthlySpent");
  if (!spentData) return 0;

  const parsed = JSON.parse(spentData);
  const now = new Date();

  // Check if spent data is for current month/year
  if (parsed.month === now.getMonth() && parsed.year === now.getFullYear()) {
    return parsed.amount;
  } else {
    localStorage.removeItem("monthlySpent");
    return 0;
  }
}

function saveSpentAmount(amount) {
  const spentData = {
    amount: amount,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  };
  localStorage.setItem("monthlySpent", JSON.stringify(spentData));
}

// Category budget storage functions
function saveCategoryBudgetToStorage(categoryId, categoryName, amount) {
  const categoryBudgets = getCategoryBudgetsFromStorage();
  categoryBudgets[categoryId] = {
    categoryId: categoryId,
    categoryName: categoryName,
    amount: amount,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  };
  localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
}

function getCategoryBudgetsFromStorage() {
  const categoryBudgetsData = localStorage.getItem("categoryBudgets");
  if (!categoryBudgetsData) return {};

  const parsed = JSON.parse(categoryBudgetsData);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter out expired budgets
  const filteredBudgets = {};
  for (const categoryId in parsed) {
    const budget = parsed[categoryId];
    if (budget.month === currentMonth && budget.year === currentYear) {
      filteredBudgets[categoryId] = budget;
    }
  }

  return filteredBudgets;
}

function getCategorySpentAmounts() {
  const categorySpentData = localStorage.getItem("categorySpent");
  if (!categorySpentData) return {};

  const parsed = JSON.parse(categorySpentData);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredData = {};
  for (const key in parsed) {
    // Skip metadata keys
    if (key.startsWith("__metadata_")) continue;

    const metadataKey = `__metadata_${key}`;
    const metadata = parsed[metadataKey];

    if (
      !metadata ||
      (metadata.month === currentMonth && metadata.year === currentYear)
    ) {
      filteredData[key] = parsed[key];
    }
  }

  return filteredData;
}

function saveCategorySpentAmount(categoryId, amount) {
  const categorySpentData = getCategorySpentAmounts();
  categorySpentData[categoryId] = amount;
  // Add month/year tracking
  categorySpentData[`__metadata_${categoryId}`] = {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  };
  localStorage.setItem("categorySpent", JSON.stringify(categorySpentData));
}

// Make budget functions available globally
window.getBudgetFromStorage = getBudgetFromStorage;
window.getSpentAmount = getSpentAmount;
window.saveSpentAmount = saveSpentAmount;
window.updateBudgetDisplay = updateBudgetDisplay;

// Make category budget functions available globally
window.getCategoryBudgetsFromStorage = getCategoryBudgetsFromStorage;
window.getCategorySpentAmounts = getCategorySpentAmounts;
window.saveCategorySpentAmount = saveCategorySpentAmount;
window.updateCategoryBudgetDisplay = updateCategoryBudgetDisplay;
window.loadCategoryBudgets = loadCategoryBudgets;

// Add expense function (to be called when transactions are created)
function addExpense(amount) {
  const currentSpent = getSpentAmount();
  const newSpent = currentSpent + amount;
  saveSpentAmount(newSpent);
  updateBudgetDisplay();

  // Use the new budget warnings system instead of simple alerts
  if (typeof checkOverallBudgetLimits === "function") {
    checkOverallBudgetLimits();
  }
}

// Add category-specific expense function
function addCategoryExpense(categoryId, amount) {
  const currentCategorySpent = getCategorySpentAmounts();
  const currentSpent = currentCategorySpent[categoryId] || 0;
  const newSpent = currentSpent + amount;

  saveCategorySpentAmount(categoryId, newSpent);
  updateCategoryBudgetDisplay();

  // Use the new budget warnings system instead of simple alerts
  if (typeof checkCategoryBudgetLimits === "function") {
    checkCategoryBudgetLimits();
  }
}

// Update category budget display
function updateCategoryBudgetDisplay() {
  loadCategoryBudgets();
}

window.addExpense = addExpense;
window.addCategoryExpense = addCategoryExpense;
window.updateCategoryBudgetDisplay = updateCategoryBudgetDisplay;

// Load and update budget display
function loadBudgetData() {
  updateBudgetDisplay();
  loadCategoryBudgets();
}

function updateBudgetDisplay() {
  const budget = getBudgetFromStorage();
  const spent = getSpentAmount();
  const remaining = budget - spent;

  // Update display elements only if they exist
  if (budgetAmountEl) {
    budgetAmountEl.textContent = `$${budget.toFixed(2)}`;
  }
  if (spentAmountEl) {
    spentAmountEl.textContent = `$${spent.toFixed(2)}`;
  }
  if (remainingAmountEl) {
    remainingAmountEl.textContent = `$${remaining.toFixed(2)}`;
  }

  // Update progress bar
  if (budget > 0 && progressFillEl && progressTextEl) {
    const percentage = Math.min(100, (spent / budget) * 100);
    progressFillEl.style.width = `${percentage}%`;
    progressTextEl.textContent = `${percentage.toFixed(1)}% used`;

    // Change color based on percentage
    if (percentage > 90) {
      progressFillEl.style.backgroundColor = "#d9534f";
    } else if (percentage > 75) {
      progressFillEl.style.backgroundColor = "#f0ad4e";
    } else {
      progressFillEl.style.backgroundColor = "#592b22";
    }
  } else if (progressTextEl) {
    progressTextEl.textContent = "No budget set";
  }
}

// Load and display category budgets
async function loadCategoryBudgets() {
  if (!categoryBudgetsList) return;

  const categoryBudgets = getCategoryBudgetsFromStorage();
  const categorySpent = getCategorySpentAmounts();

  categoryBudgetsList.innerHTML = "";

  const budgetCount = Object.keys(categoryBudgets).length;

  if (budgetCount === 0) {
    categoryBudgetsList.innerHTML =
      '<p class="no-category-budgets">No category budgets set. Add your first category budget below.</p>';
    return;
  }

  // Create HTML for each category budget
  for (const categoryId in categoryBudgets) {
    const budget = categoryBudgets[categoryId];
    const spent = categorySpent[categoryId] || 0;
    const remaining = budget.amount - spent;
    const percentage =
      budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;

    const categoryBudgetEl = document.createElement("div");
    categoryBudgetEl.className = "category-budget-item";
    categoryBudgetEl.dataset.categoryId = categoryId;

    categoryBudgetEl.innerHTML = `
      <div class="category-budget-info">
        <h5>${budget.categoryName}</h5>
        <div class="category-budget-amounts">
          <span class="category-budget-amount">Budget: $${budget.amount.toFixed(
            2
          )}</span>
          <span class="category-budget-amount">Spent: $${spent.toFixed(
            2
          )}</span>
          <span class="category-budget-amount">Remaining: $${remaining.toFixed(
            2
          )}</span>
        </div>
        <div class="category-budget-progress">
          <div class="category-budget-progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
      <div class="category-budget-actions">
        <button class="edit-category-budget" data-category-id="${categoryId}">Edit</button>
        <button class="delete-category-budget" data-category-id="${categoryId}">Delete</button>
      </div>
    `;

    categoryBudgetsList.appendChild(categoryBudgetEl);
  }

  // Add event listeners for edit and delete buttons
  document.querySelectorAll(".edit-category-budget").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const categoryId = e.target.dataset.categoryId;
      const budget = categoryBudgets[categoryId];

      if (budget) {
        await loadCategoryOptions();
        document.getElementById("category-select").value = categoryId;
        document.getElementById("category-budget-amount-input").value =
          budget.amount;

        categoryBudgetPopup.style.display = "flex";
      }
    });
  });

  document.querySelectorAll(".delete-category-budget").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryId = e.target.dataset.categoryId;
      const budget = categoryBudgets[categoryId];

      if (
        budget &&
        confirm(
          `Are you sure you want to delete the budget for ${budget.categoryName}?`
        )
      ) {
        const categoryBudgets = getCategoryBudgetsFromStorage();
        delete categoryBudgets[categoryId];
        localStorage.setItem(
          "categoryBudgets",
          JSON.stringify(categoryBudgets)
        );

        loadCategoryBudgets();
      }
    });
  });
}

// Load category options for the dropdown
async function loadCategoryOptions() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!categorySelect) return;

    const response = await fetch(
      `${CONFIG.BASE_URL}api/enums/transaction-categories`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();

    // Combine expense and income categories
    const expenseCategories = data.data?.expenseCategories || [];
    const incomeCategories = data.data?.incomeCategories || [];
    const allCategories = [...expenseCategories, ...incomeCategories];

    // Remove duplicates
    const uniqueCategories = allCategories.filter(
      (category, index, self) =>
        index === self.findIndex((c) => c.value === category.value)
    );

    // Populate category dropdown
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    uniqueCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.value;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading categories:", err);
    if (categorySelect) {
      categorySelect.innerHTML =
        '<option value="">Failed to load categories</option>';
    }
  }
}

async function fetchWalletBalances() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

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

    const myBalanceCard = document.querySelector(
      ".overview-section .card:nth-child(1) h2"
    );
    if (myBalanceCard) {
      myBalanceCard.textContent = `$${totalBalance.toLocaleString()}`;
    }

    const savingsWallet = wallets.find((w) => w.walletType === "Savings");
    const savingsBalance = savingsWallet?.balance ?? 0;

    const savingsCard = document.querySelector(
      ".overview-section .card:nth-child(2) h2"
    );
    if (savingsCard) {
      savingsCard.textContent =
        savingsBalance === 0 ? "0" : `$${savingsBalance.toLocaleString()}`;
    }
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
  }
}

// Load enums for wallet creation form
async function loadEnums() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

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
    currencies = currencyResult.data || currencies;

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
    walletTypes = walletTypeResult.data || walletTypes;
  } catch (error) {
    console.error("Error loading enums:", error);
  }
}

// Setup wallet form submission
function setupWalletForm() {
  if (walletForm) {
    walletForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("wallet-name").value;
      const currency = document.getElementById("currency").value;
      const walletType = document.getElementById("wallet-type").value;
      const balance = parseFloat(document.getElementById("balance").value);

      if (isNaN(balance) || balance < 0) {
        alert("You should enter a balance greater than 0.");
        return;
      }

      const walletData = { name, currency, walletType, balance };

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to create a wallet.");
          return;
        }

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

        alert("Wallet created successfully!");
        walletPopup.style.display = "none";
        walletForm.reset();

        fetchWalletBalances();
      } catch (error) {
        console.error("Error creating wallet:", error);
        alert(`Error creating wallet: ${error.message}`);
      }
    });
  }
}

// Single consolidated DOMContentLoaded event
document.addEventListener("DOMContentLoaded", async () => {
  await loadEnums();

  setupCustomSelect("currency-wrapper", currencies);
  setupCustomSelect("wallet-wrapper", walletTypes);

  setupWalletForm();

  loadBudgetData();
  fetchWalletBalances();
});
