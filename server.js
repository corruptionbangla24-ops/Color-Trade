const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 🎰 আপনার ওরিজিনাল মেইন সাইটের ডাটাবেজ ব্যাকএন্ড লিঙ্ক (১০০% একুরেট সিঙ্ক)
const MAIN_SITE_URL = "https://onrender.com"; 

// ⏱️ উইনগো গেমের ডাইনামিক লাইভ স্টেট কন্টেইনার
let wingoStates = {
    30: { period: parseInt(new Date().toISOString().slice(0,10).replace(/-/g,'') + "001"), timeLeft: 30 },
    60: { period: parseInt(new Date().toISOString().slice(0,10).replace(/-/g,'') + "101"), timeLeft: 60 },
    180: { period: parseInt(new Date().toISOString().slice(0,10).replace(/-/g,'') + "301"), timeLeft: 180 },
    300: { period: parseInt(new Date().toISOString().slice(0,10).replace(/-/g,'') + "501"), timeLeft: 300 }
};

// ⏳ গ্লোবাল রিয়েল-টাইমে কাউন্টডাউন এবং অটো-রেজাল্ট ফ্ল্যাশ লুপ
setInterval(() => {
    Object.keys(wingoStates).forEach(mode => {
        wingoStates[mode].timeLeft--;
        
        // কাউন্টডাউন শেষ হলে নতুন রেজাল্ট জেনারেট প্রোটোকল
        if (wingoStates[mode].timeLeft <= 0) {
            wingoStates[mode].timeLeft = parseInt(mode);
            
            // ০ থেকে ৯ পর্যন্ত ১০০% একুরেট ক্যাসিনো র্যান্ডম নাম্বার মেকার
            const finalNumber = Math.floor(Math.random() * 10);
            let finalSize = (finalNumber >= 5) ? "Big" : "Small";
            
            // অফিশিয়াল কালার ট্র্যাকার রুলস সিঙ্ক
            let finalColor = "Green";
            if ([2, 4, 6, 8].includes(finalNumber)) finalColor = "Red";
            if ([0, 5].includes(finalNumber)) finalColor = "Violet";

            // সকেটের মাধ্যমে লাইভ উইন-লস রেজাল্ট সব ইউজারের স্ক্রিনে একসাথে পাঠানো হলো
            io.emit("wingoResult", {
                mode: parseInt(mode),
                period: wingoStates[mode].period,
                number: finalNumber,
                size: finalSize,
                color: finalColor
            });

            wingoStates[mode].period++;
        }
    });
    
    // প্রতি সেকেন্ডে সব লাইভ ব্রাউজারে ঘড়ির কাঁটা নিখুঁত সিঙ্ক করা হচ্ছে
    io.emit("wingoUpdate", wingoStates);
}, 1000);

// 🛫 উইনগো রিয়েল ব্যালেন্স কাটার এক্সপ্রেস এপিআই রাউট (আপনার অরিজিনাল মেইন সাইটের userId প্যারামিটার সিঙ্ক)
app.post('/api/wingo-bet', async (req, res) => {
    const { userId, amount, wallet, selection, mode, period } = req.body;

    // শেষ ৫ সেকেন্ডে বাজি ধরা কড়া নিয়মে লকড (লেট-বেট প্রোটেকশন)
    if (wingoStates[mode] && wingoStates[mode].timeLeft <= 5) {
        return res.json({ success: false, message: "⚠️ Round locked! Wait for next round." });
    }

    try {
        // 🎲 [ওরিজিনাল ডাটাবেজ ব্যালেন্স রুট]: এটি সরাসরি আপনার পিএইচপি গেটওয়েতে হিট করে ওয়ালেট থেকে টাকা কাটবে
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', { 
            action: "bet", 
            username: userId, 
            amount: parseFloat(amount), 
            wallet: wallet,
            game: "wingo",
            period: period,
            selection: selection
        });

        if (response.data && response.data.status === "ok") {
            // বাজি সফল হলে সকেটের মাধ্যমে ব্যালেন্স লাইভ রিফ্রেশ পাঠানো হচ্ছে
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            res.json({ success: true, balance: response.data.balance });
        } else { 
            res.json({ success: false, message: response.data.message || "Declined!" }); 
        }
    } catch (e) { 
        res.json({ success: false, message: "Timeout!" }); 
    }
});

// 🌐 সার্ভার লিসেনিং পোর্ট লক
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`WinGo Mega Engine Running on port ${PORT}`);
});
