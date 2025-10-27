const loginForm = document.querySelector("form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Login form submitted");

  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  console.log("Collected values:", { email, password });

  try {
    console.log("Sending POST request to login...");

    const response = await fetch(`${CONFIG.BASE_URL}auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Response received:", response);

    const data = await response.json();
    console.log("Response JSON:", data);

    if (response.ok) {
      console.log("Login successful");

      localStorage.setItem("token", data.token);

      alert("Login successful!");
      window.location.href = "../dashboard/index.html";
    } else {
      console.log("Login failed");
      alert(data.message || "Login failed!");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Something went wrong. Check console for details.");
  }
});
