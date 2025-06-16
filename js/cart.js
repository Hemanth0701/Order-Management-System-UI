import { showToast, getUserSession, getJwtToken, storeRecentOrderId } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const cartBody = document.getElementById("cartBody");
  const cartTotalElem = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartEmptyMessage = document.getElementById("cartEmptyMessage");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const retryBtn = document.getElementById("retryCart");

  let cart = null;
  let pendingProductId = null;

  // Format number as INR currency
  function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }

  // Sanitize string to prevent XSS
  function sanitizeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Show or hide loading spinner
  function showSpinner(show = true) {
    loadingSpinner.classList.toggle("d-none", !show);
  }

  // Fetch cart from API, update cache and render
  async function fetchCart() {
    const session = getUserSession();
    const token = getJwtToken();

    if (!session || !token) {
      showToast("Please login to view your cart.", true);
      return;
    }

    // Try to load cached cart first
    const cachedCart = sessionStorage.getItem("userCart");
    if (cachedCart) {
      try {
        cart = JSON.parse(cachedCart);
        renderCart();
      } catch {
        // ignore parse errors
      }
    }

    try {
      showSpinner(true);
      retryBtn.classList.add("d-none");

      const response = await fetch(`http://localhost:8080/api/cart/${session.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSpinner(false);

      if (!response.ok) throw new Error("Failed to fetch cart");

      cart = await response.json();

      // Cache the fresh cart data
      sessionStorage.setItem("userCart", JSON.stringify(cart));
      renderCart();
    } catch (err) {
      showSpinner(false);
      console.error(err);
      showToast("Unable to load cart. Please try again.", true);
      retryBtn.classList.remove("d-none");
    }
  }

  // Remove item from cart API call
  async function removeItem(productId) {
    const session = getUserSession();
    const token = getJwtToken();

    if (!session || !token) {
      showToast("Please login to modify your cart.", true);
      return;
    }

    try {
      const url = `http://localhost:8080/api/cart/${session.id}/removeProduct?productId=${productId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to remove item");

      cart = await response.json();

      // Update cache
      sessionStorage.setItem("userCart", JSON.stringify(cart));
      showToast("Item removed from cart.");
      renderCart();
    } catch (err) {
      console.error(err);
      showToast("Error removing item. Try again.", true);
    }
  }

  // Checkout API call
  async function checkoutCart() {
    const token = getJwtToken();

    if (!token) {
      showToast("Please login to checkout.", true);
      return;
    }

    if (!cart || !cart.id) {
      showToast("No cart to checkout.", true);
      return;
    }

    try {
      showSpinner(true);

      const response = await fetch(`http://localhost:8080/api/orders/checkout/${cart.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      showSpinner(false);

      if (!response.ok) throw new Error("Checkout failed");

      const order = await response.json();

      // Store recent order ID for order details page
      storeRecentOrderId(order.id);

      // Clear cached cart
      sessionStorage.removeItem("userCart");

      showToast(`Order placed! Amount: ${formatPrice(order.finalAmount)}`);

      // Redirect to order page after short delay
      setTimeout(() => {
        window.location.href = "order.html";
      }, 1500);
    } catch (err) {
      showSpinner(false);
      console.error(err);
      showToast("Checkout failed. Try again.", true);
    }
  }

  // Render cart items table and total
  function renderCart() {
    if (!cart || !cart.items || cart.items.length === 0) {
      cartBody.innerHTML = "";
      cartEmptyMessage.classList.remove("d-none");
      cartTotalElem.textContent = `Total: ${formatPrice(0)}`;
      checkoutBtn.disabled = true;
      return;
    }

    cartEmptyMessage.classList.add("d-none");
    checkoutBtn.disabled = false;

    cartBody.innerHTML = cart.items
      .map(({ productId, quantity, priceAtAddTime }) => {
        const subtotal = priceAtAddTime * quantity;
        return `
          <tr data-product-id="${sanitizeHTML(productId)}">
            <td class="text-center">${sanitizeHTML( productId)}</td>
            <td class="text-end">${formatPrice(priceAtAddTime)}</td>
            <td class="text-center">${quantity}</td>
            <td class="text-end">${formatPrice(subtotal)}</td>
            <td class="text-center">
              <button class="btn btn-danger btn-sm remove-btn" data-bs-toggle="modal" data-bs-target="#removeConfirmModal">Remove</button>
            </td>
          </tr>
        `;
      })
      .join("");

    cartTotalElem.textContent = `Total: ${formatPrice(cart.finalPrice)}`;
  }

  // Event: Click on Remove button -> store productId, open modal
  cartBody.addEventListener("click", (e) => {
    const tr = e.target.closest("tr");
    if (!tr) return;

    if (e.target.classList.contains("remove-btn")) {
      pendingProductId = tr.dataset.productId;
      // Bootstrap modal triggers automatically via data-bs-toggle/data-bs-target
    }
  });

  // Event: Confirm remove in modal
  document.getElementById("confirmRemove").addEventListener("click", () => {
    if (pendingProductId) {
      removeItem(pendingProductId);
      pendingProductId = null;
      const modal = bootstrap.Modal.getInstance(document.getElementById("removeConfirmModal"));
      modal.hide();
    }
  });

  // Event: Click checkout button -> open modal
  checkoutBtn.addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("checkoutConfirmModal"));
    modal.show();
  });

  // Event: Confirm checkout in modal
  document.getElementById("confirmCheckout").addEventListener("click", () => {
    checkoutCart();
    const modal = bootstrap.Modal.getInstance(document.getElementById("checkoutConfirmModal"));
    modal.hide();
  });

  // Retry button event to refetch cart
  retryBtn.addEventListener("click", () => {
    retryBtn.classList.add("d-none");
    fetchCart();
  });

  // Initial fetch cart on page load
  fetchCart();
});
