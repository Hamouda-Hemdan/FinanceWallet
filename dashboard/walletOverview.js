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

  // Wait for Chart.js to be fully loaded
  const waitForChart = setInterval(() => {
    if (typeof Chart !== "undefined") {
      clearInterval(waitForChart);
      loadExpenseChartData();
    }
  }, 100);

  // Fallback in case Chart.js doesn't load
  setTimeout(() => {
    if (typeof Chart === "undefined") {
      clearInterval(waitForChart);
      console.warn("Chart.js did not load in time");
    }
  }, 3000);
});

// Add this function to load and display expense chart data
async function loadExpenseChartData() {
  try {
    console.log("Loading expense chart data...");

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("User not logged in, skipping expense chart load");
      return;
    }

    // Check if Chart.js is available
    if (typeof Chart === "undefined") {
      console.error("Chart.js is not available");
      return;
    }

    // Fetch transactions from the last 30 days
    const response = await fetch(
      `${CONFIG.BASE_URL}api/transactions?page=1&pageSize=1000`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();

    let transactions = [];
    if (Array.isArray(data)) {
      transactions = data;
    } else if (data.data) {
      if (Array.isArray(data.data)) {
        transactions = data.data;
      } else if (data.data.items) {
        transactions = Array.isArray(data.data.items) ? data.data.items : [];
      } else if (data.data.transactions) {
        transactions = Array.isArray(data.data.transactions)
          ? data.data.transactions
          : [];
      }
    }

    console.log("Fetched transactions:", transactions.length);

    // Filter for expenses in the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = transactions.filter((transaction) => {
      if (transaction.type !== "Expense") return false;

      const transactionDate = new Date(
        transaction.createdAt || transaction.date
      );
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    console.log("Current month expenses:", currentMonthExpenses.length);

    // Aggregate expenses by category
    const categoryExpenses = {};
    currentMonthExpenses.forEach((transaction) => {
      const category = transaction.category || "Uncategorized";
      const amount = parseFloat(transaction.amount || 0);

      if (!categoryExpenses[category]) {
        categoryExpenses[category] = 0;
      }
      categoryExpenses[category] += amount;
    });

    console.log("Category expenses:", categoryExpenses);

    // Display the top 3 expense categories
    displayTop3Expenses(categoryExpenses);

    // Display the chart
    displayExpenseChart(categoryExpenses);
  } catch (error) {
    console.error("Error loading expense chart data:", error);
    // Show error message in the chart area
    const noDataMessage = document.getElementById("no-expense-data");
    if (noDataMessage) {
      noDataMessage.innerHTML =
        "<p>Error loading expense data. Please try refreshing the page.</p>";
      noDataMessage.style.display = "block";
    }
  }
}

// Add this function to display the top 3 expense categories
function displayTop3Expenses(categoryExpenses) {
  try {
    // Convert object to array and sort by amount (descending)
    const sortedCategories = Object.entries(categoryExpenses)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Get top 3 categories (or fewer if less than 3 exist)
    const top3 = sortedCategories.slice(0, 3);

    // Update the UI for each top expense item
    for (let i = 1; i <= 3; i++) {
      const itemElement = document.getElementById(`top-expense-${i}`);
      if (itemElement) {
        if (i <= top3.length) {
          // Update with actual data
          const categoryData = top3[i - 1];
          itemElement.querySelector(".category").textContent =
            categoryData.category;
          itemElement.querySelector(
            ".amount"
          ).textContent = `$${categoryData.amount.toFixed(2)}`;
          itemElement.style.display = "flex";
        } else {
          // Hide unused slots
          itemElement.style.display = "none";
        }
      }
    }

    // If no expenses, hide the entire section
    const topExpensesSection = document.querySelector(".top-expenses-section");
    if (topExpensesSection && sortedCategories.length === 0) {
      topExpensesSection.style.display = "none";
    } else if (topExpensesSection) {
      topExpensesSection.style.display = "block";
    }
  } catch (error) {
    console.error("Error displaying top 3 expenses:", error);
  }
}

// Add this function to display the expense chart
function displayExpenseChart(categoryExpenses) {
  try {
    console.log("Displaying expense chart with data:", categoryExpenses);

    const ctx = document.getElementById("expenseChart");
    const noDataMessage = document.getElementById("no-expense-data");
    const chartTypeSelector = document.getElementById("chart-type");

    // Check if canvas element exists
    if (!ctx) {
      console.error("Canvas element not found");
      return;
    }

    // Check if Chart.js is available
    if (typeof Chart === "undefined") {
      console.error("Chart.js is not loaded properly");
      if (noDataMessage) {
        noDataMessage.innerHTML =
          "<p>Chart library not available. Showing data as list:<br/>" +
          Object.entries(categoryExpenses)
            .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
            .join("<br/>") +
          "</p>";
        noDataMessage.style.display = "block";
      }
      ctx.style.display = "none";
      return;
    }

    // Check if there's any data to display
    const hasData = Object.keys(categoryExpenses).length > 0;

    if (!hasData) {
      ctx.style.display = "none";
      if (noDataMessage) noDataMessage.style.display = "block";
      return;
    }

    ctx.style.display = "block";
    if (noDataMessage) noDataMessage.style.display = "none";

    // Prepare data for chart
    const categories = Object.keys(categoryExpenses);
    const amounts = Object.values(categoryExpenses);

    const backgroundColors = categories.map((_, index) => {
      // Create different shades of #592b22 by adjusting lightness
      const lightness = 30 + (index % 5) * 10;
      const opacity = 0.7 + (index % 3) * 0.1;
      return `hsla(15, 55%, ${lightness}%, ${opacity})`;
    });

    // For borders, use the solid primary color with varying opacities
    const borderColors = categories.map((_, index) => {
      const opacity = 0.8 + (index % 2) * 0.2;
      return `rgba(89, 43, 34, ${opacity})`;
    });

    // Get selected chart type
    const chartType = chartTypeSelector ? chartTypeSelector.value : "pie";

    // Destroy existing chart if it exists and is a Chart instance
    if (window.expenseChart) {
      if (typeof window.expenseChart.destroy === "function") {
        window.expenseChart.destroy();
      } else {
        delete window.expenseChart;
      }
    }

    // Chart configuration based on selected type
    const chartConfig = {
      type: chartType,
      data: {
        labels: categories,
        datasets: [
          {
            label: "Expenses by Category",
            data: amounts,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              // Use the primary color for legend text
              color: "#592b22",
              font: {
                size: 12,
                weight: "bold",
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw || 0;
                return `${label}: $${value.toFixed(2)}`;
              },
            },
            // Style the tooltips to match the theme
            backgroundColor: "rgba(89, 43, 34, 0.9)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#592b22",
            borderWidth: 2,
            titleFont: {
              weight: "bold",
            },
          },
        },
      },
    };

    // Adjust options based on chart type
    if (chartType === "bar") {
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value;
            },
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
          grid: {
            color: "rgba(89, 43, 34, 0.2)",
            drawBorder: true,
          },
          title: {
            display: true,
            text: "Amount ($)",
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
        },
        x: {
          ticks: {
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
          grid: {
            color: "rgba(89, 43, 34, 0.1)",
            drawBorder: true,
          },
          title: {
            display: true,
            text: "Categories",
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
        },
      };
    } else if (chartType === "line") {
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value;
            },
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
          grid: {
            color: "rgba(89, 43, 34, 0.2)",
            drawBorder: true,
          },
          title: {
            display: true,
            text: "Amount ($)",
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
        },
        x: {
          ticks: {
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
          grid: {
            color: "rgba(89, 43, 34, 0.1)",
            drawBorder: true,
          },
          title: {
            display: true,
            text: "Categories",
            color: "#592b22",
            font: {
              weight: "bold",
            },
          },
        },
      };
      chartConfig.data.datasets[0].fill = false;
      chartConfig.data.datasets[0].borderWidth = 4;
      chartConfig.data.datasets[0].pointRadius = 6;
      chartConfig.data.datasets[0].pointHoverRadius = 10;
      // Use monochromatic colors for line and points
      chartConfig.data.datasets[0].backgroundColor = backgroundColors[0];
      chartConfig.data.datasets[0].borderColor = "#592b22";
      chartConfig.data.datasets[0].pointBackgroundColor = "#592b22";
      chartConfig.data.datasets[0].pointBorderColor = "#ffffff";
      chartConfig.data.datasets[0].pointBorderWidth = 2;
    } else if (chartType === "doughnut" || chartType === "pie") {
      chartConfig.options.plugins.legend.position = "right";
      // Add a subtle border to pie/doughnut segments
      chartConfig.data.datasets[0].borderAlign = "center";
    }

    window.expenseChart = new Chart(ctx, chartConfig);

    console.log("Chart created successfully");
  } catch (error) {
    console.error("Error displaying expense chart:", error);
    const noDataMessage = document.getElementById("no-expense-data");
    if (noDataMessage) {
      noDataMessage.innerHTML =
        "<p>Error displaying chart. Please refresh the page.</p>";
      noDataMessage.style.display = "block";
    }
  }
}

// Add event listener for chart type selector
document.addEventListener("DOMContentLoaded", function () {
  const chartTypeSelector = document.getElementById("chart-type");
  if (chartTypeSelector) {
    chartTypeSelector.addEventListener("change", function () {
      if (typeof window.loadExpenseChartData === "function") {
        window.loadExpenseChartData();
      }
    });
  }
});

// Make the functions available globally
window.loadExpenseChartData = loadExpenseChartData;
window.displayTop3Expenses = displayTop3Expenses;
