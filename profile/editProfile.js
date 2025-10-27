document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must log in first!");
    window.location.href = "../login.html";
    return;
  }

  const editPopup = document.getElementById("edit-popup");
  const editForm = document.getElementById("edit-profile-form");
  const cancelPopupBtn = document.getElementById("cancel-popup");
  const editNameInput = document.getElementById("edit-name");
  const editEmailInput = document.getElementById("edit-email");

  async function loadProfile() {
    try {
      const res = await fetch(`${CONFIG.BASE_URL}auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const profile = data.data;

      document.getElementById("sidebar-name").textContent = profile.name;
      document.getElementById("sidebar-email").textContent = profile.email;
      document.getElementById("profile-name").textContent = profile.name;
      document.getElementById("detail-name").textContent = profile.name;
      document.getElementById("detail-email").textContent = profile.email;
      document.getElementById("detail-email").href = `mailto:${profile.email}`;

      editNameInput.value = profile.name;
      editEmailInput.value = profile.email;
    } catch (err) {
      console.error("Profile load error:", err);
      alert("Failed to load profile");
    }
  }

  await loadProfile();

  document.querySelector(".edit-link").addEventListener("click", (e) => {
    e.preventDefault();
    editPopup.style.display = "flex";
  });

  cancelPopupBtn.addEventListener("click", () => {
    editPopup.style.display = "none";
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = editNameInput.value.trim();
    const email = editEmailInput.value.trim();

    try {
      const res = await fetch(`${CONFIG.BASE_URL}auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      alert("Profile updated successfully!");
      editPopup.style.display = "none";
      await loadProfile();
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update profile");
    }
  });
});
