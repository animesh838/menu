// ---------------------------------------------------------------------------
// Menu data. Restaurant settings and the order store live in shared.js.
// ---------------------------------------------------------------------------
const MENU = [
  {
    category: "Starters",
    items: [
      {
        name: "Garlic Herb Bread",
        price: 6.5,
        desc: "Warm sourdough, roasted garlic butter, sea salt.",
        image: "rustic sourdough bread slices with garlic butter on a wooden board",
        tags: ["veg"]
      },
      {
        name: "Crispy Calamari",
        price: 11,
        desc: "Lightly fried squid, lemon aioli, pickled chilli.",
        image: "crispy fried calamari rings with lemon aioli dip",
        tags: ["popular"]
      },
      {
        name: "Tomato Basil Soup",
        price: 7.5,
        desc: "Slow-roasted tomatoes, fresh basil, cream swirl.",
        image: "bowl of creamy tomato basil soup with fresh basil leaves",
        tags: ["veg"]
      }
    ]
  },
  {
    category: "Mains",
    items: [
      {
        name: "Grilled Chicken Plate",
        price: 18,
        desc: "Char-grilled chicken breast, herb potatoes, garden greens.",
        image: "grilled chicken breast plate with roasted potatoes and greens",
        tags: ["popular"]
      },
      {
        name: "Truffle Mushroom Pasta",
        price: 16.5,
        desc: "Tagliatelle, wild mushrooms, truffle cream, parmesan.",
        image: "creamy truffle mushroom tagliatelle pasta in a bowl",
        tags: ["veg"]
      },
      {
        name: "Spicy Beef Burger",
        price: 15.5,
        desc: "Beef patty, jalapeño, cheddar, smoked chipotle sauce, fries.",
        image: "gourmet beef burger with jalapeno and cheddar with fries",
        tags: ["spicy"]
      },
      {
        name: "Margherita Pizza",
        price: 14,
        desc: "San Marzano tomato, fior di latte, basil, olive oil.",
        image: "wood fired margherita pizza with basil on a rustic table",
        tags: ["veg", "popular"]
      }
    ]
  },
  {
    category: "Desserts",
    items: [
      {
        name: "Dark Chocolate Brownie",
        price: 8,
        desc: "Warm brownie, vanilla bean ice cream, cocoa crumble.",
        image: "warm chocolate brownie with a scoop of vanilla ice cream",
        tags: ["veg"]
      },
      {
        name: "Classic Cheesecake",
        price: 8.5,
        desc: "Baked New York style, berry compote.",
        image: "slice of new york cheesecake with berry compote",
        tags: ["veg", "popular"]
      }
    ]
  },
  {
    category: "Drinks",
    items: [
      {
        name: "Fresh Lemonade",
        price: 4.5,
        desc: "Hand-squeezed lemons, mint, sparkling water.",
        image: "glass of fresh mint lemonade with ice and lemon slice",
        tags: ["veg"]
      },
      {
        name: "Flat White",
        price: 4,
        desc: "Double shot espresso, silky steamed milk.",
        image: "flat white coffee cup with latte art on a saucer",
        tags: ["veg"]
      },
      {
        name: "House Iced Tea",
        price: 4,
        desc: "Cold-brewed black tea, peach, citrus.",
        image: "glass of iced peach tea with citrus slices",
        tags: ["veg"]
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function imageUrl(prompt, size = "landscape_4_3") {
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}

const state = {
  activeCategory: "All",
  query: "",
  // Table numbers come from the QR code link, e.g. ...?table=7
  table: new URLSearchParams(window.location.search).get("table") || "",
  // The order this guest just placed, so its status can be tracked live.
  lastOrderId: null
};

// Give every dish a stable id so it can be tracked in the cart.
const DISHES_BY_ID = new Map();
MENU.forEach((section) => {
  section.items.forEach((item, index) => {
    item.id = `${section.category}-${index}`;
    item.category = section.category;
    DISHES_BY_ID.set(item.id, item);
  });
});

function buildHeader() {
  document.title = `${RESTAURANT.name} — Menu`;
  document.getElementById("restaurantName").textContent = RESTAURANT.name;
  document.getElementById("restaurantTagline").textContent = RESTAURANT.tagline;
  document.getElementById("restaurantMeta").textContent =
    `${RESTAURANT.address} · ${RESTAURANT.hours}`;
  document.getElementById("footerNote").textContent =
    `${RESTAURANT.name} · ${RESTAURANT.phone} · Orders are sent straight to the kitchen`;
}

function buildTabs() {
  const nav = document.getElementById("categoryNav");
  const categories = ["All", ...MENU.map((section) => section.category)];
  nav.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab" + (category === state.activeCategory ? " is-active" : "");
    button.textContent = category;
    button.addEventListener("click", () => {
      state.activeCategory = category;
      buildTabs();
      renderMenu();
    });
    nav.appendChild(button);
  });
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  img.className = "card__img";
  img.loading = "lazy";
  img.src = imageUrl(item.image);
  img.alt = item.name;

  const body = document.createElement("div");
  body.className = "card__body";

  const head = document.createElement("div");
  head.className = "card__head";
  head.innerHTML = `<h3 class="card__name"></h3><span class="card__price"></span>`;
  head.querySelector(".card__name").textContent = item.name;
  head.querySelector(".card__price").textContent = money(item.price);

  const desc = document.createElement("p");
  desc.className = "card__desc";
  desc.textContent = item.desc;

  const badges = document.createElement("div");
  badges.className = "badges";
  (item.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.className = `badge badge--${tag}`;
    span.textContent = tag;
    badges.appendChild(span);
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "btn btn--add";
  addButton.textContent = "Add";
  addButton.addEventListener("click", () => {
    addToCart(item.id);
    addButton.textContent = "Added";
    addButton.disabled = true;
    setTimeout(() => {
      addButton.textContent = "Add";
      addButton.disabled = false;
    }, 900);
  });

  const foot = document.createElement("div");
  foot.className = "card__foot";
  foot.append(badges, addButton);

  body.append(head, desc, foot);
  card.append(img, body);
  return card;
}

function matches(item) {
  if (!state.query) return true;
  const haystack = `${item.name} ${item.desc}`.toLowerCase();
  return haystack.includes(state.query);
}

function renderMenu() {
  const container = document.getElementById("menu");
  const emptyState = document.getElementById("emptyState");
  container.innerHTML = "";

  let visibleCount = 0;

  MENU.forEach((section) => {
    if (state.activeCategory !== "All" && section.category !== state.activeCategory) return;

    const items = section.items.filter(matches);
    if (items.length === 0) return;

    visibleCount += items.length;

    const block = document.createElement("section");
    const title = document.createElement("h2");
    title.className = "section__title";
    title.textContent = section.category;

    const cards = document.createElement("div");
    cards.className = "cards";
    items.forEach((item) => cards.appendChild(createCard(item)));

    block.append(title, cards);
    container.appendChild(block);
  });

  emptyState.hidden = visibleCount > 0;
}

// ---------------------------------------------------------------------------
// Ordering / cart
// ---------------------------------------------------------------------------
const CART_KEY = "greenfork.cart";

// dish id -> quantity
const cart = new Map();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    saved.forEach(([id, qty]) => {
      if (DISHES_BY_ID.has(id) && qty > 0) cart.set(id, qty);
    });
  } catch (error) {
    cart.clear();
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify([...cart]));
}

function cartCount() {
  return [...cart.values()].reduce((sum, qty) => sum + qty, 0);
}

function cartSubtotal() {
  return [...cart].reduce(
    (sum, [id, qty]) => sum + DISHES_BY_ID.get(id).price * qty,
    0
  );
}

function cartTotal() {
  return cartSubtotal() * (1 + RESTAURANT.serviceChargeRate);
}

// When the guest arrives from a table QR code, the table is already known,
// so the checkout form asks for it only as a fallback.
function applyTableFromQr() {
  if (!state.table) return;

  const field = document.getElementById("tableField");
  field.querySelector("input").value = state.table;
  field.hidden = true;

  const note = document.getElementById("tableNote");
  note.textContent = `Serving table ${state.table}`;
  note.hidden = false;

  const badge = document.getElementById("tableBadge");
  badge.textContent = `Table ${state.table}`;
  badge.hidden = false;
}

function addToCart(id, qty = 1) {
  cart.set(id, (cart.get(id) || 0) + qty);
  saveCart();
  renderCartBar();
}

function setQuantity(id, qty) {
  if (qty <= 0) cart.delete(id);
  else cart.set(id, qty);
  saveCart();
  renderCartBar();
  renderCart();
}

function renderCartBar() {
  const bar = document.getElementById("cartBar");
  const count = cartCount();
  bar.hidden = count === 0;
  document.getElementById("cartBarCount").textContent =
    `${count} ${count === 1 ? "item" : "items"}`;
  document.getElementById("cartBarTotal").textContent = money(cartTotal());
}

function renderCart() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("cartEmpty");
  list.innerHTML = "";

  cart.forEach((qty, id) => {
    const dish = DISHES_BY_ID.get(id);

    const row = document.createElement("li");
    row.className = "cart-item";

    const body = document.createElement("div");
    body.className = "cart-item__body";
    const name = document.createElement("p");
    name.className = "cart-item__name";
    name.textContent = dish.name;
    const price = document.createElement("p");
    price.className = "cart-item__price";
    price.textContent = money(dish.price * qty);
    body.append(name, price);

    const qtyBox = document.createElement("div");
    qtyBox.className = "qty";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", `Remove one ${dish.name}`);
    minus.addEventListener("click", () => setQuantity(id, qty - 1));

    const value = document.createElement("span");
    value.textContent = qty;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `Add one ${dish.name}`);
    plus.addEventListener("click", () => setQuantity(id, qty + 1));

    qtyBox.append(minus, value, plus);
    row.append(body, qtyBox);
    list.appendChild(row);
  });

  const subtotal = cartSubtotal();
  const service = subtotal * RESTAURANT.serviceChargeRate;

  document.getElementById("subtotalValue").textContent = money(subtotal);
  document.getElementById("serviceValue").textContent = money(service);
  document.getElementById("totalValue").textContent = money(subtotal + service);

  empty.hidden = cart.size > 0;
  document.getElementById("checkoutButton").disabled = cart.size === 0;
}

function showOrderView(view) {
  document.getElementById("cartView").hidden = view !== "cart";
  document.getElementById("checkoutView").hidden = view !== "checkout";
  document.getElementById("successView").hidden = view !== "success";
  document.getElementById("orderTitle").textContent =
    view === "success" ? "Order confirmed" : "Your order";
}

function openOrder() {
  renderCart();
  showOrderView("cart");
  document.getElementById("orderModal").hidden = false;
}

function closeOrder() {
  document.getElementById("orderModal").hidden = true;
  document.getElementById("checkoutView").reset();
  document.getElementById("checkoutError").hidden = true;
  stopTrackedOrderPolling();
  applyTableFromQr();
}

async function placeOrder(data) {
  const items = [...cart].map(([id, qty]) => {
    const dish = DISHES_BY_ID.get(id);
    return { id, name: dish.name, price: dish.price, qty };
  });

  const errorNote = document.getElementById("checkoutError");
  const submitButton = document.getElementById("submitOrderButton");

  errorNote.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Placing order...";

  try {
    // The backend stores the order, so the kitchen board sees it from any device.
    const order = await createOrder({
      customer: data.get("name").trim(),
      table: state.table || data.get("table").trim(),
      phone: data.get("phone").trim(),
      notes: data.get("notes").trim(),
      items
    });

    // Remember the order so the guest can reopen it after a refresh.
    saveTrackedOrder(order.id);

    cart.clear();
    saveCart();
    renderCartBar();

    document.getElementById("orderTitle").textContent = "Order confirmed";
    renderTrackedOrder(order);
    showOrderView("success");
    startTrackedOrderPolling();
  } catch (error) {
    errorNote.textContent =
      error.message || "We couldn't send your order. Please try again.";
    errorNote.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Place order";
  }
}

// ---------------------------------------------------------------------------
// Live order tracking
//
// The order id is stored in localStorage, not just in memory, so a guest can
// close the page, come back, and still watch their order move through the
// kitchen. The status itself always comes from the server, which is what the
// kitchen board writes to — so the two views can never drift apart.
// ---------------------------------------------------------------------------
const ORDER_POLL_MS = 3000;
const TRACKED_ORDER_KEY = "greenfork.trackedOrder";

// The stages the kitchen moves an order through, in order.
const ORDER_STEPS = [
  { status: "new", label: "Order received" },
  { status: "preparing", label: "In the kitchen" },
  { status: "ready", label: "Ready to serve" },
  { status: "done", label: "Served" }
];

let orderPollTimer = null;

function loadTrackedOrder() {
  try {
    return JSON.parse(localStorage.getItem(TRACKED_ORDER_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveTrackedOrder(id) {
  state.lastOrderId = id;
  localStorage.setItem(TRACKED_ORDER_KEY, JSON.stringify(id));
  renderTrackButton();
}

function clearTrackedOrder() {
  state.lastOrderId = null;
  localStorage.removeItem(TRACKED_ORDER_KEY);
  renderTrackButton();
}

// Only offer the entry point when there is actually an order to show.
function renderTrackButton() {
  document.getElementById("trackOrderButton").hidden = !state.lastOrderId;
}

// The kitchen moves the order along; the guest sees the change here.
function renderOrderStatus(status) {
  const pill = document.getElementById("orderStatus");
  pill.textContent = STATUS_LABELS[status] || status;
  pill.className = `status-pill status-pill--${status}`;
  pill.hidden = false;
}

// Steps already reached are filled in, the current one is highlighted.
function renderOrderSteps(status) {
  const list = document.getElementById("orderSteps");
  const currentIndex = ORDER_STEPS.findIndex((step) => step.status === status);
  list.innerHTML = "";

  ORDER_STEPS.forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "step";
    if (index < currentIndex) item.classList.add("is-done");
    else if (index === currentIndex) item.classList.add("is-current");

    const dot = document.createElement("span");
    dot.className = "step__dot";
    dot.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "step__label";
    label.textContent = step.label;

    item.append(dot, label);
    list.appendChild(item);
  });

  list.hidden = false;
}

// An itemised receipt of exactly what was ordered.
function renderOrderItems(order) {
  const list = document.getElementById("orderItems");
  list.innerHTML = "";

  order.items.forEach((line) => {
    const row = document.createElement("li");
    row.className = "receipt__row";

    const qty = document.createElement("span");
    qty.className = "receipt__qty";
    qty.textContent = `${line.qty}×`;

    const name = document.createElement("span");
    name.className = "receipt__name";
    name.textContent = line.name;

    const price = document.createElement("span");
    price.className = "receipt__price";
    price.textContent = money(line.price * line.qty);

    row.append(qty, name, price);
    list.appendChild(row);
  });

  document.getElementById("orderSubtotal").textContent = money(order.subtotal);
  document.getElementById("orderService").textContent = money(order.service);
  document.getElementById("orderTotal").textContent = money(order.total);
  document.getElementById("orderTotals").hidden = false;
}

function renderTrackedOrder(order) {
  const served = order.status === "done";

  document.getElementById("successTitle").textContent =
    served ? "Order served" : "Order confirmed";
  document.getElementById("orderNumber").textContent =
    `Order #${order.number}` + (order.table ? ` · Table ${order.table}` : "");
  document.getElementById("orderDetails").textContent = served
    ? "Served — hope you enjoyed it!"
    : "This updates automatically as the kitchen prepares your food.";

  renderOrderStatus(order.status);
  renderOrderSteps(order.status);
  renderOrderItems(order);
}

// Reopening from the saved id, for a guest who came back later.
async function openTrackedOrder() {
  if (!state.lastOrderId) return;

  showOrderView("success");
  // showOrderView resets the heading, so set ours after it.
  document.getElementById("orderTitle").textContent = "Your order";
  document.getElementById("orderModal").hidden = false;

  const order = await refreshTrackedOrder();
  // Nothing to watch if it was already served (or already gone).
  if (order && order.status !== "done") startTrackedOrderPolling();
}

function startTrackedOrderPolling() {
  stopTrackedOrderPolling();
  orderPollTimer = setInterval(refreshTrackedOrder, ORDER_POLL_MS);
}

function stopTrackedOrderPolling() {
  if (orderPollTimer) clearInterval(orderPollTimer);
  orderPollTimer = null;
}

async function refreshTrackedOrder() {
  if (!state.lastOrderId) return null;

  try {
    const order = await fetchOrder(state.lastOrderId);
    renderTrackedOrder(order);
    // Once served there is nothing left to watch, so stop hammering the API.
    if (order.status === "done") stopTrackedOrderPolling();
    return order;
  } catch (error) {
    // The order was cleared from the kitchen board — forget it.
    if (error.status === 404) {
      stopTrackedOrderPolling();
      clearTrackedOrder();
    }
    // Any other failure just keeps the last known status on screen.
    return null;
  }
}

// ---------------------------------------------------------------------------
// QR share — each table gets its own code, e.g. ...?table=7
// ---------------------------------------------------------------------------
function menuUrl(table) {
  const base = window.location.href.split(/[?#]/)[0];
  return table ? `${base}?table=${encodeURIComponent(table)}` : base;
}

function renderQr() {
  const table = document.getElementById("qrTableInput").value.trim();
  const url = menuUrl(table);
  document.getElementById("qrImage").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=0&data=${encodeURIComponent(url)}`;
  document.getElementById("qrUrl").textContent = url;
}

function openQrModal() {
  document.getElementById("qrTableInput").value = state.table;
  renderQr();
  document.getElementById("qrModal").hidden = false;
}

function closeQrModal() {
  document.getElementById("qrModal").hidden = true;
}

function copyLink(button) {
  const url = document.getElementById("qrUrl").textContent;
  navigator.clipboard.writeText(url).then(
    () => {
      button.textContent = "Copied!";
      setTimeout(() => (button.textContent = "Copy link"), 1500);
    },
    () => {}
  );
}

function init() {
  buildHeader();
  buildTabs();
  loadCart();

  // Restore the guest's last order, if they placed one on this device.
  state.lastOrderId = loadTrackedOrder();
  renderTrackButton();

  applyTableFromQr();
  renderMenu();
  renderCartBar();

  const servicePercent = Math.round(RESTAURANT.serviceChargeRate * 100);
  document.getElementById("serviceLabel").textContent = `Service (${servicePercent}%)`;
  document.getElementById("orderServiceLabel").textContent = `Service (${servicePercent}%)`;

  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderMenu();
  });

  // Ordering
  document.getElementById("cartBar").addEventListener("click", openOrder);
  document.getElementById("closeOrderButton").addEventListener("click", closeOrder);
  document.getElementById("checkoutButton").addEventListener("click", () => {
    if (cart.size > 0) showOrderView("checkout");
  });
  document.getElementById("backToCartButton").addEventListener("click", () => {
    showOrderView("cart");
  });
  document.getElementById("checkoutView").addEventListener("submit", (event) => {
    event.preventDefault();
    placeOrder(new FormData(event.currentTarget));
  });
  document.getElementById("newOrderButton").addEventListener("click", closeOrder);
  document.getElementById("trackOrderButton").addEventListener("click", openTrackedOrder);
  document.getElementById("orderModal").addEventListener("click", (event) => {
    if (event.target.id === "orderModal") closeOrder();
  });

  // QR share
  document.getElementById("qrButton").addEventListener("click", openQrModal);
  document.getElementById("qrTableInput").addEventListener("input", renderQr);
  document.getElementById("closeModalButton").addEventListener("click", closeQrModal);
  document.getElementById("copyLinkButton").addEventListener("click", (event) => {
    copyLink(event.currentTarget);
  });

  document.getElementById("qrModal").addEventListener("click", (event) => {
    if (event.target.id === "qrModal") closeQrModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeQrModal();
    closeOrder();
  });
}

init();
