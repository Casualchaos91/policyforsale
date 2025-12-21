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
    $("btnBalance").onclick = () => showOverlay("Balance Test", "Hold phone to chest and stand still.", runBalance);
    $("btnReset").onclick = resetApp;
});

// --- UI Logic ---
function showOverlay(title, text, startFn) {
    const ov = $("overlay");
    $("overlayTitle").textContent = title;
    $("overlayText").textContent = text;
    ov.classList.remove("hidden"); // Show it
    ov.style.display = "flex";    // Force it
    
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

// --- Sensor Logic (For your Samsung Galaxy) ---
async function enableMotion() {
    try {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            const res = await DeviceMotionEvent.requestPermission();
            if (res !== "granted") return;
        }
        
        window.addEventListener("devicemotion", (e) => {
            motionEnabled = true;
            const a = e.accelerationIncludingGravity;
            if(a) {
                motionSamples.push({x: a.x, y: a.y, z: a.z, t: performance.now()});
                $("motionStatus").textContent = "Motion: Active";
                $("motionStatus").style.color = "#34d399";
            }
        });
    } catch (e) {
        alert("Sensors blocked. Please check Chrome Site Settings.");
    }
}

// --- The Reaction Test Game ---
function runReaction() {
    const duration = 10000; // 10 seconds for testing
    const start = performance.now();
    let trials = [];
    let lastSpawn = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();

        if (now - start > duration) {
            $("results").textContent = "Test Complete! Items caught: " + trials.filter(t => t.hit).length;
            return;
        }

        // Spawn a circle every second
        if (now - lastSpawn > 1000) {
            lastSpawn = now;
            const isGo = Math.random() > 0.3;
            trials.push({t: now, go: isGo, hit: false, x: Math.random() * 800 + 50, y: Math.random() * 400 + 50});
        }

        // Draw circles
        trials.forEach(t => {
            if (!t.hit && now - t.t < 800) {
                ctx.fillStyle = t.go ? "#22c55e" : "#ef4444";
                ctx.beginPath();
                ctx.arc(t.x, t.y, 40, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        requestAnimationFrame(gameLoop);
    }
    
    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        // Simple hit detection logic could go here
    };

    gameLoop();
}

// --- The Balance Test ---
function runBalance() {
    motionSamples = [];
    setTimeout(() => {
        $("results").textContent = "Balance samples collected: " + motionSamples.length;
    }, 5000); // 5 seconds test
}

function resetApp() {
    session = {};
    $("results").textContent = "Data cleared.";
    $("motionStatus").textContent = "Motion: Off";
}
