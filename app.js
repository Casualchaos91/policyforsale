const $ = id => document.getElementById(id);
let canvas, ctx, motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction", "Tap Green/Blue items. Ignore Red/Yellow.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance", "Hold phone to chest, stand still.", runBalance);
    $("btnTrailing").onclick = () => showOverlay("Trailing", "Trace the shooting star tail.", runTrailing);
    $("btnPuzzle").onclick = () => showOverlay("Spatial Puzzle", "Group colors: Connect 5 Green, 5 Red, and 5 Yellow. Ignore Blue.", runPuzzle);
    $("btnReset").onclick = () => { ctx.clearRect(0,0,canvas.width,canvas.height); $("results").textContent = "Reset."; };
});

function showOverlay(title, text, startFn) {
    const ov = $("overlay");
    $("overlayTitle").textContent = title;
    $("overlayText").textContent = text;
    ov.classList.remove("hidden");
    ov.style.display = "flex";
    $("overlayStart").onclick = () => { ov.style.display = "none"; startFn(); };
}

// --- MOTION PERMISSIONS ---
async function enableMotion() {
    try {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            await DeviceMotionEvent.requestPermission();
        }
        window.addEventListener("devicemotion", (e) => {
            const a = e.accelerationIncludingGravity;
            if(a) motionSamples.push({x: a.x, y: a.y, z: a.z, t: performance.now()});
        });
        $("motionStatus").textContent = "Motion: Active";
        $("motionStatus").style.color = "#34d399";
    } catch (e) { alert("Motion sensors blocked."); }
}

// --- NEW CATEGORY PUZZLE (18 Pieces) ---
function runPuzzle() {
    const duration = 60000; // Increased to 60s for 18 pieces
    const start = performance.now();
    let pieces = [];
    let selected = null;
    const w = 80, h = 80;

    // Define target zones for each color group
    const zones = {
        '#22c55e': { x: 100, y: 150 }, // Green
        '#ef4444': { x: 350, y: 150 }, // Red
        '#facc15': { x: 600, y: 150 }  // Yellow
    };

    const colors = ['#22c55e', '#ef4444', '#facc15'];
    colors.forEach(color => {
        for(let i=0; i<5; i++) {
            pieces.push({
                color: color,
                x: Math.random() * 700 + 50,
                y: Math.random() * 300 + 100,
                targetX: zones[color].x,
                targetY: zones[color].y + (i * 45), // Vertical stack
                locked: false,
                isBlue: false
            });
        }
    });

    // Add 3 Blue Distractors
    for(let i=0; i<3; i++) {
        pieces.push({ color: '#3b82f6', x: Math.random()*700+50, y: Math.random()*300+100, locked: false, isBlue: true });
    }

    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        let rem = Math.max(0, ((duration - (now-start))/1000).toFixed(1));

        if (now-start > duration || pieces.filter(p=>!p.isBlue).every(p=>p.locked)) {
            const win = pieces.filter(p=>!p.isBlue).every(p=>p.locked);
            $("results").textContent = `PUZZLE: ${win ? "PASS" : "FAIL"}`;
            canvas.onpointerdown = null; return;
        }

        // Draw Target Zones Labels
        ctx.fillStyle = "white"; ctx.font = "16px Arial";
        ctx.fillText("GREEN HERE", 100, 130); ctx.fillText("RED HERE", 350, 130); ctx.fillText("YELLOW HERE", 600, 130);

        pieces.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.locked ? 1.0 : 0.7;
            ctx.fillRect(p.x, p.y, w, h);
            ctx.strokeStyle = "white"; ctx.lineWidth = p.locked ? 3 : 1;
            ctx.strokeRect(p.x, p.y, w, h);
        });
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "white"; ctx.fillText(`Time: ${rem}s  Locked: ${pieces.filter(p=>p.locked).length}/15`, 20, 30);
        requestAnimationFrame(loop);
    }

    canvas.onpointerdown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
        selected = pieces.findLast(p => !p.locked && mx > p.x && mx < p.x+w && my > p.y && my < p.y+h);
    };
    canvas.onpointermove = (e) => {
        if (!selected) return;
        const rect = canvas.getBoundingClientRect();
        selected.x = (e.clientX-rect.left)*(900/rect.width) - w/2;
        selected.y = (e.clientY-rect.top)*(540/rect.height) - h/2;
    };
    canvas.onpointerup = () => {
        if (selected && !selected.isBlue) {
            // Easier snap: 80 pixel radius
            if (Math.abs(selected.x - selected.targetX) < 80 && Math.abs(selected.y - selected.targetY) < 80) {
                selected.x = selected.targetX; selected.y = selected.targetY; selected.locked = true;
            }
        }
        selected = null;
    };
    loop();
}

// --- UPDATED TRAILING TRACK (Longer Tail + Normal Accuracy) ---
function runTrailing() {
    const duration = 45000;
    const start = performance.now();
    let ball = { x: 450, y: 270, vx: 4, vy: 4 }, trail = [], scoreSum = 0, samples = 0;

    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        if (now-start > duration) {
            const finalAcc = Math.min(100, (scoreSum / samples || 0)).toFixed(1);
            const passed = finalAcc >= 20;
            $("results").textContent = `TRAILING: ${finalAcc}% - ${passed ? "PASS" : "FAIL"}\n(Req: 20%)`;
            canvas.onpointermove = null; return;
        }
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 50 || ball.x > 850) ball.vx *= -1;
        if (ball.y < 50 || ball.y > 490) ball.vy *= -1;

        // Longer tail: 40 points instead of 20
        trail.push({x: ball.x, y: ball.y}); if(trail.length > 40) trail.shift();
        
        trail.forEach((p,i) => {
            ctx.fillStyle = `rgba(59,130,246,${i/40})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, (i/40)*30, 0, Math.PI*2); ctx.fill();
        });
        ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(ball.x, ball.y, 25, 0, Math.PI*2); ctx.fill();
        requestAnimationFrame(loop);
    }
    canvas.onpointermove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const ux = (e.clientX-rect.left)*(900/rect.width), uy = (e.clientY-rect.top)*(540/rect.height);
        // Normalized math: Closer to 100% when right on top of the ball
        const dist = Math.hypot(ux-ball.x, uy-ball.y);
        const frameAcc = Math.max(0, 100 - (dist * 0.8)); 
        scoreSum += frameAcc; samples++;
    };
    loop();
}

// --- REACTION & BALANCE (Unchanged) ---
function runReaction() {
    const duration = 45000;
    const start = performance.now();
    let objs = [], last = 0, score = 0;
    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        if (now-start > duration) { $("results").textContent = `REACTION: ${score} pts - ${score >= 15 ? "PASS" : "FAIL"}`; return; }
        if (now - last > 900) {
            last = now;
            const color = ['#22c55e','#ef4444','#facc15','#3b82f6'][Math.floor(Math.random()*4)];
            objs.push({x: Math.random()*800+50, y: Math.random()*440+50, t: now, color, target: color==='#22c55e'||color==='#3b82f6'});
        }
        objs.forEach(o => { if(now-o.t < 1000) { ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(o.x, o.y, 40, 0, Math.PI*2); ctx.fill(); }});
        requestAnimationFrame(loop);
    }
    canvas.onpointerdown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
        objs.forEach(o => { if(Math.hypot(mx-o.x, my-o.y) < 50) { o.t = 0; if(o.target) score++; else score--; }});
    };
    loop();
}

function runBalance() {
    motionSamples = [];
    $("results").textContent = "Get ready... 3s";
    setTimeout(() => {
        motionSamples = [];
        $("results").textContent = "Recording...";
        setTimeout(() => {
            if (motionSamples.length < 5) { $("results").textContent = "Error: No data."; return; }
            const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
            const avg = mags.reduce((a,b)=>a+b,0)/mags.length;
            const sway = Math.sqrt(mags.reduce((a,b)=>a+Math.pow(b-avg,2),0)/mags.length);
            $("results").textContent = `SWAY: ${sway.toFixed(4)} - ${sway < 0.08 ? "PASS" : "FAIL"}`;
        }, 10000);
    }, 3000);
}

function resetApp() { $("results").textContent = "Reset."; ctx.clearRect(0,0,canvas.width,canvas.height); }
