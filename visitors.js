// ============================================
// Visitor Log Page — Script
// ============================================

const API_URL = "http://localhost:3000";

const visitorBody = document.getElementById("visitorBody");
const visitorTable = document.getElementById("visitorTable");
const emptyMsg = document.getElementById("emptyMsg");
const searchInput = document.getElementById("searchInput");
const statTotal = document.getElementById("statTotal");
const statIn = document.getElementById("statIn");
const statOut = document.getElementById("statOut");
const rowCount = document.getElementById("rowCount");
const tableFooter = document.getElementById("tableFooter");
const toastEl = document.getElementById("toast");
const dateFrom = document.getElementById("dateFrom");
const dateTo = document.getElementById("dateTo");
const clearDateBtn = document.getElementById("clearDateBtn");

// Current filter state
let allVisitors = [];
let currentFilter = "all";

// --- Toast notification ---
function showToast(message, type = "success") {
  toastEl.textContent = (type === "success" ? "✓ " : "✕ ") + message;
  toastEl.className = "toast " + type;
  requestAnimationFrame(() => toastEl.classList.add("show"));
  setTimeout(() => toastEl.classList.remove("show"), 3000);
}

// --- Update header stats ---
function updateStats(visitors) {
  statTotal.textContent = visitors.length;
  statIn.textContent = visitors.filter((v) => v.status === "IN").length;
  statOut.textContent = visitors.filter((v) => v.status === "OUT").length;
}

// --- Fetch all visitors ---
async function loadVisitors() {
  try {
    const res = await fetch(`${API_URL}/visitors`);
    allVisitors = await res.json();
    updateStats(allVisitors);
    applyFilters();
  } catch (err) {
    console.error("Failed to load visitors:", err);
  }
}

// --- Get the check-in date from a visitor (supports both ISO and locale string) ---
function getVisitorDate(visitor) {
  // Use ISO date if available (new visitors)
  if (visitor.checkInDate) {
    return new Date(visitor.checkInDate);
  }

  // Fallback: parse locale string like "6/4/2026, 10:53:03 pm"
  // Extract the date part before the comma
  const dateStr = visitor.checkInTime.split(",")[0]; // "6/4/2026"
  if (dateStr) {
    const parts = dateStr.trim().split("/"); // ["6", "4", "2026"]
    if (parts.length === 3) {
      // Month/Day/Year format
      return new Date(parts[2], parts[0] - 1, parts[1]);
    }
  }

  return new Date(visitor.checkInTime);
}

// --- Apply search + status + date filters ---
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const fromVal = dateFrom.value; // "YYYY-MM-DD" or ""
  const toVal = dateTo.value;

  let filtered = allVisitors;

  // Status filter
  if (currentFilter !== "all") {
    filtered = filtered.filter((v) => v.status === currentFilter);
  }

  // Search filter
  if (query) {
    filtered = filtered.filter((v) => v.name.toLowerCase().includes(query));
  }

  // Date filter — From
  if (fromVal) {
    const fromDate = new Date(fromVal);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter((v) => {
      const d = getVisitorDate(v);
      return d >= fromDate;
    });
  }

  // Date filter — To
  if (toVal) {
    const toDate = new Date(toVal);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((v) => {
      const d = getVisitorDate(v);
      return d <= toDate;
    });
  }

  renderTable(filtered);
}

// --- Render table rows ---
function renderTable(visitors) {
  visitorBody.innerHTML = "";

  if (visitors.length === 0) {
    visitorTable.style.display = "none";
    tableFooter.style.display = "none";
    emptyMsg.style.display = "block";
    return;
  }

  visitorTable.style.display = "table";
  emptyMsg.style.display = "none";
  tableFooter.style.display = "block";
  rowCount.textContent = visitors.length;

  // Show newest first
  [...visitors].reverse().forEach((v, i) => {
    const tr = document.createElement("tr");
    const badgeClass = v.status === "IN" ? "badge-in" : "badge-out";

    let actionHTML;
    if (v.status === "IN") {
      actionHTML = `<button class="btn btn-checkout" onclick="checkoutVisitor('${v.id}')">Check Out</button>`;
    } else {
      actionHTML = `<button class="btn btn-disabled" disabled>Done</button>`;
    }

    tr.innerHTML = `
      <td class="row-num">${visitors.length - i}</td>
      <td>${v.name}</td>
      <td>${v.phone}</td>
      <td>${v.purpose}</td>
      <td>${v.host}</td>
      <td>${v.checkInTime}</td>
      <td>${v.checkOutTime || "—"}</td>
      <td><span class="badge ${badgeClass}">${v.status}</span></td>
      <td>${actionHTML}</td>
    `;

    visitorBody.appendChild(tr);
  });
}

// --- Handle check-out ---
async function checkoutVisitor(id) {
  if (!confirm("Check out this visitor?")) return;

  try {
    const res = await fetch(`${API_URL}/checkout/${id}`, { method: "POST" });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || "Check-out failed.", "error");
      return;
    }

    const data = await res.json();
    showToast(`${data.visitor.name} checked out successfully!`);
    loadVisitors();
  } catch (err) {
    showToast("Could not connect to server.", "error");
    console.error(err);
  }
}

// --- Search listener ---
searchInput.addEventListener("input", applyFilters);

// --- Date input listeners ---
dateFrom.addEventListener("change", () => {
  clearPresetActive();
  applyFilters();
});

dateTo.addEventListener("change", () => {
  clearPresetActive();
  applyFilters();
});

// --- Clear date filters ---
clearDateBtn.addEventListener("click", () => {
  dateFrom.value = "";
  dateTo.value = "";
  setPresetActive("all");
  applyFilters();
});

// --- Helper: format date to YYYY-MM-DD for input[type=date] ---
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// --- Preset button helpers ---
function clearPresetActive() {
  document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
}

function setPresetActive(range) {
  document.querySelectorAll(".preset-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.range === range);
  });
}

// --- Preset button listeners (Today, This Week, This Month, All Time) ---
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const range = btn.dataset.range;
    const today = new Date();

    setPresetActive(range);

    if (range === "all") {
      dateFrom.value = "";
      dateTo.value = "";
    } else if (range === "today") {
      dateFrom.value = toDateString(today);
      dateTo.value = toDateString(today);
    } else if (range === "week") {
      // Start of current week (Monday)
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1; // adjust so Monday = 0
      const monday = new Date(today);
      monday.setDate(today.getDate() - diff);
      dateFrom.value = toDateString(monday);
      dateTo.value = toDateString(today);
    } else if (range === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      dateFrom.value = toDateString(firstDay);
      dateTo.value = toDateString(today);
    }

    applyFilters();
  });
});

// --- Status filter button listeners ---
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    applyFilters();
  });
});

// --- Admin: Clear all data ---
document.getElementById("clearDataBtn").addEventListener("click", async () => {
  const password = document.getElementById("adminPassword").value.trim();

  if (!password) {
    showToast("Please enter the admin password.", "error");
    return;
  }

  if (!confirm("Are you sure? This will delete ALL visitor records permanently.")) return;

  try {
    const res = await fetch(`${API_URL}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to clear data.", "error");
      return;
    }

    document.getElementById("adminPassword").value = "";
    showToast("All visitor data cleared!");
    loadVisitors();
  } catch (err) {
    showToast("Could not connect to server.", "error");
    console.error(err);
  }
});

// --- Init ---
loadVisitors();
