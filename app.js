const $ = id => document.getElementById(id);
let canvas, ctx, motionEnabled = false;
let motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction Test", "TAP: Green Circles/Stars/Squares. IGNORE: Red and Yellow.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance Test", "Hold phone to chest and stand still.", runBalance);
    $("btnTrailing").onclick = () => showOverlay("Trailing Track", "Trace the tail! Follow the ball with your finger.", runTrailing);
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

// --- TRAILING TRACK (Shooting Star Version) ---
function runTrailing() {
    const duration = 30000;
    const start = performance.now();
    let ball = { x: 450, y: 270, vx: 5, vy: 5 };
    let trail = []; // Stores previous positions for the "star tail"
    let scoreTotal = 0, samples = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();
        let remaining = Math.max(0, ((duration - (now - start)) / 1000).toFixed(1));

        if (now - start > duration) {
            const accuracy = samples > 0 ? (scoreTotal / samples).toFixed(1) : 0;
            const passed = accuracy >= 30; // 30% passing threshold
            $("results").textContent = `TRAILING COMPLETE\nAccuracy: ${accuracy}%\nStatus: ${passed ? "PASS" : "FAIL"}`;
            $("results").style.color = passed ? "#34d399" : "#fb7185";
            canvas.onpointermove = null;
            return;
        }

        // Move Ball
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 50 || ball.x > canvas.width - 50) ball.vx *= -1;
        if (ball.y < 50 || ball.y > canvas.height - 50) ball.vy *= -1;
        if (Math.random() < 0.02) { ball.vx = (Math.random()-0.5)*12; ball.vy = (Math.random()-0.5)*12; }

        // Update shooting star trail
        trail.push({x: ball.x, y: ball.y});
        if (trail.length > 20) trail.shift(); // Length of the tail

        // Draw the "Shooting Star" tail
        trail.forEach((p, i) => {
            const opacity = i / trail.length;
            const size = (i / trail.length) * 20;
            ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`; // Fading blue
            ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
        });

        // Draw Head of the Star
        ctx.fillStyle = "#22c55e"; // Green head
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 25, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "white"; ctx.font = "24px Arial";
        ctx.fillText(`Accuracy: ${samples > 0 ? (scoreTotal/samples).toFixed(0) : 0}%  Time: ${remaining}s`, 20, 40);
        requestAnimationFrame(gameLoop);
    }

    // Pointer events handle both touch and mouse instantly
    canvas.onpointermove = (e) => {
        e.preventDefault(); // Extra layer of protection against scrolling
        const rect = canvas.getBoundingClientRect();
        const ux = (e.clientX - rect.left) * (canvas.width / rect.width);
        const uy = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        // Check distance to the ball OR any part of the tail
        let bestDist = Math.hypot(ux - ball.x, uy - ball.y);
        trail.forEach(p => {
            const d = Math.hypot(ux - p.x, uy - p.y);
            if (d < bestDist) bestDist = d;
        });

        scoreTotal += Math.max(0, 100 - (bestDist * 2));
        samples++;
    };
    gameLoop();
}

function resetApp() { $("results").textContent = "Reset."; ctx.clearRect(0,0,canvas.width,canvas.height); }
// ... (Include your existing runReaction and runBalance functions)
