// ============================================
// Visitor Check-In Page — Script
// ============================================

const API_URL = "http://localhost:3000";

const checkinForm = document.getElementById("checkinForm");
const successBox = document.getElementById("successBox");
const successMsg = document.getElementById("successMsg");
const statTotal = document.getElementById("statTotal");
const statIn = document.getElementById("statIn");
const statOut = document.getElementById("statOut");
const toastEl = document.getElementById("toast");

// --- Toast notification ---
function showToast(message, type = "success") {
  toastEl.textContent = (type === "success" ? "✓ " : "✕ ") + message;
  toastEl.className = "toast " + type;
  requestAnimationFrame(() => toastEl.classList.add("show"));
  setTimeout(() => toastEl.classList.remove("show"), 3000);
}

// --- Load stats on page open ---
async function loadStats() {
  try {
    const res = await fetch(`${API_URL}/visitors`);
    const visitors = await res.json();
    statTotal.textContent = visitors.length;
    statIn.textContent = visitors.filter((v) => v.status === "IN").length;
    statOut.textContent = visitors.filter((v) => v.status === "OUT").length;
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

// --- Handle form submission ---
checkinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const visitor = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    purpose: document.getElementById("purpose").value.trim(),
    host: document.getElementById("host").value.trim(),
  };

  try {
    const res = await fetch(`${API_URL}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitor),
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || "Check-in failed.", "error");
      return;
    }

    // Show success state
    checkinForm.style.display = "none";
    successMsg.textContent = `${visitor.name} has been checked in at ${new Date().toLocaleTimeString()}.`;
    successBox.style.display = "block";

    showToast(`${visitor.name} checked in successfully!`);
    loadStats();
  } catch (err) {
    showToast("Could not connect to server. Is the backend running?", "error");
    console.error(err);
  }
});

// --- Reset form to check-in another visitor ---
function resetForm() {
  successBox.style.display = "none";
  checkinForm.style.display = "block";
  checkinForm.reset();
}

// --- Init ---
loadStats();
