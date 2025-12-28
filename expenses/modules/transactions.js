// Transaction management functions

async function addTransaction(walletId, type, amount, category, description, date, loadExpenses) {
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
      type: type, // Use the selected transaction type
      notes: description,
      tags: category
    };
    
    // Send transaction to API
    const response = await fetch(`${CONFIG.BASE_URL}api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add transaction: ${errorText}`);
    }
    
    // Update budget tracking only for expenses
    if (type === "Expense" && typeof window.addExpense === 'function') {
      window.addExpense(amount);
      
      // Update category-specific budget tracking
      if (typeof window.addCategoryExpense === 'function') {
        window.addCategoryExpense(category, amount);
      }
    }
    
    // Reload transactions (go back to first page)
    window.currentPage = 1;
    await loadExpenses();
    
    alert(`Transaction of $${amount.toFixed(2)} added successfully!`);
  } catch (err) {
    console.error("Error adding transaction:", err);
    alert(`Failed to add transaction: ${err.message}`);
  }
}

async function loadExpenses(currentPage, pageSize, expensesList, updatePaginationControls, renderExpense, updateBudgetWithCurrentExpenses) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      if (expensesList) expensesList.innerHTML = '<p class="no-expenses">Please log in to view transactions.</p>';
      updatePaginationControls(1, 1);
      return;
    }
    
    // Fetch transactions from API
    const response = await fetch(`${CONFIG.BASE_URL}api/transactions?page=${currentPage}&pageSize=${pageSize}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle paginated response format
    let transactions = [];
    let totalCount = 0;
    
    if (Array.isArray(data)) {
      // Direct array format
      transactions = data;
      totalCount = data.length;
    } else if (data.data) {
      // Paginated format with data property
      if (Array.isArray(data.data)) {
        transactions = data.data;
        totalCount = data.data.length;
      } else if (data.data.items) {
        // Further nested format with items property
        transactions = Array.isArray(data.data.items) ? data.data.items : [];
        totalCount = data.data.totalCount || transactions.length;
      } else if (data.data.transactions) {
        // Another possible format
        transactions = Array.isArray(data.data.transactions) ? data.data.transactions : [];
        totalCount = data.data.totalCount || transactions.length;
      } else {
        transactions = [];
        totalCount = 0;
      }
    } else {
      transactions = [];
      totalCount = 0;
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Store total pages globally so other modules can access
    window.totalPages = totalPages;
    
    // Update pagination controls
    updatePaginationControls(currentPage, totalPages);
    
    if (transactions.length === 0) {
      if (expensesList) expensesList.innerHTML = '<p class="no-expenses">No transactions recorded yet.</p>';
      return;
    }
    
    // Clear the container
    if (expensesList) expensesList.innerHTML = '';
    
    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    
    // Render each transaction
    transactions.forEach(transaction => {
      renderExpense(transaction, expensesList);
    });
    
    // Update budget with total expenses for current month
    updateBudgetWithCurrentExpenses(transactions, currentPage);
    
    // If we're on the first page, update the global allTransactions array for filtering
    if (currentPage === 1) {
      window.allTransactions = [...transactions];
    } else {
      // For subsequent pages, append to existing transactions
      window.allTransactions = [...window.allTransactions, ...transactions];
    }
  } catch (err) {
    console.error("Error loading transactions:", err);
    if (expensesList) expensesList.innerHTML = '<p class="no-expenses">Failed to load transactions.</p>';
    updatePaginationControls(1, 1);
  }
}

async function deleteExpense(id, expensesList, loadExpenses) {
  if (!confirm("Are you sure you want to delete this transaction?")) {
    return;
  }
  
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${CONFIG.BASE_URL}api/transactions/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete transaction: ${errorText}`);
    }
    
    // Remove from UI
    if (expensesList) {
      const expenseEl = document.querySelector(`.expense-item[data-id="${id}"]`);
      if (expenseEl) {
        expenseEl.remove();
      }
      
      // If no transactions left on this page, go to previous page or reload
      const expenseItems = document.querySelectorAll(".expense-item");
      if (expenseItems.length === 0 && window.currentPage > 1) {
        window.currentPage--;
      }
      
      // Reload transactions
      await loadExpenses();
    }
    
    alert("Transaction deleted successfully!");
  } catch (err) {
    console.error("Error deleting transaction:", err);
    alert(`Failed to delete transaction: ${err.message}`);
  }
}

// Export functions
window.addTransaction = addTransaction;
window.loadExpenses = loadExpenses;
window.deleteExpense = deleteExpense;