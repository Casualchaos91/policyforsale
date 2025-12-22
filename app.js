const $ = id => document.getElementById(id);
let canvas, ctx, motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction", "Tap Green/Blue items. Ignore Red/Yellow.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance", "Hold phone to chest, stand still.", runBalance);
    $("btnTrailing").onclick = () => showOverlay("Trailing", "Trace the shooting star tail.", runTrailing);
    $("btnPuzzle").onclick = () => showOverlay("Spatial Puzzle", "Assemble the white square (15 pieces).", runPuzzle);
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

// --- MOTION ---
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

// --- PUZZLE ---
function runPuzzle() {
    const duration = 45000;
    const start = performance.now();
    let pieces = [];
    let selected = null;
    const r=3, c=5, w=150, h=150, offX=75, offY=45;

    for(let i=0; i<15; i++) {
        pieces.push({
            tx: offX + (i % c) * w, ty: offY + Math.floor(i / c) * h,
            x: Math.random()*700, y: Math.random()*400, locked: false
        });
    }

    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        let rem = Math.max(0, ((duration - (now-start))/1000).toFixed(1));

        if (now-start > duration || pieces.every(p=>p.locked)) {
            const win = pieces.every(p=>p.locked);
            $("results").textContent = `PUZZLE: ${win ? "PASS" : "FAIL"}`;
            canvas.onpointerdown = null; return;
        }

        ctx.strokeStyle = "#222"; ctx.strokeRect(offX, offY, c*w, r*h);
        pieces.forEach(p => {
            ctx.fillStyle = p.locked ? "white" : "#ccc";
            ctx.fillRect(p.x, p.y, w-5, h-5);
        });
        ctx.fillStyle = "white"; ctx.fillText(`Time: ${rem}s`, 20, 30);
        requestAnimationFrame(loop);
    }

    canvas.onpointerdown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (900/rect.width);
        const my = (e.clientY - rect.top) * (540/rect.height);
        selected = pieces.findLast(p => !p.locked && mx > p.x && mx < p.x + w && my > p.y && my < p.y + h);
    };
    canvas.onpointermove = (e) => {
        if (!selected) return;
        const rect = canvas.getBoundingClientRect();
        selected.x = (e.clientX - rect.left) * (900/rect.width) - w/2;
        selected.y = (e.clientY - rect.top) * (540/rect.height) - h/2;
    };
    canvas.onpointerup = () => {
        if (selected && Math.hypot(selected.x-selected.tx, selected.y-selected.ty) < 40) {
            selected.x = selected.tx; selected.y = selected.ty; selected.locked = true;
        }
        selected = null;
    };
    loop();
}

// --- TRAILING ---
function runTrailing() {
    const duration = 45000;
    const start = performance.now();
    let ball = { x: 450, y: 270, vx: 4, vy: 4 }, trail = [], score = 0, samples = 0;

    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        if (now-start > duration) {
            const acc = (score/samples || 0).toFixed(1);
            $("results").textContent = `TRAILING: ${acc}% - ${acc >= 25 ? "PASS" : "FAIL"}`;
            canvas.onpointermove = null; return;
        }
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 50 || ball.x > 850) ball.vx *= -1;
        if (ball.y < 50 || ball.y > 490) ball.vy *= -1;
        trail.push({x: ball.x, y: ball.y}); if(trail.length > 20) trail.shift();
        trail.forEach((p,i) => {
            ctx.fillStyle = `rgba(59,130,246,${i/20})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, (i/20)*25, 0, Math.PI*2); ctx.fill();
        });
        ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(ball.x, ball.y, 25, 0, Math.PI*2); ctx.fill();
        requestAnimationFrame(loop);
    }
    canvas.onpointermove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const ux = (e.clientX - rect.left) * (900/rect.width), uy = (e.clientY - rect.top) * (540/rect.height);
        score += Math.max(0, 100 - (Math.hypot(ux-ball.x, uy-ball.y)*2)); samples++;
    };
    loop();
}

// --- REACTION ---
function runReaction() {
    const duration = 45000;
    const start = performance.now();
    let objs = [], last = 0, score = 0;
    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        if (now-start > duration) {
            $("results").textContent = `REACTION: ${score} pts - ${score >= 15 ? "PASS" : "FAIL"}`;
            return;
        }
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

// --- BALANCE ---
function runBalance() {
    motionSamples = [];
    $("results").textContent = "Get ready... 3s";
    setTimeout(() => {
        motionSamples = [];
        $("results").textContent = "Recording...";
        setTimeout(() => {
            const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
            const avg = mags.reduce((a,b)=>a+b,0)/mags.length;
            const sway = Math.sqrt(mags.reduce((a,b)=>a+Math.pow(b-avg,2),0)/mags.length);
            $("results").textContent = `SWAY: ${sway.toFixed(4)} - ${sway < 0.08 ? "PASS" : "FAIL"}`;
        }, 10000);
    }, 3000);
}
