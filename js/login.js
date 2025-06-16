import {
  showToast,
  toggleSpinner,
  setUserSession,
  redirectToRole
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});

async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  form.classList.remove("was-validated");

  const spinnerId = "loginSpinner";
  toggleSpinner(spinnerId, true);

  const email = document.getElementById("loginEmail")?.value.trim() ?? "";
  const password = document.getElementById("loginPassword")?.value ?? "";

  try {
    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberOrEmail: email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Login failed due to server error.");
    }

    const data = await response.json();

    setUserSession(data.userDetailsResponse, data.token);

    showToast("Login successful");

    setTimeout(() => redirectToRole(data.userDetailsResponse.role), 1000);
  } catch (error) {
    showToast(error.message || "Login failed. Please check your credentials.", true);
    console.error("Login error:", error);
  } finally {
    toggleSpinner(spinnerId, false);
  }
}
