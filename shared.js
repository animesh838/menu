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
// Order store
//
// There is no server in this project, so orders live in localStorage and both
// pages are kept in sync through a BroadcastChannel. That means the kitchen
// board and the guest menu must be open in the same browser (e.g. on the same
// tablet) to see each other's updates.
// ---------------------------------------------------------------------------
const ORDERS_KEY = "greenfork.orders";
const STATUS_LABELS = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  done: "Served"
};

const ordersChannel = new BroadcastChannel("greenfork.orders");

function money(value) {
  return `${RESTAURANT.currency}${value.toFixed(2)}`;
}

function readOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(orders) ? orders : [];
  } catch (error) {
    return [];
  }
}

function writeOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  ordersChannel.postMessage("orders-changed");
}

function createOrder(details) {
  const order = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    number: String(Math.floor(1000 + Math.random() * 9000)),
    status: "new",
    placedAt: new Date().toISOString(),
    ...details
  };

  writeOrders([...readOrders(), order]);
  return order;
}

function setOrderStatus(id, status) {
  const orders = readOrders();
  const order = orders.find((entry) => entry.id === id);
  if (!order) return null;

  order.status = status;
  writeOrders(orders);
  return order;
}

function clearFinishedOrders() {
  writeOrders(readOrders().filter((order) => order.status !== "done"));
}

// Fires when the *other* page changes an order.
function onOrdersChanged(handler) {
  ordersChannel.addEventListener("message", handler);
}
