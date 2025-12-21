const $ = id => document.getElementById(id);

// This ensures the code waits for the buttons to exist
window.addEventListener('load', () => {
    console.log("App Loaded");
    
    // Wire up the buttons
    $("btnPerms").onclick = enableMotion;
    $("btnReaction").onclick = () => showOverlay("Reaction", "Tap Green Circles", startReaction);
    
    // Simple test to see if buttons work:
    $("btnReset").onclick = () => alert("Logic is connected!");
});

async function enableMotion() {
    // Android/Chrome doesn't usually use .requestPermission()
    // It just needs a user gesture (a click) to start listening
    try {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            await DeviceMotionEvent.requestPermission();
        }
        
        window.addEventListener("devicemotion", (e) => {
            // Test if we are getting data
            if(e.accelerationIncludingGravity) {
                $("motionStatus").textContent = "Motion: Active";
                $("motionStatus").style.color = "#34d399";
            }
        }, { once: true }); // Just check once to see if it works
        
    } catch (e) {
        $("motionStatus").textContent = "Motion: Error";
        console.error(e);
    }
}

function showOverlay(title, text, startFn) {
    const ov = $("overlay");
    $("overlayTitle").textContent = title;
    $("overlayText").textContent = text;
    ov.classList.remove("hidden");
    ov.style.display = "flex"; // Force visibility
    
    $("overlayStart").onclick = () => {
        ov.style.display = "none";
        startFn();
    };
}

function startReaction() {
    const canvas = $("canvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "green";
    ctx.fillRect(100, 100, 50, 50); // Draw a test square
    console.log("Reaction test started");
}
