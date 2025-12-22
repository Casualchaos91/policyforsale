const $ = id => document.getElementById(id);
let canvas, ctx, motionEnabled = false;
let motionSamples = [];

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    // Safety check: only wire up if the buttons exist
    if($("btnPerms")) $("btnPerms").onclick = enableMotion;
    if($("btnReaction")) $("btnReaction").onclick = () => showOverlay("Reaction Test", "TAP: Green Circles/Stars/Squares & Blue Stars/Squares. IGNORE: Red and Yellow.", runReaction);
    if($("btnBalance")) $("btnBalance").onclick = () => showOverlay("Balance Test", "Hold phone to chest and stand still. Starts in 3s.", runBalance);
    if($("btnTrailing")) $("btnTrailing").onclick = () => showOverlay("Trailing Track", "Follow the green ball with your finger!", runTrailing);
    if($("btnReset")) $("btnReset").onclick = resetApp;
    
    console.log("Buttons linked and ready.");
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
    $("overlayCancel").onclick = () => {
        ov.style.display = "none";
        ov.classList.add("hidden");
    };
}

// --- PERMISSIONS ---
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

// --- TRAILING TRACK (New Logic) ---
function runTrailing() {
    const duration = 30000;
    const start = performance.now();
    let ball = { x: 450, y: 270, vx: 5, vy: 5 };
    let scoreTotal = 0, samples = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();
        let remaining = Math.max(0, ((duration - (now - start)) / 1000).toFixed(1));

        if (now - start > duration) {
            const accuracy = samples > 0 ? (scoreTotal / samples).toFixed(1) : 0;
            $("results").textContent = `TRAILING COMPLETE\nAccuracy: ${accuracy}%\nStatus: ${accuracy > 70 ? "PASS" : "FAIL"}`;
            canvas.onpointermove = null;
            return;
        }

        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 50 || ball.x > canvas.width - 50) ball.vx *= -1;
        if (ball.y < 50 || ball.y > canvas.height - 50) ball.vy *= -1;
        if (Math.random() < 0.02) { ball.vx = (Math.random()-0.5)*12; ball.vy = (Math.random()-0.5)*12; }

        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.arc(ball.x, ball.y, 35, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "white"; ctx.font = "24px Arial";
        ctx.fillText(`Accuracy: ${samples > 0 ? (scoreTotal/samples).toFixed(0) : 0}%  Time: ${remaining}s`, 20, 40);
        requestAnimationFrame(gameLoop);
    }

    canvas.onpointermove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const ux = (e.clientX - rect.left) * (canvas.width / rect.width);
        const uy = (e.clientY - rect.top) * (canvas.height / rect.height);
        const dist = Math.hypot(ux - ball.x, uy - ball.y);
        scoreTotal += Math.max(0, 100 - (dist * 1.5));
        samples++;
    };
    gameLoop();
}

// --- (Existing Reaction and Balance logic goes below) ---
function runReaction() { /* ... Insert previous runReaction code here ... */ }
function runBalance() { /* ... Insert previous runBalance code here ... */ }
function resetApp() { $("results").textContent = "Reset."; ctx.clearRect(0,0,canvas.width,canvas.height); }
