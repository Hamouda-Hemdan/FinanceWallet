// Filtering and search functionality

async function applyFilters(
  searchTermInput, 
  filterCategorySelect, 
  filterTypeSelect, 
  minAmountInput, 
  maxAmountInput, 
  filterDateFromInput, 
  filterDateToInput, 
  allTransactions, 
  fetchAllTransactionsForFiltering, 
  expensesList, 
  updatePaginationControls, 
  renderExpense
) {
  try {
    // Get filter values
    const searchTerm = searchTermInput ? searchTermInput.value.toLowerCase() : '';
    const filterCategory = filterCategorySelect ? filterCategorySelect.value : '';
    const filterType = filterTypeSelect ? filterTypeSelect.value : '';
    const minAmount = minAmountInput ? parseFloat(minAmountInput.value) || 0 : 0;
    const maxAmount = maxAmountInput ? parseFloat(maxAmountInput.value) || Infinity : Infinity;
    const filterDateFrom = filterDateFromInput ? filterDateFromInput.value : '';
    const filterDateTo = filterDateToInput ? filterDateToInput.value : '';
    
    // Fetch all transactions if we haven't already
    if (allTransactions.length === 0) {
      const fetchedTransactions = await fetchAllTransactionsForFiltering();
      // Update the global allTransactions array
      allTransactions.splice(0, allTransactions.length, ...fetchedTransactions);
    }
    
    // Filter transactions
    let filteredTransactions = [...allTransactions];
    
    // Apply search term filter
    if (searchTerm) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        const notes = (transaction.notes || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const tags = (transaction.tags || '').toLowerCase();
        return notes.includes(searchTerm) || category.includes(searchTerm) || tags.includes(searchTerm);
      });
    }
    
    // Apply category filter
    if (filterCategory) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.category === filterCategory
      );
    }
    
    // Apply type filter
    if (filterType) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.type === filterType
      );
    }
    
    // Apply amount filters
    filteredTransactions = filteredTransactions.filter(transaction => {
      const amount = parseFloat(transaction.amount || 0);
      return amount >= minAmount && amount <= maxAmount;
    });
    
    // Apply date filters
    if (filterDateFrom || filterDateTo) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt || transaction.date);
        
        if (filterDateFrom && transactionDate < new Date(filterDateFrom)) {
          return false;
        }
        
        if (filterDateTo && transactionDate > new Date(filterDateTo)) {
          return false;
        }
        
        return true;
      });
    }
    
    // Display filtered transactions
    displayFilteredTransactions(filteredTransactions, expensesList, updatePaginationControls, renderExpense);
  } catch (err) {
    console.error("Error applying filters:", err);
    alert("Failed to apply filters. Please try again.");
  }
}

// Fetch all transactions for filtering
async function fetchAllTransactionsForFiltering() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];
    
    // Fetch all transactions across multiple pages
    let allTransactions = [];
    let page = 1;
    const pageSize = 50; 
    let hasMorePages = true;
    
    // Fetch transactions page by page until we have all
    while (hasMorePages) {
      const response = await fetch(`${CONFIG.BASE_URL}api/transactions?page=${page}&pageSize=${pageSize}`, {
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
          transactions = Array.isArray(data.data.transactions) ? data.data.transactions : [];
          totalCount = data.data.totalCount || transactions.length;
        }
      }
      
      // Add transactions to our collection
      allTransactions = allTransactions.concat(transactions);
      
      // Check if we have more pages
      const totalPages = Math.ceil(totalCount / pageSize);
      if (page >= totalPages) {
        hasMorePages = false;
      } else {
        page++;
      }
      
      // Safety check to prevent infinite loops
      if (page > 100) {
        hasMorePages = false;
      }
    }
    
    return allTransactions;
  } catch (err) {
    console.error("Error fetching all transactions for filtering:", err);
    return [];
  }
}

// Display filtered transactions
function displayFilteredTransactions(transactions, expensesList, updatePaginationControls, renderExpense) {
  if (!expensesList) return;
  
  // Clear the container
  expensesList.innerHTML = '';
  
  if (transactions.length === 0) {
    expensesList.innerHTML = '<p class="no-expenses">No transactions match the selected filters.</p>';
    updatePaginationControls(1, 1);
    return;
  }
  
  // Sort transactions by date (newest first)
  transactions.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  
  // Render each transaction
  transactions.forEach(transaction => {
    renderExpense(transaction, expensesList);
  });
  
  // Update pagination controls (for filtered results, we'll show all on one page)
  updatePaginationControls(1, 1);
}

// Clear all filters
function clearFilters(
  searchTermInput, 
  filterCategorySelect, 
  filterTypeSelect, 
  minAmountInput, 
  maxAmountInput, 
  filterDateFromInput, 
  filterDateToInput
) {
  if (searchTermInput) searchTermInput.value = '';
  if (filterCategorySelect) filterCategorySelect.value = '';
  if (filterTypeSelect) filterTypeSelect.value = '';
  if (minAmountInput) minAmountInput.value = '';
  if (maxAmountInput) maxAmountInput.value = '';
  if (filterDateFromInput) filterDateFromInput.value = '';
  if (filterDateToInput) filterDateToInput.value = '';
}

// Export functions
window.applyFilters = applyFilters;
window.fetchAllTransactionsForFiltering = fetchAllTransactionsForFiltering;
window.displayFilteredTransactions = displayFilteredTransactions;
window.clearFilters = clearFilters;