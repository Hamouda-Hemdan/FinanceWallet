// PDF generation functionality

// Function to fetch user profile information
async function getUserProfile() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const response = await fetch(`${CONFIG.BASE_URL}auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const profileJson = await response.json();
    return profileJson.data;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

// Function to download transactions as PDF with date range
async function downloadTransactionsAsPdf(
  startDateInput,
  endDateInput,
  downloadPdfBtn,
  fetchTransactionsByDateRange
) {
  try {
    // Show loading indicator
    if (downloadPdfBtn) {
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.textContent = "Generating PDF...";
    }

    // Get date range
    const startDate = startDateInput ? startDateInput.value : "";
    const endDate = endDateInput ? endDateInput.value : "";

    // Validate date range
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      resetPdfButton(downloadPdfBtn);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      resetPdfButton(downloadPdfBtn);
      return;
    }

    // Get user profile information
    const userProfile = await getUserProfile();
    const userName = userProfile?.name || "Unknown User";

    // Fetch transactions within date range
    const transactions = await fetchTransactionsByDateRange(startDate, endDate);

    if (transactions.length === 0) {
      alert("No transactions found for the selected date range.");
      resetPdfButton(downloadPdfBtn);
      return;
    }

    // Create PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: `Transaction History - ${userName}`,
      subject: "Personal Finance Transactions",
      author: "Finance Tracker App",
    });

    // Define colors matching the platform style
    const primaryColor = [89, 43, 34];
    const secondaryColor = [207, 207, 207];
    const backgroundColor = [217, 217, 217];
    const incomeColor = [92, 184, 92];
    const expenseColor = [217, 83, 79];
    const accentColor = [66, 133, 244];

    // Add header with gradient effect
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");

    // Add decorative elements
    doc.setFillColor(...accentColor);
    doc.circle(180, 15, 8, "F");
    doc.setFillColor(255, 255, 255);
    doc.circle(180, 15, 5, "F");

    // Add title with shadow effect
    doc.setFontSize(24);
    doc.setTextColor(255);
    doc.setFont(undefined, "bold");
    doc.text(`Transaction History`, 20, 22);

    // Add subtitle with date range
    doc.setFontSize(14);
    doc.setTextColor(240);
    doc.setFont(undefined, "normal");
    doc.text(`for ${userName}`, 20, 30);
    doc.setFontSize(12);
    doc.text(`${formatDate(startDate)} to ${formatDate(endDate)}`, 20, 37);

    // Add platform branding
    doc.setFontSize(10);
    doc.setTextColor(200);
    doc.text("Finance Tracker • OkTeam", 160, 35, null, null, "right");

    // Add content background
    doc.setFillColor(...backgroundColor);
    doc.rect(10, 45, 190, 10, "F");

    // Add generation info with icon-style presentation
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Report Generated: ${currentDate}`, 20, 52);

    // Add table header with enhanced styling
    const headers = [
      ["Date", "Description", "Category", "Type", "Wallet", "Amount"],
    ];

    // Prepare transaction data
    const data = transactions.map((transaction) => {
      const date =
        transaction.createdAt || transaction.date || new Date().toISOString();
      const formattedDate = new Date(date).toLocaleDateString();
      const amount = parseFloat(transaction.amount || 0).toFixed(2);
      const amountDisplay =
        transaction.type === "Income" ? `+$${amount}` : `-$${amount}`;

      return [
        formattedDate,
        transaction.notes || "No description",
        transaction.category || "N/A",
        transaction.type || "N/A",
        transaction.walletName || "Unknown wallet",
        amountDisplay,
      ];
    });

    // Add table to PDF using autoTable plugin with enhanced styling
    // Handle multiple pages automatically
    doc.autoTable({
      head: headers,
      body: data,
      startY: 65,
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: "bold",
        lineWidth: 0.1,
        lineColor: [255, 255, 255],
      },
      bodyStyles: {
        textColor: 0,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      alternateRowStyles: {
        fillColor: secondaryColor,
      },
      margin: { left: 15, right: 15 },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 5) {
          const text = data.cell.raw;
          if (text.startsWith("+")) {
            data.cell.styles.textColor = incomeColor;
            data.cell.styles.fontStyle = "bold";
          } else if (text.startsWith("-")) {
            data.cell.styles.textColor = expenseColor;
            data.cell.styles.fontStyle = "bold";
          }
        }

        // Style header cells
        if (data.section === "head") {
          data.cell.styles.halign = "center";
        }
      },
      didDrawCell: function (data) {},

      pageBreak: "auto",
    });

    // Add summary section with enhanced styling
    let finalY = doc.lastAutoTable.finalY || 65;

    // If the table took more than one page, we need to add the summary on a new page
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    } else {
      finalY += 15;
    }

    const summaryStartY = finalY;

    // Summary header with background
    doc.setFillColor(...primaryColor);
    doc.rect(15, summaryStartY - 5, 180, 12, "F");
    doc.setFontSize(16);
    doc.setTextColor(255);
    doc.setFont(undefined, "bold");
    doc.text("Financial Summary", 20, summaryStartY + 5);

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount || 0);
      if (transaction.type === "Income") {
        totalIncome += amount;
      } else if (transaction.type === "Expense") {
        totalExpenses += amount;
      }
    });

    // Add summary boxes with shadows
    const boxWidth = 55;
    const boxHeight = 30;
    const boxSpacing = 5;
    const startX = 20;
    const boxY = summaryStartY + 20;

    // Income box
    doc.setFillColor(255);
    doc.setDrawColor(200);
    doc.rect(startX, boxY, boxWidth, boxHeight, "FD");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text("Total Income", startX + 5, boxY + 12);
    doc.setFontSize(16);
    doc.setTextColor(...incomeColor);
    doc.text(`$${totalIncome.toFixed(2)}`, startX + 5, boxY + 22);

    // Expenses box
    const expensesX = startX + boxWidth + boxSpacing;
    doc.setFillColor(255);
    doc.setDrawColor(200);
    doc.rect(expensesX, boxY, boxWidth, boxHeight, "FD");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text("Total Expenses", expensesX + 5, boxY + 12);
    doc.setFontSize(16);
    doc.setTextColor(...expenseColor);
    doc.text(`$${totalExpenses.toFixed(2)}`, expensesX + 5, boxY + 22);

    // Net Balance box
    const balanceX = expensesX + boxWidth + boxSpacing;
    doc.setFillColor(255);
    doc.setDrawColor(200);
    doc.rect(balanceX, boxY, boxWidth, boxHeight, "FD");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text("Net Balance", balanceX + 5, boxY + 12);
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(
      `$${(totalIncome - totalExpenses).toFixed(2)}`,
      balanceX + 5,
      boxY + 22
    );

    // Add visual indicator for net balance
    const netBalance = totalIncome - totalExpenses;
    if (netBalance > 0) {
      doc.setFillColor(...incomeColor);
      doc.triangle(
        balanceX + boxWidth - 15,
        boxY + 10,
        balanceX + boxWidth - 5,
        boxY + 10,
        balanceX + boxWidth - 10,
        boxY + 5,
        "F"
      );
    } else if (netBalance < 0) {
      doc.setFillColor(...expenseColor);
      doc.triangle(
        balanceX + boxWidth - 15,
        boxY + 5,
        balanceX + boxWidth - 5,
        boxY + 5,
        balanceX + boxWidth - 10,
        boxY + 10,
        "F"
      );
    }

    // Add signature section with decorative border
    let signatureY = boxY + boxHeight + 25;

    // If we're near the bottom of the page, add a new page
    if (signatureY > 250) {
      doc.addPage();
      signatureY = 30;
    }

    doc.setLineWidth(2);
    doc.setDrawColor(...primaryColor);
    doc.line(15, signatureY - 10, 195, signatureY - 10);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont(undefined, "italic");
    doc.text("Generated by Finance Tracker Platform", 20, signatureY);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...primaryColor);
    doc.text("OkTeam", 20, signatureY + 7);

    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.setFont(undefined, "normal");
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, null, null, "right");
    }

    // Save the PDF
    // Sanitize filename to remove invalid characters
    const sanitizedStartDate = startDate.replace(/[^a-zA-Z0-9]/g, "-");
    const sanitizedEndDate = endDate.replace(/[^a-zA-Z0-9]/g, "-");
    doc.save(
      `transactions_${userName}_${sanitizedStartDate}_to_${sanitizedEndDate}.pdf`
    );

    // Restore button state
    resetPdfButton(downloadPdfBtn);

    alert("PDF downloaded successfully!");
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Failed to generate PDF. Please try again.");

    // Restore button state
    resetPdfButton(downloadPdfBtn);
  }
}

// Helper function to reset PDF button state
function resetPdfButton(downloadPdfBtn) {
  if (downloadPdfBtn) {
    downloadPdfBtn.disabled = false;
    downloadPdfBtn.textContent = "Download Transactions as PDF";
  }
}

// Helper function to format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Function to fetch transactions within a date range
async function fetchTransactionsByDateRange(startDate, endDate) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, returning empty array");
      return [];
    }

    console.log(`Fetching transactions from ${startDate} to ${endDate}`);

    let allTransactions = [];
    let page = 1;
    const pageSize = 50;
    let hasMorePages = true;

    // Fetch transactions page by page until we have all
    while (hasMorePages) {
      console.log(`Fetching page ${page}`);
      const response = await fetch(
        `${CONFIG.BASE_URL}api/transactions?page=${page}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch transactions:", errorText);
        throw new Error(
          `Failed to fetch transactions: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Received data for page", page, ":", data);

      // Handle paginated response format
      let transactions = [];
      let totalCount = 0;

      if (Array.isArray(data)) {
        transactions = data;
        totalCount = data.length;
        console.log("Data is array, count:", transactions.length);
      } else if (data.data) {
        if (Array.isArray(data.data)) {
          transactions = data.data;
          totalCount = data.data.length;
          console.log("Data.data is array, count:", transactions.length);
        } else if (data.data.items) {
          transactions = Array.isArray(data.data.items) ? data.data.items : [];
          totalCount = data.data.totalCount || transactions.length;
          console.log(
            "Data.data.items is array, count:",
            transactions.length,
            "total:",
            totalCount
          );
        } else if (data.data.transactions) {
          transactions = Array.isArray(data.data.transactions)
            ? data.data.transactions
            : [];
          totalCount = data.data.totalCount || transactions.length;
          console.log(
            "Data.data.transactions is array, count:",
            transactions.length,
            "total:",
            totalCount
          );
        }
      }

      // Add transactions to our collection
      allTransactions = allTransactions.concat(transactions);

      // Check if we have more pages
      const totalPages = Math.ceil(totalCount / pageSize);
      console.log(`Page ${page} of ${totalPages}`);
      if (page >= totalPages) {
        hasMorePages = false;
      } else {
        page++;
      }

      // Safety check to prevent infinite loops
      if (page > 100) {
        console.warn("Too many pages, stopping fetch");
        hasMorePages = false;
      }
    }

    console.log("Total transactions before filtering:", allTransactions.length);

    // Filter transactions by date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log("Filtering from:", start, "to:", end);

    const filteredTransactions = allTransactions.filter((transaction) => {
      const transactionDate = new Date(
        transaction.createdAt || transaction.date
      );
      const isInDateRange = transactionDate >= start && transactionDate <= end;
      if (!isInDateRange) {
        // Only log if it's close to the date range
        const timeDiffStart = Math.abs(transactionDate - start);
        const timeDiffEnd = Math.abs(transactionDate - end);
        const dayInMillis = 24 * 60 * 60 * 1000;

        // Log if within 3 days of the range
        if (timeDiffStart < 3 * dayInMillis || timeDiffEnd < 3 * dayInMillis) {
          console.log(
            "Excluding transaction:",
            transactionDate,
            "not in range"
          );
        }
      }
      return isInDateRange;
    });

    console.log("Filtered transactions count:", filteredTransactions.length);
    return filteredTransactions;
  } catch (err) {
    console.error("Error fetching transactions by date range:", err);
    alert(`Error fetching transactions: ${err.message}`);
    return [];
  }
}

// Export functions
window.getUserProfile = getUserProfile;
window.downloadTransactionsAsPdf = downloadTransactionsAsPdf;
window.resetPdfButton = resetPdfButton;
window.formatDate = formatDate;
window.fetchTransactionsByDateRange = fetchTransactionsByDateRange;
