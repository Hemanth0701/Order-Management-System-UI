import {
  showToast,
  showSpinner,
  getJwtToken,
  getUserSession,
  formatPrice,
} from './utils.js';

const grid = document.getElementById("productsGrid");
const adminWelcome = document.getElementById("adminWelcome");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const pagination = document.getElementById("pagination");

let currentPage = 0;
let pageSize = 6;
let totalPages = 0;

const token = getJwtToken();
const session = getUserSession();

if (!token || !session || session.role !== 'ADMIN') {
  window.location.href = "login.html";
} else {
  adminWelcome.textContent = `Welcome, ${session.username}`;
  loadProducts();
 // loadCategories();
}

// Fetch products
function loadProducts(page = 0, category = '', keyword = '') {
  showSpinner(true);
  const url = new URL(`http://localhost:8080/api/products/admin/${session.id}`, window.location.origin);
  url.searchParams.append("page", page);
  url.searchParams.append("size", pageSize);
  url.searchParams.append("sortBy", "createdAt");
  url.searchParams.append("direction", "desc");
  if (category) url.searchParams.append("category", category);
  if (keyword) url.searchParams.append("search", keyword);

  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    })
    .then(data => {
      const { content, totalPages: tp } = data;
      grid.innerHTML = "";
      totalPages = tp;
      currentPage = page;

      content.forEach(product => {
        grid.innerHTML += `
        <div class="col">
          <div class="card h-100">
            <img src="${product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}" class="card-img-top" alt="Product Image">
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">${product.description || 'No description available.'}</p>
              <p class="card-text">Price: <strong>${formatPrice(product.currentPrice)}</strong></p>
              <p class="card-text">Stock: <strong>${product.stock}</strong> ${product.stock < 10 ? '<span class="badge bg-danger ms-2">Low</span>' : ''}</p>
            </div>
            <div class="card-footer text-end">
              <button class="btn btn-sm btn-primary me-1 edit-btn" data-product='${encodeURIComponent(JSON.stringify(product))}'>Edit</button>
              <button class="btn btn-sm btn-warning me-1" onclick="updatePrice('${product.id}', ${product.currentPrice})">Price</button>
              <button class="btn btn-sm btn-success me-1" onclick="addStock('${product.id}')">Stock</button>
              <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
          </div>
        </div>`;
      });
      
       grid.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const product = JSON.parse(decodeURIComponent(btn.getAttribute("data-product")));
          editProduct(product);
        });
      });


      renderPagination();
    })
    .catch(err => showToast(err.message, true))
    .finally(() => showSpinner(false));
}

function renderPagination() {
  pagination.innerHTML = '';
  for (let i = 0; i < totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${i})">${i + 1}</a>
      </li>`;
  }
}

window.goToPage = function(page) {
  loadProducts(page, '', searchInput.value.trim());
};


// ---------------------- Dynamic Price Handling ---------------------- //

function initFlatpickrOnInputs() {
  document.querySelectorAll('.price-date-input').forEach(input => {
    flatpickr(input, {
      enableTime: true,
      dateFormat: "Y-m-d\\TH:i",
      defaultDate: new Date()
    });
  });
}

function addPriceRow(price = '', startDate = '') {
  const priceRows = document.getElementById("priceRows");
  const row = document.createElement("div");
  row.classList.add("row", "g-2", "align-items-center", "mb-2");

  row.innerHTML = `
    <div class="col-5">
      <input type="number" class="form-control price-amount-input" placeholder="₹ Amount" value="${price}" required />
    </div>
    <div class="col-5">
      <input type="text" class="form-control price-date-input" placeholder="Start Date" value="${startDate}" required />
    </div>
    <div class="col-2 text-end">
      <button type="button" class="btn btn-sm btn-danger remove-price-btn">&times;</button>
    </div>`;

  priceRows.appendChild(row);
  initFlatpickrOnInputs();

  row.querySelector(".remove-price-btn").addEventListener("click", () => row.remove());
}

document.getElementById("addPriceRowBtn").addEventListener("click", () => addPriceRow());

// ---------------------- Product Edit / Prefill ---------------------- //

window.editProduct = (product) => {
  const modal = document.getElementById("editProductModal");

  // Set modal title for clarity
  modal.querySelector(".modal-title").textContent = `Edit Product - ${product.name}`;

  // Fill form fields
  document.getElementById("editProductId").value = product.id;
  document.getElementById("editProductName").value = product.name;
  document.getElementById("editProductDescription").value = product.description || '';
  document.getElementById("editProductImage").value = product.imageUrl || '';
  document.getElementById("editProductStock").value = product.stock ?? 0;

  // Populate and sort price rows by startDate
  const priceRows = document.getElementById("priceRows");
  priceRows.innerHTML = "";

  if (Array.isArray(product.prices)) {
    product.prices
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .forEach(p => addPriceRow(p.amount, p.startDate));
  }

  new bootstrap.Modal(modal).show();
};


document.getElementById("editProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const modal = document.getElementById("editProductModal");
  const submitBtn = e.target.querySelector("button[type='submit']");
  const id = document.getElementById("editProductId").value;

  try {
    // Disable button and show loading text
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

    // Collect price inputs with validation
    const priceRows = document.querySelectorAll("#priceRows .row");
    const prices = Array.from(priceRows).map(row => {
      const amount = parseFloat(row.querySelector(".price-amount-input").value);
      const startDate = row.querySelector(".price-date-input").value;

      if (isNaN(amount) || !startDate) {
        throw new Error("Invalid price or missing start date");
      }

      return { amount, startDate };
    });

    // Build payload
    const payload = {
      name: document.getElementById("editProductName").value.trim(),
      description: document.getElementById("editProductDescription").value.trim(),
      imageUrl: document.getElementById("editProductImage").value.trim(),
      stock: parseInt(document.getElementById("editProductStock").value),
      prices
    };

    // Perform AP(I call
    const res = await fetch(`http://localhost:8080/api/products/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
console.log(res)
    if (!res.ok) throw new Error("Failed to update product");

    showToast("Product updated successfully!");
    bootstrap.Modal.getInstance(modal).hide();
    loadProducts(currentPage); // Preserve current page
  } catch (err) {
    showToast(err.message || "Something went wrong", true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Save Changes`;

    // Optional: Reset form after submission (for next time)
    document.getElementById("editProductForm").reset();
    document.getElementById("priceRows").innerHTML = "";
  }
});


// ---------------------- Price, Stock, Delete ---------------------- //

window.updatePrice = (id, currentPrice) => {
  document.getElementById('updatePriceProductId').value = id;
  document.getElementById('newPrice').value = currentPrice;
  new bootstrap.Modal(document.getElementById('updatePriceModal')).show();
};

document.getElementById("updatePriceForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("updatePriceProductId").value;
  const amount = document.getElementById("newPrice").value;

  fetch(`http://localhost:8080/api/products/updatePrice/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, startDate: new Date().toISOString() }),
  })
    .then(res => res.ok ? showToast("Price updated successfully!") : Promise.reject("Update failed"))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById("updatePriceModal")).hide();
      loadProducts();
    })
    .catch(err => showToast(err, true));
});

window.addStock = (id) => {
  document.getElementById("addStockProductId").value = id;
  new bootstrap.Modal(document.getElementById("addStockModal")).show();
};

document.getElementById("addStockForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("addStockProductId").value;
  const quantity = document.getElementById("stockQuantity").value;

  fetch(`http://localhost:8080/api/products/add-stock/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  })
    .then(res => res.ok ? showToast("Stock added successfully!") : Promise.reject("Failed to add stock"))
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById("addStockModal")).hide();
      loadProducts();
    })
    .catch(err => showToast(err, true));
});

window.deleteProduct = (id) => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`http://localhost:8080/api/products/remove/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.ok ? showToast("Product deleted successfully!") : Promise.reject("Delete failed"))
        .then(() => loadProducts())
        .catch(err => showToast(err, true));
    }
  });
}; 