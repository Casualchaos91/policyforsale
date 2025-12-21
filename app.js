const $ = id => document.getElementById(id);
let canvas, ctx, motionEnabled = false;
let session = {};
let motionSamples = [];

// This waits for the HTML to finish loading
window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    // Wire up the buttons
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction Test", "Tap GREEN circles. Ignore RED squares.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance Test", "Hold phone to chest and stand still for 10s.", runBalance);
    $("btnReset").onclick = resetApp;
});

// --- UI Logic ---
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

// --- Sensor Logic (For Samsung/Android) ---
async function enableMotion() {
    try {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            const res = await DeviceMotionEvent.requestPermission();
            if (res !== "granted") return;
        }
        
        window.addEventListener("devicemotion", (e) => {
            const a = e.accelerationIncludingGravity;
            if(a) {
                motionSamples.push({x: a.x, y: a.y, z: a.z, t: performance.now()});
                $("motionStatus").textContent = "Motion: Active";
                $("motionStatus").style.color = "#34d399";
            }
        });
    } catch (e) {
        alert("Sensors blocked. Check Chrome Site Settings > Motion Sensors.");
    }
}

// --- The Reaction Test Game ---
function runReaction() {
    const duration = 20000; // 20 seconds
    const start = performance.now();
    let trials = [];
    let lastSpawn = 0;
    let score = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();

        if (now - start > duration) {
            const hits = trials.filter(t => t.hit && t.go);
            const avgRT = hits.length ? (hits.reduce((a, b) => a + b.rt, 0) / hits.length).toFixed(0) : 0;
            
            $("results").textContent = `REACTION COMPLETE\n----------------\nPoints: ${score}\nAvg Speed: ${avgRT}ms\nMissed: ${trials.filter(t => t.go && !t.hit).length}`;
            return;
        }

        if (now - lastSpawn > 1000) {
            lastSpawn = now;
            const isGo = Math.random() > 0.3; // 70% chance for green
            trials.push({t: now, go: isGo, hit: false, x: Math.random() * (canvas.width - 100) + 50, y: Math.random() * (canvas.height - 100) + 50});
        }

        trials.forEach(t => {
            const age = now - t.t;
            if (!t.hit && age < 900) { 
                ctx.fillStyle = t.go ? "#22c55e" : "#ef4444";
                ctx.beginPath();
                ctx.arc(t.x, t.y, 45, 0, Math.PI * 2);
                ctx.fill();
            }
        });
