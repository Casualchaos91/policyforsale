const $ = id => document.getElementById(id);
let canvas, ctx, motionEnabled = false;
let motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    // Wire up buttons
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction Test", "TAP: Green Circles, Green Stars/Squares, and Blue Stars/Squares. IGNORE: Red and Yellow.", runReaction);
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

function drawStar(x, y, r, p, m, color) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0, 0 - r);
    for (let i = 0; i < p; i++) {
        ctx.rotate(Math.PI / p);
        ctx.lineTo(0, 0 - (r * m));
        ctx.rotate(Math.PI / p);
        ctx.lineTo(0, 0 - r);
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function runReaction() {
    const duration = 45000;
    const start = performance.now();
    let objects = [];
    let lastSpawn = 0;
    let score = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();
        let remaining = Math.max(0, ((duration - (now - start)) / 1000).toFixed(1));

        if (now - start > duration) {
            const passed = score >= 15;
            $("results").textContent = `REACTION COMPLETE\nScore: ${score}\nStatus: ${passed ? "PASSED" : "FAILED"}`;
            $("results").style.color = passed ? "#34d399" : "#fb7185";
            canvas.onpointerdown = null; // Clean up touch listener
            return;
        }

        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText(`Time: ${remaining}s  Score: ${score}`, 20, 40);

        if (now - lastSpawn > 800) {
            lastSpawn = now;
            const count = Math.floor(Math.random() * 2) + 1; 
            for(let i=0; i<count; i++) {
                const types = ['circle', 'star', 'square'];
                const colors = ['#22c55e', '#ef4444', '#facc15', '#3b82f6'];
                const type = types[Math.floor(Math.random() * types.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                let isTarget = false;
                if (color === '#22c55e' && type === 'circle') isTarget = true;
                if ((color === '#22c55e' || color === '#3b82f6') && (type === 'star' || type === 'square')) isTarget = true;

                objects.push({
                    t: now, x: Math.random() * (canvas.width - 120) + 60, 
                    y: Math.random() * (canvas.height - 120) + 60,
                    type, color, isTarget, hit: false
                });
            }
        }

        objects.forEach(obj => {
            if (!obj.hit && now - obj.t < 1100) {
                if (obj.type === 'circle') {
                    ctx.fillStyle = obj.color;
                    ctx.beginPath(); ctx.arc(obj.x, obj.y, 45, 0, Math.PI * 2); ctx.fill();
                } else if (obj.type === 'square') {
                    ctx.fillStyle = obj.color;
                    ctx.fillRect(obj.x - 40, obj.y - 40, 80, 80);
                } else {
                    drawStar(obj.x, obj.y, 45, 5, 0.5, obj.color);
                }
            }
        });
        requestAnimationFrame(gameLoop);
    }

    // MOBILE TOUCH FIX: Use onpointerdown for instant response
    canvas.onpointerdown = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        
        // Calculate the scale between CSS size and internal Canvas resolution
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        objects.forEach(obj => {
            const dist = Math.hypot(mx - obj.x, my - obj.y);
            // Increased hit radius to 60 for easier finger tapping
            if (dist < 60 && !obj.hit && (performance.now() - obj.t < 1100)) {
                obj.hit = true;
                if (obj.isTarget) score++; else score--;
            }
        });
    };
    
    gameLoop();
}

function runBalance() {
    motionSamples = [];
    let countdown = 3;
    const cdInterval = setInterval(() => {
        $("results").textContent = `Place phone on chest... ${countdown}`;
        if (countdown-- < 0) { clearInterval(cdInterval); startRecording(); }
    }, 1000);

    function startRecording() {
        motionSamples = [];
        $("results").textContent = "RECORDING... Stand still.";
        setTimeout(() => {
            if (motionSamples.length < 20) { $("results").textContent = "No data. Enable Motion first."; return; }
            const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
            const avg = mags.reduce((a, b) => a + b, 0) / mags.length;
            const variance = mags.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / mags.length;
            const sway = Math.sqrt(variance);
            $("results").textContent = `BALANCE COMPLETE\nSway Score: ${sway.toFixed(4)}\nStatus: ${sway < 0.06 ? "PASS" : "FAIL"}`;
        }, 10000);
    }
}

function resetApp() { $("results").textContent = "Reset."; ctx.clearRect(0,0,canvas.width,canvas.height); }
