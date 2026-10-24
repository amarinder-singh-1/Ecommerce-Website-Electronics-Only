/* =========================================================
   script.js — main JavaScript for the Voltix website
   (Assessment 2). Uses only plain JavaScript. All data comes
   from products.js and is saved in the browser's localStorage.

   Sections:
   1. Settings & small helper functions
   2. Cart, wishlist, login system, orders
   3. Header / footer (added to every page)
   4. Toast, popup (modal), product card, search, account menu
   5. Page code: home, shop, product, cart, login/signup
   ========================================================= */

/* ---------- 1. SETTINGS & HELPERS ---------- */

const FREE_SHIPPING_ABOVE = 1999;   // free delivery above this amount (₹)
const SHIPPING_FEE = 99;            // delivery charge below that (₹)
const GST_RATE = 0.18;              // GST is already included in prices
const PER_PAGE = 9;                 // products per page on the shop page
const MAX_QTY = 10;                 // max quantity of one item in the cart

const PROMO_CODES = {
  VOLTIX10:   { type: "percent", value: 10, text: "10% off your order" },
  WELCOME500: { type: "flat", value: 500, min: 5000, text: "₹500 off orders above ₹5,000" },
  FREESHIP:   { type: "shipping", text: "Free shipping" }
};

const CATEGORIES = [
  { key: "smartphones", label: "Smartphones" },
  { key: "audio", label: "Audio" },
  { key: "gaming", label: "Gaming" },
  { key: "computers", label: "Computers" },
  { key: "wearables", label: "Wearables" },
  { key: "accessories", label: "Accessories" }
];

const params = new URLSearchParams(location.search);

function $(selector, parent) { return (parent || document).querySelector(selector); }
function $$(selector, parent) { return Array.from((parent || document).querySelectorAll(selector)); }

// stops text typed by a user from being read as HTML
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function getData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (e) { return fallback; }
}
function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
}

function formatPrice(amount) { return "₹" + Math.round(amount).toLocaleString("en-IN"); }
function categoryName(key) {
  const c = CATEGORIES.find(function (x) { return x.key === key; });
  return c ? c.label : "Products";
}
function findProduct(id) { return products.find(function (p) { return p.id === id; }); }
function discountPercent(p) { return p.old ? Math.round((1 - p.price / p.old) * 100) : 0; }
function starText(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
function productLink(id) { return "product.html?id=" + encodeURIComponent(id); }

/* ---------- 2. CART, WISHLIST, LOGIN, ORDERS ---------- */

/* Cart: list of { id, name, brand, price, image, qty } */
function getCart() { return getData("voltix_cart", []); }
function saveCart(cart) {
  saveData("voltix_cart", cart);
  updateCounts();
  document.dispatchEvent(new Event("cartchange"));
}
function cartCount() {
  return getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
}
function addToCart(id, qty) {
  const p = findProduct(id);
  if (!p) return;
  const cart = getCart();
  const limit = Math.min(MAX_QTY, p.stock);
  const existing = cart.find(function (item) { return item.id === id; });
  if (existing) {
    existing.qty = Math.min(limit, existing.qty + qty);
  } else {
    cart.push({ id: p.id, name: p.name, brand: p.brand, price: p.price, image: p.images[0], qty: Math.min(limit, qty) });
  }
  saveCart(cart);
}
function setCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find(function (i) { return i.id === id; });
  if (!item) return;
  const p = findProduct(id);
  const limit = Math.min(MAX_QTY, p ? p.stock : MAX_QTY);
  item.qty = Math.max(1, Math.min(limit, qty || 1));
  saveCart(cart);
}
function removeFromCart(id) {
  saveCart(getCart().filter(function (i) { return i.id !== id; }));
}
function clearCart() {
  localStorage.removeItem("voltix_promo");
  saveCart([]);
}

/* works out subtotal, discount, shipping, total */
function getTotals() {
  const cart = getCart();
  const code = getData("voltix_promo", "");
  const promo = PROMO_CODES[code];
  let subtotal = 0;
  cart.forEach(function (item) { subtotal += item.price * item.qty; });

  let shipping = 0;
  if (subtotal > 0 && subtotal < FREE_SHIPPING_ABOVE) shipping = SHIPPING_FEE;
  let discount = 0;
  let promoWorks = false;
  let promoMessage = "";

  if (promo) {
    if (promo.type === "percent") { discount = Math.round(subtotal * promo.value / 100); promoWorks = true; }
    if (promo.type === "flat") {
      if (subtotal >= promo.min) { discount = promo.value; promoWorks = true; }
      else promoMessage = "Add items worth " + formatPrice(promo.min) + " to use " + code;
    }
    if (promo.type === "shipping") { shipping = 0; promoWorks = true; }
  }
  const total = Math.max(0, subtotal - discount + shipping);
  const gst = Math.round(total - total / (1 + GST_RATE));
  return {
    cart: cart, subtotal: subtotal, discount: discount, shipping: shipping, total: total, gst: gst,
    code: code, promoWorks: promoWorks, promoMessage: promoMessage,
    toFree: Math.max(0, FREE_SHIPPING_ABOVE - subtotal)
  };
}

/* Wishlist: list of product ids */
function getWishlist() { return getData("voltix_wishlist", []); }
function inWishlist(id) { return getWishlist().indexOf(id) !== -1; }
function toggleWishlist(id) {
  let list = getWishlist();
  if (list.indexOf(id) !== -1) list = list.filter(function (x) { return x !== id; });
  else list.push(id);
  saveData("voltix_wishlist", list);
  updateCounts();
  return list.indexOf(id) !== -1;
}

/* Login system (no server yet, so users are kept in localStorage) */
function getUsers() { return getData("voltix_users", []); }
function getCurrentUser() {
  const email = getData("voltix_session", null) || JSON.parse(sessionStorage.getItem("voltix_session") || "null");
  if (!email) return null;
  return getUsers().find(function (u) { return u.email === email; }) || null;
}
async function hashPassword(text) {
  if (window.crypto && crypto.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buffer)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  let h = 5381;                                   // simple fallback hash
  for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return "x" + h.toString(16);
}
async function signUp(first, last, email, password) {
  email = email.trim().toLowerCase();
  const users = getUsers();
  if (users.some(function (u) { return u.email === email; })) {
    throw new Error("An account with this email already exists. Try logging in.");
  }
  const salt = Math.random().toString(36).slice(2);
  users.push({ first: first.trim(), last: last.trim(), email: email, salt: salt, hash: await hashPassword(salt + password) });
  saveData("voltix_users", users);
  sessionStorage.setItem("voltix_session", JSON.stringify(email));
}
async function logIn(email, password, remember) {
  email = email.trim().toLowerCase();
  const user = getUsers().find(function (u) { return u.email === email; });
  if (!user || user.hash !== await hashPassword(user.salt + password)) {
    throw new Error("Incorrect email or password.");
  }
  localStorage.removeItem("voltix_session");
  sessionStorage.removeItem("voltix_session");
  if (remember) saveData("voltix_session", email);
  else sessionStorage.setItem("voltix_session", JSON.stringify(email));
}
function logOut() {
  localStorage.removeItem("voltix_session");
  sessionStorage.removeItem("voltix_session");
}

/* Orders placed at checkout */
function getOrders() { return getData("voltix_orders", []); }
function myOrders() {
  const user = getCurrentUser();
  return getOrders().filter(function (o) { return user && o.email === user.email; })
    .sort(function (a, b) { return b.date - a.date; });
}
function orderStatus(order) {
  const hours = (Date.now() - order.date) / 3600000;
  if (hours < 2) return "Order confirmed";
  if (hours < 24) return "Packed and ready to ship";
  if (hours < 48) return "Shipped";
  if (hours < 72) return "Out for delivery";
  return "Delivered";
}
function orderEta(order) {
  return new Date(order.date + 3 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* shows the numbers on the cart icon and wishlist link */
function updateCounts() {
  const n = cartCount();
  $$(".count").forEach(function (el) { el.textContent = n; el.hidden = (n === 0); });
  const w = getWishlist().length;
  $$(".nav-wish-count").forEach(function (el) { el.textContent = w ? "(" + w + ")" : ""; });
}

/* ---------- 3. HEADER & FOOTER ---------- */

const ICON_SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>';
const ICON_USER = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"></path></svg>';
const ICON_CART = '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L19 8H6"></path><circle cx="9" cy="20" r="1"></circle><circle cx="17" cy="20" r="1"></circle></svg>';

function buildLayout() {
  const top =
    '<div class="announcement"><div class="container"><strong>FREE EXPRESS SHIPPING</strong> on orders over ' + formatPrice(FREE_SHIPPING_ABOVE) + ' <span>•</span> <a href="shop.html">Shop the latest tech</a></div></div>' +
    '<header><nav class="nav container" aria-label="Main">' +
      '<a href="index.html" class="logo"><i class="logo-mark"></i>volt<span>ix</span></a>' +
      '<input type="checkbox" id="nav-toggle" class="nav-toggle">' +
      '<label for="nav-toggle" class="nav-burger" aria-label="Open menu" aria-controls="nav-links"><span></span><span></span><span></span></label>' +
      '<div class="nav-links" id="nav-links">' +
        '<a href="index.html#categories">Categories</a>' +
        '<a href="shop.html">Shop</a>' +
        '<a href="shop.html?deals=1" class="sale">Flash deals</a>' +
        '<a href="index.html#brands">Brands</a>' +
        '<a href="shop.html?wishlist=1">Wishlist <span class="nav-wish-count"></span></a>' +
      '</div>' +
      '<form class="search" id="nav-search-form" role="search" autocomplete="off" action="shop.html" method="get">' +
        ICON_SEARCH +
        '<input id="nav-search" name="q" type="search" placeholder="Search products..." aria-label="Search products">' +
        '<div class="search-results" id="search-results" hidden></div>' +
      '</form>' +
      '<div class="nav-actions">' +
        '<button class="icon-btn search-toggle" id="search-toggle" type="button" aria-label="Search">' + ICON_SEARCH + '</button>' +
        '<a class="icon-btn" id="acct-btn" aria-label="Account" href="login.html">' + ICON_USER + '</a>' +
        '<a class="icon-btn" aria-label="Shopping cart" href="cart.html">' + ICON_CART + '<span class="count" hidden>0</span></a>' +
      '</div>' +
    '</nav></header>' +
    '<form class="mobile-search" id="mobile-search" action="shop.html" method="get" role="search">' +
      '<input name="q" type="search" placeholder="Search products..." aria-label="Search products">' +
    '</form>';

  const bottom =
    '<footer><div class="container">' +
      '<div class="footer-grid">' +
        '<div>' +
          '<a href="index.html" class="logo"><i class="logo-mark"></i>volt<span>ix</span></a>' +
          '<p class="footer-about">The destination for people who live for great technology. Better gear, better every day.</p>' +
          '<div class="socials"><a href="#" class="social">f</a><a href="#" class="social">𝕏</a><a href="#" class="social">ig</a><a href="#" class="social">in</a></div>' +
        '</div>' +
        '<div class="footer-col"><h4>Shop</h4>' +
          '<a href="shop.html?cat=smartphones">Smartphones</a><a href="shop.html?cat=computers">Laptops &amp; Tablets</a><a href="shop.html?cat=audio">Audio</a><a href="shop.html?cat=gaming">Gaming</a><a href="shop.html?cat=accessories">Accessories</a>' +
        '</div>' +
        '<div class="footer-col"><h4>Help</h4>' +
          '<a href="#" data-ask="How can I contact support?">Contact us</a><a href="#" data-ask="Tell me about shipping and delivery">Shipping &amp; Delivery</a><a href="#" data-ask="What is your returns and refund policy?">Returns &amp; Refunds</a><a href="#" data-ask="Track my order">Track your order</a><a href="#" data-ask="What offers and promo codes are available?">FAQs</a>' +
        '</div>' +
        '<div class="footer-col"><h4>About Voltix</h4>' +
          '<a href="#">Our story</a><a href="#">Careers</a><a href="#">Stores</a><a href="#">Terms &amp; Conditions</a><a href="#">Privacy policy</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom"><span>© 2026 Voltix Electronics. All rights reserved.</span>' +
        '<div class="payments"><span class="pay">VISA</span><span class="pay">mastercard</span><span class="pay">UPI</span><span class="pay">RuPay</span></div></div>' +
    '</div></footer>' +
    '<div class="toast-wrap" id="toast-wrap" aria-live="polite"></div>';

  document.body.insertAdjacentHTML("afterbegin", top);
  document.body.insertAdjacentHTML("beforeend", bottom);
}

/* ---------- 4. TOAST, POPUP, PRODUCT CARD, SEARCH, ACCOUNT ---------- */

function showToast(message, type) {
  const wrap = $("#toast-wrap");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className = "toast " + (type || "ok");
  t.textContent = message;
  wrap.appendChild(t);
  setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 300); }, 2600);
}

let openPopup = null;
function showPopup(html) {
  closePopup();
  openPopup = document.createElement("div");
  openPopup.className = "modal-back";
  openPopup.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><button class="modal-x" type="button" data-close aria-label="Close">✕</button>' + html + "</div>";
  openPopup.addEventListener("click", function (e) {
    if (e.target === openPopup || e.target.closest("[data-close]")) closePopup();
  });
  document.body.appendChild(openPopup);
  document.body.style.overflow = "hidden";
}
function closePopup() {
  if (openPopup) { openPopup.remove(); openPopup = null; document.body.style.overflow = ""; }
}

/* one product card (used on home, shop and product pages) */
function productCard(p) {
  const d = discountPercent(p);
  let badge = "";
  if (d >= 10) badge = '<span class="badge hot">-' + d + "%</span>";
  else if (p.badge) badge = '<span class="badge">' + escapeHTML(p.badge) + "</span>";
  const liked = inWishlist(p.id);
  return '<article class="product">' +
    '<div class="product-media">' + badge +
      '<button class="wish ' + (liked ? "active" : "") + '" type="button" data-wish="' + p.id + '" aria-label="Toggle wishlist">' + (liked ? "♥" : "♡") + "</button>" +
      '<a href="' + productLink(p.id) + '"><img src="' + p.images[0] + '" alt="' + escapeHTML(p.name) + '" loading="lazy"></a>' +
    "</div>" +
    '<div class="product-info">' +
      '<div class="rating">' + starText(p.rating) + " <em>" + p.rating.toFixed(1) + " (" + p.count + ")</em></div>" +
      '<h3><a href="' + productLink(p.id) + '">' + escapeHTML(p.name) + "</a></h3>" +
      '<div class="price-row">' +
        '<div class="price">' + formatPrice(p.price) + (p.old ? ' <span class="old-price">' + formatPrice(p.old) + "</span>" : "") + "</div>" +
        '<button class="cart-add" type="button" data-add="' + p.id + '" aria-label="Add ' + escapeHTML(p.name) + ' to cart">+</button>' +
      "</div>" +
    "</div></article>";
}

/* search box in the header: shows matching products while typing */
function searchProducts(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  return products.filter(function (p) {
    const all = (p.name + " " + p.brand + " " + categoryName(p.cat)).toLowerCase();
    return words.every(function (w) { return all.indexOf(w) !== -1; });
  });
}

function setupSearch() {
  const form = $("#nav-search-form");
  const input = $("#nav-search");
  const box = $("#search-results");
  const mobileBox = $("#mobile-search");

  input.addEventListener("input", function () {
    const text = input.value.trim();
    if (text.length < 2) { box.hidden = true; return; }
    const found = searchProducts(text).slice(0, 6);
    if (found.length === 0) {
      box.innerHTML = '<div class="sr-empty">No products found for “' + escapeHTML(text) + "”</div>";
    } else {
      box.innerHTML = found.map(function (p) {
        return '<a class="sr-item" href="' + productLink(p.id) + '"><img src="' + p.images[0] + '" alt=""><span><b>' +
          escapeHTML(p.name) + "</b><small>" + formatPrice(p.price) + " · " + categoryName(p.cat) + "</small></span></a>";
      }).join("") + '<a class="sr-all" href="shop.html?q=' + encodeURIComponent(text) + '">See all results →</a>';
    }
    box.hidden = false;
  });
  input.addEventListener("keydown", function (e) { if (e.key === "Escape") box.hidden = true; });
  document.addEventListener("click", function (e) { if (!form.contains(e.target)) box.hidden = true; });
  form.addEventListener("submit", function (e) { if (!input.value.trim()) e.preventDefault(); });

  $("#search-toggle").addEventListener("click", function () {
    mobileBox.classList.toggle("open");
    if (mobileBox.classList.contains("open")) $("input", mobileBox).focus();
  });
  if (params.get("q")) { input.value = params.get("q"); $("input", mobileBox).value = params.get("q"); }
}

/* account button: shows first letter + dropdown menu when logged in */
function setupAccount() {
  const user = getCurrentUser();
  if (!user) return;
  const btn = $("#acct-btn");
  btn.classList.add("has-user");
  btn.textContent = (user.first[0] || "U").toUpperCase();
  btn.href = "#";

  const menu = document.createElement("div");
  menu.className = "acct-menu";
  menu.hidden = true;
  menu.innerHTML = '<div class="acct-who"><b>Hi, ' + escapeHTML(user.first) + "</b><small>" + escapeHTML(user.email) + "</small></div>" +
    '<button type="button" id="menu-orders">My orders</button>' +
    '<a href="shop.html?wishlist=1">My wishlist</a>' +
    '<a href="cart.html">My cart</a>' +
    '<button type="button" id="menu-logout" class="danger">Log out</button>';
  $(".nav-actions").appendChild(menu);

  btn.addEventListener("click", function (e) { e.preventDefault(); menu.hidden = !menu.hidden; });
  document.addEventListener("click", function (e) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) menu.hidden = true;
  });
  $("#menu-logout").addEventListener("click", function () {
    logOut(); showToast("You have been logged out");
    setTimeout(function () { location.reload(); }, 600);
  });
  $("#menu-orders").addEventListener("click", function () { menu.hidden = true; showOrdersPopup(); });
}

function showOrdersPopup() {
  const orders = myOrders();
  let html = "<h3>My orders</h3><p class='modal-sub'>" + (orders.length ? "Your recent orders on Voltix." : "You have not placed any orders yet.") + "</p>";
  orders.forEach(function (o) {
    html += '<div class="order-card"><div class="order-top"><b>' + o.id + '</b><span class="pill">' + orderStatus(o) + "</span></div>" +
      "<small>" + new Date(o.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " · <b>" + formatPrice(o.total) + "</b> · " + escapeHTML(o.payment) + "</small>" +
      "<small>" + o.items.map(function (i) { return escapeHTML(i.name) + " × " + i.qty; }).join(", ") + "</small></div>";
  });
  showPopup(html);
}

/* clicks on buttons that are created by JavaScript (add to cart, heart) */
function setupClicks() {
  document.addEventListener("click", function (e) {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      e.preventDefault();
      const p = findProduct(addBtn.dataset.add);
      if (!p) return;
      addToCart(p.id, 1);
      showToast("Added to cart — " + (p.name.length > 36 ? p.name.slice(0, 36) + "…" : p.name));
      addBtn.classList.add("added");
      addBtn.textContent = "✓";
      setTimeout(function () { addBtn.classList.remove("added"); addBtn.textContent = "+"; }, 1100);
      return;
    }
    const wishBtn = e.target.closest("[data-wish]");
    if (wishBtn) {
      e.preventDefault();
      const liked = toggleWishlist(wishBtn.dataset.wish);
      $$("[data-wish]").forEach(function (b) {
        if (b.dataset.wish === wishBtn.dataset.wish) { b.classList.toggle("active", liked); b.textContent = liked ? "♥" : "♡"; }
      });
      showToast(liked ? "Saved to wishlist" : "Removed from wishlist");
      document.dispatchEvent(new Event("wishchange"));
      return;
    }
    const askLink = e.target.closest("[data-ask]");
    if (askLink) { e.preventDefault(); askChatbot(askLink.dataset.ask); return; }
    if (e.target.closest(".nav-links a")) { const t = $("#nav-toggle"); if (t) t.checked = false; }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePopup(); });

  // if a product image is missing, hide the broken icon
  document.addEventListener("error", function (e) {
    if (e.target.tagName === "IMG") e.target.style.visibility = "hidden";
  }, true);
}

/* ---------- 5. PAGE CODE ---------- */

/* ----- HOME PAGE ----- */
function initHome() {
  // trending products (ids are listed in products.js)
  $("#trending-grid").innerHTML = trendingIds.map(function (id) { return productCard(findProduct(id)); }).join("");

  // number of products in each category card
  $$(".category[data-cat]").forEach(function (card) {
    const n = products.filter(function (p) { return p.cat === card.dataset.cat; }).length;
    $("small", card).textContent = n + (n === 1 ? " product" : " products");
  });

  // flash deal countdown (counts down to midnight)
  const boxes = $$(".timer .time b");
  function tick() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const left = Math.floor((midnight - now) / 1000);
    const parts = [Math.floor(left / 3600), Math.floor(left % 3600 / 60), left % 60];
    boxes.forEach(function (b, i) { b.textContent = String(parts[i]).padStart(2, "0"); });
  }
  tick();
  setInterval(tick, 1000);

  // newsletter form
  const form = $(".email-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const list = getData("voltix_newsletter", []);
    list.push($("input", form).value.trim().toLowerCase());
    saveData("voltix_newsletter", list);
    form.reset();
    showToast("Subscribed! Watch your inbox for tech drops.");
  });
}

/* ----- SHOP PAGE ----- */
function initShop() {
  const grid = $("#shop-grid");
  const pagination = $("#pagination");

  // current filter settings
  const state = {
    cats: [], brands: [], min: 0, max: 0, rating: 0,
    sort: params.get("sort") || "featured", q: (params.get("q") || "").trim(), page: 1,
    deals: params.get("deals") === "1", wishlist: params.get("wishlist") === "1"
  };
  (params.get("cat") || "").split(",").forEach(function (c) {
    if (CATEGORIES.some(function (x) { return x.key === c; })) state.cats.push(c);
  });

  // build the category and brand checkboxes from the product list
  $("#filter-cats").innerHTML = CATEGORIES.map(function (c) {
    const n = products.filter(function (p) { return p.cat === c.key; }).length;
    return '<div class="filter-option"><input type="checkbox" id="cat-' + c.key + '" value="' + c.key + '"' + (state.cats.indexOf(c.key) !== -1 ? " checked" : "") +
      '><label for="cat-' + c.key + '">' + c.label + "</label><small>" + n + "</small></div>";
  }).join("");

  const brandNames = [];
  products.forEach(function (p) { if (brandNames.indexOf(p.brand) === -1) brandNames.push(p.brand); });
  brandNames.sort();
  $("#filter-brands").innerHTML = brandNames.map(function (b, i) {
    return '<div class="filter-option"><input type="checkbox" id="brand-' + i + '" value="' + b + '"><label for="brand-' + i + '">' + b + "</label></div>";
  }).join("");
  $("#sort-select").value = state.sort;

  // pick the products that match the filters, then sort them
  function getFilteredProducts() {
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = products.filter(function (p) {
      const all = (p.name + " " + p.brand + " " + categoryName(p.cat)).toLowerCase();
      if (!words.every(function (w) { return all.indexOf(w) !== -1; })) return false;
      if (state.cats.length && state.cats.indexOf(p.cat) === -1) return false;
      if (state.brands.length && state.brands.indexOf(p.brand) === -1) return false;
      if (state.min && p.price < state.min) return false;
      if (state.max && p.price > state.max) return false;
      if (state.rating && p.rating < state.rating) return false;
      if (state.deals && discountPercent(p) < 10) return false;
      if (state.wishlist && !inWishlist(p.id)) return false;
      return true;
    });
    if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === "rating") list.sort(function (a, b) { return b.rating - a.rating; });
    if (state.sort === "discount") list.sort(function (a, b) { return discountPercent(b) - discountPercent(a); });
    if (state.sort === "new") list.sort(function (a, b) { return (b.badge === "NEW") - (a.badge === "NEW"); });
    return list;
  }

  function pageTitle() {
    if (state.wishlist) return "Your Wishlist";
    if (state.deals) return "Flash Deals";
    if (state.q) return "Results for “" + state.q + "”";
    if (state.cats.length === 1) return categoryName(state.cats[0]);
    return "All Products";
  }

  function showPage(scrollUp) {
    const list = getFilteredProducts();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PER_PAGE;
    const shown = list.slice(start, start + PER_PAGE);

    $("#page-title").textContent = pageTitle();
    $("#bc-current").textContent = pageTitle();
    document.title = pageTitle() + " — Voltix";
    $("#shop-count").textContent = list.length ? "Showing " + (start + 1) + "–" + (start + shown.length) + " of " + list.length + " products" : "No products found";

    if (shown.length) {
      grid.innerHTML = shown.map(productCard).join("");
    } else {
      grid.innerHTML = '<div class="shop-empty"><div class="empty-ico">' + (state.wishlist ? "♡" : "🔍") + "</div><h3>" +
        (state.wishlist ? "Your wishlist is empty" : "No products match your filters") + "</h3><p>" +
        (state.wishlist ? "Tap the heart on any product to save it here." : "Try removing a filter or searching for something else.") +
        '</p><button class="btn-primary" type="button" id="reset-filters">' + (state.wishlist ? "Browse products" : "Reset filters") + "</button></div>";
    }

    // small tags showing the active filters
    const chips = [];
    if (state.q) chips.push(["q", "Search: " + state.q]);
    state.cats.forEach(function (c) { chips.push(["cat:" + c, categoryName(c)]); });
    state.brands.forEach(function (b) { chips.push(["brand:" + b, b]); });
    if (state.min || state.max) chips.push(["price", (state.min ? formatPrice(state.min) : "₹0") + " – " + (state.max ? formatPrice(state.max) : "any")]);
    if (state.rating) chips.push(["rating", state.rating + "★ & up"]);
    if (state.deals) chips.push(["deals", "Flash deals"]);
    $("#active-chips").innerHTML = chips.map(function (c) {
      return '<button type="button" class="chip" data-chip="' + escapeHTML(c[0]) + '">' + escapeHTML(c[1]) + " ✕</button>";
    }).join("");

    // page numbers
    if (pages <= 1) { pagination.innerHTML = ""; }
    else {
      let html = '<a href="#" data-page="' + (state.page - 1) + '" class="' + (state.page === 1 ? "disabled" : "") + '">‹</a>';
      for (let i = 1; i <= pages; i++) {
        html += '<a href="#" data-page="' + i + '" class="' + (i === state.page ? "active" : "") + '">' + i + "</a>";
      }
      html += '<a href="#" data-page="' + (state.page + 1) + '" class="' + (state.page === pages ? "disabled" : "") + '">›</a>';
      pagination.innerHTML = html;
    }
    if (scrollUp) $(".shop-toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetFilters() {
    state.cats = []; state.brands = []; state.min = 0; state.max = 0; state.rating = 0;
    state.q = ""; state.deals = false; state.wishlist = false; state.page = 1;
    $$(".filters input[type=checkbox]").forEach(function (i) { i.checked = false; });
    $("#r0").checked = true;
    $("#price-min").value = ""; $("#price-max").value = "";
    $("#nav-search").value = ""; $("#mobile-search input").value = "";
    showPage();
  }

  // filter box changes
  $(".filters").addEventListener("change", function (e) {
    const t = e.target;
    if (t.closest("#filter-cats")) {
      state.cats = $$("#filter-cats input:checked").map(function (i) { return i.value; });
      state.wishlist = false;
    } else if (t.closest("#filter-brands")) {
      state.brands = $$("#filter-brands input:checked").map(function (i) { return i.value; });
    } else if (t.name === "rating") {
      state.rating = Number(t.value);
    } else if (t.id === "price-min" || t.id === "price-max") {
      state.min = Number($("#price-min").value) || 0;
      state.max = Number($("#price-max").value) || 0;
    }
    state.page = 1;
    showPage();
  });
  $("#apply-filters").addEventListener("click", function () {
    state.min = Number($("#price-min").value) || 0;
    state.max = Number($("#price-max").value) || 0;
    state.page = 1;
    showPage(true);
    $("#filters-toggle").checked = false;
  });
  $("#sort-select").addEventListener("change", function (e) { state.sort = e.target.value; state.page = 1; showPage(); });
  pagination.addEventListener("click", function (e) {
    const a = e.target.closest("a[data-page]");
    if (!a) return;
    e.preventDefault();
    if (a.classList.contains("disabled")) return;
    state.page = Number(a.dataset.page);
    showPage(true);
  });
  $("#active-chips").addEventListener("click", function (e) {
    const chip = e.target.closest("[data-chip]");
    if (!chip) return;
    const parts = chip.dataset.chip.split(":");
    const kind = parts[0];
    const value = parts.slice(1).join(":");
    if (kind === "q") { state.q = ""; $("#nav-search").value = ""; }
    if (kind === "cat") { state.cats = state.cats.filter(function (c) { return c !== value; }); $("#cat-" + value).checked = false; }
    if (kind === "brand") {
      state.brands = state.brands.filter(function (b) { return b !== value; });
      $$("#filter-brands input").forEach(function (i) { if (i.value === value) i.checked = false; });
    }
    if (kind === "price") { state.min = 0; state.max = 0; $("#price-min").value = ""; $("#price-max").value = ""; }
    if (kind === "rating") { state.rating = 0; $("#r0").checked = true; }
    if (kind === "deals") state.deals = false;
    state.page = 1;
    showPage();
  });
  grid.addEventListener("click", function (e) {
    if (e.target.closest("#reset-filters")) {
      if (state.wishlist) location.href = "shop.html"; else resetFilters();
    }
  });
  document.addEventListener("wishchange", function () { if (state.wishlist) showPage(); });

  showPage();
}

/* ----- PRODUCT PAGE (one page for every product: product.html?id=...) ----- */
function initProduct() {
  const root = $("#product-root");
  const p = findProduct(params.get("id"));

  if (!p) {
    $("#bc-current").textContent = "Not found";
    root.innerHTML = '<div class="container shop-empty"><div class="empty-ico">😕</div><h3>We couldn\'t find that product</h3><p>It may have been removed, or the link is incorrect.</p><a class="btn-primary" href="shop.html">Back to shop</a></div>';
    return;
  }

  document.title = p.name + " — Voltix";
  $("#bc-cat").innerHTML = '<a href="shop.html?cat=' + p.cat + '">' + categoryName(p.cat) + "</a>";
  $("#bc-current").textContent = p.name.length > 40 ? p.name.slice(0, 40) + "…" : p.name;

  let stockClass = "", stockText = "In stock — ships within 24 hours";
  if (p.stock <= 10) { stockClass = "low"; stockText = "Only " + p.stock + " left — order soon"; }
  const liked = inWishlist(p.id);
  const d = discountPercent(p);

  // small thumbnails (only if the product has more than one image)
  let thumbs = "";
  if (p.images.length > 1) {
    thumbs = '<div class="gallery-thumbs">' + p.images.map(function (src, i) {
      return '<button type="button" class="thumb-btn ' + (i === 0 ? "active" : "") + '" data-img="' + i + '" aria-label="Show image ' + (i + 1) + '"><img src="' + src + '" alt=""></button>';
    }).join("") + "</div>";
  }

  const specs = p.specs.map(function (s) {
    return "<li><b>" + escapeHTML(s[0]) + "</b> <span>" + escapeHTML(s[1]) + "</span></li>";
  }).join("");

  const reviews = p.reviews.map(function (r) {
    return '<div class="review"><div class="rating">' + starText(r[1]) + "</div><p>" + escapeHTML(r[2]) + "</p><small><b>" + escapeHTML(r[0]) + "</b> · Verified buyer</small></div>";
  }).join("");

  root.innerHTML =
    '<div class="container product-detail">' +
      '<div class="gallery"><div class="gallery-main dyn"><img id="pd-main" src="' + p.images[0] + '" alt="' + escapeHTML(p.name) + '"></div>' + thumbs + "</div>" +
      '<div class="pd-info">' +
        '<div class="rating">' + starText(p.rating) + " <em>" + p.rating.toFixed(1) + " · " + p.count + " reviews</em></div>" +
        "<h1>" + escapeHTML(p.name) + "</h1>" +
        '<div class="pd-price"><div class="price">' + formatPrice(p.price) + "</div>" +
          (p.old ? '<span class="old-price">' + formatPrice(p.old) + '</span><span class="pd-discount">' + d + "% OFF</span>" : "") + "</div>" +
        '<div class="pd-tax">Inclusive of all taxes (GST). Free shipping above ' + formatPrice(FREE_SHIPPING_ABOVE) + ".</div>" +
        '<div class="pd-stock ' + stockClass + '">' + stockText + "</div>" +
        '<p class="pd-desc">' + escapeHTML(p.desc) + "</p>" +
        '<ul class="pd-specs">' + specs + "</ul>" +
        '<div class="pd-actions">' +
          '<div class="qty-select"><button type="button" id="q-dec" aria-label="Decrease quantity">−</button>' +
          '<input type="text" id="q-val" value="1" inputmode="numeric" aria-label="Quantity">' +
          '<button type="button" id="q-inc" aria-label="Increase quantity">+</button></div>' +
          '<button class="btn-primary" type="button" id="pd-add">Add to cart</button>' +
          '<button class="btn-outline wish-btn ' + (liked ? "active" : "") + '" type="button" data-wish="' + p.id + '" aria-label="Add to wishlist">' + (liked ? "♥" : "♡") + "</button>" +
        "</div>" +
        '<button class="buy-now" type="button" id="pd-buy">Buy it now</button>' +
        '<div class="pincode"><input type="text" id="pin-in" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit pincode" aria-label="Delivery pincode">' +
        '<button type="button" id="pin-btn">Check delivery</button></div>' +
        '<div class="pin-msg" id="pin-msg"></div>' +
        '<ul class="pd-perks"><li>7-day easy returns</li><li>Cash on delivery available</li><li>Brand warranty &amp; GST invoice</li></ul>' +
      "</div>" +
    "</div>" +
    '<section class="container pd-sec"><div class="section-top"><div><div class="section-label">What buyers say</div><h2>Customer reviews</h2></div></div><div class="reviews-grid">' + reviews + "</div></section>" +
    '<section class="container pd-sec"><div class="section-top related-heading"><div><div class="section-label">You might also like</div><h2>Related products</h2></div></div><div class="products" id="related-grid"></div></section>';

  // change the big image when a thumbnail is clicked
  $$(".thumb-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $("#pd-main").src = p.images[Number(btn.dataset.img)];
      $$(".thumb-btn").forEach(function (b) { b.classList.toggle("active", b === btn); });
    });
  });

  // quantity box
  const qty = $("#q-val");
  const maxQty = Math.min(MAX_QTY, p.stock);
  function setQty(n) { qty.value = Math.max(1, Math.min(maxQty, n || 1)); }
  $("#q-dec").addEventListener("click", function () { setQty(Number(qty.value) - 1); });
  $("#q-inc").addEventListener("click", function () {
    if (Number(qty.value) >= maxQty) showToast("Maximum " + maxQty + " per order", "error");
    setQty(Number(qty.value) + 1);
  });
  qty.addEventListener("change", function () { setQty(parseInt(qty.value, 10)); });
  $("#pd-add").addEventListener("click", function () { addToCart(p.id, Number(qty.value)); showToast("Added " + qty.value + " to cart"); });
  $("#pd-buy").addEventListener("click", function () { addToCart(p.id, Number(qty.value)); location.href = "cart.html"; });

  // delivery date checker
  function checkPincode() {
    const pin = $("#pin-in").value.trim();
    const msg = $("#pin-msg");
    msg.className = "pin-msg";
    msg.textContent = "Checking delivery…";
    checkDelivery(pin, p.price)
      .then(function (text) { msg.className = "pin-msg ok"; msg.textContent = text; })
      .catch(function (err) { msg.className = "pin-msg err"; msg.textContent = err.message; });
  }
  $("#pin-btn").addEventListener("click", checkPincode);
  $("#pin-in").addEventListener("keydown", function (e) { if (e.key === "Enter") checkPincode(); });

  // related products: same category first, then the rest
  let related = products.filter(function (x) { return x.cat === p.cat && x.id !== p.id; });
  products.forEach(function (x) { if (related.length < 4 && x.id !== p.id && related.indexOf(x) === -1) related.push(x); });
  $("#related-grid").innerHTML = related.slice(0, 4).map(productCard).join("");
}

/* ----- CART PAGE ----- */
function initCart() {
  const root = $("#cart-root");

  function drawCart() {
    const t = getTotals();
    if (t.cart.length === 0) {
      root.innerHTML = '<div class="container shop-empty"><div class="empty-ico">🛒</div><h3>Your cart is empty</h3><p>Looks like you haven\'t added anything yet.</p><a class="btn-primary" href="shop.html">Start shopping</a></div>';
      return;
    }
    const percent = Math.min(100, Math.round(t.subtotal / FREE_SHIPPING_ABOVE * 100));
    let rows = "";
    t.cart.forEach(function (item) {
      rows += '<div class="cart-row" data-id="' + item.id + '">' +
        '<a class="cart-img" href="' + productLink(item.id) + '"><img src="' + item.image + '" alt="' + escapeHTML(item.name) + '"></a>' +
        '<div class="cart-meta"><a class="cart-title" href="' + productLink(item.id) + '">' + escapeHTML(item.name) + "</a>" +
          "<small>" + escapeHTML(item.brand) + " · " + formatPrice(item.price) + ' each</small><button type="button" class="remove-link" data-remove>Remove</button></div>' +
        '<div class="cart-qty"><button type="button" data-dec aria-label="Decrease quantity">−</button>' +
          '<input type="text" value="' + item.qty + '" inputmode="numeric" aria-label="Quantity" data-qty>' +
          '<button type="button" data-inc aria-label="Increase quantity">+</button></div>' +
        '<div class="cart-line">' + formatPrice(item.price * item.qty) + "</div></div>";
    });

    let promoText = "Try VOLTIX10, WELCOME500 or FREESHIP";
    if (t.code && PROMO_CODES[t.code]) promoText = t.promoWorks ? "✓ " + PROMO_CODES[t.code].text + " applied" : t.promoMessage;

    root.innerHTML =
      '<div class="container cart-layout"><div class="cart-list">' + rows +
        '<div class="cart-foot"><a href="shop.html" class="view-all">← Continue shopping</a><button type="button" class="remove-link" id="clear-cart">Clear cart</button></div></div>' +
      '<aside class="cart-summary"><h3>Order summary</h3>' +
        (t.toFree > 0
          ? '<div class="ship-bar"><small>Add <b>' + formatPrice(t.toFree) + '</b> more for free shipping</small><div class="bar"><span style="width:' + percent + '%"></span></div></div>'
          : '<div class="ship-bar ok"><small>🎉 You\'ve unlocked free shipping</small></div>') +
        '<div class="summary-row"><span>Subtotal (' + cartCount() + " items)</span><span>" + formatPrice(t.subtotal) + "</span></div>" +
        (t.discount ? '<div class="summary-row disc"><span>Discount (' + t.code + ")</span><span>− " + formatPrice(t.discount) + "</span></div>" : "") +
        '<div class="summary-row"><span>Shipping</span><span>' + (t.shipping ? formatPrice(t.shipping) : "Free") + "</span></div>" +
        '<div class="summary-row muted"><span>Includes GST (18%)</span><span>' + formatPrice(t.gst) + "</span></div>" +
        '<div class="promo-row"><input type="text" id="promo-in" placeholder="Promo code" aria-label="Promo code" value="' + escapeHTML(t.code) + '">' +
          '<button type="button" id="promo-btn">' + (t.code && t.promoWorks ? "Remove" : "Apply") + "</button></div>" +
        '<div class="promo-msg ' + (t.promoWorks ? "ok" : "err") + '" id="promo-msg">' + promoText + "</div>" +
        '<div class="summary-row total"><span>Total</span><span>' + formatPrice(t.total) + "</span></div>" +
        '<button class="btn-primary" type="button" id="checkout-btn">Proceed to checkout</button>' +
        '<p class="empty-cart-note">7-day easy returns on all orders.</p></aside></div>';
  }

  root.addEventListener("click", function (e) {
    const row = e.target.closest(".cart-row");
    const id = row ? row.dataset.id : null;
    const item = id ? getCart().find(function (i) { return i.id === id; }) : null;

    if (e.target.closest("[data-remove]")) { removeFromCart(id); showToast("Item removed"); }
    else if (e.target.closest("[data-inc]")) {
      if (item.qty >= Math.min(MAX_QTY, findProduct(id).stock)) showToast("Maximum quantity reached", "error");
      setCartQty(id, item.qty + 1);
    }
    else if (e.target.closest("[data-dec]")) setCartQty(id, item.qty - 1);
    else if (e.target.closest("#clear-cart")) clearCart();
    else if (e.target.closest("#promo-btn")) {
      const t = getTotals();
      if (t.code && t.promoWorks) { localStorage.removeItem("voltix_promo"); drawCart(); return; }
      const code = $("#promo-in").value.trim().toUpperCase();
      if (!PROMO_CODES[code]) { const m = $("#promo-msg"); m.className = "promo-msg err"; m.textContent = "Invalid promo code"; return; }
      saveData("voltix_promo", code);
      drawCart();
    }
    else if (e.target.closest("#checkout-btn")) startCheckout();
  });
  root.addEventListener("change", function (e) {
    if (e.target.matches("[data-qty]")) setCartQty(e.target.closest(".cart-row").dataset.id, parseInt(e.target.value, 10));
  });
  document.addEventListener("cartchange", drawCart);
  drawCart();
}

/* checkout popup (demo — no real payment) */
function startCheckout() {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please log in to place your order", "error");
    setTimeout(function () { location.href = "login.html?next=cart.html"; }, 900);
    return;
  }
  const t = getTotals();
  const saved = getData("voltix_address_" + user.email, {});
  function val(x) { return escapeHTML(saved[x] || ""); }

  showPopup(
    "<h3>Checkout</h3><p class='modal-sub'>Delivering to " + escapeHTML(user.first) + " · total <b>" + formatPrice(t.total) + "</b></p>" +
    '<form id="co-form" novalidate>' +
      '<div class="field"><label for="co-name">Full name</label><input id="co-name" value="' + escapeHTML(saved.name || user.first + " " + user.last) + '"></div>' +
      '<div class="field-row">' +
        '<div class="field"><label for="co-phone">Mobile number</label><input id="co-phone" inputmode="numeric" maxlength="10" placeholder="10-digit number" value="' + val("phone") + '"></div>' +
        '<div class="field"><label for="co-pin">Pincode</label><input id="co-pin" inputmode="numeric" maxlength="6" placeholder="6-digit pincode" value="' + val("pin") + '"></div>' +
      "</div>" +
      '<div class="field"><label for="co-addr">Address</label><input id="co-addr" placeholder="House no., street, area" value="' + val("addr") + '"></div>' +
      '<div class="field"><label for="co-city">City &amp; state</label><input id="co-city" placeholder="e.g. Panipat, Haryana" value="' + val("city") + '"></div>' +
      '<div class="field"><label>Payment method</label><div class="pay-opts">' +
        '<label class="pay-opt"><input type="radio" name="pay" value="UPI" checked> UPI (GPay / PhonePe / Paytm)</label>' +
        '<label class="pay-opt"><input type="radio" name="pay" value="Card"> Credit / Debit card</label>' +
        '<label class="pay-opt"><input type="radio" name="pay" value="Cash on Delivery"> Cash on delivery</label>' +
      "</div></div>" +
      '<div class="form-msg" id="co-msg" role="alert"></div>' +
      '<button class="auth-submit" type="submit">Place order · ' + formatPrice(t.total) + "</button>" +
      '<p class="terms-note">Demo checkout — no real payment is taken.</p>' +
    "</form>"
  );

  $("#co-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = $("#co-name").value.trim(), phone = $("#co-phone").value.trim(), pin = $("#co-pin").value.trim();
    const addr = $("#co-addr").value.trim(), city = $("#co-city").value.trim();
    let error = "";
    if (!name) error = "Please enter your name.";
    else if (!/^[6-9]\d{9}$/.test(phone)) error = "Enter a valid 10-digit Indian mobile number.";
    else if (!/^[1-9]\d{5}$/.test(pin)) error = "Enter a valid 6-digit pincode.";
    else if (!addr) error = "Please enter your address.";
    else if (!city) error = "Please enter your city and state.";
    if (error) { $("#co-msg").textContent = error; return; }

    saveData("voltix_address_" + user.email, { name: name, phone: phone, pin: pin, addr: addr, city: city });
    // place the order: stock check + payment run together (Promise.all inside placeOrder)
    const btn = $("#co-form button[type=submit]");
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Processing payment…";
    $("#co-msg").textContent = "";
    placeOrder(user, $("input[name=pay]:checked").value)
      .then(function (order) {
        showPopup('<div class="order-ok"><div class="ok-ring">✓</div><h3>Order placed!</h3>' +
          '<p class="modal-sub">Thank you, ' + escapeHTML(user.first) + ". Your order <b>" + order.id + "</b> is confirmed and will arrive by <b>" + orderEta(order) + "</b>.</p>" +
          '<p class="modal-sub">Total: <b>' + formatPrice(order.total) + "</b> via " + escapeHTML(order.payment) + ". Ask our chat assistant to track it any time.</p>" +
          '<a class="btn-primary" href="shop.html">Continue shopping</a></div>');
      })
      .catch(function (err) { $("#co-msg").textContent = err.message; })
      .finally(function () {
        if (btn.isConnected) { btn.disabled = false; btn.textContent = label; }
      });
  });
}

/* ----- LOGIN / SIGNUP PAGE ----- */
function initAuth() {
  const next = params.get("next") || "index.html";
  function showError(form, text) { $(".form-msg", form).textContent = text; }

  $("#signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const f = e.target;
    showError(f, "");
    const pw = f.elements.password.value;
    if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return showError(f, "Password must include both letters and numbers.");
    if (pw !== f.elements.confirm_password.value) return showError(f, "Passwords do not match.");
    try {
      await signUp(f.elements.first_name.value, f.elements.last_name.value, f.elements.email.value, pw);
      showToast("Welcome to Voltix, " + f.elements.first_name.value.trim() + "!");
      setTimeout(function () { location.href = next; }, 900);
    } catch (err) { showError(f, err.message); }
  });

  $("#login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const f = e.target;
    showError(f, "");
    try {
      await logIn(f.elements.email.value, f.elements.password.value, f.elements.remember.checked);
      showToast("Welcome back!");
      setTimeout(function () { location.href = next; }, 800);
    } catch (err) { showError(f, err.message); }
  });

  $$(".social-auth button").forEach(function (b) {
    b.addEventListener("click", function () { showToast(b.textContent + " sign-in is not available — please use email", "error"); });
  });
  $(".forgot-link").addEventListener("click", function (e) {
    e.preventDefault();
    showToast("Password reset is not available yet", "error");
  });
}

/* =====================================================================
   PROMISES — a tiny "fake server"
   A real shop would call a server for data, payments and delivery dates.
   These functions return Promises that behave like those server calls:
   they take a moment, then either resolve (success) or reject (failure).
   The rest of the code uses .then(), .catch(), .finally(), Promise.all()
   and Promise.race() to handle the result.
   ===================================================================== */

/* wait for some milliseconds, then resolve */
function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/* "download" the product list (resolves with the products array) */
function loadProducts() {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (typeof products !== "undefined" && Array.isArray(products) && products.length) resolve(products);
      else reject(new Error("The product list could not be loaded."));
    }, 350);
  });
}

/* reject if the promise takes longer than `ms` — Promise.race, first one to finish wins */
function withTimeout(promise, ms) {
  const timer = new Promise(function (resolve, reject) {
    setTimeout(function () { reject(new Error("The request took too long. Please try again.")); }, ms);
  });
  return Promise.race([promise, timer]);
}

/* check every cart line is still in stock */
function verifyStock(cart) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      const bad = cart.find(function (i) { const p = findProduct(i.id); return !p || i.qty > p.stock; });
      if (bad) reject(new Error(bad.name + " is not available in that quantity."));
      else resolve(true);
    }, 500);
  });
}

/* pretend to talk to a payment provider */
function processPayment(method, amount) {
  return delay(1100).then(function () {
    return { ref: "PAY" + String(Date.now()).slice(-6), method: method, amount: amount };
  });
}

/* stock check and payment run at the same time; the order is created only if BOTH succeed */
function placeOrder(user, method) {
  const t = getTotals();
  if (!t.cart.length) return Promise.reject(new Error("Your cart is empty."));
  return Promise.all([verifyStock(t.cart), processPayment(method, t.total)]).then(function (results) {
    const payment = results[1];
    const order = {
      id: "VX" + String(Date.now()).slice(-8), email: user.email, date: Date.now(),
      payment: method, paymentRef: payment.ref, total: t.total,
      items: t.cart.map(function (i) { return { id: i.id, name: i.name, qty: i.qty, price: i.price }; })
    };
    const orders = getOrders();
    orders.push(order);
    saveData("voltix_orders", orders);
    clearCart();
    return order;
  });
}

/* look up the delivery date for a pincode */
function checkDelivery(pin, price) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (!/^[1-9]\d{5}$/.test(pin)) { reject(new Error("Please enter a valid 6-digit pincode.")); return; }
      const bigCities = ["11", "40", "56", "60", "70", "50", "12", "16"];   // first 2 digits of metro pincodes
      const days = bigCities.indexOf(pin.slice(0, 2)) !== -1 ? 2 : 5;
      const date = new Date(Date.now() + days * 86400000);
      resolve("Delivery to " + pin + " by " + date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) + (price >= FREE_SHIPPING_ABOVE ? " · Free shipping" : ""));
    }, 600);
  });
}

/* show a loading placeholder while the product list "downloads" */
function showLoading(page) {
  if (page === "shop") {
    $("#shop-grid").innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  } else {
    $("#product-root").innerHTML = '<div class="container"><div class="skeleton skeleton-wide"></div></div>';
  }
}
function showLoadError(page, err) {
  const target = page === "shop" ? $("#shop-grid") : $("#product-root");
  target.innerHTML = '<div class="container shop-empty"><div class="empty-ico">⚠️</div><h3>Something went wrong</h3><p>' + escapeHTML(err.message) + '</p><button class="btn-primary" type="button" onclick="location.reload()">Try again</button></div>';
}

/* ---------- START ---------- */
document.addEventListener("DOMContentLoaded", function () {
  buildLayout();
  updateCounts();
  setupSearch();
  setupAccount();
  setupClicks();

  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "shop" || page === "product") {
    // the product list "downloads" first (a Promise), then the page is drawn
    showLoading(page);
    withTimeout(loadProducts(), 5000)
      .then(function () { return page === "shop" ? initShop() : initProduct(); })
      .catch(function (err) { showLoadError(page, err); });
  }
  if (page === "cart") initCart();
  if (page === "auth") initAuth();
});
