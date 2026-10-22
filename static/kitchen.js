// ---------------------------------------------------------------------------
// Kitchen board. Polls the order API for the orders guests place from their
// tables, and moves each one through new -> preparing -> ready -> served.
// ---------------------------------------------------------------------------

const POLL_MS = 3000;

const FILTERS = [
  { label: "Active", statuses: ["new", "preparing", "ready"] },
  { label: "New", statuses: ["new"] },
  { label: "Preparing", statuses: ["preparing"] },
  { label: "Ready", statuses: ["ready"] },
  { label: "Served", statuses: ["done"] }
];

// What the kitchen can do next with an order.
const NEXT_STEP = {
  new: { label: "Start preparing", status: "preparing" },
  preparing: { label: "Mark ready", status: "ready" },
  ready: { label: "Mark served", status: "done" }
};

let activeFilter = FILTERS[0].label;

// Latest orders from the API, reused for tab switches between polls.
let orders = [];
// Re-render only when something actually changed, so scrolling stays put.
let lastSignature = "";

function showError(message) {
  const note = document.getElementById("kitchenError");
  note.textContent = message;
  note.hidden = false;
}

function clearError() {
  document.getElementById("kitchenError").hidden = true;
}

function timeAgo(isoDate) {
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  return `${minutes} min ago`;
}

function buildTabs() {
  const nav = document.getElementById("kitchenTabs");
  nav.innerHTML = "";

  FILTERS.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab" + (filter.label === activeFilter ? " is-active" : "");
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      activeFilter = filter.label;
      buildTabs();
      render();
    });
    nav.appendChild(button);
  });
}

function createOrderCard(order) {
  const card = document.createElement("article");
  card.className = `order order--${order.status}`;

  const head = document.createElement("div");
  head.className = "order__head";
  const number = document.createElement("span");
  number.className = "order__number";
  number.textContent = `#${order.number}`;
  const table = document.createElement("span");
  table.className = "order__table";
  table.textContent = order.table ? `Table ${order.table}` : "Takeaway";
  head.append(number, table);

  const meta = document.createElement("p");
  meta.className = "order__meta";
  const customer = order.customer || "Guest";
  meta.textContent = `${customer} · ${timeAgo(order.placedAt)}`;

  const items = document.createElement("ul");
  items.className = "order__items";
  order.items.forEach((line) => {
    const row = document.createElement("li");
    const qty = document.createElement("span");
    qty.className = "order__qty";
    qty.textContent = `${line.qty}×`;
    row.append(qty, document.createTextNode(` ${line.name}`));
    items.appendChild(row);
  });

  card.append(head, meta);

  if (order.notes) {
    const notes = document.createElement("p");
    notes.className = "order__notes";
    notes.textContent = `Note: ${order.notes}`;
    card.appendChild(notes);
  }

  card.appendChild(items);

  const foot = document.createElement("div");
  foot.className = "order__foot";

  const status = document.createElement("span");
  status.className = `status-pill status-pill--${order.status}`;
  status.textContent = STATUS_LABELS[order.status];

  const total = document.createElement("span");
  total.className = "order__total";
  total.textContent = money(order.total);

  foot.append(status, total);
  card.appendChild(foot);

  const actions = document.createElement("div");
  actions.className = "order__actions";

  const next = NEXT_STEP[order.status];
  const target = next || { label: "Reopen", status: "preparing" };

  const button = document.createElement("button");
  button.type = "button";
  button.className = next ? "btn" : "btn btn--ghost";
  button.textContent = target.label;
  button.addEventListener("click", async () => {
    button.disabled = true;

    try {
      await setOrderStatus(order.id, target.status);
    } catch (error) {
      button.disabled = false;
      showError(`Couldn't update order #${order.number}: ${error.message}`);
      return;
    }

    refresh();
  });
  actions.appendChild(button);

  card.appendChild(actions);
  return card;
}

function render() {
  const newestFirst = [...orders].sort(
    (a, b) => new Date(b.placedAt) - new Date(a.placedAt)
  );

  // Header counters
  const countBy = (status) => orders.filter((order) => order.status === status).length;
  document.getElementById("statNew").textContent = countBy("new");
  document.getElementById("statPreparing").textContent = countBy("preparing");
  document.getElementById("statReady").textContent = countBy("ready");

  const activeCount = countBy("new") + countBy("preparing") + countBy("ready");
  document.title = activeCount ? `(${activeCount}) Kitchen` : "Kitchen";

  // Filtered list
  const filter = FILTERS.find((entry) => entry.label === activeFilter);
  const visible = newestFirst.filter((order) => filter.statuses.includes(order.status));

  const list = document.getElementById("orderList");
  list.innerHTML = "";
  visible.forEach((order) => list.appendChild(createOrderCard(order)));

  const empty = document.getElementById("noOrders");
  empty.textContent = orders.length
    ? `No ${activeFilter.toLowerCase()} orders.`
    : "No orders yet. They'll appear here the moment a guest orders from a table QR code.";
  empty.hidden = visible.length > 0;
}

// Only touch the DOM when an order changed, or once a minute so the
// "x min ago" labels stay honest.
function renderIfChanged() {
  const signature = [
    ...orders.map((order) => `${order.id}:${order.status}:${order.updatedAt || ""}`),
    activeFilter,
    Math.floor(Date.now() / 60000)
  ].join("|");

  if (signature === lastSignature) return;
  lastSignature = signature;
  render();
}

async function refresh() {
  try {
    orders = await fetchOrders();
  } catch (error) {
    showError(`Can't reach the order server, retrying... (${error.message})`);
    return;
  }

  clearError();
  renderIfChanged();
}

function init() {
  document.getElementById("kitchenSub").textContent =
    `${RESTAURANT.name} · orders arrive live from the menu`;

  buildTabs();
  refresh();

  document.getElementById("clearDoneButton").addEventListener("click", async () => {
    try {
      await clearFinishedOrders();
    } catch (error) {
      // refresh() below surfaces any connection problem.
    }
    refresh();
  });

  // Guests' orders show up here within a few seconds.
  setInterval(refresh, POLL_MS);
}

init();
