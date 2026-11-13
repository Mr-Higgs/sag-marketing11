(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");

  const EMAIL = "info@multidasdaughters.com";
  const STORAGE_KEY = "mde-quote";

  // Header shadow on scroll
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile drawer
  const toggle = document.querySelector(".menu-toggle");
  const drawer = document.getElementById("drawer");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer?.setAttribute("aria-hidden", String(!open));
    if (drawer) drawer.inert = !open;
  };
  if (drawer) drawer.inert = true;
  toggle?.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  drawer?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.matchMedia("(min-width: 1025px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  // Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Toast
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);
  let toastTimer;
  const showToast = (html) => {
    toast.innerHTML = html;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };

  // Quote list (persisted locally)
  const readQuote = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
  const writeQuote = (items) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {} renderQuote(); };
  const money = (n) => "$" + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);

  const renderQuote = () => {
    const items = readQuote();
    const count = items.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll(".quote-count").forEach((el) => {
      el.textContent = count > 99 ? "99+" : count;
      el.classList.toggle("has-items", count > 0);
    });
    document.querySelectorAll("[data-add-quote]").forEach((btn) => {
      const inQuote = items.some((i) => i.id === btn.dataset.id);
      btn.classList.toggle("is-added", inQuote);
      btn.querySelector(".label") && (btn.querySelector(".label").textContent = inQuote ? "Added" : "Add to quote");
    });

    const list = document.getElementById("quote-items");
    if (!list) return;
    const empty = document.getElementById("quote-empty");
    const total = document.getElementById("quote-total");
    list.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "quote-item";
      row.innerHTML = `
        <img src="${item.img}" alt="" loading="lazy">
        <div><b>${item.name}</b><small>${money(item.price)} ${item.unit}</small></div>
        <div class="qty" role="group" aria-label="Quantity for ${item.name}">
          <button type="button" data-step="-1" aria-label="Decrease">&minus;</button>
          <input type="number" inputmode="numeric" min="1" value="${item.qty}" aria-label="Quantity">
          <button type="button" data-step="1" aria-label="Increase">+</button>
        </div>
        <button type="button" class="remove" aria-label="Remove ${item.name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>`;
      const update = (qty) => {
        const next = readQuote().map((i) => (i.id === item.id ? { ...i, qty: Math.max(1, Math.min(999, qty || 1)) } : i));
        writeQuote(next);
      };
      row.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => update(item.qty + Number(b.dataset.step))));
      row.querySelector("input").addEventListener("change", (e) => update(parseInt(e.target.value, 10)));
      row.querySelector(".remove").addEventListener("click", () => writeQuote(readQuote().filter((i) => i.id !== item.id)));
      list.appendChild(row);
    });
    if (empty) empty.hidden = items.length > 0;
    if (total) {
      const sum = items.reduce((s, i) => s + i.price * i.qty, 0);
      total.hidden = items.length === 0;
      total.querySelector("span").textContent = money(sum);
    }
  };

  document.querySelectorAll("[data-add-quote]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const items = readQuote();
      const { id, name, price, img, unit } = btn.dataset;
      const existing = items.find((i) => i.id === id);
      if (existing) existing.qty += 1;
      else items.push({ id, name, price: Number(price), img, unit, qty: Number(btn.dataset.qty || 1) });
      writeQuote(items);
      showToast(`Added ${name} <a href="contact.html#quote">View quote</a>`);
    });
  });
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) renderQuote(); });
  renderQuote();

  // Category filters
  const filterBtns = document.querySelectorAll("[data-filter]");
  const products = document.querySelectorAll(".product[data-category]");
  const applyFilter = (cat) => {
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === cat)));
    products.forEach((p) => { p.hidden = cat !== "all" && p.dataset.category !== cat; });
  };
  filterBtns.forEach((b) => b.addEventListener("click", () => {
    applyFilter(b.dataset.filter);
    history.replaceState(null, "", b.dataset.filter === "all" ? location.pathname : "#" + b.dataset.filter);
  }));
  if (filterBtns.length) {
    const hash = location.hash.slice(1);
    if ([...filterBtns].some((b) => b.dataset.filter === hash)) applyFilter(hash);
  }

  // Quote request form -> pre-filled email
  const quoteForm = document.getElementById("quote-form");
  quoteForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!quoteForm.reportValidity()) return;
    const d = Object.fromEntries(new FormData(quoteForm));
    const items = readQuote();
    const lines = [
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      `Email: ${d.email}`,
      `Event date: ${d.date || "TBD"}`,
      `Event type: ${d.type || "-"}`,
      `Guests: ${d.guests || "-"}`,
      `Delivery address / area: ${d.location || "-"}`,
      `Setup & teardown: ${d.setup || "No"}`,
      "",
      "Items:",
      ...(items.length ? items.map((i) => `- ${i.qty} x ${i.name} (${money(i.price)} ${i.unit})`) : ["- Not sure yet, please recommend"]),
      "",
      `Notes: ${d.message || "-"}`,
    ];
    const subject = `Quote request - ${d.date || "event"} - ${d.name}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    const status = document.getElementById("quote-status");
    status?.classList.add("is-visible");
  });

  // Newsletter -> pre-filled email
  document.querySelectorAll("[data-newsletter]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector("input[type=email]").value;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Newsletter signup")}&body=${encodeURIComponent("Please add me to the newsletter: " + email)}`;
      showToast("Thanks! Finish sending the email to subscribe.");
      form.reset();
    });
  });

  // Policy nav active state
  const policyLinks = document.querySelectorAll(".policy-nav a");
  if (policyLinks.length && "IntersectionObserver" in window) {
    const map = new Map([...policyLinks].map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        policyLinks.forEach((a) => a.classList.remove("is-active"));
        const link = map.get(entry.target.id);
        if (link) { link.classList.add("is-active"); link.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    map.forEach((_, id) => { const el = document.getElementById(id); el && spy.observe(el); });
  }
})();
