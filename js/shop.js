import { getUserSession, clearUserSession, showToast, toggleSpinner } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:8080";
  const shopGrid = document.getElementById("shopProductGrid");
  const userGreeting = document.getElementById("userGreeting");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("shopSearchInput");
  const searchBtn = document.getElementById("searchBtn");
  const categoryFilter = document.getElementById("shopCategoryFilter");
  const sortOrder = document.getElementById("sortOrder");
  const cartBadge = document.getElementById("cartBadge");
  const paginationControls = document.getElementById("paginationControls");

  let user = getUserSession();
  let cartCount = parseInt(localStorage.getItem("cartCount")) || 0;
  let currentPage = 0;
  const pageSize = 12;
  let totalPages = 0;
  let allProducts = [];

  updateCartBadge();
  setupUserUI();
  fetchProducts(currentPage);

  logoutBtn?.addEventListener("click", () => {
    clearUserSession();
    localStorage.removeItem("cartCount");
    location.href = "login.html";
  });

  searchBtn?.addEventListener("click", applyFilters);
  categoryFilter?.addEventListener("change", applyFilters);
  sortOrder?.addEventListener("change", applyFilters);

  // Debounced input event for search
  let debounceTimer;
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilters(), 300);
  });

  function setupUserUI() {
    if (user) {
      loginBtn?.classList.add("d-none");
      logoutBtn?.classList.remove("d-none");
      userGreeting?.classList.remove("d-none");
      userGreeting.textContent = `Welcome, ${user.username}`;
    } else {
      logoutBtn?.classList.add("d-none");
      userGreeting?.classList.add("d-none");
      loginBtn?.classList.remove("d-none");
    }
  }

  function updateCartBadge() {
    if (cartCount > 0) {
      cartBadge.textContent = cartCount;
      cartBadge.style.display = "inline-block";
      cartBadge.setAttribute("aria-live", "polite");
    } else {
      cartBadge.style.display = "none";
    }
  }

  async function fetchProducts(page = 0) {
    toggleSpinner("shopSpinner", true);
    try {
      const response = await fetch(`${BASE_URL}/api/products/all?page=${page}&size=${pageSize}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      allProducts = data.content || [];
      totalPages = data.totalPages || 1;
      currentPage = page;

      renderProducts(allProducts);
      renderPagination(totalPages, currentPage);
    } catch (err) {
      shopGrid.innerHTML = `<p class="text-danger">Error loading products: ${err.message}</p>`;
      showToast(`Error loading products: ${err.message}`, true);
    } finally {
      toggleSpinner("shopSpinner", false);
    }
  }

  function renderProducts(products) {
    if (!products.length) {
      shopGrid.innerHTML = `<p>No products found.</p>`;
      return;
    }

    shopGrid.innerHTML = products.map(productToHTML).join("");

    document.querySelectorAll(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!user) {
          showToast("Please log in to add products to your cart.", true);
          setTimeout(() => { window.location.href = "login.html"; }, 1500);
          return;
        }
        addToCart(btn.dataset.id);
      });
    });

    document.querySelectorAll(".product-card").forEach(card => {
      card.addEventListener("click", () => {
        const productId = card.dataset.id;
        localStorage.setItem("selectedProductId", productId);
        window.location.href = "product-details.html";
      });
    });
  }

  async function addToCart(productId) {
    toggleSpinner("shopSpinner", true);
    try {
      const response = await fetch(`${BASE_URL}/api/cart/${user.id}/addProduct?productId=${productId}&quantity=1`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error("Failed to add to cart");

      cartCount++;
      localStorage.setItem("cartCount", cartCount);
      updateCartBadge();
      showToast("Product added to cart!");
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      toggleSpinner("shopSpinner", false);
    }
  }

  // Filtering remains client-side; consider backend filtering for scalability
  function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const sort = sortOrder.value;

    let filtered = allProducts.filter(p =>
      (!category || p.category === category) &&
      (p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search))
    );

    if (sort === "price-asc") filtered.sort((a, b) => a.currentPrice - b.currentPrice);
    else if (sort === "price-desc") filtered.sort((a, b) => b.currentPrice - a.currentPrice);
    else if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderProducts(filtered);
  }

  function renderPagination(total, current) {
    paginationControls.innerHTML = "";

    const prevBtn = createPageItem("&laquo;", current === 0, () => fetchProducts(current - 1));
    paginationControls.appendChild(prevBtn);

    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, start + 4);
    for (let i = start; i <= end; i++) {
      const li = createPageItem(i + 1, false, () => fetchProducts(i), i === current);
      paginationControls.appendChild(li);
    }

    const nextBtn = createPageItem("&raquo;", current === total - 1, () => fetchProducts(current + 1));
    paginationControls.appendChild(nextBtn);
  }

  function createPageItem(label, disabled, onClick, active = false) {
    const li = document.createElement("li");
    li.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;
    li.innerHTML = `<button class="page-link">${label}</button>`;
    if (!disabled) li.addEventListener("click", onClick);
    return li;
  }

  function productToHTML(product) {
    return `
      <div class="col">
        <div class="card h-100 product-card" data-id="${product.id}" style="cursor: pointer;">
          <img src="${product.imageUrl}" alt="${product.name}" class="card-img-top"
               onerror="this.src='images/placeholder.png';"
               style="object-fit: cover; height: 200px;" />
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text flex-grow-1">${product.description}</p>
            <p class="text-primary fw-bold">₹${product.currentPrice.toFixed(2)}</p>
            <button class="btn btn-sm btn-outline-success w-100 add-to-cart" data-id="${product.id}">Add to Cart</button>
          </div>
        </div>
      </div>`;
  }
});