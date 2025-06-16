window.onload = function () {
  fetch("http://localhost:8080/api/products/popular") // Adjust the URL if hosted differently
    .then(response => response.json())
    .then(products => {
      const grid = document.getElementById("productGrid");

      products.forEach(product => {
        const col = document.createElement("div");
        col.className = "col-7 col-md-3 mb-5";

        col.innerHTML = `
          <div class="card h-100 text-center">
            <img src="${product.imageUrl}" alt="${product.name}" class="card-img-top"
               onerror="this.src='images/placeholder.png';"
               style="object-fit: cover; height: 200px;" />
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">${product.currentPrice.toFixed(2)}</p>
              <button class="btn btn-sm btn-primary" onclick="addToCart('${product.id}')">Add to Cart</button>
            </div>
          </div>
        `;

        grid.appendChild(col);
      });
    })
    .catch(error => {
      console.error("Error loading products:", error);
    });
};

function addToCart(id) {
  alert(`${name} added to cart!`);
}

function shopNow() {
  document.querySelector('#productGrid').scrollIntoView({ behavior: 'smooth' });
}


function login() {
  // Redirect to login page
  window.location.href = "login.html";
}

function viewCart() {
  // Redirect to cart page
  window.location.href = "cart.html";
}

function shopNow() {
  // Scroll to products or go to shop page
  document.getElementById("productGrid").scrollIntoView({ behavior: "smooth" });
}
