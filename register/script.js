const form = document.querySelector("form");
const passwordInput = document.getElementById("password");

// Create a password strength indicator
let strengthText = document.createElement("div");
strengthText.id = "password-strength";
strengthText.style.marginTop = "5px";
strengthText.style.fontWeight = "bold";
passwordInput.insertAdjacentElement("afterend", strengthText);

function getPasswordStrength(value) {
  let strength = 0;

  if (/[a-z]/.test(value)) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;
  if (value.length >= 8) strength++;

  return strength;
}

passwordInput.addEventListener("input", () => {
  const value = passwordInput.value;
  const strength = getPasswordStrength(value);

  let message = "";
  let className = "";

  if (strength <= 2) {
    message = "Weak";
    className = "weak";
  } else if (strength === 3 || strength === 4) {
    message = "Medium";
    className = "medium";
  } else if (strength === 5) {
    message = "Strong";
    className = "strong";
  }

  strengthText.textContent = ` ${message}`;
  strengthText.className = className;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Form submitted");

  const name = document.getElementById("phone").value;
  const email = document.getElementById("email").value;
  const password = passwordInput.value;
  const confirmPassword = document.getElementById("confirm-password").value;

  console.log("Collected values:", { name, email, password, confirmPassword });

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const strength = getPasswordStrength(password);
  if (strength < 3) {
    alert(
      "Password is too weak! Use uppercase, lowercase, numbers, symbols, and at least 8 characters."
    );
    return;
  }

  try {
    console.log("Sending POST request to backend...");

    const response = await fetch(`${CONFIG.BASE_URL}auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    console.log("Response received:", response);

    const data = await response.json();
    console.log("Response JSON:", data);

    if (response.ok) {
      alert("Registration successful!");
      window.location.href = "../login/index.html";
    } else {
      alert(data.message || "Registration failed!");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Something went wrong. Check console for details.");
  }
});
