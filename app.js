const $ = id => document.getElementById(id);
let canvas, ctx, motionEnabled = false;
let motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction Test", "TAP: Green Circles/Stars/Squares & Blue Stars/Squares. IGNORE: Red and Yellow.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance Test", "Hold phone to chest and stand still. Starts in 3s.", runBalance);
    $("btnTrailing").onclick = () => showOverlay("Trailing Track", "Trace the shooting star! Follow the tail with your finger.", runTrailing);
    $("btnReset").onclick = resetApp;
});

function showOverlay(title, text, startFn) {
    const ov = $("overlay");
    $("overlayTitle").textContent = title;
    $("overlayText").textContent = text;
    ov.classList.remove("hidden");
    ov.style.display = "flex";
    $("overlayStart").onclick = () => {
        ov.style.display = "none";
        ov.classList.add("hidden");
        startFn();
    };
}

async function enableMotion() {
    try {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            const res = await DeviceMotionEvent.requestPermission();
            if (res !== "granted") return;
        }
        window.addEventListener("devicemotion", (e) => {
            const a = e.accelerationIncludingGravity;
            if(a) motionSamples.push({x: a.x, y: a.y, z: a.z, t: performance.now()});
        });
        $("motionStatus").textContent = "Motion: Active";
        $("motionStatus").style.color = "#34d399";
    } catch (e) { alert("Sensors blocked."); }
}

// --- SHOOTING STAR TRAILING TRACK ---
function runTrailing() {
    const duration = 45000; // Increased to 45s to match reaction test
    const start = performance.now();
    let ball = { x: 450, y: 270, vx: 4, vy: 4 }; // Slightly slowed for fairness
    let trail = []; 
    let scoreTotal = 0, samples = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();
        let remaining = Math.max(0, ((duration - (now - start)) / 1000).toFixed(1));

        if (now - start > duration) {
            const accuracy = samples > 0 ? (scoreTotal / samples).toFixed(1) : 0;
            const passed = accuracy >= 25; // UPDATED PASSING THRESHOLD
            $("results").textContent = `TRAILING COMPLETE\nAccuracy: ${accuracy}%\nStatus: ${passed ? "PASS" : "FAIL"}\n(Req: 25%)`;
            $("results").style.color = passed ? "#34d399" : "#fb7185";
            canvas.onpointermove = null;
            return;
        }

        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 50 || ball.x > canvas.width - 50) ball.vx *= -1;
        if (ball.y < 50 || ball.y > canvas.height - 50) ball.vy *= -1;
        
        // Randomize direction occasionally
        if (Math.random() < 0.015) { 
            ball.vx = (Math.random()-0.5)*10; 
            ball.vy = (Math.random()-0.5)*10; 
        }

        // Update trail for the shooting star effect
        trail.push({x: ball.x, y: ball.y});
        if (trail.length > 15) trail.shift();

        // Draw Fading Tail
        trail.forEach((p, i) => {
            const opacity = i / trail.length;
            ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, (i/trail.length)*20, 0, Math.PI*2); ctx.fill();
        });

        // Draw Head
        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 25, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "white"; ctx.font = "20px Arial";
        ctx.fillText(`Accuracy: ${samples > 0 ? (scoreTotal/samples).toFixed(0) : 0}%  Time: ${remaining}s`, 20, 30);
        requestAnimationFrame(gameLoop);
    }

    canvas.onpointermove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const ux = (e.clientX - rect.left) * (canvas.width / rect.width);
        const uy = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        // Distance check for scoring
        const dist = Math.hypot(ux - ball.x, uy - ball.y);
        scoreTotal += Math.max(0, 100 - (dist * 1.8)); // Calibrated for tablet touch
        samples++;
    };
    gameLoop();
}

// --- REACTION TEST ---
function runReaction() {
    const duration = 45000;
    const start = performance.now();
    let objects = [];
    let lastSpawn = 0;
    let score = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();
        if (now - start > duration) {
            const passed = score >= 15;
            $("results").textContent = `REACTION COMPLETE\nScore: ${score}\nStatus: ${passed ? "PASS" : "FAIL"}`;
            $("results").style.color = passed ? "#34d399" : "#fb7185";
            return;
        }
        if (now - lastSpawn > 900) {
            lastSpawn = now;
            const count = Math.floor(Math.random() * 2) + 1;
            for(let i=0; i<count; i++) {
                const colors = ['#22c55e', '#ef4444', '#facc15', '#3b82f6'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                objects.push({t: now, x: Math.random()*800+50, y: Math.random()*440+50, color, hit: false, isTarget: color==='#22c55e'||color==='#3b82f6'});
            }
        }
        objects.forEach(o => {
            if (!o.hit && now - o.t < 1100) {
                ctx.fillStyle = o.color;
                ctx.beginPath(); ctx.arc(o.x, o.y, 40, 0, Math.PI*2); ctx.fill();
            }
        });
        requestAnimationFrame(gameLoop);
    }
    canvas.onpointerdown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        objects.forEach(o => {
            if (!o.hit && Math.hypot(mx - o.x, my - o.y) < 55) {
                o.hit = true;
                if (o.isTarget) score++; else score--;
            }
        });
    };
    gameLoop();
}

// --- BALANCE TEST ---
function runBalance() {
    motionSamples = [];
    let countdown = 3;
    const cd = setInterval(() => {
        $("results").textContent = `Ready in... ${countdown}`;
        if (countdown-- <= 0) { clearInterval(cd); startRec(); }
    }, 1000);
    function startRec() {
        motionSamples = [];
        $("results").textContent = "RECORDING... Stand still.";
        setTimeout(() => {
            if (motionSamples.length < 20) { $("results").textContent = "Error: No data."; return; }
            const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
            const avg = mags.reduce((a,b)=>a+b)/mags.length;
            const sway = Math.sqrt(mags.reduce((a,b)=>a+Math.pow(b-avg,2),0)/mags.length);
            $("results").textContent = `BALANCE COMPLETE\nSway Score: ${sway.toFixed(4)}\nStatus: ${sway < 0.08 ? "PASS" : "FAIL"}`;
        }, 10000);
    }
}

function resetApp() { $("results").textContent = "Reset."; ctx.clearRect(0,0,canvas.width,canvas.height); }
