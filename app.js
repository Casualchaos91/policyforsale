const $ = id => document.getElementById(id);
let canvas, ctx, motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction", "Tap Green/Blue items. Ignore Red/Yellow.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance", "Hold phone to chest, stand still.", runBalance);
    $("btnTrailing").onclick = () => showOverlay("Trailing", "Trace the shooting star tail.", runTrailing);
    $("btnPuzzle").onclick = () => showOverlay("Numerical Puzzle", "Stack 1-5 in order for Green, Red, and Yellow. Ignore Blue.", runPuzzle);
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

// --- NUMERICAL CATEGORY PUZZLE (35s Limit) ---
function runPuzzle() {
    const duration = 35000; 
    const start = performance.now();
    let pieces = [];
    let selected = null;
    const w = 92, h = 92; // 15% larger than 80px

    const zones = {
        '#22c55e': { x: 100, y: 150 }, 
        '#ef4444': { x: 350, y: 150 }, 
        '#facc15': { x: 600, y: 150 }  
    };

    const colors = ['#22c55e', '#ef4444', '#facc15'];
    colors.forEach(color => {
        for(let i=0; i<5; i++) {
            pieces.push({
                color: color,
                num: i + 1,
                // Spawning more evenly in a side-bar area
                x: 800, 
                y: 50 + (pieces.length * 25),
                targetX: zones[color].x,
                targetY: zones[color].y + (i * 40), 
                locked: false,
                isBlue: false
            });
        }
    });

    for(let i=0; i<3; i++) {
        pieces.push({ color: '#3b82f6', num: 'X', x: 800, y: 450 + (i*30), locked: false, isBlue: true });
    }

    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        let rem = Math.max(0, ((duration - (now-start))/1000).toFixed(1));

        if (now-start > duration || pieces.filter(p=>!p.isBlue).every(p=>p.locked)) {
            const win = pieces.filter(p=>!p.isBlue).every(p=>p.locked);
            $("results").textContent = `PUZZLE: ${win ? "PASS" : "FAIL"}\nTime: ${rem}s`;
            $("results").style.color = win ? "#34d399" : "#fb7185";
            canvas.onpointerdown = null; return;
        }

        // Draw Target Zone Foundations
        ctx.lineWidth = 2;
        Object.keys(zones).forEach(z => {
            ctx.strokeStyle = z;
            ctx.strokeRect(zones[z].x - 5, zones[z].y - 5, w + 10, (5 * 40) + h - 30);
        });

        pieces.sort((a,b) => a.locked - b.locked).forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.locked ? 1.0 : 0.8;
            ctx.fillRect(p.x, p.y, w, h);
            ctx.strokeStyle = "white";
            ctx.strokeRect(p.x, p.y, w, h);
            
            // Draw Numbers
            ctx.fillStyle = "black";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText(p.num, p.x + w/2, p.y + h/2 + 8);
        });

        ctx.globalAlpha = 1.0; ctx.textAlign = "left"; ctx.fillStyle = "white";
        ctx.fillText(`Time: ${rem}s  Order: 1 at Top -> 5 at Bottom`, 20, 30);
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
            // Increased Snap to 90px
            if (Math.abs(selected.x - selected.targetX) < 90 && Math.abs(selected.y - selected.targetY) < 90) {
                selected.x = selected.targetX; selected.y = selected.targetY; selected.locked = true;
            }
        }
        selected = null;
    };
    loop();
}

// --- TRAILING TRACK (25% Threshold) ---
function runTrailing() {
    const duration = 45000;
    const start = performance.now();
    let ball = { x: 450, y: 270, vx: 4, vy: 4 }, trail = [], scoreSum = 0, samples = 0;

    function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let now = performance.now();
        if (now-start > duration) {
            const finalAcc = Math.min(100, (scoreSum / samples || 0)).toFixed(1);
            const passed = finalAcc >= 25; // RAISED TO 25%
            $("results").textContent = `TRAILING: ${finalAcc}% - ${passed ? "PASS" : "FAIL"}`;
            $("results").style.color = passed ? "#34d399" : "#fb7185";
            canvas.onpointermove = null; return;
        }
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 50 || ball.x > 850) ball.vx *= -1;
        if (ball.y < 50 || ball.y > 490) ball.vy *= -1;

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
        const dist = Math.hypot(ux-ball.x, uy-ball.y);
        scoreSum += Math.max(0, 100 - (dist * 0.8)); samples++;
    };
    loop();
}

// --- REACTION & BALANCE ---
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
