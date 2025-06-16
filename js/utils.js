// ✅ Show Bootstrap Toast
export function showToast(message, isError = false) {
  const containerId = "toastContainer";
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.style.position = "fixed";
    container.style.top = "1rem";
    container.style.right = "1rem";
    container.style.zIndex = "1055";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${isError ? "danger" : "success"} border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.style.minWidth = "250px";

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;

  container.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// ✅ Show/Hide Fullscreen Spinner
export function showSpinner(show) {
  const existing = document.getElementById("loadingSpinner");

  if (show) {
    if (!existing) {
      const spinner = document.createElement("div");
      spinner.id = "loadingSpinner";
      spinner.innerHTML = `
        <div class="text-center my-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>`;
      document.body.appendChild(spinner);
    }
  } else {
    if (existing) existing.remove();
  }
}

// ✅ Toggle any inline spinner (e.g., button)
export function toggleSpinner(spinnerId, show) {
  const spinner = document.getElementById(spinnerId);
  if (spinner) spinner.style.display = show ? "inline-block" : "none";
}

// ✅ Save user session with expiry (default 30 min)
export function setUserSession(user, token, expiryMs = 30 * 60 * 1000) {
  const expiry = Date.now() + expiryMs;
  const session = { ...user, token, expiry };
  localStorage.setItem("userSession", JSON.stringify(session));
}

// ✅ Get valid session or auto-clear if expired
export function getUserSession() {
  const sessionStr = localStorage.getItem("userSession");
  if (!sessionStr) return null;

  try {
    const session = JSON.parse(sessionStr);
    if (Date.now() > session.expiry) {
      clearUserSession();
      return null;
    }
    return session;
  } catch {
    clearUserSession();
    return null;
  }
}

// ✅ Price formatting helper
export function formatPrice(amount) {
  return `₹${parseFloat(amount).toFixed(2)}`;
}

// ✅ Clear session
export function clearUserSession() {
  localStorage.removeItem("userSession");
}

// ✅ Get token from session
export function getJwtToken() {
  const session = getUserSession();
  return session?.token ?? null;
}

// ✅ Get user ID from session
export function getUserId() {
  const session = getUserSession();
  return session?.id ?? session?.userId ?? null;
}

// ✅ Save recent order ID for order.html
export function storeRecentOrderId(orderId) {
  localStorage.setItem("recentOrderId", orderId);
}

export function getRecentOrderId() {
  return localStorage.getItem("recentOrderId");
}

// ✅ Redirect based on role
export function redirectToRole(role) {
  switch ((role ?? "").toUpperCase()) {
    case "ADMIN":
      window.location.href = "admin.html";
      break;
    case "SELLER":
      window.location.href = "seller-dashboard.html";
      break;
    default:
      window.location.href = "shop.html";
  }
}
