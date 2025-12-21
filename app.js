const $ = id => document.getElementById(id);

// Force setup as soon as the script loads
window.onload = () => {
    console.log("App Ready");
    setupButtons();
};

function setupButtons() {
    // Permission Button
    $("btnPerms").onclick = async () => {
        try {
            if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
                const res = await DeviceMotionEvent.requestPermission();
                if (res === "granted") {
                    $("motionStatus").textContent = "Motion: Enabled";
                    $("motionStatus").style.color = "#34d399";
                    return;
                }
            }
            $("motionStatus").textContent = "Motion: Blocked";
            $("motionStatus").style.color = "#fb7185";
        } catch(e) {
            alert("Error: " + e);
        }
    };

    // Reaction Button
    $("btnReaction").onclick = () => {
        const overlay = $("overlay");
        $("overlayTitle").textContent = "Reaction Test";
        $("overlayText").textContent = "Tap the screen when you see a green circle.";
        
        // Manual CSS override to force it to show
        overlay.style.display = "flex"; 
        overlay.classList.remove("hidden");
    };
    
    // Cancel Button
    $("overlayCancel").onclick = () => {
        $("overlay").style.display = "none";
    };
}
