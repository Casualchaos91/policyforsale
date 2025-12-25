const $ = id => document.getElementById(id);

window.addEventListener('load', () => {
    const canvas = $("canvas");
    const ctx = canvas.getContext("2d");
    const overlay = $("overlay");
    let motionSamples = [];
    let tilt = { x: 0, y: 0 };
    let memoryWords = ["Apple", "Table", "Penny", "Watch", "Chair"]; // Mini-Cog standard
    let memoryStatus = "not_started"; // not_started, encoded, tested

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
            window.addEventListener("deviceorientation", (e) => {
                tilt.y = e.beta; tilt.x = e.gamma;
            });
            $("motionStatus").textContent = "Sensors: Active";
            $("motionStatus").style.color = "#34d399";
        } catch (e) { alert("Sensors enabled."); }
    });

    // --- 1. MEMORY ENCODING ---
    wire("btnDog", () => {
        showOverlay("Memory Encoding", `Memorize these 5 words. I will ask you for them later: \n\n ${memoryWords.join(" - ")}`, () => {
            memoryStatus = "encoded";
            $("results").textContent = "Words Encoded. Proceed to other tests.";
            $("results").style.color = "#fbbf24";
        });
    });

    // --- 2. REACTION (Inhibition Upgrade) ---
    wire("btnReaction", () => showOverlay("Selective Reaction", "Tap GREEN only. Tapping RED is a major penalty!", runReaction));
    function runReaction() {
        const start = performance.now(); const duration = 40000;
        let objs = [], score = 0, lastSpawn = 0;
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let now = performance.now();
            if (now - start > duration) {
                const pass = score >= 12;
                $("results").textContent = `REACTION: ${pass ? 'PASS':'FAIL'} (${score} pts)`;
                $("results").style.color = pass ? "#34d399":"#f43f5e"; return;
            }
            if (now - lastSpawn > 600) {
                lastSpawn = now;
                let isRed = Math.random() > 0.7;
                objs.push({ x: Math.random()*700+100, y: Math.random()*300+120, t: now, color: isRed?'#ef4444':'#22c55e', target: !isRed });
            }
            objs = objs.filter(o => (now - o.t < 900));
            objs.forEach(o => { ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(o.x, o.y, 45, 0, Math.PI*2); ctx.fill(); });
            requestAnimationFrame(loop);
        }
        canvas.onpointerdown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
            objs.forEach((o, i) => {
                if (Math.hypot(mx-o.x, my-o.y) < 55) {
                    if(o.target) score++; else score -= 5;
                    objs.splice(i, 1);
                }
            });
        };
        loop();
    }

    // --- 3. MAZE (105s Limit) ---
    wire("btnMaze", () => showOverlay("Tilt Maze", "Navigate to RED. 1:45 limit.", runMaze));
    function runMaze() {
        const start = performance.now(); const duration = 105000;
        let ball = { x: 40, y: 40, r: 10, vx: 0, vy: 0 };
        const goal = { x: 850, y: 500, r: 25 };
        const walls = [[0,100,800,15],[100,200,800,15],[0,300,800,15],[100,400,800,15]];
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let rem = Math.max(0, ((duration - (performance.now()-start))/1000).toFixed(1));
            if (rem <= 0) { $("results").textContent = "MAZE FAIL: TIME"; return; }
            ball.vx += (tilt.x || 0) * 0.07; ball.vy += (tilt.y || 0) * 0.07;
            ball.vx *= 0.94; ball.vy *= 0.94;
            let nX = ball.x + ball.vx, nY = ball.y + ball.vy;
            let hit = false;
            walls.forEach(w => { if (nX+ball.r > w[0] && nX-ball.r < w[0]+w[2] && nY+ball.r > w[1] && nY-ball.r < w[1]+w[3]) hit = true; });
            if (hit) { ball.x = 40; ball.y = 40; ball.vx = 0; ball.vy = 0; }
            else { ball.x = Math.max(ball.r, Math.min(900-ball.r, nX)); ball.y = Math.max(ball.r, Math.min(540-ball.r, nY)); }
            ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(goal.x, goal.y, goal.r, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#4b5563"; walls.forEach(w => ctx.fillRect(w[0], w[1], w[2], w[3]));
            ctx.fillStyle = "#3b82f6"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
            if (Math.hypot(ball.x - goal.x, ball.y - goal.y) < goal.r) { $("results").textContent = `MAZE PASS: ${rem}s left`; return; }
            ctx.fillStyle = "white"; ctx.fillText(`${rem}s`, 20, 30); requestAnimationFrame(loop);
        }
        loop();
    }

    // --- 4. TRAILING (Kept Original) ---
    wire("btnTrailing", () => showOverlay("Trailing Track", "Trace the shooting star tail.", runTrailing));
    function runTrailing() {
        const start = performance.now(); let ball = {x:450, y:270, vx:4.2, vy:4.2}, trail = [], scoreSum = 0, samples = 0;
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height); let now = performance.now();
            if (now-start > 45000) { $("results").textContent = `TRAILING: ${(scoreSum/samples || 0).toFixed(1)}%`; return; }
            ball.x += ball.vx; ball.y += ball.vy; if (ball.x < 50 || ball.x > 850) ball.vx *= -1; if (ball.y < 50 || ball.y > 490) ball.vy *= -1;
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

    // --- 5. SWITCH TRAIL (MoCA Part B) ---
    wire("btnPuzzle", () => showOverlay("Switch Trail", "Connect in order: 1 - A - 2 - B - 3 - C...", runSwitchTrail));
    function runSwitchTrail() {
        const start = performance.now(); let currentIndex = 0;
        const sequence = [{v:'1'},{v:'A'},{v:'2'},{v:'B'},{v:'3'},{v:'C'},{v:'4'},{v:'D'},{v:'5'},{v:'E'}];
        let dots = sequence.map(s => ({ v: s.v, x: 100 + Math.random()*700, y: 100 + Math.random()*340 }));
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            if (currentIndex === sequence.length || (performance.now()-start > 60000)) {
                $("results").textContent = currentIndex >= 6 ? "SWITCH PASS" : "SWITCH FAIL"; return;
            }
            ctx.beginPath(); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
            for(let i=0; i<currentIndex; i++) { if(i===0) ctx.moveTo(dots[i].x, dots[i].y); else ctx.lineTo(dots[i].x, dots[i].y); }
            ctx.stroke();
            dots.forEach((d, i) => {
                ctx.fillStyle = i === currentIndex ? "#a855f7" : (i < currentIndex ? "#3b82f6" : "#1e293b");
                ctx.beginPath(); ctx.arc(d.x, d.y, 35, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "white"; ctx.font = "bold 22px Arial"; ctx.textAlign="center"; ctx.fillText(d.v, d.x, d.y+8);
            });
            requestAnimationFrame(loop);
        }
        canvas.onpointerdown = (e) => {
            const rect = canvas.getBoundingClientRect(); const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
            if (Math.hypot(mx - dots[currentIndex].x, my - dots[currentIndex].y) < 40) currentIndex++;
        };
        loop();
    }

    // --- 6. DELAYED RECALL ---
    wire("btnReset", () => {
        if (memoryStatus !== "encoded") { alert("Encode words first (Test 5)"); return; }
        let input = prompt("Enter the 5 words you memorized (comma separated):");
        if (input) {
            let correct = input.split(",").filter(w => memoryWords.map(m=>m.toLowerCase()).includes(w.trim().toLowerCase())).length;
            $("results").textContent = `RECALL: ${correct}/5 words correct`;
            $("results").style.color = correct >= 3 ? "#34d399" : "#f43f5e";
        }
    });

    // --- 7. BALANCE ---
    wire("btnBalance", () => {
        $("results").textContent = "Steady... 3s";
        setTimeout(() => {
            motionSamples = []; $("results").textContent = "RECORDING...";
            setTimeout(() => {
                const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
                const sway = Math.sqrt(mags.reduce((a,b)=>a+Math.pow(b-(mags.reduce((x,y)=>x+y,0)/mags.length),2),0)/mags.length);
                $("results").textContent = sway < 0.08 ? `BALANCE PASS` : `BALANCE FAIL`;
            }, 10000);
        }, 3000);
    });
});
