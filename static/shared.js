// ---------------------------------------------------------------------------
// Shared between the guest menu (index.html) and the kitchen board (kitchen.html).
// Load this file first on both pages.
// ---------------------------------------------------------------------------

// Restaurant configuration — edit this block to make the menu your own.
const RESTAURANT = {
  name: "Green Fork Bistro",
  tagline: "Fresh seasonal plates, made to order",
  address: "42 Market Street, Springfield",
  hours: "Mon–Sun · 11:00 – 22:30",
  phone: "+1 (555) 018-4420",
  currency: "$",
  serviceChargeRate: 0.1 // 10% service charge added at checkout
};

// ---------------------------------------------------------------------------
// Order API
//
// Orders are stored by the Django backend, so a guest's phone and the kitchen
// screen see the same orders from anywhere. Every call returns a promise.
// ---------------------------------------------------------------------------
const API_BASE = "/api";

const STATUS_LABELS = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  done: "Served"
};

function money(value) {
  return `${RESTAURANT.currency}${value.toFixed(2)}`;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = (payload && payload.error) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

async function createOrder(details) {
  return apiFetch("/orders/", {
    method: "POST",
    body: JSON.stringify(details)
  });
}

async function fetchOrders() {
  const payload = await apiFetch("/orders/");
  return payload.orders;
}

async function fetchOrder(id) {
  return apiFetch(`/orders/${id}/`);
}

async function setOrderStatus(id, status) {
  return apiFetch(`/orders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

async function clearFinishedOrders() {
  await apiFetch("/orders/clear-finished/", { method: "POST" });
}

