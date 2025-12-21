// Project MVP – core logic
const $ = id => document.getElementById(id);

let canvas, ctx;
let motionEnabled = false;
let session = {};
let motionSamples = [];

// Initialize after the page loads
window.addEventListener('DOMContentLoaded', () => {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    setupButtons();
});

function setupButtons() {
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = runReaction;
    $("btnDivided").onclick = runDivided;
    $("btnBalance").onclick = runBalance;

    $("btnReset").onclick = () => {
        session = {};
        $("results").textContent = "";
        setStatus("Idle");
    };
}

// ---------- Utilities ----------
function now() { return performance.now(); }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function rand(min,max){ return Math.random()*(max-min)+min; }

function setStatus(msg){
    $("sessionStatus").textContent = `Session: ${msg}`;
}

function showOverlay(title, text, onStart){
    $("overlayTitle").textContent = title;
    $("overlayText").textContent = text;
    $("overlay").classList.remove("hidden");
    
    $("overlayStart").onclick = () => {
        $("overlay").classList.add("hidden");
        onStart();
    };
    $("overlayCancel").onclick = () => {
        $("overlay").classList.add("hidden");
        setStatus("Idle");
    };
}

// ---------- Motion Sensor Logic ----------
async function enableMotion(){
    try {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            const res = await DeviceMotionEvent.requestPermission();
            if (res !== "granted") throw "denied";
        }
        window.addEventListener("devicemotion", (e) => {
            if(!motionEnabled) return;
            const a = e.accelerationIncludingGravity;
            if(!a) return;
            motionSamples.push({ t: now(), x: a.x || 0, y: a.y || 0, z: a.z || 0 });
        });
        motionEnabled = true;
        $("motionStatus").textContent = "Motion: Enabled";
        $("motionStatus").style.color = "#34d399";
    } catch(e) {
        $("motionStatus").textContent = "Motion: Blocked";
        $("motionStatus").style.color = "#fb7185";
        alert("Sensor access denied. If on Android, check Chrome Site Settings.");
    }
}

// ---------- Reaction Test ----------
function runReaction(){
    showOverlay("Reaction + Inhibition", "Tap GREEN circles. Do NOT tap RED squares.", () => {
        setStatus("Reaction Test");
        const start = now();
        const duration = 45000;
        let trials = [];
        let lastStim = 0;

        function draw(){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            if(now() - start > duration){
                finish();
                return;
            }
            if(now() - lastStim > rand(500,1200)){
                lastStim = now();
                const isGo = Math.random() < 0.7;
                trials.push({t:lastStim, go:isGo, hit:false});
                ctx.fillStyle = isGo ? "#22c55e" : "#ef4444";
                ctx.beginPath();
                ctx.arc(rand(80,820), rand(80,460), 40, 0, Math.PI*2);
                ctx.fill();
            }
            requestAnimationFrame(draw);
        }

        canvas.onclick = () => {
            const t = now();
            for(let i=trials.length-1; i>=0; i--){
                if(!trials[i].hit){
                    trials[i].hit = true;
                    trials[i].rt = t - trials[i].t;
                    break;
                }
            }
        };

        function finish(){
            canvas.onclick = null;
            const go = trials.filter(x=>x.go);
            session.reaction = {
                meanRT: avg(go.map(x=>x.rt).filter(Boolean)),
                misses: go.filter(x=>!x.hit).length
            };
            setStatus("Complete");
            renderResults();
        }
        draw();
    });
}

// ---------- Balance Test ----------
function runBalance(){
    showOverlay("Balance / Sway", "Hold device to chest. Stand still for 30s.", () => {
        setStatus("Balance Test");
        motionSamples = [];
        setTimeout(() => {
            const mags = motionSamples.map(s => Math.hypot(s.x, s.y, s.z));
            session.balance = { sway: std(mags), samples: mags.length };
            setStatus("Balance Complete");
            renderResults();
        }, 30000);
    });
}

function avg(a){ return a.length ? a.reduce((x,y)=>x+y,0)/a.length : null; }
function std(a){
    if(!a.length) return null;
    const m = avg(a);
    return Math.sqrt(avg(a.map(x=>(x-m)**2)));
}
function renderResults(){
    $("results").textContent = JSON.stringify(session, null, 2);
}
