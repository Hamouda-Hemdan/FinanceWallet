// API functions for loading data
async function loadWallets(walletSelect) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      if (walletSelect) walletSelect.innerHTML = '<option value="">Please log in</option>';
      return;
    }
    
    const response = await fetch(`${CONFIG.BASE_URL}wallets`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wallets: ${response.status}`);
    }
    
    const data = await response.json();
    const wallets = Array.isArray(data) ? data : data.data || [];
    
    // Populate wallet dropdown
    if (walletSelect) {
      walletSelect.innerHTML = '<option value="">Select Wallet</option>';
      wallets.forEach(wallet => {
        const option = document.createElement("option");
        option.value = wallet.walletId;
        option.textContent = `${wallet.name} (${wallet.balance} ${wallet.currency})`;
        walletSelect.appendChild(option);
      });
      
      // Select first wallet by default if only one exists
      if (wallets.length === 1) {
        walletSelect.value = wallets[0].walletId;
      }
    }
  } catch (err) {
    console.error("Error loading wallets:", err);
    if (walletSelect) walletSelect.innerHTML = '<option value="">Failed to load wallets</option>';
  }
}

async function loadTransactionTypes(typeSelect, filterTypeSelect) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      if (typeSelect) typeSelect.innerHTML = '<option value="">Please log in</option>';
      return;
    }
    
    const response = await fetch(`${CONFIG.BASE_URL}api/enums/transaction-types`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction types: ${response.status}`);
    }
    
    const data = await response.json();
    const types = data.data || [];
    
    // Populate transaction type dropdown
    if (typeSelect) {
      typeSelect.innerHTML = '<option value="">Select Type</option>';
      types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.value;
        option.textContent = type.name;
        typeSelect.appendChild(option);
      });
    }
    
    // Also populate filter type dropdown
    if (filterTypeSelect) {
      filterTypeSelect.innerHTML = '<option value="">All Types</option>';
      types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.value;
        option.textContent = type.name;
        filterTypeSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error loading transaction types:", err);
    if (typeSelect) typeSelect.innerHTML = '<option value="">Failed to load transaction types</option>';
    if (filterTypeSelect) filterTypeSelect.innerHTML = '<option value="">Failed to load transaction types</option>';
  }
}

async function loadCategories(categorySelect, filterCategorySelect) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      if (categorySelect) categorySelect.innerHTML = '<option value="">Please log in</option>';
      if (filterCategorySelect) filterCategorySelect.innerHTML = '<option value="">All Categories</option>';
      return;
    }
    
    const response = await fetch(`${CONFIG.BASE_URL}api/enums/transaction-categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Combine expense and income categories
    const expenseCategories = data.data?.expenseCategories || [];
    const incomeCategories = data.data?.incomeCategories || [];
    const allCategories = [...expenseCategories, ...incomeCategories];
    
    // Remove duplicates
    const uniqueCategories = allCategories.filter((category, index, self) => 
      index === self.findIndex(c => c.value === category.value)
    );
    
    // Populate category dropdown
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Select Category</option>';
      uniqueCategories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.value;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    }
    
    // Also populate filter category dropdown
    if (filterCategorySelect) {
      filterCategorySelect.innerHTML = '<option value="">All Categories</option>';
      uniqueCategories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.value;
        option.textContent = category.name;
        filterCategorySelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error loading categories:", err);
    if (categorySelect) categorySelect.innerHTML = '<option value="">Failed to load categories</option>';
    if (filterCategorySelect) filterCategorySelect.innerHTML = '<option value="">Failed to load categories</option>';
  }
}

// Export functions
window.loadWallets = loadWallets;
window.loadTransactionTypes = loadTransactionTypes;
window.loadCategories = loadCategories;