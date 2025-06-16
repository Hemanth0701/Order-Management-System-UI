import {
  showToast,
  showSpinner,
  toggleSpinner,
  getUserSession,
  getJwtToken,
  getUserId,
  formatPrice
} from "./utils.js";

// Base API URLs
const API_BASE = "http://localhost:8080";
const PRODUCTS_ENDPOINT = `${API_BASE}/api/products`;
const CART_ENDPOINT = `${API_BASE}/api/cart`;

// DOM Elements
const productDetailsContainer = document.getElementById("productDetailsContainer");
const breadcrumbProductName = document.getElementById("breadcrumbProductName");

// Show error UI + toast
function showError(message) {
  productDetailsContainer.innerHTML = `
    <div class="alert alert-danger text-center" role="alert">${message}</div>
  `;
  breadcrumbProductName.textContent = "Product Not Found";
  showToast(message, true);
}

// Render product details
function renderProduct(product) {
  breadcrumbProductName.textContent = product.name;

  productDetailsContainer.innerHTML = `
    <div class="row">
      <div class="col-md-6 mb-4">
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image img-fluid"
             onerror="this.src='images/placeholder.png';" />
      </div>
      <div class="col-md-6 product-info">
        <h2>${product.name}</h2>
        <p class="description">${product.description || "No description available."}</p>
        <h4 class="price">${formatPrice(product.currentPrice)}</h4>
        <button class="btn btn-primary" id="btnAddToCart">
          <span>Add to Cart</span>
          <span id="cartSpinner" class="spinner-border spinner-border-sm ms-2" style="display: none;"></span>
        </button>
      </div>
    </div>
  `;

  // Handle "Add to Cart" button click
  document.getElementById("btnAddToCart").addEventListener("click", () => {
    const user = getUserSession();
    if (!user) {
      showToast("Please login to add items to cart.", true);
      location.href = "login.html";
      return;
    }

    addToCart(product.id);
  });
}

// Add product to cart
async function addToCart(productId) {
  const token = getJwtToken();
  const userId = getUserId();

  if (!token || !userId) {
    showToast("Session expired. Please login again.", true);
    location.href = "login.html";
    return;
  }

  try {
    toggleSpinner("cartSpinner", true);

    const response = await fetch(`${CART_ENDPOINT}/${userId}/addProduct?productId=${productId}&quantity=1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to add product to cart.");
    }

    showToast("Product added to cart!");
  } catch (error) {
    showToast("Error adding to cart: " + error.message, true);
  } finally {
    toggleSpinner("cartSpinner", false);
  }
}

// Fetch product by ID (token sent)
async function fetchProductById(id) {
  const token = getJwtToken();

  try {
    showSpinner(true);

    const response = await fetch(`${PRODUCTS_ENDPOINT}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (response.status === 404) {
      showError("Product not found.");
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch product.");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    showError("Error loading product details. Please try again later.");
    return null;
  } finally {
    showSpinner(false);
  }
}

// Init page on load
document.addEventListener("DOMContentLoaded", async () => {
  const productId = localStorage.getItem("selectedProductId");

  if (!productId) {
    showError("No product selected.");
    return;
  }

  const product = await fetchProductById(productId);
  if (product) {
    renderProduct(product);
  }
});
