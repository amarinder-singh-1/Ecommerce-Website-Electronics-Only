/* =========================================================
   products.js — all product data for Voltix (hardcoded)
   To add a product: copy one block, give it a new id,
   put its image in the project folder and add the file name
   in "images". Prices are in Indian rupees (₹).
   ========================================================= */

const products = [
  {
    id: "galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra 256GB Titanium Gray",
    brand: "Samsung",
    cat: "smartphones",
    price: 129999,
    old: 0,
    rating: 4.8,
    count: 124,
    stock: 34,
    badge: "NEW",
    images: ["images/5.png", "images/16.png", "images/17.png", "images/18.png"],
    desc: "Samsung's flagship phone pairs a built-in S Pen with Galaxy AI features that reach into photo editing, note-taking and real-time call translation. The 6.8\" Dynamic AMOLED 2X display is brighter and sharper than ever, and the titanium frame stays light without giving up durability.",
    specs: [["Display", '6.8" QHD+ 120Hz'], ["Storage", "256GB"], ["RAM", "12GB"], ["Camera", "200MP quad"], ["Battery", "5000mAh"], ["Color", "Titanium Gray"]],
    reviews: [
      ["Rohit M.", 5, "The camera is unreal in low light and the S Pen is actually useful for notes."],
      ["Neha K.", 5, "Battery easily lasts a full day with heavy use. Display is gorgeous."]
    ]
  },
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    brand: "Sony",
    cat: "audio",
    price: 26990,
    old: 33990,
    rating: 4.9,
    count: 389,
    stock: 52,
    badge: "",
    images: ["images/6.png"],
    desc: "Industry-leading noise cancellation meets all-day comfort. Two processors and eight microphones work together to cancel more ambient noise than ever, while precise voice pickup keeps calls clear in any environment. Up to 30 hours of battery life on a single charge, with quick charging for when you're in a hurry.",
    specs: [["Battery life", "30 hours"], ["Connectivity", "Bluetooth 5.2"], ["Weight", "250g"], ["Noise cancelling", "Adaptive, dual-processor"], ["Color", "Midnight Black"], ["Warranty", "1 year"]],
    reviews: [
      ["Aman S.", 5, "Blocks out the metro noise completely. Very comfortable for long hours."],
      ["Priya D.", 5, "Call quality is excellent and the battery just keeps going."]
    ]
  },
  {
    id: "apple-watch-s9",
    name: "Apple Watch Series 9 GPS 45mm",
    brand: "Apple",
    cat: "wearables",
    price: 44900,
    old: 0,
    rating: 4.7,
    count: 210,
    stock: 27,
    badge: "BESTSELLER",
    images: ["images/7.png"],
    desc: "The most capable Apple Watch yet, built around the new S9 chip that enables on-device Siri requests and a double-tap gesture for hands-free control. The Always-On Retina display gets brighter outdoors, and health tools like blood oxygen and ECG keep you on top of your wellbeing.",
    specs: [["Case size", "45mm"], ["Display", "Always-On Retina"], ["Chip", "Apple S9"], ["Water resistance", "50m"], ["Battery", "Up to 18 hours"], ["Color", "Midnight Aluminum"]],
    reviews: [
      ["Karan V.", 5, "Double tap gesture is a game changer when my hands are full."],
      ["Simran B.", 4, "Great watch, the screen is very bright outdoors."]
    ]
  },
  {
    id: "keychron-q1-pro",
    name: "Keychron Q1 Pro Wireless Mechanical Keyboard",
    brand: "Keychron",
    cat: "accessories",
    price: 14999,
    old: 17999,
    rating: 4.4,
    count: 86,
    stock: 18,
    badge: "",
    images: ["images/8.png"],
    desc: "A gasket-mounted, all-metal mechanical keyboard built for people who type all day. Full QMK/VIA support means every key is programmable, and Bluetooth 5.1 with a 4000mAh battery keeps you cable-free for weeks between charges.",
    specs: [["Layout", "75% (84-key)"], ["Switches", "Hot-swappable"], ["Connectivity", "Bluetooth 5.1 + USB-C"], ["Battery", "4000mAh"], ["Body", "CNC aluminum"], ["Color", "Carbon Black"]],
    reviews: [
      ["Vikas T.", 5, "Typing feel is superb and the build is super solid."],
      ["Ishita R.", 4, "Heavy but worth it. Programming keys with VIA is easy."]
    ]
  },
  {
    id: "macbook-air-m3",
    name: 'Apple MacBook Air 13" M3 8GB/256GB',
    brand: "Apple",
    cat: "computers",
    price: 99900,
    old: 0,
    rating: 4.8,
    count: 302,
    stock: 22,
    badge: "NEW",
    images: ["images/10.png"],
    desc: "The most popular laptop gets even faster with Apple's M3 chip, delivering up to 18 hours of battery life in a fanless design that runs completely silent. The 13.6\" Liquid Retina display and 1080p camera make it just as capable for creative work as it is for everyday tasks.",
    specs: [["Chip", "Apple M3, 8-core CPU"], ["Memory", "8GB unified"], ["Storage", "256GB SSD"], ["Display", '13.6" Liquid Retina'], ["Battery", "Up to 18 hours"], ["Weight", "1.24kg"]],
    reviews: [
      ["Ankit G.", 5, "Perfect for coding and college work. Battery lasts all day."],
      ["Divya P.", 5, "Silent, fast and very light to carry around."]
    ]
  },
  {
    id: "ipad-pro-11",
    name: 'Apple iPad Pro 11" M4 128GB Wi-Fi',
    brand: "Apple",
    cat: "computers",
    price: 89900,
    old: 99900,
    rating: 4.8,
    count: 176,
    stock: 15,
    badge: "",
     images: ["images/13.png"],
    desc: "The thinnest Apple product ever made, powered by the M4 chip and a stunning Ultra Retina XDR display with tandem OLED technology. Pair it with the Apple Pencil Pro and Magic Keyboard to turn it into a full creative and productivity powerhouse.",
    specs: [["Chip", "Apple M4"], ["Display", '11" Ultra Retina XDR'], ["Storage", "128GB"], ["Connectivity", "Wi-Fi 6E"], ["Camera", "12MP Wide + LiDAR"], ["Weight", "444g"]],
    reviews: [
      ["Meera J.", 5, "The display is stunning and drawing with the Pencil feels natural."],
      ["Harsh L.", 4, "Super fast. I wish it came with more base storage."]
    ]
  },
  {
    id: "voltix-pro-15-laptop",
    name: 'Voltix Pro 15 Laptop 15.6" 16GB/512GB',
    brand: "Voltix",
    cat: "computers",
    price: 54999,
    old: 64999,
    rating: 4.3,
    count: 98,
    stock: 31,
    badge: "",
    images: ["images/1.png"],
    desc: "A dependable everyday laptop for students and professionals. The full HD display, fast SSD storage and 16GB of memory keep multitasking smooth, while the slim body and long battery life make it easy to carry from class to home.",
    specs: [["Processor", "Octa-core, 3.8GHz"], ["Memory", "16GB DDR5"], ["Storage", "512GB SSD"], ["Display", '15.6" Full HD IPS'], ["Battery", "Up to 10 hours"], ["Weight", "1.6kg"]],
    reviews: [
      ["Sahil N.", 4, "Great value for the price. Handles coding and Chrome tabs easily."],
      ["Tanya C.", 4, "Good screen and keyboard. Fan gets slightly loud under load."]
    ]
  },
  {
    id: "voltix-studio-headphones",
    name: "Voltix Studio Over-Ear Wireless Headphones",
    brand: "Voltix",
    cat: "audio",
    price: 3999,
    old: 5999,
    rating: 4.2,
    count: 143,
    stock: 64,
    badge: "",
    images: ["images/2.png"],
    desc: "Balanced, punchy sound in a lightweight foldable design. Soft ear cushions make them comfortable for hours, and the built-in microphone keeps calls and online classes clear.",
    specs: [["Battery life", "40 hours"], ["Connectivity", "Bluetooth 5.3"], ["Drivers", "40mm"], ["Weight", "230g"], ["Charging", "USB-C"], ["Color", "Matte Black"]],
    reviews: [
      ["Yash A.", 4, "Bass is strong and the battery is excellent at this price."],
      ["Pooja H.", 4, "Comfortable and sounds great for the money."]
    ]
  },
  {
    id: "voltix-accessory-kit",
    name: "Voltix Everyday Tech Accessory Kit",
    brand: "Voltix",
    cat: "accessories",
    price: 1499,
    old: 0,
    rating: 4.1,
    count: 57,
    stock: 120,
    badge: "",
    images: ["images/3.png"],
    desc: "Everything you need to keep your devices running: a fast-charging cable, a compact charger, a carry pouch and cable organisers. A handy bundle for your desk or travel bag.",
    specs: [["Charger", "20W fast charging"], ["Cable", "1m USB-C braided"], ["Pouch", "Water-resistant"], ["Pieces", "5 in the box"], ["Warranty", "6 months"], ["Color", "Black"]],
    reviews: [
      ["Mohit F.", 4, "Useful bundle, the cable feels sturdy."],
      ["Rhea S.", 4, "Good for travel. Charger works well with my phone."]
    ]
  },
  {
    id: "voltix-nova-5g",
    name: "Voltix Nova 5G 128GB Smartphone",
    brand: "Voltix",
    cat: "smartphones",
    price: 24999,
    old: 29999,
    rating: 4.4,
    count: 211,
    stock: 45,
    badge: "",
    images: ["images/4.png"],
    desc: "A fast 5G phone with a smooth 120Hz AMOLED display, a sharp 50MP camera and a big battery that comfortably lasts a full day. Fast charging gets you back to 100% in under an hour.",
    specs: [["Display", '6.6" AMOLED 120Hz'], ["Storage", "128GB"], ["RAM", "8GB"], ["Camera", "50MP dual"], ["Battery", "5000mAh, 67W"], ["Color", "Midnight Blue"]],
    reviews: [
      ["Aditya K.", 5, "Smooth display and the battery is amazing for this price."],
      ["Nisha W.", 4, "Camera is good in daylight. Overall a great budget pick."]
    ]
  },
  {
    id: "voltix-strike-gaming-headset",
    name: "Voltix Strike RGB Gaming Headset",
    brand: "Voltix",
    cat: "gaming",
    price: 4999,
    old: 6999,
    rating: 4.5,
    count: 164,
    stock: 38,
    badge: "",
    images: ["images/9.png"],
    desc: "Hear every footstep with 7.1 surround sound. The padded headband, detachable noise-cancelling microphone and RGB lighting make it a great partner for long gaming sessions on PC and console.",
    specs: [["Sound", "7.1 virtual surround"], ["Drivers", "50mm"], ["Microphone", "Detachable, noise-cancelling"], ["Connection", "USB + 3.5mm"], ["Lighting", "RGB"], ["Weight", "320g"]],
    reviews: [
      ["Arjun P.", 5, "Positional audio is brilliant in shooters. Mic is clear."],
      ["Kabir D.", 4, "Very comfortable even after long sessions."]
    ]
  }
];

/* Product ids shown in the "Trending right now" section on the home page */
const trendingIds = [
  "galaxy-s24-ultra", "sony-wh1000xm5", "apple-watch-s9", "keychron-q1-pro",
  "macbook-air-m3", "ipad-pro-11", "voltix-nova-5g", "voltix-strike-gaming-headset"
];
