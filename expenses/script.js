document.addEventListener("DOMContentLoaded", async () => {
  const expenseForm = document.getElementById("expense-form");
  const expensesList = document.getElementById("expenses-list");
  const walletSelect = document.getElementById("expense-wallet");
  const categorySelect = document.getElementById("expense-category");
  const typeSelect = document.getElementById("transaction-type");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");

  let currentPage = 1;
  let totalPages = 1;
  let pageSize = 10;

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("expense-date").value = today;

  await Promise.all([loadWallets(), loadCategories(), loadTransactionTypes()]);

  await loadExpenses();

  // Form submission
  if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const walletId = document.getElementById("expense-wallet").value;
      const type = document.getElementById("transaction-type").value;
      const amount = parseFloat(
        document.getElementById("expense-amount").value
      );
      const category = document.getElementById("expense-category").value;
      const description = document.getElementById("expense-description").value;
      const date = document.getElementById("expense-date").value;

      if (!walletId) {
        alert("Please select a wallet.");
        return;
      }

      if (!type) {
        alert("Please select a transaction type.");
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than zero.");
        return;
      }

      if (!category) {
        alert("Please select a category.");
        return;
      }

      await addTransaction(walletId, type, amount, category, description, date);

      document.getElementById("expense-amount").value = "";
      document.getElementById("transaction-type").value = "";
      document.getElementById("expense-category").value = "";
      document.getElementById("expense-description").value = "";
      document.getElementById("expense-date").value = today;
    });
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", async () => {
      if (currentPage > 1) {
        currentPage--;
        await loadExpenses();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", async () => {
      if (currentPage < totalPages) {
        currentPage++;
        await loadExpenses();
      }
    });
  }

  async function loadWallets() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        if (walletSelect)
          walletSelect.innerHTML = '<option value="">Please log in</option>';
        return;
      }

      const response = await fetch(`${CONFIG.BASE_URL}wallets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallets: ${response.status}`);
      }

      const data = await response.json();
      const wallets = Array.isArray(data) ? data : data.data || [];

      if (walletSelect) {
        walletSelect.innerHTML = '<option value="">Select Wallet</option>';
        wallets.forEach((wallet) => {
          const option = document.createElement("option");
          option.value = wallet.walletId;
          option.textContent = `${wallet.name} (${wallet.balance} ${wallet.currency})`;
          walletSelect.appendChild(option);
        });

        if (wallets.length === 1) {
          walletSelect.value = wallets[0].walletId;
        }
      }
    } catch (err) {
      console.error("Error loading wallets:", err);
      if (walletSelect)
        walletSelect.innerHTML =
          '<option value="">Failed to load wallets</option>';
    }
  }

  async function loadTransactionTypes() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        if (typeSelect)
          typeSelect.innerHTML = '<option value="">Please log in</option>';
        return;
      }

      const response = await fetch(
        `${CONFIG.BASE_URL}api/enums/transaction-types`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transaction types: ${response.status}`
        );
      }

      const data = await response.json();
      const types = data.data || [];

      if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Select Type</option>';
        types.forEach((type) => {
          const option = document.createElement("option");
          option.value = type.value;
          option.textContent = type.name;
          typeSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Error loading transaction types:", err);
      if (typeSelect)
        typeSelect.innerHTML =
          '<option value="">Failed to load transaction types</option>';
    }
  }

  async function loadCategories() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        if (categorySelect)
          categorySelect.innerHTML = '<option value="">Please log in</option>';
        return;
      }

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

      const expenseCategories = data.data?.expenseCategories || [];
      const incomeCategories = data.data?.incomeCategories || [];
      const allCategories = [...expenseCategories, ...incomeCategories];

      const uniqueCategories = allCategories.filter(
        (category, index, self) =>
          index === self.findIndex((c) => c.value === category.value)
      );

      if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        uniqueCategories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.value;
          option.textContent = category.name;
          categorySelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      if (categorySelect)
        categorySelect.innerHTML =
          '<option value="">Failed to load categories</option>';
    }
  }

  async function addTransaction(
    walletId,
    type,
    amount,
    category,
    description,
    date
  ) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to add transactions.");
        return;
      }

      // Prepare transaction data according to API specification
      const transactionData = {
        walletId: walletId,
        amount: amount,
        category: category,
        type: type,
        notes: description,
        tags: category,
      };

      // Send transaction to API
      const response = await fetch(`${CONFIG.BASE_URL}api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add transaction: ${errorText}`);
      }

      if (type === "Expense" && typeof window.addExpense === "function") {
        window.addExpense(amount);

        if (typeof window.addCategoryExpense === "function") {
          window.addCategoryExpense(category, amount);
        }
      }

      currentPage = 1;
      await loadExpenses();

      alert(`Transaction of $${amount.toFixed(2)} added successfully!`);
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert(`Failed to add transaction: ${err.message}`);
    }
  }

  // Load and display transactions from API
  async function loadExpenses() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        if (expensesList)
          expensesList.innerHTML =
            '<p class="no-expenses">Please log in to view transactions.</p>';
        updatePaginationControls(1, 1);
        return;
      }

      const response = await fetch(
        `${CONFIG.BASE_URL}api/transactions?page=${currentPage}&pageSize=${pageSize}`,
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
      let totalCount = 0;

      if (Array.isArray(data)) {
        // Direct array format
        transactions = data;
        totalCount = data.length;
      } else if (data.data) {
        if (Array.isArray(data.data)) {
          transactions = data.data;
          totalCount = data.data.length;
        } else if (data.data.items) {
          transactions = Array.isArray(data.data.items) ? data.data.items : [];
          totalCount = data.data.totalCount || transactions.length;
        } else if (data.data.transactions) {
          transactions = Array.isArray(data.data.transactions)
            ? data.data.transactions
            : [];
          totalCount = data.data.totalCount || transactions.length;
        } else {
          transactions = [];
          totalCount = 0;
        }
      } else {
        transactions = [];
        totalCount = 0;
      }

      totalPages = Math.ceil(totalCount / pageSize);

      updatePaginationControls(currentPage, totalPages);

      if (transactions.length === 0) {
        if (expensesList)
          expensesList.innerHTML =
            '<p class="no-expenses">No transactions recorded yet.</p>';
        return;
      }

      if (expensesList) expensesList.innerHTML = "";

      transactions.sort(
        (a, b) =>
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );

      transactions.forEach((transaction) => {
        renderExpense(transaction);
      });

      updateBudgetWithCurrentExpenses(transactions);
    } catch (err) {
      console.error("Error loading transactions:", err);
      if (expensesList)
        expensesList.innerHTML =
          '<p class="no-expenses">Failed to load transactions.</p>';
      updatePaginationControls(1, 1);
    }
  }

  // Calculate and update budget with current month's expenses
  function updateBudgetWithCurrentExpenses(transactions) {
    if (currentPage !== 1) return;

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

    const totalExpenses = currentMonthExpenses.reduce((sum, transaction) => {
      return sum + parseFloat(transaction.amount || 0);
    }, 0);

    if (typeof window.saveSpentAmount === "function") {
      window.saveSpentAmount(totalExpenses);
    }

    if (typeof window.updateBudgetDisplay === "function") {
      window.updateBudgetDisplay();
    }

    const categoryExpenses = {};
    currentMonthExpenses.forEach((transaction) => {
      const categoryId = transaction.category;
      if (!categoryExpenses[categoryId]) {
        categoryExpenses[categoryId] = 0;
      }
      categoryExpenses[categoryId] += parseFloat(transaction.amount);
    });

    if (
      typeof window.getCategoryBudgetsFromStorage === "function" &&
      typeof window.saveCategorySpentAmount === "function"
    ) {
      const categoryBudgets = window.getCategoryBudgetsFromStorage();
      for (const categoryId in categoryBudgets) {
        window.saveCategorySpentAmount(categoryId, 0);
      }

      for (const categoryId in categoryExpenses) {
        window.saveCategorySpentAmount(
          categoryId,
          categoryExpenses[categoryId]
        );
      }

      if (typeof window.updateCategoryBudgetDisplay === "function") {
        window.updateCategoryBudgetDisplay();
      }
    }

    if (typeof window.checkOverallBudgetLimits === "function") {
      window.checkOverallBudgetLimits();
    }

    if (typeof window.checkCategoryBudgetLimits === "function") {
      window.checkCategoryBudgetLimits();
    }
  }

  function updatePaginationControls(current, total) {
    if (pageInfo) {
      pageInfo.textContent = `Page ${current} of ${total}`;
    }

    if (prevPageBtn) {
      prevPageBtn.disabled = current <= 1;
    }

    if (nextPageBtn) {
      nextPageBtn.disabled = current >= total;
    }
  }

  function renderExpense(transaction) {
    if (!expensesList) return;

    const expenseEl = document.createElement("div");
    expenseEl.className = "expense-item";
    expenseEl.dataset.id = transaction.transactionId || transaction.id;

    const date =
      transaction.createdAt || transaction.date || new Date().toISOString();
    const formattedDate = new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const amountClass =
      transaction.type === "Income" ? "income-amount" : "expense-amount";
    const amountSign = transaction.type === "Income" ? "+" : "-";

    expenseEl.innerHTML = `
      <div class="expense-header">
        <div class="expense-description">${
          transaction.notes || "No description"
        }</div>
        <div class="${amountClass}">${amountSign}$${parseFloat(
      transaction.amount
    ).toFixed(2)}</div>
      </div>
      <div class="expense-details">
        <div class="expense-meta">
          <span class="expense-category">Category: ${
            transaction.category
          }</span>
          <span class="expense-type">Type: ${transaction.type}</span>
        </div>
        <div class="expense-wallet">Wallet: ${
          transaction.walletName || "Unknown wallet"
        }</div>
        <div class="expense-date">Date: ${formattedDate}</div>
      </div>
      <button class="delete-expense-btn" data-id="${
        transaction.transactionId || transaction.id
      }">Delete</button>
    `;

    expensesList.prepend(expenseEl);

    const deleteBtn = expenseEl.querySelector(".delete-expense-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        await deleteExpense(transaction.transactionId || transaction.id);
      });
    }
  }

  // Delete a transaction via API
  async function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${CONFIG.BASE_URL}api/transactions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete transaction: ${errorText}`);
      }

      if (expensesList) {
        const expenseEl = document.querySelector(
          `.expense-item[data-id="${id}"]`
        );
        if (expenseEl) {
          expenseEl.remove();
        }

        const expenseItems = document.querySelectorAll(".expense-item");
        if (expenseItems.length === 0 && currentPage > 1) {
          currentPage--;
        }

        await loadExpenses();
      }

      alert("Transaction deleted successfully!");
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert(`Failed to delete transaction: ${err.message}`);
    }
  }
});
