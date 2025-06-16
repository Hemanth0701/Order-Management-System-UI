const tableBody = document.getElementById("orders-table-body");
const messageBox = document.getElementById("status-message");

// Load all orders
fetch("/orders/all")
  .then(res => res.json())
  .then(data => {
    data.forEach(order => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${order.id}</td>
        <td>${order.user}</td>
        <td>
          <select class="form-select status-select" data-id="${order.id}">
            <option value="Processing" ${order.status === "Processing" ? "selected" : ""}>Processing</option>
            <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
            <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
            <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""} disabled>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn btn-danger btn-sm cancel-btn" data-id="${order.id}" ${order.status === "Cancelled" ? "disabled" : ""}>Cancel</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  })
  .catch(err => {
    console.error(err);
    messageBox.textContent = "Failed to load orders.";
    messageBox.className = "text-danger";
  });

// Event delegation for status change
document.addEventListener("change", async (e) => {
  if (e.target.classList.contains("status-select")) {
    const orderId = e.target.dataset.id;
    const newStatus = e.target.value;

    try {
      const res = await fetch(`/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error();
      messageBox.textContent = `Order ${orderId} status updated to ${newStatus}`;
      messageBox.className = "text-success";
    } catch {
      messageBox.textContent = `Failed to update order ${orderId}`;
      messageBox.className = "text-danger";
    }
  }
});

// Event delegation for cancel button
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("cancel-btn")) {
    const orderId = e.target.dataset.id;

    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch(`/orders/${orderId}/cancel`, {
        method: "PUT"
      });

      if (!res.ok) throw new Error();
      e.target.disabled = true;
      const statusSelect = document.querySelector(`select[data-id='${orderId}']`);
      statusSelect.value = "Cancelled";
      statusSelect.disabled = true;

      messageBox.textContent = `Order ${orderId} cancelled successfully.`;
      messageBox.className = "text-success";
    } catch {
      messageBox.textContent = `Failed to cancel order ${orderId}`;
      messageBox.className = "text-danger";
    }
  }
});
