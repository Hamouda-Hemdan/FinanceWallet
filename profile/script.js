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

    document.getElementById("sidebar-name").textContent =
      profile.name || "Unknown";
    document.getElementById("sidebar-email").textContent = profile.email || "";
    document.getElementById("profile-name").textContent =
      profile.name || "Unknown";
    document.getElementById("detail-name").textContent =
      profile.name || "Unknown";
    document.getElementById("detail-email").textContent = profile.email || "";
    document.getElementById("detail-email").href = `mailto:${profile.email}`;

    const createdAtElem = document.createElement("p");
    createdAtElem.innerHTML = `<strong>Account Created:</strong> ${new Date(
      profile.createdAt
    ).toLocaleDateString()}`;
    document
      .querySelector(".profile-details .details")
      .appendChild(createdAtElem);
  } catch (err) {
    console.error("Profile load error:", err);
  }
});
