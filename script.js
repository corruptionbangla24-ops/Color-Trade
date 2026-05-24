const socket = io();
let mode = 30, base = 10, qty = 1, mult = 1, selectedType = "";

const urlParams = new URLSearchParams(window.location.search);
const urlUserId = urlParams.get('userId') || urlParams.get('id') || urlParams.get('username') || "guest_user";
const urlWallet = urlParams.get('wallet') || "main";

// ⏳ টাইমার ও পিরিয়ড সিঙ্ক লক
socket.on("wingoUpdate", (data) => {
    if (data && data[mode]) {
        const currentModeData = data[mode];
        document.getElementById('p-num').innerText = currentModeData.period;
        let min = Math.floor(currentModeData.timeLeft / 60);
        let sec = currentModeData.timeLeft % 60;
        document.getElementById('timer').innerText = String(min).padStart(2, '0') + ":" + String(sec).padStart(2, '0');
        
        const confirmBtn = document.querySelector('.confirm-btn');
        if (currentModeData.timeLeft <= 5) {
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerText = "Locked";
                confirmBtn.style.background = "#aaa";
            }
        } else {
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Confirm ৳" + (base * qty * mult).toFixed(2);
                confirmBtn.style.background = "var(--green)";
            }
        }
    }
});

// 🏆 রেজাল্ট হিস্টোরি টেবিল সিঙ্ক
socket.on("wingoResult", (data) => {
    if (data && data.mode === mode) {
        let sizeColor = data.size === "Big" ? "color:#ffa000;" : "color:#40c4ff;";
        let clrColor = data.color === "Green" ? "color:var(--green);" : (data.color === "Red" ? "color:var(--red);" : "color:var(--violet);");
        let row = "<tr><td>" + data.period + "</td><td>" + data.number + "</td><td style='" + sizeColor + "'>" + data.size + "</td><td style='" + clrColor + "'>" + data.color + "</td></tr>";
        document.getElementById('history').innerHTML = row + document.getElementById('history').innerHTML;
        if (window.parent) window.parent.postMessage({ action: "refresh_wallet" }, "*");
    }
});

// 🔘 বাটন ফাংশনসমূহ (পপআপ ও ক্যালকুলেশন)
function openPop(n) {
    selectedType = n;
    document.getElementById('sel').innerText = n;
    document.getElementById('m-mode-txt').innerText = mode + "s";
    document.getElementById('over').style.display = 'block';
    document.getElementById('nodal').style.display = 'block';
    qty = 1;
    updateUI();
}

function closePop() {
    document.getElementById('over').style.display = 'none';
    document.getElementById('nodal').style.display = 'none';
}

function setBase(v, el) {
    base = v;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    updateUI();
}

function setMultiplier(v, el) {
    mult = v;
    document.querySelectorAll('.m-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    updateUI();
}

// ➕ কোয়ান্টিটি চেঞ্জার ➖
function chgQ(v) {
    qty = Math.max(1, qty + v);
    updateUI();
}

function updateUI() {
    document.getElementById('qtyVal').innerText = qty;
    document.getElementById('tot').innerText = (base * qty * mult).toFixed(2);
}

function switchMode(s, el) {
    mode = s;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    document.getElementById('history').innerHTML = "";
}

// 🚀 ব্যালেন্স কাটার বাজি বাটন
async function confirmBet() {
    const totalAmount = base * qty * mult;
    if (!urlUserId || totalAmount <= 0) return;
    try {
        const response = await fetch('/api/wingo-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: urlUserId,
                amount: totalAmount,
                wallet: urlWallet,
                selection: selectedType,
                mode: mode,
                period: document.getElementById('p-num').innerText
            })
        });
        const result = await response.json();
        if (result.success) {
            alert("🎯 Bet Placed Successfully!");
            if (window.parent) window.parent.postMessage({ action: "refresh_wallet" }, "*");
            closePop();
        } else {
            alert(result.message || "Bet Declined!");
        }
    } catch (error) {
        console.error("WinGo connection error:", error);
        alert("⚠️ Connection Timeout!");
    }

