// orders.js
import {
  getUserId,
  getJwtToken,
  showToast,
  formatPrice
} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const userId = getUserId();
  const token = getJwtToken();

  if (!userId || !token) {
    showToast('Session expired. Please login again.', true);
    window.location.href = 'login.html';
    return;
  }

  const ordersList = document.getElementById('orders-list');
  const pagination = document.getElementById('pagination');
  const message = document.getElementById('message');

  const filterStatus = document.getElementById('filterStatus');
  const filterDate = document.getElementById('filterDate');
  const applyFiltersBtn = document.getElementById('applyFilters');

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back to Profile';
  backBtn.className = 'btn btn-outline-secondary mb-4';
  backBtn.addEventListener('click', () => {
    if (document.referrer.includes('profile')) {
      window.history.back();
    } else {
      window.location.href = `profile.html?userId=${userId}`;
    }
  });
  document.querySelector('.container').insertBefore(backBtn, ordersList);

  let currentPage = 0;
  const pageSize = 5;

  async function fetchOrders(page = 0) {
    ordersList.innerHTML = '';
    pagination.innerHTML = '';
    message.textContent = '';

    const status = filterStatus.value;
    const date = filterDate.value;

    let url = `http://localhost:8080/api/orders/user/${userId}?page=${page}&size=${pageSize}&sortBy=createdAt&sortDir=desc`;
    if (status) url += `&status=${status}`;
    if (date) url += `&date=${date}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');

      const data = await res.json();
      const { content, totalPages } = data;

      if (content.length === 0) {
        message.textContent = 'No previous orders found.';
        return;
      }

      content.forEach(order => {
        const orderEl = document.createElement('div');
        orderEl.className = 'list-group-item list-group-item-action';
        orderEl.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-1">Order #${order.orderId}</h5>
              <small>${new Date(order.createdAt).toLocaleString()}</small><br/>
              <span class="text-muted">Status: <strong>${order.status}</strong></span>
            </div>
            <span class="badge bg-primary fs-6">${formatPrice(order.totalAmount)}</span>
          </div>`;

        orderEl.addEventListener('click', () => {
          localStorage.setItem('recentOrderId', order.orderId);
          window.location.href = `order.html?orderId=${order.orderId}`;
        });

        ordersList.appendChild(orderEl);
      });

      renderPagination(totalPages, page);
    } catch (err) {
      console.error(err);
      showToast('Error loading orders.', true);
    }
  }

  function renderPagination(totalPages, currentPage) {
    pagination.innerHTML = '';
    const maxVisible = 5;
    let start = Math.max(0, currentPage - 2);
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    const createPageItem = (label, page, disabled = false, active = false) => {
      const li = document.createElement('li');
      li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
      li.innerHTML = `<button class="page-link">${label}</button>`;
      if (!disabled && !active) {
        li.querySelector('button').addEventListener('click', () => fetchOrders(page));
      }
      return li;
    };

    pagination.appendChild(createPageItem('«', currentPage - 1, currentPage === 0));
    for (let i = start; i <= end; i++) {
      pagination.appendChild(createPageItem(i + 1, i, false, i === currentPage));
    }
    pagination.appendChild(createPageItem('»', currentPage + 1, currentPage === totalPages - 1));
  }

  applyFiltersBtn.addEventListener('click', () => fetchOrders(0));

  fetchOrders(currentPage);
});