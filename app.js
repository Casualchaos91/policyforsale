// Safe selector function
const $ = id => document.getElementById(id);

window.addEventListener('load', () => {
    console.log("App.js is connected and running.");
    const canvas = $("canvas");
    if (!canvas) {
        console.error("Canvas not found!");
        return;
    }
    const ctx = canvas.getContext("2d");
    let motionSamples = [];

    // --- SHARED FUNCTIONS ---
    function showOverlay(title, text, startFn) {
        const ov = $("overlay");
        $("overlayTitle").textContent = title;
        $("overlayText").textContent = text;
        ov.classList.remove("hidden");
        ov.style.display = "flex";
        $("overlayStart").onclick = () => {
            ov.style.display = "none";
            startFn();
        };
    }

    // --- BUTTON WIRING (Fail-Safe) ---
    const wire = (id, fn) => {
        const el = $(id);
        if (el) el.onclick = fn;
        else console.warn(`Button ${id} not found in HTML`);
    };

    wire("btnPerms", async () => {
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
        } catch (e) { alert("Sensors blocked or not supported."); }
    });

    wire("btnReaction", () => showOverlay("Reaction", "Tap Green/Blue. Ignore Red/Yellow.", runReaction));
    wire("btnBalance", () => showOverlay("Balance", "Hold phone to chest, stand still.", runBalance));
    wire("btnTrailing", () => showOverlay("Trailing", "Trace the shooting star tail.", runTrailing));
    wire("btnPuzzle", () => showOverlay("Numerical Puzzle", "Stack 1-5 in order (Green, Red, Yellow).", runPuzzle));
    wire("btnDog", () => showOverlay("Dog Memory", "Memorize for 8s, then attach the missing parts.", runDogPuzzle));
    wire("btnReset", () => { ctx.clearRect(0,0,canvas.width,canvas.height); $("results").textContent = "Reset."; });

    // --- 1. DOG MEMORY PUZZLE ---
    function drawDogPart(x, y, part, color = "white") {
        ctx.fillStyle = color; ctx.beginPath();
        if (part === "body") {
            ctx.ellipse(x, y, 100, 60, 0, 0, Math.PI * 2);
            ctx.ellipse(x - 80, y - 40, 40, 50, 0, 0, Math.PI * 2);
        } else if (part === "ear") {
            ctx.moveTo(x, y); ctx.lineTo(x + 15, y - 40); ctx.lineTo(x + 30, y);
        } else if (part === "tail") {
            ctx.moveTo(x,y); ctx.quadraticCurveTo(x + 40, y - 60, x + 80, y - 20); 
            ctx.lineWidth = 15; ctx.strokeStyle = color; ctx.stroke(); return;
        } else if (part === "leg") {
            ctx.fillRect(x, y, 20, 50);
        }
        ctx.fill();
    }

    function runDogPuzzle() {
        const start = performance.now();
        let isMemorizing = true;
        let pieces = [
            { type: "ear", x: 750, y: 100, tx: 345, ty: 195, locked: false },
            { type: "tail", x: 750, y: 200, tx: 530, ty: 270, locked: false },
            { type: "leg", x: 750, y: 350, tx: 400, ty: 330, locked: false },
            { type: "leg", x: 820, y: 350, tx: 480, ty: 330, locked: false }
        ];
        let selected = null;

        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let now = performance.now();
            if (isMemorizing) {
                ctx.fillStyle = "white"; ctx.font = "24px Arial";
                ctx.fillText(`Memorize! ${(8 - (now-start)/1000).toFixed(1)}s`, 50, 50);
                drawDogPart(450, 270, "body"); drawDogPart(345, 195, "ear");
                drawDogPart(530, 270, "tail"); drawDogPart(400, 330, "leg"); drawDogPart(480, 330, "leg");
                if (now-start > 8000) isMemorizing = false;
            } else {
                if (pieces.every(p => p.locked)) { $("results").textContent = "DOG PUZZLE: PASS"; return; }
                drawDogPart(450, 270, "body", "#222");
                pieces.forEach(p => drawDogPart(p.x, p.y, p.type, p.locked ? "white" : "#7dd3fc"));
            }
            if(!pieces.every(p=>p.locked)) requestAnimationFrame(loop);
        }
        canvas.onpointerdown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
            selected = pieces.findLast(p => !p.locked && Math.hypot(mx-p.x, my-p.y) < 60);
        };
        canvas.onpointermove = (e) => {
            if (selected) {
                const rect = canvas.getBoundingClientRect();
                selected.x = (e.clientX-rect.left)*(900/rect.width); selected.y = (e.clientY-rect.top)*(540/rect.height);
            }
        };
        canvas.onpointerup = () => {
            if (selected && Math.hypot(selected.x - selected.tx, selected.y - selected.ty) < 90) {
                selected.x = selected.tx; selected.y = selected.ty; selected.locked = true;
            }
            selected = null;
        };
        loop();
    }

    // --- 2. NUMERICAL SQUARE PUZZLE ---
    function runPuzzle() {
        const duration = 35000; const start = performance.now();
        let pieces = [], selected = null; const w = 92, h = 92;
        const zones = {'#22c55e':{x:100,y:150}, '#ef4444':{x:350,y:150}, '#facc15':{x:600,y:150}};
        ['#22c55e','#ef4444','#facc15'].forEach(color => {
            for(let i=0; i<5; i++) pieces.push({color, num:i+1, x:800, y:50+(pieces.length*25), targetX:zones[color].x, targetY:zones[color].y+(i*40), locked:false});
        });
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let rem = Math.max(0, ((duration - (performance.now()-start))/1000).toFixed(1));
            if (rem <= 0 || pieces.every(p=>p.locked)) { $("results").textContent = `PUZZLE: ${pieces.every(p=>p.locked)?"PASS":"FAIL"}`; return; }
            pieces.forEach(p => {
                ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, w, h);
                ctx.fillStyle = "black"; ctx.font = "bold 24px Arial"; ctx.textAlign="center";
                ctx.fillText(p.num, p.x+w/2, p.y+h/2+8);
            });
            requestAnimationFrame(loop);
        }
        canvas.onpointerdown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
            selected = pieces.findLast(p => !p.locked && mx > p.x && mx < p.x+w && my > p.y && my < p.y+h);
        };
        canvas.onpointermove = (e) => {
            if(selected) { 
                const rect = canvas.getBoundingClientRect();
                selected.x = (e.clientX-rect.left)*(900/rect.width)-w/2; selected.y = (e.clientY-rect.top)*(540/rect.height)-h/2; 
            }
        };
        canvas.onpointerup = () => {
            if (selected && Math.abs(selected.x-selected.targetX)<90 && Math.abs(selected.y-selected.targetY)<90) { selected.x=selected.targetX; selected.y=selected.targetY; selected.locked=true; }
            selected = null;
        };
        loop();
    }

    // --- 3. TRAILING TRACK ---
    function runTrailing() {
        const start = performance.now();
        let ball = {x:450, y:270, vx:4, vy:4}, trail = [], scoreSum = 0, samples = 0;
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let now = performance.now();
            if (now-start > 45000) {
                const acc = (scoreSum/samples || 0).toFixed(1);
                $("results").textContent = `TRAILING: ${acc}% - ${acc >= 25 ? "PASS" : "FAIL"}`;
                return;
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

    // --- 4. REACTION & BALANCE ---
    function runReaction() {
        const start = performance.now();
        let objs = [], last = 0, score = 0;
        function loop() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let now = performance.now();
            if (now-start > 45000) { $("results").textContent = `REACTION: ${score} - ${score >= 15 ? "PASS" : "FAIL"}`; return; }
            if (now - last > 900) {
                last = now; const color = ['#22c55e','#ef4444','#facc15','#3b82f6'][Math.floor(Math.random()*4)];
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
        $("results").textContent = "Recording in 3s...";
        setTimeout(() => {
            motionSamples = []; $("results").textContent = "Recording...";
            setTimeout(() => {
                const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
                const avg = mags.length ? mags.reduce((a,b)=>a+b,0)/mags.length : 0;
                const sway = mags.length ? Math.sqrt(mags.reduce((a,b)=>a+Math.pow(b-avg,2),0)/mags.length) : 0;
                $("results").textContent = `SWAY: ${sway.toFixed(4)} - ${sway < 0.08 ? "PASS" : "FAIL"}`;
            }, 10000);
        }, 3000);
    }
});
