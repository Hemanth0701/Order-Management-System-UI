import {
  getUserSession,
  getUserId,
  getJwtToken,
  showToast,
  showSpinner,
  setUserSession
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("updateForm");

  const session = getUserSession();
  if (!session) {
    showToast("Session expired. Please log in again.", true);
    window.location.href = "login.html";
    return;
  }

  const userId = getUserId();
  const token = getJwtToken();

  // ✅ Fill form with session data
  document.getElementById("email").value = session.email || "";
  document.getElementById("phoneNumber").value = session.phoneNumber || "";
  document.getElementById("dob").value = session.dob || "";
  document.getElementById("role").value = session.role || "";
  document.getElementById("createdAt").value = session.createdAt || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const dob = document.getElementById("dob").value;
    const role = session.role;

    const payload = {
      role,
      email,
      phoneNumber,
      dob,
    };

    showSpinner(true);

    try {
      const res = await fetch(`http://localhost:8080/api/users/update/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      showSpinner(false);

      if (res.ok) {
        setUserSession(
          {
            ...session,
            email,
            phoneNumber,
            dob,
          },
          token
        );
        showToast("Profile updated successfully.");
      } else {
        showToast(result.message || "Update failed", true);
      }
    } catch (err) {
      showSpinner(false);
      showToast("Error: " + err.message, true);
    }
  });
});
