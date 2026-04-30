const VENDORS = ["MATLAB", "ANSYS", "AUTOCAD", "CATIA", "SIEMENS", "FLEX", "RLM"];
const state = {
    hosts: [],
    pools: [],
    acknowledgedPools: new Set(),
    filter: ""
};

function init() {
    // 1. Build Infrastructure
    for (let i = 1; i <= 90; i++) {
        state.hosts.push({ id: `SRV-${String(i).padStart(3, '0')}`, status: 'nominal' });
    }

    // 2. Build Services
    for (let i = 0; i < 400; i++) {
        const vendor = VENDORS[Math.floor(Math.random() * VENDORS.length)];
        const isTriad = Math.random() > 0.2;
        state.pools.push({
            id: `${vendor}-${3000 + i}`,
            vendor: vendor,
            isTriad: isTriad,
            hostRefs: Array.from({length: isTriad ? 3 : 1}, () => state.hosts[Math.floor(Math.random() * 90)].id),
            status: 'nominal'
        });
    }

    renderStructure();
    setupEvents();
    setInterval(engineLoop, 3000);
}

function renderStructure() {
    const hostStack = document.getElementById('host-stack');
    const hexGrid = document.getElementById('hex-grid');

    state.hosts.forEach(h => {
        const div = document.createElement('div');
        div.className = 'host-node nominal';
        div.id = `node-${h.id}`;
        div.innerHTML = `<span>${h.id}</span><span class="status-lbl">OK</span>`;
        hostStack.appendChild(div);
    });

    state.pools.forEach(p => {
        const hex = document.createElement('div');
        hex.className = 'hex nominal';
        hex.id = `hex-${p.id}`;
        hex.innerHTML = `<span>${p.vendor.substring(0,3)}</span>`;
        hex.onclick = () => showInterrogation(p);
        hexGrid.appendChild(hex);
    });
}

function engineLoop() {
    // Simulate Host Failures
    if (Math.random() > 0.7) {
        const h = state.hosts[Math.floor(Math.random() * 90)];
        h.status = Math.random() > 0.7 ? 'error' : 'warning';
        setTimeout(() => { h.status = 'nominal'; syncUI(); }, 8000);
    }
    syncUI();
}

function syncUI() {
    let criticalActions = 0;
    let riskCount = 0;
    let downCount = 0;

    state.pools.forEach(p => {
        const healthyLegs = p.hostRefs.filter(hId => state.hosts.find(h => h.id === hId).status === 'nominal').length;
        const el = document.getElementById(`hex-${p.id}`);
        
        // Quorum Logic
        let currentStatus = 'nominal';
        if (p.isTriad) {
            if (healthyLegs === 2) { currentStatus = 'degraded'; riskCount++; }
            else if (healthyLegs < 2) { currentStatus = 'critical'; }
        } else {
            if (healthyLegs < 1) currentStatus = 'critical';
        }

        // Apply Status Classes
        el.className = `hex ${currentStatus}`;
        if (state.acknowledgedPools.has(p.id)) {
            el.classList.add('acknowledged');
        } else if (currentStatus === 'critical') {
            criticalActions++;
            downCount++;
        }

        // Filter Logic
        const isMatch = p.id.toLowerCase().includes(state.filter) || p.vendor.toLowerCase().includes(state.filter);
        el.style.display = isMatch ? 'flex' : 'none';
    });

    // Update Hosts
    state.hosts.forEach(h => {
        const el = document.getElementById(`node-${h.id}`);
        el.className = `host-node ${h.status}`;
        el.querySelector('.status-lbl').innerText = h.status.toUpperCase();
    });

    // Update KPIs
    document.getElementById('stat-critical').innerText = criticalActions;
    document.getElementById('stat-avail').innerText = `${(((400 - downCount)/400)*100).toFixed(1)}%`;
    document.getElementById('stat-risk').innerText = riskCount;
    document.getElementById('stat-host').innerText = `${state.hosts.filter(h => h.status === 'nominal').length}/90`;
}

function showInterrogation(pool) {
    const overlay = document.getElementById('details-overlay');
    document.getElementById('detail-title').innerText = pool.id;
    
    const legContainer = document.getElementById('detail-legs');
    legContainer.innerHTML = pool.hostRefs.map(hId => {
        const h = state.hosts.find(host => host.id === hId);
        return `<div class="leg-row"><span>${hId}</span><span style="color:${h.status === 'error' ? 'var(--state-fail)' : 'inherit'}">${h.status.toUpperCase()}</span></div>`;
    }).join('');

    const ackBtn = document.getElementById('ack-btn');
    ackBtn.innerText = state.acknowledgedPools.has(pool.id) ? "UNMARK KNOWN ISSUE" : "MARK AS KNOWN ISSUE";
    ackBtn.onclick = () => {
        if (state.acknowledgedPools.has(pool.id)) state.acknowledgedPools.delete(pool.id);
        else state.acknowledgedPools.add(pool.id);
        syncUI();
        closeDetails();
    };

    overlay.classList.remove('hidden');
}

function setupEvents() {
    document.getElementById('global-search').addEventListener('input', (e) => {
        state.filter = e.target.value.toLowerCase();
        syncUI();
    });
}

function closeDetails() { document.getElementById('details-overlay').classList.add('hidden'); }

window.onload = init;
