// 📁 register.js
import {
  showToast,
  toggleSpinner,
  setUserSession,
  redirectToRole
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (form) {
    form.addEventListener("submit", handleRegister);
  }

  const dobInput = document.getElementById("regDob");
  if (dobInput) {
    dobInput.max = new Date().toISOString().split("T")[0]; // Set max date to today
  }
});

async function handleRegister(event) {
  event.preventDefault();

  const form = event.target;
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  form.classList.remove("was-validated");

  const spinnerId = "registerSpinner";
  toggleSpinner(spinnerId, true);

  const user = {
    username: document.getElementById("regUsername")?.value.trim() ?? "",
    email: document.getElementById("regEmail")?.value.trim() ?? "",
    password: document.getElementById("regPassword")?.value ?? "",
    phoneNumber: document.getElementById("regPhoneNumber")?.value.trim() ?? "",
    dob: document.getElementById("regDob")?.value ?? "",
    role: "USER" // Enforced role; backend should verify
  };

  try {
    const res = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Registration failed due to server error.");
    }

    const data = await res.json();
    if (data.token && data.userDetailsResponse) {
      setUserSession(data.userDetailsResponse, data.token);
      showToast("Registration successful!");
      setTimeout(() => redirectToRole("USER"), 1500);
    } else {
      throw new Error("Invalid response from server.");
    }
  } catch (err) {
    showToast(err.message || "Registration failed. Please try again.", true);
    console.error("Registration error:", err);
  } finally {
    toggleSpinner(spinnerId, false);
  }
}
