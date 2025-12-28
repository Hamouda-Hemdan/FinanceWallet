// UI helper functions

// Update pagination controls
function updatePaginationControls(current, total, pageInfo, prevPageBtn, nextPageBtn) {
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

// Render a single transaction
function renderExpense(transaction, expensesList) {
  if (!expensesList) return;
  
  const expenseEl = document.createElement("div");
  expenseEl.className = "expense-item";
  expenseEl.dataset.id = transaction.transactionId || transaction.id;
  
  // Format date
  const date = transaction.createdAt || transaction.date || new Date().toISOString();
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Determine amount color based on transaction type
  const amountClass = transaction.type === "Income" ? "income-amount" : "expense-amount";
  const amountSign = transaction.type === "Income" ? "+" : "-";
  
  // Display important transaction information
  expenseEl.innerHTML = `
    <div class="expense-header">
      <div class="expense-description">${transaction.notes || 'No description'}</div>
      <div class="${amountClass}">${amountSign}$${parseFloat(transaction.amount).toFixed(2)}</div>
    </div>
    <div class="expense-details">
      <div class="expense-meta">
        <span class="expense-category">Category: ${transaction.category}</span>
        <span class="expense-type">Type: ${transaction.type}</span>
      </div>
      <div class="expense-wallet">Wallet: ${transaction.walletName || 'Unknown wallet'}</div>
      <div class="expense-date">Date: ${formattedDate}</div>
    </div>
    <button class="delete-expense-btn" data-id="${transaction.transactionId || transaction.id}">Delete</button>
  `;
  
  expensesList.prepend(expenseEl);
  
  // Add delete event listener
  const deleteBtn = expenseEl.querySelector(".delete-expense-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      await window.deleteExpense(transaction.transactionId || transaction.id, expensesList, 
        () => window.loadExpenses(window.currentPage, window.pageSize, expensesList, 
          (current, total) => window.updatePaginationControls(current, total, document.getElementById("page-info"), document.getElementById("prev-page"), document.getElementById("next-page")),
          (transaction) => window.renderExpense(transaction, expensesList),
          window.updateBudgetWithCurrentExpenses
        )
      );
    });
  }
}

// Calculate and update budget with current month's expenses
function updateBudgetWithCurrentExpenses(transactions, currentPage) {
  // Only update if we're on the first page (to avoid double counting)
  if (currentPage !== 1) return;
  
  // Filter for current month's expenses only
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const currentMonthExpenses = transactions.filter(transaction => {
    // Only count Expense transactions
    if (transaction.type !== "Expense") return false;
    
    // Check if transaction is in current month
    const transactionDate = new Date(transaction.createdAt || transaction.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });
  
  // Calculate total expenses for current month
  const totalExpenses = currentMonthExpenses.reduce((sum, transaction) => {
    return sum + parseFloat(transaction.amount || 0);
  }, 0);
  
  // Update overall budget tracking
  if (typeof window.saveSpentAmount === 'function') {
    window.saveSpentAmount(totalExpenses);
  }
  
  if (typeof window.updateBudgetDisplay === 'function') {
    window.updateBudgetDisplay();
  }
  
  // Calculate category-specific expenses
  const categoryExpenses = {};
  currentMonthExpenses.forEach(transaction => {
    const categoryId = transaction.category;
    if (!categoryExpenses[categoryId]) {
      categoryExpenses[categoryId] = 0;
    }
    categoryExpenses[categoryId] += parseFloat(transaction.amount);
  });
  
  // Update category-specific budget tracking with calculated totals
  if (typeof window.getCategoryBudgetsFromStorage === 'function' && 
      typeof window.saveCategorySpentAmount === 'function') {
    // First, reset all category spending to zero
    const categoryBudgets = window.getCategoryBudgetsFromStorage();
    for (const categoryId in categoryBudgets) {
      window.saveCategorySpentAmount(categoryId, 0);
    }
    
    // Then set each category to its calculated total
    for (const categoryId in categoryExpenses) {
      window.saveCategorySpentAmount(categoryId, categoryExpenses[categoryId]);
    }
    
    // Update category budget display
    if (typeof window.updateCategoryBudgetDisplay === 'function') {
      window.updateCategoryBudgetDisplay();
    }
  }
  
  // Use the new budget warnings system
  if (typeof window.checkOverallBudgetLimits === 'function') {
    window.checkOverallBudgetLimits();
  }
  
  if (typeof window.checkCategoryBudgetLimits === 'function') {
    window.checkCategoryBudgetLimits();
  }
}

// Export functions
window.updatePaginationControls = updatePaginationControls;
window.renderExpense = renderExpense;
window.updateBudgetWithCurrentExpenses = updateBudgetWithCurrentExpenses;