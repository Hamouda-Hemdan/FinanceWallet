document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const profileRes = await fetch(`${CONFIG.BASE_URL}auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!profileRes.ok) throw new Error("Failed to load profile");

    const profileJson = await profileRes.json();
    const profile = profileJson.data;

    const sidebarName = document.getElementById("sidebar-name");
    if (sidebarName) {
      sidebarName.textContent = profile.name || "Unknown";
    }

    const sidebarEmail = document.getElementById("sidebar-email");
    if (sidebarEmail) {
      sidebarEmail.textContent = profile.email || "";
    }

    const profileName = document.getElementById("profile-name");
    if (profileName) {
      profileName.textContent = profile.name || "Unknown";
    }

    const detailName = document.getElementById("detail-name");
    if (detailName) {
      detailName.textContent = profile.name || "Unknown";
    }

    const detailEmail = document.getElementById("detail-email");
    if (detailEmail) {
      detailEmail.textContent = profile.email || "";
      detailEmail.href = `mailto:${profile.email}`;
    }

    const detailsContainer = document.querySelector(
      ".profile-details .details"
    );
    if (detailsContainer) {
      const createdAtElem = document.createElement("p");
      createdAtElem.innerHTML = `<strong>Account Created:</strong> ${new Date(
        profile.createdAt
      ).toLocaleDateString()}`;
      detailsContainer.appendChild(createdAtElem);
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
});
