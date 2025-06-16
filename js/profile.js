import {
  getUserSession,
  clearUserSession,
  getJwtToken,
  showToast,
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const phone = document.getElementById("phoneNumber");
  const dob = document.getElementById("dob");
  const createdAt = document.getElementById("createdAt");
  const errorMessage = document.getElementById("errorMessage");

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back to Profile';
  backBtn.className = 'btn btn-outline-secondary mb-4';
  backBtn.addEventListener('click', () => {
    if (document.referrer.includes('profile')) {
      window.history.back();
    } else {
      window.location.href = `profile.html?userId=${userId}`;
    }
  });

  function loadUserDetails() {
    const session = getUserSession();

    if (!session) {
      errorMessage.classList.remove("d-none");
      showToast("Session expired. Please log in again.", true);
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return;
    }

    username.textContent = session.username ?? "-";
    email.textContent = session.email ?? "-";
    phone.textContent = session.phoneNumber || "-";
    dob.textContent = session.dob || "-";
    createdAt.textContent = formatDateTime(session.createdAt);
  }

  function formatDateTime(iso) {
    if (!iso) return "-";
    const date = new Date(iso);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  document.getElementById("editBtn").addEventListener("click", () => {
    window.location.href = "update-user.html";
  });

  document.getElementById("deleteBtn").addEventListener("click", async () => {
    const confirmDelete = confirm("Are you sure you want to delete your account?");
    if (!confirmDelete) return;

    try {
      const token = getJwtToken();
      if (!token) throw new Error("Missing token");

      const response = await fetch("http://localhost:8080/api/user/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Delete failed");

      showToast("Account deleted successfully");
      localStorage.clear();
      setTimeout(() => window.location.href = "index.html", 1000);
    } catch (error) {
      console.error(error);
      showToast("Error deleting account", true);
    }
  });

  document.getElementById("orderHistoryBtn").addEventListener("click", () => {
    window.location.href = "orders.html";
  });

  loadUserDetails();
});
