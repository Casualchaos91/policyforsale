// Project MVP – core logic
// No network calls. Local-only session logging.

const $ = id => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");

let motionEnabled = false;
let session = {};
let baseline = null;
let currentTest = null;
let timer = null;

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

// ---------- Motion ----------
let motionSamples = [];
function onMotion(e){
  if(!motionEnabled) return;
  const a = e.accelerationIncludingGravity;
  if(!a) return;
  motionSamples.push({
    t: now(),
    x: a.x || 0,
    y: a.y || 0,
    z: a.z || 0
  });
}

async function enableMotion(){
  try{
    if(typeof DeviceMotionEvent !== "undefined" &&
       typeof DeviceMotionEvent.requestPermission === "function"){
      const res = await DeviceMotionEvent.requestPermission();
      if(res !== "granted") throw "denied";
    }
    window.addEventListener("devicemotion", onMotion);
    motionEnabled = true;
    $("motionStatus").textContent = "Motion: Enabled";
    $("motionStatus").style.color = "#34d399";
  }catch(e){
    $("motionStatus").textContent = "Motion: Blocked";
    $("motionStatus").style.color = "#fb7185";
  }
}

// ---------- Reaction + Inhibition ----------
function runReaction(){
  showOverlay(
    "Reaction + Inhibition",
    "Tap GREEN circles. Do NOT tap RED squares. Go as fast and accurate as you can.",
    () => {
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
        for(let i=trials.length-1;i>=0;i--){
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
        const nogo = trials.filter(x=>!x.go);
        session.reaction = {
          meanRT: avg(go.map(x=>x.rt).filter(Boolean)),
          falseTaps: nogo.filter(x=>x.hit).length,
          misses: go.filter(x=>!x.hit).length,
          variability: std(go.map(x=>x.rt).filter(Boolean))
        };
        setStatus("Reaction Complete");
        renderResults();
      }

      draw();
    }
  );
}

// ---------- Divided Attention ----------
function runDivided(){
  showOverlay(
    "Divided Attention",
    "Keep your finger on the moving dot. When prompted, TAP quickly.",
    () => {
      setStatus("Divided Attention");
      const start = now();
      const duration = 60000;
      let trackErr = [];
      let prompts = [];
      let dot = {x:450,y:270};

      function step(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        dot.x += rand(-3,3);
        dot.y += rand(-3,3);
        dot.x = clamp(dot.x,40,860);
        dot.y = clamp(dot.y,40,500);

        ctx.fillStyle="#7dd3fc";
        ctx.beginPath();
        ctx.arc(dot.x,dot.y,14,0,Math.PI*2);
        ctx.fill();

        if(Math.random()<0.01){
          prompts.push({t:now(), hit:false});
        }

        prompts.forEach(p=>{
          if(!p.hit){
            ctx.fillStyle="#facc15";
            ctx.fillRect(20,20,120,40);
            ctx.fillStyle="#000";
            ctx.fillText("TAP NOW",30,48);
          }
        });

        if(now()-start>duration){
          finish();
          return;
        }
        requestAnimationFrame(step);
      }

      canvas.ontouchmove = e => {
        const r = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - r.left;
        const y = e.touches[0].clientY - r.top;
        trackErr.push(Math.hypot(x-dot.x,y-dot.y));
      };

      canvas.onclick = () => {
        prompts.forEach(p=>{
          if(!p.hit){
            p.hit = true;
            p.rt = now()-p.t;
          }
        });
      };

      function finish(){
        canvas.onclick=null;
        canvas.ontouchmove=null;
        session.divided = {
          trackError: avg(trackErr),
          promptRT: avg(prompts.map(p=>p.rt).filter(Boolean)),
          missedPrompts: prompts.filter(p=>!p.hit).length
        };
        setStatus("Divided Complete");
        renderResults();
      }

      step();
    }
  );
}

// ---------- Balance / Sway ----------
function runBalance(){
  showOverlay(
    "Balance / Sway",
    "Hold the device flat against your chest. Feet together. Stand still.",
    () => {
      setStatus("Balance Test");
      motionSamples = [];
      setTimeout(()=>{
        const mags = motionSamples.map(s=>Math.hypot(s.x,s.y,s.z));
        session.balance = {
          sway: std(mags),
          samples: mags.length
        };
        setStatus("Balance Complete");
        renderResults();
      },30000);
    }
  );
}

// ---------- Results ----------
function avg(a){ return a.length ? a.reduce((x,y)=>x+y,0)/a.length : null; }
function std(a){
  if(!a.length) return null;
  const m = avg(a);
  return Math.sqrt(avg(a.map(x=>(x-m)**2)));
}

function renderResults(){
  $("results").textContent = JSON.stringify(session,null,2);
}

// ---------- Buttons ----------
$("btnPerms").onclick = enableMotion;
$("btnReaction").onclick = runReaction;
$("btnDivided").onclick = runDivided;
$("btnBalance").onclick = runBalance;

$("btnReset").onclick = () => {
  session = {};
  $("results").textContent="";
  setStatus("Idle");
};

$("btnExport").onclick = () => {
  const blob = new Blob([JSON.stringify(session,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project-session.json";
  a.click();
};
