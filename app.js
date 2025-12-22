const $ = id => document.getElementById(id);

window.addEventListener('load', () => {
    const canvas = $("canvas");
    const ctx = canvas.getContext("2d");
    const overlay = $("overlay");
    let motionSamples = [];
    let tilt = { x: 0, y: 0 };

    function showOverlay(title, text, startFn) {
        $("overlayTitle").textContent = title;
        $("overlayText").textContent = text;
        overlay.classList.remove("hidden");
        overlay.style.display = "flex"; 
        $("overlayStart").onclick = () => {
            overlay.classList.add("hidden");
            overlay.style.display = "none"; 
            startFn();
        };
    }

    const wire = (id, fn) => { if ($(id)) $(id).onclick = fn; };

    wire("btnPerms", async () => {
        try {
            if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
                await DeviceMotionEvent.requestPermission();
                await DeviceOrientationEvent.requestPermission();
            }
            window.addEventListener("devicemotion", (e) => {
                const a = e.accelerationIncludingGravity;
                if(a) motionSamples.push({x: a.x, y: a.y, z: a.z, t: performance.now()});
            });
            window.addEventListener("deviceorientation", (e) => {
                tilt.y = e.beta; // Forward/Back
                tilt.x = e.gamma; // Left/Right
            });
            $("motionStatus").textContent = "Sensors: Active";
            $("motionStatus").style.color = "#34d399";
        } catch (e) { alert("Sensors blocked. Use HTTPS and enable permissions."); }
    });

    wire("btnReaction", () => showOverlay("Selective Reaction", "Tap GREEN only. Others are -2 points!", runReaction));
    wire("btnPuzzle", () => showOverlay("Numerical Puzzle", "Stack 1-5 in order by color boxes.", runPuzzle));
    wire("btnDog", () => showOverlay("Dog Memory", "Memorize for 8s. Reassemble in 7s.", runDogPuzzle));
    wire("btnTrailing", () => showOverlay("Trailing Track", "Trace the shooting star tail with your finger.", runTrailing));
    wire("btnBalance", () => showOverlay("Balance Test", "Hold phone flat against chest and stand still.", runBalance));
    wire("btnMaze", () => showOverlay("Tilt Maze", "Tilt phone to roll ball to RED hole. Walls reset you!", runMaze));
    wire("btnReset", () => { 
        ctx.clearRect(0,0,canvas.width,canvas.height); 
        $("results").textContent = "Waiting..."; 
        $("results").style.color = "white"; 
    });

    // --- 1. SELECTIVE REACTION (YOUR 120-BALL LOGIC) ---
    function runReaction() {
        const start = performance.now();
        const duration = 50000;
        const totalBalls = 120;
        const spawnInterval = duration / totalBalls;
        let objs = [], lastSpawn = 0, score = 0, spawnedCount = 0;
        let pool = { '#22c55e': 24, '#ef4444': 32, '#facc15': 32, '#3b82f6': 32 };

        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let now = performance.now();
            let elapsed = now - start;
            if (elapsed > duration) { 
                const pass = score >= 15;
                $("results").textContent = pass ? `REACTION: PASS (${score} pts)` : `REACTION FAIL: (${score} pts)`;
                $("results").style.color = pass ? "#34d399" : "#f43f5e";
                return; 
            }
            if (now - lastSpawn > spawnInterval && spawnedCount < totalBalls) {
                lastSpawn = now; spawnedCount++;
                let available = Object.keys(pool).filter(c => pool[c] > 0);
                let color;
                if (elapsed > 30000 && pool['#22c55e'] > 0) color = '#22c55e';
                else color = available[Math.floor(Math.random() * available.length)];
                pool[color]--;
                objs.push({ x: Math.random()*700+100, y: Math.random()*300+120, t: now, color, target: (color==='#22c55e'), clicked: false });
            }
            objs = objs.filter(o => !o.clicked && (now - o.t < 1100));
            objs.forEach(o => { ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(o.x, o.y, 45, 0, Math.PI*2); ctx.fill(); });
            ctx.fillStyle = "white"; ctx.font = "bold 20px Arial";
            ctx.fillText(`Score: ${score} (Target: 15)`, 20, 40);
            ctx.fillText(`Green Left: ${pool['#22c55e']}`, 20, 70);
            requestAnimationFrame(loop);
        }
        canvas.onpointerdown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
            objs.forEach(o => {
                if (Math.hypot(mx-o.x, my-o.y) < 55) {
                    o.clicked = true;
                    if(o.target) score++; else score = Math.max(0, score - 2);
                }
            });
        };
        loop();
    }

    // --- 2. TILT MAZE (7/10 DIFFICULTY) ---
    function runMaze() {
        const start = performance.now();
        const duration = 60000;
        let ball = { x: 40, y: 40, r: 12, vx: 0, vy: 0 };
        const goal = { x: 840, y: 490, r: 25 };
        const walls = [
            [0, 80, 750, 15], [150, 180, 750, 15], [0, 280, 650, 15], 
            [250, 380, 650, 15], [100, 480, 800, 15], [400, 80, 15, 120],
            [600, 180, 15, 120], [200, 280, 15, 120], [750, 380, 15, 120]
        ];
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let now = performance.now(), elapsed = now - start;
            let rem = Math.max(0, ((duration - elapsed)/1000).toFixed(1));
            if (elapsed > duration) { $("results").textContent = "MAZE FAIL: TIME"; $("results").style.color = "#f43f5e"; return; }
            ball.vx += (tilt.x || 0) * 0.08; ball.vy += (tilt.y || 0) * 0.08;
            ball.vx *= 0.92; ball.vy *= 0.92;
            let nX = ball.x + ball.vx, nY = ball.y + ball.vy;
            let hit = false;
            walls.forEach(w => {
                if (nX+ball.r > w[0] && nX-ball.r < w[0]+w[2] && nY+ball.r > w[1] && nY-ball.r < w[1]+w[3]) hit = true;
            });
            if (hit) { ball.x = 40; ball.y = 40; ball.vx = 0; ball.vy = 0; } // 7/10 Difficulty: Wall hit resets to start
            else { ball.x = Math.max(ball.r, Math.min(900-ball.r, nX)); ball.y = Math.max(ball.r, Math.min(540-ball.r, nY)); }
            ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(goal.x, goal.y, goal.r, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#4b5563"; walls.forEach(w => ctx.fillRect(w[0], w[1], w[2], w[3]));
            ctx.fillStyle = "#3b82f6"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
            if (Math.hypot(ball.x - goal.x, ball.y - goal.y) < goal.r) {
                $("results").textContent = `MAZE PASS: ${rem}s left`; $("results").style.color = "#34d399"; return;
            }
            ctx.fillStyle = "white"; ctx.font = "20px Arial"; ctx.fillText(`Time: ${rem}s`, 20, 30);
            requestAnimationFrame(loop);
        }
        loop();
    }

    // --- 3. NUMERICAL SQUARE PUZZLE ---
    function runPuzzle() {
        const duration = 35000; const start = performance.now();
        let pieces = [], selected = null; const w = 96, h = 96;
        const zones = { '#22c55e': { x: 80, y: 120, label: "GREEN" }, '#ef4444': { x: 280, y: 120, label: "RED" }, '#facc15': { x: 480, y: 120, label: "YELLOW" } };
        ['#22c55e','#ef4444','#facc15'].forEach((color) => {
            for(let i=0; i<5; i++) pieces.push({ color, num: i+1, tx: zones[color].x, ty: zones[color].y+(i*48), locked: false });
        });
        pieces = pieces.sort(() => Math.random() - 0.5);
        pieces.forEach((p, idx) => { p.x = 750; p.y = 30 + (idx * 30); });
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let rem = Math.max(0, ((duration - (performance.now()-start))/1000).toFixed(1));
            if (rem <= 0 || pieces.every(p=>p.locked)) {
                const pass = pieces.every(p=>p.locked); $("results").textContent = pass ? "SQUARE PUZZLE: PASS" : "PUZZLE FAIL";
                $("results").style.color = pass ? "#34d399" : "#f43f5e"; return;
            }
            Object.keys(zones).forEach(key => {
                const z = zones[key]; ctx.strokeStyle = key; ctx.lineWidth = 2; ctx.setLineDash([5,5]);
                ctx.strokeRect(z.x-5, z.y-5, w+10, (5*48)+55); ctx.setLineDash([]);
                ctx.fillStyle = key; ctx.font = "bold 16px Arial"; ctx.textAlign="center"; ctx.fillText(z.label, z.x+w/2, z.y-15);
            });
            pieces.slice().sort((a,b)=>a.locked-b.locked).forEach(p => {
                ctx.fillStyle = p.color; ctx.globalAlpha = p.locked ? 1.0 : 0.8;
                ctx.fillRect(p.x, p.y, w, h); ctx.strokeStyle = "white"; ctx.strokeRect(p.x, p.y, w, h);
                ctx.fillStyle = "black"; ctx.font = "bold 28px Arial"; ctx.textAlign="center"; ctx.fillText(p.num, p.x+w/2, p.y+h/2+10);
            });
            ctx.globalAlpha = 1.0; ctx.fillStyle = "white"; ctx.textAlign="left"; ctx.fillText(`Time: ${rem}s`, 20, 30);
            requestAnimationFrame(loop);
        }
        canvas.onpointerdown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
            selected = pieces.findLast(p => !p.locked && mx > p.x && mx < p.x+w && my > p.y && my < p.y+h);
        };
        canvas.onpointermove = (e) => {
            if(selected) { const rect = canvas.getBoundingClientRect(); selected.x = (e.clientX-rect.left)*(900/rect.width)-w/2; selected.y = (e.clientY-rect.top)*(540/rect.height)-h/2; }
        };
        canvas.onpointerup = () => {
            if (selected && Math.abs(selected.x-selected.tx)<95 && Math.abs(selected.y-selected.ty)<95) { selected.x=selected.tx; selected.y=selected.ty; selected.locked=true; }
            selected = null;
        };
        loop();
    }

    // --- 4. DOG MEMORY PUZZLE ---
    function drawDogPart(x, y, part, color = "white") {
        ctx.fillStyle = color; ctx.beginPath();
        if (part === "body") { ctx.ellipse(x, y, 100, 60, 0, 0, Math.PI * 2); ctx.ellipse(x - 80, y - 40, 40, 50, 0, 0, Math.PI * 2); }
        else if (part === "ear") { ctx.moveTo(x, y); ctx.lineTo(x + 15, y - 40); ctx.lineTo(x + 30, y); }
        else if (part === "tail") { ctx.moveTo(x,y); ctx.quadraticCurveTo(x + 40, y - 60, x + 80, y - 20); ctx.lineWidth = 15; ctx.strokeStyle = color; ctx.stroke(); return; }
        else if (part === "leg") { ctx.fillRect(x, y, 20, 50); }
        ctx.fill();
    }
    function runDogPuzzle() {
        const memTime = 8000, runTime = 7000, start = performance.now();
        let isMemorizing = true, playStart = 0;
        let pieces = [{ type: "ear", x: 700, y: 150, tx: 345, ty: 195, locked: false }, { type: "tail", x: 700, y: 250, tx: 530, ty: 270, locked: false }, { type: "leg", x: 700, y: 350, tx: 400, ty: 330, locked: false }, { type: "leg", x: 780, y: 350, tx: 480, ty: 330, locked: false }];
        let selected = null;
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height); let now = performance.now();
            if (isMemorizing) {
                ctx.fillStyle="white"; ctx.font="24px Arial"; ctx.fillText(`Memorize! ${(8-(now-start)/1000).toFixed(1)}s`, 50, 50);
                drawDogPart(450, 270, "body"); drawDogPart(345, 195, "ear"); drawDogPart(530, 270, "tail"); drawDogPart(400, 330, "leg"); drawDogPart(480, 330, "leg");
                if (now-start > memTime) { isMemorizing = false; playStart = now; }
            } else {
                let rem = Math.max(0, ((runTime - (now-playStart))/1000).toFixed(1));
                if (rem <= 0 || pieces.every(p => p.locked)) {
                    const pass = pieces.every(p => p.locked); $("results").textContent = pass ? "DOG PASS" : "MEMORY FAIL";
                    $("results").style.color = pass ? "#34d399" : "#f43f5e"; return;
                }
                ctx.fillStyle="white"; ctx.font="24px Arial"; ctx.fillText(`Assemble! ${rem}s`, 50, 50);
                drawDogPart(450, 270, "body", "#222"); pieces.forEach(p => drawDogPart(p.x, p.y, p.type, p.locked ? "white" : "#7dd3fc"));
            }
            requestAnimationFrame(loop);
        }
        canvas.onpointerdown = (e) => {
            if(isMemorizing) return; const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
            selected = pieces.findLast(p => !p.locked && Math.hypot(mx-p.x, my-p.y) < 60);
        };
        canvas.onpointermove = (e) => { if(selected) { const rect = canvas.getBoundingClientRect(); selected.x = (e.clientX-rect.left)*(900/rect.width); selected.y = (e.clientY-rect.top)*(540/rect.height); } };
        canvas.onpointerup = () => { if (selected && Math.hypot(selected.x - selected.tx, selected.y - selected.ty) < 95) { selected.x = selected.tx; selected.y = selected.ty; selected.locked = true; } selected = null; };
        loop();
    }

    // --- 5. TRAILING TRACK ---
    function runTrailing() {
        const start = performance.now();
        let ball = {x:450, y:270, vx:4.16, vy:4.16}, trail = [], scoreSum = 0, samples = 0;
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height); let now = performance.now();
            if (now-start > 45000) {
                const acc = (scoreSum/samples || 0).toFixed(1); const pass = acc >= 25;
                $("results").textContent = pass ? `TRAILING: PASS (${acc}%)` : `TRACKING FAIL (${acc}%)`;
                $("results").style.color = pass ? "#34d399" : "#f43f5e"; return;
            }
            ball.x += ball.vx; ball.y += ball.vy;
            if (ball.x < 50 || ball.x > 850) ball.vx *= -1; if (ball.y < 50 || ball.y > 490) ball.vy *= -1;
            trail.push({x: ball.x, y: ball.y}); if(trail.length > 40) trail.shift();
            trail.forEach((p,i) => { ctx.fillStyle = `rgba(59,130,246,${i/40})`; ctx.beginPath(); ctx.arc(p.x, p.y, (i/40)*30, 0, Math.PI*2); ctx.fill(); });
            ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(ball.x, ball.y, 25, 0, Math.PI*2); ctx.fill();
            requestAnimationFrame(loop);
        }
        canvas.onpointermove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const ux = (e.clientX-rect.left)*(900/rect.width), uy = (e.clientY-rect.top)*(540/rect.height);
            scoreSum += Math.max(0, 100 - (Math.hypot(ux-ball.x, uy-ball.y)*0.8)); samples++;
        };
        loop();
    }

    // --- 6. BALANCE ---
    function runBalance() {
        $("results").textContent = "Recording in 3s...";
        setTimeout(() => {
            motionSamples = []; $("results").textContent = "Recording...";
            setTimeout(() => {
                const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
                const avg = mags.length ? mags.reduce((a,b)=>a+b,0)/mags.length : 0;
                const sway = mags.length ? Math.sqrt(mags.reduce((a,b)=>a+Math.pow(b-avg,2),0)/mags.length) : 0;
                const pass = sway < 0.08;
                $("results").textContent = pass ? `SWAY PASS (${sway.toFixed(4)})` : `BALANCE FAIL (${sway.toFixed(4)})`;
                $("results").style.color = pass ? "#34d399" : "#f43f5e";
            }, 10000);
        }, 3000);
    }
});
