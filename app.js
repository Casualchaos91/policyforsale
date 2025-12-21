const $ = id => document.getElementById(id);
let canvas, ctx, motionEnabled = false;
let session = {};
let motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction Test", "Tap GREEN circles. Ignore RED squares.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance Test", "Hold phone to chest and stand still. Test starts in 3 seconds.", runBalance);
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
    $("overlayCancel").onclick = () => {
        ov.style.display = "none";
        ov.classList.add("hidden");
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

function runReaction() {
    const duration = 20000;
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
            $("results").textContent = `REACTION COMPLETE\nPoints: ${score}\nAvg Speed: ${avgRT}ms`;
            return;
        }

        if (now - lastSpawn > 1000) {
            lastSpawn = now;
            const isGo = Math.random() > 0.3;
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
        requestAnimationFrame(gameLoop);
    }

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        trials.forEach(t => {
            const dist = Math.hypot(mouseX - t.x, mouseY - t.y);
            if (dist < 50 && !t.hit) { 
                t.hit = true;
                t.rt = performance.now() - t.t;
                if (t.go) score++; else score--; 
            }
        });
    };
    gameLoop();
}

// --- FIXED BALANCE / SWAY ---
function runBalance() {
    motionSamples = []; // Clear old data
    let countdown = 3;
    
    const cdInterval = setInterval(() => {
        $("results").textContent = `Get ready... ${countdown}`;
        countdown--;
        if (countdown < 0) {
            clearInterval(cdInterval);
            startRecording();
        }
    }, 1000);

    function startRecording() {
        motionSamples = []; // Start fresh after countdown
        $("results").textContent = "RECORDING... Stand still for 10 seconds.";
        
        setTimeout(() => {
            if (motionSamples.length < 20) {
                $("results").textContent = "ERROR: No motion data. Enable sensors first!";
                return;
            }

            // Math: Calculate the "Root Mean Square Error" (Wobble)
            const magnitudes = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
            const avg = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
            const variance = magnitudes.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / magnitudes.length;
            const swayScore = Math.sqrt(variance);

            $("results").textContent = `BALANCE COMPLETE\n----------------\nSway Score: ${swayScore.toFixed(4)}\nSamples: ${motionSamples.length}\nNote: Under 0.05 is steady.`;
        }, 10000); // 10 second recording
    }
}

function resetApp() {
    $("results").textContent = "Data cleared.";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
