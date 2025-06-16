document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const resultSection = document.getElementById("result-section");
  const errorMessage = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const query = searchInput.value.trim();
    if (!query) return;

    errorMessage.textContent = "";
    resultSection.classList.add("d-none");

    try {
      // Simulated API call (replace with actual endpoint)
      const product = await mockFindProduct(query);

      if (product) {
        document.getElementById("product-id").textContent = product.id;
        document.getElementById("product-name").textContent = product.name;
        document.getElementById("product-price").textContent = product.price.toFixed(2);
        document.getElementById("product-description").textContent = product.description;
        resultSection.classList.remove("d-none");
      } else {
        errorMessage.textContent = "❌ Product not found.";
      }
    } catch (err) {
      errorMessage.textContent = "⚠️ An error occurred while searching.";
    }
  });

  // Mock data for demonstration
  async function mockFindProduct(query) {
    const mockDB = [
      { id: "P101", name: "Smart Watch", price: 199.99, description: "Water-resistant and Bluetooth enabled." },
      { id: "P102", name: "Wireless Earbuds", price: 89.49, description: "Noise cancelling with 20hr battery." },
      { id: "P103", name: "Gaming Mouse", price: 49.99, description: "Ergonomic with RGB lighting." },
    ];

    await new Promise((res) => setTimeout(res, 800)); // simulate latency
    return mockDB.find(p => p.id === query || p.name.toLowerCase() === query.toLowerCase());
  }
});
