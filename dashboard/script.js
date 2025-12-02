document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!token) {
        window.location.href = "../index.html";
        return;
      }

      try {
        const res = await fetch(`${CONFIG.BASE_URL}auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "*/*",
          },
        });

        if (!res.ok) throw new Error("Logout failed");

        localStorage.removeItem("token");
        window.location.href = "../index.html";
      } catch (err) {
        console.error("Logout error:", err);
        alert("Failed to logout. Please try again.");
      }
    });
  }
  
  // Initialize category budget display if on dashboard page
  if (typeof window.loadCategoryBudgets === 'function') {
    window.loadCategoryBudgets();
  }
});