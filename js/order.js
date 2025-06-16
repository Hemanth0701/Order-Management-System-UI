import {
  getUserSession,
  getJwtToken,
  getRecentOrderId,
  showSpinner,
  showToast
} from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const session = getUserSession();
  const token = getJwtToken();
  const userId = session?.id || session?.userId;
  const orderId = getRecentOrderId();

  if (!token || !orderId) {
    showToast("Order not found. Please try again.", true);
    return;
  }

  await loadOrderDetails(orderId, token);

  // Cancel button handler
  const cancelBtn = document.getElementById("cancelOrderBtn");
  cancelBtn?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      showSpinner(true);
      const res = await fetch(`http://localhost:8080/api/orders/cancel/${orderId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showSpinner(false);

      if (!res.ok) throw new Error("Order cancellation failed");
      showToast("Order cancelled successfully!");
      await loadOrderDetails(orderId, token); // Refresh UI
    } catch (err) {
      showToast("Error cancelling order: " + err.message, true);
    }
  });

  // Order History Button → forward userId
  const historyBtn = document.getElementById("orderHistoryBtn");
  historyBtn?.addEventListener("click", () => {
    if (!userId) {
      showToast("Session expired. Please log in again.", true);
      return;
    }
    window.location.href = `orders.html?userId=${userId}`;
  });
});

// 🟦 Load order details by ID
async function loadOrderDetails(orderId, token) {
  try {
    showSpinner(true);

    const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    showSpinner(false);

    if (!res.ok) throw new Error("Failed to fetch order details");

    const order = await res.json();
    renderOrder(order);
  } catch (err) {
    showToast("Error loading order: " + err.message, true);
  }
}

// 🟩 Render order details to UI
function renderOrder(order) {
  const container = document.getElementById("orderDetails");
  if (!container) return;

  container.innerHTML = `
    <h5>Order #${order.id}</h5>
    <p><strong>Status:</strong> ${order.status}</p>
    <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
    <p><strong>Discount:</strong> ₹${order.discount.toFixed(2)}</p>
    <p><strong>Final Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
    <p><strong>Placed At:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    <hr/>
    <ul class="list-group mb-3">
      ${order.items.map(item => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${item.productName}</strong><br/>
            Quantity: ${item.quantity}<br/>
            Price: ₹${item.priceAtPurchase.toFixed(2)}
          </div>
          <span class="fw-bold">₹${item.total.toFixed(2)}</span>
        </li>
      `).join("")}
    </ul>
  `;

  // Disable cancel button if already cancelled
  const cancelBtn = document.getElementById("cancelOrderBtn");
  if (order.status === "CANCELLED") {
    cancelBtn.disabled = true;
    cancelBtn.innerText = "Order Cancelled";
  }
}
