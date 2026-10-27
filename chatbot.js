/* =========================================================
   chatbot.js — "Volt", the Voltix customer assistant.
   It works completely offline: it reads what the customer
   types, looks for keywords and replies from the answers
   written below. Product suggestions come from products.js.
   (Needs script.js and products.js to be loaded first.)
   ========================================================= */

let chatHistory = JSON.parse(sessionStorage.getItem("voltix_chat") || "[]");
let chatBusy = false;

const quickQuestions = [
  "Best phones under ₹30,000",
  "Track my order",
  "Shipping & delivery",
  "Returns policy",
  "Offers & promo codes"
];

/* ----- build the chat window ----- */
function buildChat() {
  document.body.insertAdjacentHTML("beforeend",
    '<button class="chat-fab" id="chat-fab" type="button" aria-label="Open chat assistant">' +
      '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"></path><path d="M8.5 11h7M8.5 14h4"></path></svg>' +
    "</button>" +
    '<section class="chat-panel" id="chat-panel" hidden aria-label="Voltix assistant">' +
      '<div class="chat-head">' +
        '<div class="chat-avatar">⚡</div>' +
        '<div class="chat-title"><b>Volt · Voltix Assistant</b><small>● Online — replies instantly</small></div>' +
        '<button id="chat-clear" type="button" aria-label="Clear chat" title="Clear chat">↺</button>' +
        '<button id="chat-close" type="button" aria-label="Close chat">✕</button>' +
      "</div>" +
      '<div class="chat-body" id="chat-body" aria-live="polite"></div>' +
      '<div class="chat-chips" id="chat-chips"></div>' +
      '<form class="chat-form" id="chat-form" autocomplete="off">' +
        '<input id="chat-input" type="text" maxlength="300" placeholder="Ask about products, orders, offers…" aria-label="Type your message">' +
        '<button type="submit" aria-label="Send message">➤</button>' +
      "</form>" +
    "</section>");

  $("#chat-chips").innerHTML = quickQuestions.map(function (q) {
    return '<button type="button" data-quick>' + escapeHTML(q) + "</button>";
  }).join("");

  $("#chat-fab").addEventListener("click", openChat);
  $("#chat-close").addEventListener("click", closeChat);
  $("#chat-clear").addEventListener("click", function () {
    chatHistory = [];
    sessionStorage.removeItem("voltix_chat");
    $("#chat-body").innerHTML = "";
    greetCustomer();
  });
  $("#chat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const text = $("#chat-input").value.trim();
    if (text) { $("#chat-input").value = ""; askChatbot(text); }
  });
  $("#chat-chips").addEventListener("click", function (e) {
    const b = e.target.closest("[data-quick]");
    if (b) askChatbot(b.textContent);
  });

  if (chatHistory.length) chatHistory.forEach(function (m) { drawMessage(m); });
  else greetCustomer();
}

function openChat() {
  $("#chat-panel").hidden = false;
  $("#chat-fab").classList.add("hide");
  setTimeout(function () { $("#chat-input").focus(); }, 50);
  scrollChat();
}
function closeChat() {
  $("#chat-panel").hidden = true;
  $("#chat-fab").classList.remove("hide");
}
function scrollChat() { const b = $("#chat-body"); b.scrollTop = b.scrollHeight; }

function greetCustomer() {
  const user = getCurrentUser();
  addMessage({ who: "bot", text: "Hi" + (user ? " " + user.first : "") + "! I'm Volt, your Voltix assistant. I can help you find products within your budget, track orders, and explain shipping, returns and offers. What do you need?" });
}

/* ----- show messages ----- */
function addMessage(msg) {
  chatHistory.push(msg);
  sessionStorage.setItem("voltix_chat", JSON.stringify(chatHistory.slice(-30)));
  drawMessage(msg);
}

function drawMessage(msg) {
  const div = document.createElement("div");
  div.className = "msg " + msg.who;
  const text = escapeHTML(msg.text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  div.innerHTML = '<div class="bubble">' + text + "</div>";

  if (msg.products && msg.products.length) {
    const list = document.createElement("div");
    list.className = "chat-products";
    list.innerHTML = msg.products.map(function (id) {
      const p = findProduct(id);
      if (!p) return "";
      return '<div class="chat-prod"><a href="' + productLink(p.id) + '"><img src="' + p.images[0] + '" alt=""></a>' +
        '<div><a href="' + productLink(p.id) + '"><b>' + escapeHTML(p.name) + "</b></a><small>" + starText(p.rating) + " " + p.rating.toFixed(1) +
        "</small><span>" + formatPrice(p.price) + "</span></div>" +
        '<button type="button" data-add="' + p.id + '" aria-label="Add to cart">+</button></div>';
    }).join("");
    div.appendChild(list);
  }
  $("#chat-body").appendChild(div);
  scrollChat();
}

function showTyping(on) {
  let t = $("#typing");
  if (on && !t) {
    t = document.createElement("div");
    t.id = "typing";
    t.className = "msg bot";
    t.innerHTML = '<div class="bubble typing"><i></i><i></i><i></i></div>';
    $("#chat-body").appendChild(t);
    scrollChat();
  }
  if (!on && t) t.remove();
}

/* called when the customer sends a message (also used by the footer Help links) */
function askChatbot(text) {
  if (chatBusy) return;
  openChat();
  addMessage({ who: "user", text: text });
  chatBusy = true;
  showTyping(true);
  const reply = getReply(text);
  setTimeout(function () {
    showTyping(false);
    chatBusy = false;
    addMessage({ who: "bot", text: reply.text, products: reply.products });
  }, 600);
}

/* ----- the bot's brain: keywords -> answers ----- */
function getReply(text) {
  const t = text.toLowerCase();
  function has(regex) { return regex.test(t); }

  // order tracking (order ids look like VX12345678)
  const idMatch = text.match(/VX\d{6,}/i);
  if (idMatch || has(/\b(track|where is|order status|my orders?|delivery status)\b/)) {
    const orders = myOrders();
    if (idMatch) {
      const order = getOrders().find(function (o) { return o.id.toLowerCase() === idMatch[0].toLowerCase(); });
      if (!order) return { text: "I couldn't find an order with ID " + idMatch[0].toUpperCase() + ". Please check the ID — it looks like VX12345678." };
      return { text: "Order **" + order.id + "**: " + orderStatus(order) + ".\nPlaced on " + new Date(order.date).toLocaleDateString("en-IN") + ", expected by " + orderEta(order) + ". Total " + formatPrice(order.total) + " (" + order.payment + ")." };
    }
    if (!getCurrentUser()) return { text: "Please log in first so I can look up your orders, or send me your order ID (for example VX12345678)." };
    if (orders.length === 0) return { text: "You haven't placed any orders yet. Once you do, I can track them for you here." };
    return { text: "Your latest orders:\n" + orders.slice(0, 3).map(function (o) { return "• **" + o.id + "** — " + orderStatus(o) + " (by " + orderEta(o) + ")"; }).join("\n") };
  }

  if (has(/\b(hi|hello|hey|namaste|good (morning|evening|afternoon))\b/) && t.length < 25) return { text: "Hello! 👋 Looking for a gadget, or need help with an order?" };
  if (has(/\b(thanks|thank you|thx|great|awesome)\b/) && t.length < 30) return { text: "You're welcome! Anything else I can help with?" };
  if (has(/\b(ship|shipping|delivery|deliver|dispatch)\b/)) {
    return { text: "🚚 Shipping is **free above " + formatPrice(FREE_SHIPPING_ABOVE) + "**, otherwise " + formatPrice(SHIPPING_FEE) + ". Orders placed before 2 PM are dispatched the same day. Delivery takes about 2–3 days in metro cities and 4–6 days elsewhere. Enter your pincode on any product page to see the exact date." };
  }
  if (has(/\b(return|refund|replace|exchange|cancel)\b/)) {
    return { text: "↩️ You get **7 days** for easy returns on unused items in their original packaging. Refunds go back to your original payment method within 5–7 working days after pickup. To cancel before dispatch, contact support with your order ID." };
  }
  if (has(/\b(pay|payment|upi|card|cod|cash on delivery|emi)\b/)) {
    return { text: "💳 We accept UPI, credit/debit cards and Cash on Delivery. Prices include GST and you get a GST invoice with every order." };
  }
  if (has(/\b(offer|offers|promo|coupon|discount|deal|code)\b/)) {
    return { text: "🎁 Active codes:\n• **VOLTIX10** — 10% off\n• **WELCOME500** — ₹500 off above ₹5,000\n• **FREESHIP** — free shipping\nApply them in your cart. See the Flash deals link in the menu for today's discounts." };
  }
  if (has(/\b(warranty|guarantee)\b/)) return { text: "All products carry the brand's official India warranty (usually 1 year). Warranty details are listed on each product page." };
  if (has(/\b(contact|support|human|agent|call|phone|email|complaint)\b/)) {
    return { text: "You can reach our team at **support@voltix.in** or call **1800-123-4567** (10 AM – 7 PM, Mon–Sat)." };
  }
  if (has(/\b(cart|basket)\b/) && has(/\b(what|show|my|total|how much)\b/)) {
    const t2 = getTotals();
    if (t2.cart.length === 0) return { text: "Your cart is empty right now." };
    return { text: "Your cart has " + cartCount() + " item(s):\n" + t2.cart.map(function (i) { return "• " + i.name + " × " + i.qty + " — " + formatPrice(i.price * i.qty); }).join("\n") + "\nTotal: **" + formatPrice(t2.total) + "**." };
  }

  const found = findProductsFor(text);
  if (found) return found;

  return { text: "Sorry, I didn't quite get that. I can help with:\n• Finding products (try \"laptops under ₹60,000\")\n• Tracking an order\n• Shipping, returns, payments and offers\nOr email support@voltix.in for anything else." };
}

/* reads a budget like "under 30000", "below 30k", "under 1 lakh" */
function readBudget(t) {
  function toNumber(n, unit) {
    let v = parseFloat(String(n).replace(/,/g, ""));
    unit = (unit || "").toLowerCase();
    if (unit === "k" || unit === "thousand") v *= 1000;
    else if (unit) v *= 100000;
    return v || 0;
  }
  const unit = "(?:\\s*(k|thousand|lakh|lac|l)\\b)?";
  const money = "\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,.]+)" + unit;
  let max = 0, min = 0, m;
  m = t.match(new RegExp("(?:under|below|less than|within|upto|up to|max|budget(?: of)?|<)" + money, "i"));
  if (m) max = toNumber(m[1], m[2]);
  m = t.match(new RegExp("(?:above|over|more than|at least|min|>)" + money, "i"));
  if (m) min = toNumber(m[1], m[2]);
  return { min: min, max: max };
}

/* suggests products when the customer mentions a category, brand or budget */
function findProductsFor(text) {
  const t = text.toLowerCase();
  const categoryWords = [
    ["smartphones", /phone|mobile|smartphone|iphone|galaxy|android/],
    ["computers", /laptop|macbook|notebook|computer|tablet|ipad/],
    ["audio", /headphone|earphone|earbud|airpod|speaker|audio|sound|music/],
    ["wearables", /watch|band|wearable|fitness/],
    ["gaming", /gaming|game|console|controller|headset/],
    ["accessories", /keyboard|mouse|charger|cable|accessor/]
  ];
  let cat = null;
  categoryWords.forEach(function (c) { if (!cat && c[1].test(t)) cat = c[0]; });

  const budget = readBudget(text);
  let brand = null;
  products.forEach(function (p) { if (!brand && t.indexOf(p.brand.toLowerCase()) !== -1) brand = p.brand; });
  const wantsHelp = /\b(show|find|recommend|suggest|best|cheap|cheapest|budget|buy|looking|need|want|which|top|good)\b/.test(t);

  if (!cat && !brand && !(wantsHelp && (budget.min || budget.max))) return null;

  let list = products.filter(function (p) {
    return (!cat || p.cat === cat) && (!brand || p.brand === brand) &&
      (!budget.max || p.price <= budget.max) && (!budget.min || p.price >= budget.min);
  });
  if (list.length === 0) {
    return { text: "I couldn't find " + (brand || (cat ? categoryName(cat).toLowerCase() : "products")) + (budget.max ? " under " + formatPrice(budget.max) : "") + (budget.min ? " above " + formatPrice(budget.min) : "") + " right now. Try a higher budget or a different category." };
  }
  if (/cheap|lowest|budget/.test(t)) list.sort(function (a, b) { return a.price - b.price; });
  else list.sort(function (a, b) { return b.rating - a.rating; });

  const top = list.slice(0, 4);
  return {
    text: "Here " + (top.length === 1 ? "is the top pick" : "are my top picks") + (cat ? " in " + categoryName(cat) : "") + (brand ? " from " + brand : "") +
      (budget.max ? " under " + formatPrice(budget.max) : "") + (budget.min ? " above " + formatPrice(budget.min) : "") + ":",
    products: top.map(function (p) { return p.id; })
  };
}

// runs after script.js has added the header and footer
document.addEventListener("DOMContentLoaded", buildChat);
