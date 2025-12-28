// Main application file that coordinates all modules

document.addEventListener("DOMContentLoaded", async () => {
  // Import all modules
  
  // Get DOM elements
  const expenseForm = document.getElementById("expense-form");
  const expensesList = document.getElementById("expenses-list");
  const walletSelect = document.getElementById("expense-wallet");
  const categorySelect = document.getElementById("expense-category");
  const typeSelect = document.getElementById("transaction-type");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const downloadPdfBtn = document.getElementById("download-pdf");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  
  // Search and filter elements
  const searchTermInput = document.getElementById("search-term");
  const filterCategorySelect = document.getElementById("filter-category");
  const filterTypeSelect = document.getElementById("filter-type");
  const minAmountInput = document.getElementById("min-amount");
  const maxAmountInput = document.getElementById("max-amount");
  const filterDateFromInput = document.getElementById("filter-date-from");
  const filterDateToInput = document.getElementById("filter-date-to");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");
  
  // Store all transactions for filtering - stored globally so filtering module can access
  window.allTransactions = [];
  
  // Set default date range (last 30 days)
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(today.getDate() - 30);
  
  if (startDateInput) {
    startDateInput.value = lastMonth.toISOString().split('T')[0];
  }
  
  if (endDateInput) {
    endDateInput.value = today.toISOString().split('T')[0];
  }
  
  // Set default date range for filters (last 30 days)
  if (filterDateFromInput) {
    filterDateFromInput.value = lastMonth.toISOString().split('T')[0];
  }
  
  if (filterDateToInput) {
    filterDateToInput.value = today.toISOString().split('T')[0];
  }
  
  // Pagination state - stored globally so other modules can access
  window.currentPage = 1;
  window.pageSize = 10;
  window.totalPages = 1;
  
  // Set today's date as default for expense form
  const todayStr = today.toISOString().split('T')[0];
  document.getElementById("expense-date").value = todayStr;
  
  // Load wallets, categories, and transaction types
  await Promise.all([
    window.loadWallets(walletSelect),
    window.loadCategories(categorySelect, filterCategorySelect),
    window.loadTransactionTypes(typeSelect, filterTypeSelect)
  ]);
  
  // Load existing expenses from API
  await window.loadExpenses(window.currentPage, window.pageSize, expensesList, 
    (current, total) => window.updatePaginationControls(current, total, pageInfo, prevPageBtn, nextPageBtn),
    (transaction) => window.renderExpense(transaction, expensesList),
    window.updateBudgetWithCurrentExpenses
  );
  
  // Add event listener for PDF download button
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", async () => {
      await window.downloadTransactionsAsPdf(startDateInput, endDateInput, downloadPdfBtn, window.fetchTransactionsByDateRange);
    });
  }
  
  // Add event listeners for search and filter
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", async () => {
      await window.applyFilters(
        searchTermInput,
        filterCategorySelect,
        filterTypeSelect,
        minAmountInput,
        maxAmountInput,
        filterDateFromInput,
        filterDateToInput,
        window.allTransactions,
        window.fetchAllTransactionsForFiltering,
        expensesList,
        (current, total) => window.updatePaginationControls(current, total, pageInfo, prevPageBtn, nextPageBtn),
        (transaction) => window.renderExpense(transaction, expensesList)
      );
    });
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", async () => {
      window.clearFilters(
        searchTermInput,
        filterCategorySelect,
        filterTypeSelect,
        minAmountInput,
        maxAmountInput,
        filterDateFromInput,
        filterDateToInput
      );
      // Clear the global allTransactions array
      window.allTransactions = [];
      await window.loadExpenses(window.currentPage, window.pageSize, expensesList, 
        (current, total) => window.updatePaginationControls(current, total, pageInfo, prevPageBtn, nextPageBtn),
        (transaction) => window.renderExpense(transaction, expensesList),
        window.updateBudgetWithCurrentExpenses
      );
    });
  }
  
  // Form submission
  if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const walletId = document.getElementById("expense-wallet").value;
      const type = document.getElementById("transaction-type").value;
      const amount = parseFloat(document.getElementById("expense-amount").value);
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
      
      // Add transaction via API
      await window.addTransaction(walletId, type, amount, category, description, date, 
        () => window.loadExpenses(window.currentPage, window.pageSize, expensesList, 
          (current, total) => window.updatePaginationControls(current, total, pageInfo, prevPageBtn, nextPageBtn),
          (transaction) => window.renderExpense(transaction, expensesList),
          window.updateBudgetWithCurrentExpenses
        )
      );
      
      // Reset form (but keep wallet selection)
      document.getElementById("expense-amount").value = "";
      document.getElementById("transaction-type").value = "";
      document.getElementById("expense-category").value = "";
      document.getElementById("expense-description").value = "";
      document.getElementById("expense-date").value = todayStr;
    });
  }
  
  // Pagination event listeners
  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", async () => {
      if (window.currentPage > 1) {
        window.currentPage--;
        await window.loadExpenses(window.currentPage, window.pageSize, expensesList, 
          (current, total) => window.updatePaginationControls(current, total, pageInfo, prevPageBtn, nextPageBtn),
          (transaction) => window.renderExpense(transaction, expensesList),
          window.updateBudgetWithCurrentExpenses
        );
      }
    });
  }
  
  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", async () => {
      // Check if we can go to the next page
      if (window.currentPage < window.totalPages) {
        window.currentPage++;
        await window.loadExpenses(window.currentPage, window.pageSize, expensesList, 
          (current, total) => window.updatePaginationControls(current, total, pageInfo, prevPageBtn, nextPageBtn),
          (transaction) => window.renderExpense(transaction, expensesList),
          window.updateBudgetWithCurrentExpenses
        );
      }
    });
  }
});