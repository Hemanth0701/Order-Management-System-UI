document.addEventListener("DOMContentLoaded", () => {
  const statusMessage = document.getElementById("status-message");

  const showLoading = (id) => document.getElementById(id).classList.remove("d-none");
  const hideLoading = (id) => document.getElementById(id).classList.add("d-none");

  async function loadDashboardStats() {
    try {
      showLoading("orders-loading");
      showLoading("products-loading");
      showLoading("revenue-loading");

      // Simulated API call (replace this with real API request)
      const stats = await new Promise((resolve) =>
        setTimeout(() => resolve({
          orders: 128,
          products: 57,
          revenue: 15499.99
        }), 1000)
      );

      document.getElementById("total-orders").textContent = stats.orders;
      document.getElementById("total-products").textContent = stats.products;
      document.getElementById("total-revenue").textContent = `$${stats.revenue.toFixed(2)}`;

    } catch (error) {
      statusMessage.classList.add("text-danger");
      statusMessage.textContent = "⚠️ Error: Unable to fetch dashboard data.";
    } finally {
      hideLoading("orders-loading");
      hideLoading("products-loading");
      hideLoading("revenue-loading");
    }
  }

  loadDashboardStats();
});
