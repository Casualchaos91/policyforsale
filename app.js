const $ = id => document.getElementById(id);
let canvas, ctx, motionSamples = [];

window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction", "Tap Green/Blue. Ignore Red/Yellow.", runReaction);
    $("btnBalance").onclick = () => showOverlay("Balance", "Hold phone to chest, stand still.", runBalance);
    $("btnTrailing").onclick = () => showOverlay("Trailing", "Trace the shooting star tail.", runTrailing);
    $("btnPuzzle").onclick = () => showOverlay("Numerical Puzzle", "Stack 1-5 by color.", runPuzzle);
    $("btnDog").onclick = () => showOverlay("Dog Memory", "Memorize the dog for 8s, then reassemble the missing parts!", runDogPuzzle);
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

// --- DOG PUZZLE LOGIC ---
function drawDogPart(x, y, part, color = "white") {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (part === "body") {
        ctx.ellipse(x, y, 100, 60, 0, 0, Math.PI * 2); // Body
        ctx.ellipse(x - 80, y - 40, 40, 50, 0, 0, Math.PI * 2); // Head
    } else if (part === "ear") {
        ctx.moveTo(x, y); ctx.lineTo(x + 15, y - 40); ctx.lineTo(x + 30, y); // Ear triangle
    } else if (part === "tail") {
        ctx.quadraticCurveTo(x + 40, y - 60, x + 80, y - 20); ctx.lineWidth = 15; ctx.strokeStyle = color; ctx.stroke(); return;
    } else if (part === "leg") {
        ctx.fillRect(x, y, 20, 50); // Simple leg
    }
    ctx.fill();
}

function runDogPuzzle() {
    const flashDuration = 8000;
    const start = performance.now();
    let isMemorizing = true;
    let pieces = [
        { id: "Ear", type: "ear", x: 650, y: 100, tx: 345, ty: 195, locked: false },
        { id: "Tail", type: "tail", x: 650, y: 200, tx: 530, ty: 270, locked: false },
        { id: "Leg1", type: "leg", x: 650, y: 300, tx: 400, ty: 330, locked: false },
        { id: "Leg2", type: "leg", x: 750, y: 300, tx: 480, ty: 330, locked: false }
    ];
    let selected = null;

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let now = performance.now();
        let elapsed = now - start;

        if (isMemorizing) {
            ctx.fillStyle = "white"; ctx.font = "24px Arial";
            ctx.fillText(`Memorize! Time remaining: ${Math.max(0, (8 - elapsed/1000).toFixed(1))}s`, 50, 50);
            // Draw Full Dog
            drawDogPart(450, 270, "body");
            drawDogPart(345, 195, "ear");
            drawDogPart(530, 270, "tail");
            drawDogPart(400, 330, "leg");
            drawDogPart(480, 330, "leg");

            if (elapsed > flashDuration) isMemorizing = false;
            requestAnimationFrame(loop);
            return;
        }

        // --- Assembly Phase ---
        if (pieces.every(p => p.locked)) {
            $("results").textContent = "DOG PUZZLE: PASS";
            $("results").style.color = "#34d399";
            return;
        }

        ctx.fillStyle = "white"; ctx.font = "20px Arial";
        ctx.fillText("Reassemble the dog! Drag parts to the correct spots.", 50, 50);

        drawDogPart(450, 270, "body", "#333"); // Dark "ghost" body
        
        pieces.forEach(p => {
            drawDogPart(p.x, p.y, p.type, p.locked ? "white" : "#7dd3fc");
        });

        requestAnimationFrame(loop);
    }

    canvas.onpointerdown = (e) => {
        if (isMemorizing) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX-rect.left)*(900/rect.width), my = (e.clientY-rect.top)*(540/rect.height);
        selected = pieces.findLast(p => !p.locked && Math.hypot(mx-p.x, my-p.y) < 60);
    };
    canvas.onpointermove = (e) => {
        if (!selected) return;
        const rect = canvas.getBoundingClientRect();
        selected.x = (e.clientX-rect.left)*(900/rect.width);
        selected.y = (e.clientY-rect.top)*(540/rect.height);
    };
    canvas.onpointerup = () => {
        if (selected && Math.hypot(selected.x - selected.tx, selected.y - selected.ty) < 90) {
            selected.x = selected.tx; selected.y = selected.ty; selected.locked = true;
        }
        selected = null;
    };
    loop();
}

// --- KEEP ALL OTHER FUNCTIONS (runTrailing, runReaction, etc.) BELOW ---
