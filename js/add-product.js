import {
  showSpinner,
  showToast,
  getJwtToken,
  getUserId,
} from './utils.js';

// --- UTILITY FUNCTIONS ---

function setMinDate(input) {
  const now = new Date();
  input.min = now.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
}

function validateProductForm(product) {
  const errors = [];

  if (!product.name) errors.push("Product name is required.");
  if (!product.description) errors.push("Description is required.");
  if (!product.category) errors.push("Category must be selected.");
  if (!product.imageUrl || !/^https?:\/\//i.test(product.imageUrl))
    errors.push("Valid image URL (http/https) is required.");
  if (isNaN(product.stock) || product.stock < 0)
    errors.push("Stock must be a non-negative number.");

  if (!product.prices.length) {
    errors.push("At least one price entry is required.");
  } else {
    product.prices.forEach((p, i) => {
      if (isNaN(p.amount) || p.amount <= 0) {
        errors.push(`Price #${i + 1} must be a positive number.`);
      }
      if (!p.startDate) {
        errors.push(`Start Date #${i + 1} is required.`);
      }
    });
  }

  return errors;
}

// --- PRICE SECTION LOGIC ---

const priceSection = document.getElementById('priceSection');
const addPriceBtn = document.getElementById('addPriceBtn');
console.log("Add Price Button:", addPriceBtn);

addPriceBtn.addEventListener('click', () => {
  console.log("Add Price button clicked");
  const newRow = document.createElement('div');
  newRow.classList.add('price-row', 'row', 'g-3', 'align-items-end', 'mb-3');

  newRow.innerHTML = `
    <div class="col-md-5">
      <label class="form-label">Amount</label>
      <input type="number" class="form-control price" placeholder="Enter amount" required />
    </div>
    <div class="col-md-5">
      <label class="form-label">Start Date</label>
      <input type="datetime-local" class="form-control priceDate" required />
    </div>
    <div class="col-md-2 d-grid">
      <button type="button" class="btn btn-danger remove-price-btn">Remove</button>
    </div>
  `;

  const dateInput = newRow.querySelector('.priceDate');
  setMinDate(dateInput);

  newRow.querySelector('.remove-price-btn').addEventListener('click', () => {
    newRow.remove();
  });

  priceSection.appendChild(newRow);
});

// Set min date for initial price inputs
document.querySelectorAll('.priceDate').forEach(setMinDate);

// --- FORM SUBMIT HANDLER ---

document.getElementById('addProductForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const adminId = getUserId();
  const token = getJwtToken();

  if (!adminId || !token) {
    showToast('Unauthorized. Please login again.', true);
    return;
  }

  const product = {
    name: document.getElementById('productName').value.trim(),
    category: document.getElementById('productCategory').value.trim(),
    description: document.getElementById('productDescription').value.trim(),
    imageUrl: document.getElementById('productImage').value.trim(),
    stock: parseInt(document.getElementById('productStock').value, 10),
    prices: []
  };

  document.querySelectorAll('.price-row').forEach(row => {
    const amount = parseFloat(row.querySelector('.price').value);
    const startDate = row.querySelector('.priceDate').value;
    product.prices.push({ amount, startDate });
  });

  const validationErrors = validateProductForm(product);
  if (validationErrors.length > 0) {
    validationErrors.forEach(err => showToast(err, true));
    return;
  }

  showSpinner(true);

  try {
    const response = await fetch(`http://localhost:8080/api/products/create/${adminId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });

    showSpinner(false);

    if (!response.ok) {
      const errorData = await response.json();
      showToast(errorData.message || 'Failed to add product.', true);
      return;
    }

    const data = await response.json();
    showToast('Product added successfully!');
  } catch (error) {
    showSpinner(false);
    console.error('Error adding product:', error);
    showToast('Server error occurred. Try again later.', true);
  }
});
