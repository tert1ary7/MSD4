// --- v4 Simulation Logic ---
const simState = {
    dc1_offline: false,
    chaos_active: false,
    viewMode: 'health' // health | financial
};

// Toggle Data Center Failure
document.getElementById('kill-dc1').onclick = () => {
    simState.dc1_offline = !simState.dc1_offline;
    document.getElementById('kill-dc1').innerText = simState.dc1_offline ? "RESTORE DC-1" : "KILL DC-1";
    
    // Impact: Force every host in the "DC-1" range to fail
    state.hosts.forEach((h, index) => {
        if (index < 30) h.status = simState.dc1_offline ? 'error' : 'nominal';
    });
    render();
};

// Toggle Financial View
document.getElementById('view-mode').onchange = (e) => {
    simState.viewMode = e.target.value;
    render();
};

// Modified Render Logic for v4
function render() {
    updatePoolStates();
    const hexGrid = document.getElementById('hex-grid');
    hexGrid.innerHTML = '';

    state.pools.forEach(p => {
        const el = document.createElement('div');
        el.id = p.id;
        
        if (simState.viewMode === 'financial') {
            // Logic: Is the pool nominal (active) or idle?
            const isIdle = Math.random() > 0.7; // In production, linked to real-time checkout data
            el.className = `hex ${isIdle ? 'financial-waste' : 'financial-high'}`;
            el.innerHTML = `<span>$${(Math.random() * 100).toFixed(0)}/h</span>`;
        } else {
            // Health Mode with "Fragility" detection
            const activeHosts = p.hostRefs.filter(hId => state.hosts.find(h => h.id === hId).status === 'nominal').length;
            const isFragile = p.isTriad && activeHosts === 1;
            
            el.className = `hex ${p.status} ${isFragile ? 'fragile' : ''}`;
            el.innerHTML = `<span>${p.vendor.substring(0,3)}</span><span>${isFragile ? '!!' : p.id.split('-')[1]}</span>`;
        }
        
        el.onmouseenter = () => tracePool(p);
        el.onmouseleave = clearTrace;
        hexGrid.appendChild(el);
    });
    
    // ... Host rendering remains same, but sorted by status ...
    renderHosts(); 
}
