/**
 * Check overall budget limits and show warnings
 */
function checkOverallBudgetLimits() {
  try {
    // Get budget and spent amounts from localStorage
    const budgetData = localStorage.getItem("monthlyBudget");
    const spentData = localStorage.getItem("monthlySpent");

    if (!budgetData || !spentData) return;

    const budgetObj = JSON.parse(budgetData);
    const budget = parseFloat(budgetObj.amount || 0);
    const spent = parseFloat(spentData || 0);

    if (budget > 0) {
      const percentage = (spent / budget) * 100;

      // Warning at 80% and 90% usage
      if (spent > budget) {
        showAlert(
          `Warning: You have exceeded your monthly budget!\nBudget: $${budget.toFixed(
            2
          )}\nSpent: $${spent.toFixed(2)}`,
          "error"
        );
      } else if (percentage >= 90) {
        showAlert(
          `Warning: You are close to exceeding your monthly budget!\nBudget: $${budget.toFixed(
            2
          )}\nSpent: $${spent.toFixed(2)}\nRemaining: $${(
            budget - spent
          ).toFixed(2)}`,
          "warning"
        );
      } else if (percentage >= 80) {
        showAlert(
          `Notice: You have used 80% of your monthly budget.\nBudget: $${budget.toFixed(
            2
          )}\nSpent: $${spent.toFixed(2)}\nRemaining: $${(
            budget - spent
          ).toFixed(2)}`,
          "info"
        );
      }
    }
  } catch (error) {
    console.warn("Could not check overall budget limits:", error);
  }
}

/**
 * Check category budget limits and show warnings
 */
function checkCategoryBudgetLimits() {
  try {
    const categoryBudgetsData = localStorage.getItem("categoryBudgets");
    const categorySpentData = localStorage.getItem("categorySpent");

    if (!categoryBudgetsData || !categorySpentData) return;

    const categoryBudgets = JSON.parse(categoryBudgetsData);
    const categorySpent = JSON.parse(categorySpentData);

    for (const categoryId in categoryBudgets) {
      const budget = categoryBudgets[categoryId];
      const spent = categorySpent[categoryId] || 0;

      if (budget && budget.amount > 0) {
        const percentage = (spent / budget.amount) * 100;

        // Warning at 80% and 90% usage
        if (spent > budget.amount) {
          showAlert(
            `Warning: You have exceeded your ${
              budget.categoryName
            } budget!\nBudget: $${budget.amount.toFixed(
              2
            )}\nSpent: $${spent.toFixed(2)}`,
            "error"
          );
        } else if (percentage >= 90) {
          showAlert(
            `Warning: You are close to exceeding your ${
              budget.categoryName
            } budget!\nBudget: $${budget.amount.toFixed(
              2
            )}\nSpent: $${spent.toFixed(2)}\nRemaining: $${(
              budget.amount - spent
            ).toFixed(2)}`,
            "warning"
          );
        } else if (percentage >= 80) {
          showAlert(
            `Notice: You have used 80% of your ${
              budget.categoryName
            } budget.\nBudget: $${budget.amount.toFixed(
              2
            )}\nSpent: $${spent.toFixed(2)}\nRemaining: $${(
              budget.amount - spent
            ).toFixed(2)}`,
            "info"
          );
        }
      }
    }
  } catch (error) {
    console.warn("Could not check category budget limits:", error);
  }
}

function showAlert(message, type = "info") {
  // Check if we've already shown this exact message recently to avoid spam
  const alertKey = `${message}-${type}`;
  const lastShown = sessionStorage.getItem(alertKey);
  const now = Date.now();

  // If we've shown this alert in the last 30 seconds, don't show it again
  if (lastShown && now - parseInt(lastShown) < 30000) {
    return;
  }

  // Record when we showed this alert
  sessionStorage.setItem(alertKey, now.toString());

  // Create alert element
  const alertEl = document.createElement("div");
  alertEl.className = `budget-alert budget-alert-${type}`;

  // Style the alert based on type
  const baseStyles = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    max-width: 400px;
    margin: 10px;
    animation: fadeIn 0.3s ease-in-out;
  `;

  let typeStyles = "";
  switch (type) {
    case "error":
      typeStyles = "background-color: #dc3545;";
      break;
    case "warning":
      typeStyles = "background-color: #ffc107; color: #212529;";
      break;
    case "info":
    default:
      typeStyles = "background-color: #17a2b8;";
      break;
  }

  alertEl.style.cssText = baseStyles + typeStyles;
  alertEl.textContent = message;

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    float: right;
    margin-left: 10px;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
  `;
  closeBtn.onclick = () => {
    alertEl.remove();
    sessionStorage.removeItem(alertKey);
  };
  alertEl.prepend(closeBtn);

  document.body.appendChild(alertEl);

  setTimeout(() => {
    if (alertEl.parentNode) {
      alertEl.remove();
      sessionStorage.removeItem(alertKey);
    }
  }, 5000);
}

const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

function initBudgetWarnings() {
  document.addEventListener("DOMContentLoaded", () => {
    checkOverallBudgetLimits();
    checkCategoryBudgetLimits();
  });

  window.checkOverallBudgetLimits = checkOverallBudgetLimits;
  window.checkCategoryBudgetLimits = checkCategoryBudgetLimits;
}

initBudgetWarnings();
