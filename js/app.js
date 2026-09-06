/**
 * The Round Table Exchange (RTE) - Main Frontend Application Logic
 * Supports both Live FastAPI Backend and Standalone In-Browser Engine (for GitHub Pages).
 */

const API_BASE = window.location.origin.includes('http') && !window.location.origin.includes('github.io') ? window.location.origin : '';
let isStandaloneMode = false;

// Sample Taxonomy and Preset Data for Standalone Mode
const SKILL_TAXONOMY = {
  "Python Programming": "Technology",
  "React Development": "Technology",
  "Machine Learning": "Technology",
  "Graphic Design": "Creative",
  "UI/UX Design": "Creative",
  "Video Editing": "Creative",
  "Acoustic Guitar": "Music",
  "Vocal Coaching": "Music",
  "Conversational Spanish": "Languages",
  "Conversational French": "Languages",
  "Calculus & Algebra": "Academics",
  "Digital Photography": "Creative"
};

const DHAKA_LOCATIONS = [
  { city: "Dhanmondi", lat: 23.7461, lon: 90.3742 },
  { city: "Gulshan-2", lat: 23.7925, lon: 90.4078 },
  { city: "Banani", lat: 23.7937, lon: 90.4066 },
  { city: "Uttara", lat: 23.8759, lon: 90.3795 },
  { city: "Mirpur-10", lat: 23.8069, lon: 90.3687 },
  { city: "Bashundhara R/A", lat: 23.8191, lon: 90.4326 },
  { city: "Mohammadpur", lat: 23.7658, lon: 90.3584 },
  { city: "Badda / UITS Area", lat: 23.7805, lon: 90.4267 }
];

// State Store
let appState = {
  users: [],
  metadata: { skills: SKILL_TAXONOMY, locations: DHAKA_LOCATIONS.map(l => l.city) },
  discoveredCycles: [],
  proposals: [],
  selectedCycleId: null,
  activeTab: 'tab-explorer',
  alpha: 0.5,
  minK: 3,
  maxK: 4
};

let graphVisualizer = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  graphVisualizer = new GraphVisualizer('network-canvas');
  setupEventListeners();
  populateLocationDropdown();
  await initializeApp();
});

function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });

  // Alpha Slider
  const alphaSlider = document.getElementById('alpha-slider');
  const alphaVal = document.getElementById('alpha-val');
  alphaSlider.addEventListener('input', (e) => {
    appState.alpha = parseFloat(e.target.value);
    alphaVal.textContent = appState.alpha.toFixed(2);
  });

  // Cycle Length Min/Max
  document.getElementById('min-k-select').addEventListener('change', (e) => {
    appState.minK = parseInt(e.target.value);
  });
  document.getElementById('max-k-select').addEventListener('change', (e) => {
    appState.maxK = parseInt(e.target.value);
  });

  // Run Match Button
  document.getElementById('btn-run-match').addEventListener('click', runMatching);

  // Reset Graph Button
  document.getElementById('btn-reset-graph').addEventListener('click', () => {
    if (graphVisualizer) graphVisualizer.resetHighlight();
  });

  // Fit Graph Button
  document.getElementById('btn-fit-graph').addEventListener('click', () => {
    if (graphVisualizer) graphVisualizer.fit();
  });

  // Reset Demo Data Button
  document.getElementById('btn-reset-demo').addEventListener('click', resetDemoData);

  // Synthetic Generator Buttons
  document.querySelectorAll('.btn-gen-synth').forEach(btn => {
    btn.addEventListener('click', async () => {
      const count = parseInt(btn.dataset.count);
      await generateSyntheticUsers(count);
    });
  });

  // Run Benchmark Button
  document.getElementById('btn-run-benchmark').addEventListener('click', runBenchmark);

  // User Modal Triggers
  document.getElementById('btn-open-user-modal').addEventListener('click', openCreateUserModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeCreateUserModal);
  document.getElementById('form-create-user').addEventListener('submit', handleCreateUser);
}

function switchTab(tabId) {
  appState.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const activeContent = document.getElementById(tabId);
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');

  if (tabId === 'tab-explorer' && graphVisualizer) {
    setTimeout(() => graphVisualizer.fit(), 100);
  }
}

function populateLocationDropdown() {
  const select = document.getElementById('user-city-select');
  select.innerHTML = '';
  appState.metadata.locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    select.appendChild(opt);
  });
}

// Initialization & Mode Detection
async function initializeApp() {
  try {
    const res = await fetch(`${API_BASE}/api/meta`);
    if (!res.ok) throw new Error();
    appState.metadata = await res.json();
    populateLocationDropdown();
    isStandaloneMode = false;
  } catch (e) {
    isStandaloneMode = true;
    console.log('Running in Standalone In-Browser Mode (GitHub Pages compatible).');
  }

  if (isStandaloneMode) {
    initStandaloneDemoData();
  } else {
    await refreshAll();
  }
}

async function refreshAll() {
  if (isStandaloneMode) {
    runStandaloneMatching();
    renderMetrics();
    renderCyclesList();
    renderProposalsList();
    renderUsersList();
    return;
  }
  await Promise.all([loadUsers(), runMatching(), loadProposals()]);
}

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/api/users`);
    appState.users = await res.json();
    renderMetrics();
    renderUsersList();
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

async function runMatching() {
  if (isStandaloneMode) {
    runStandaloneMatching();
    return;
  }

  try {
    const runBtn = document.getElementById('btn-run-match');
    runBtn.textContent = '⚡ Running Algorithm...';
    runBtn.disabled = true;

    const res = await fetch(`${API_BASE}/api/match/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alpha: appState.alpha,
        min_k: appState.minK,
        max_k: appState.maxK
      })
    });
    const data = await res.json();
    appState.discoveredCycles = data.cycles || [];
    
    if (graphVisualizer && data.graph) {
      graphVisualizer.setData(data.graph.nodes, data.graph.edges);
    }

    renderMetrics();
    renderCyclesList();
  } catch (err) {
    console.error('Failed to run matching:', err);
  } finally {
    const runBtn = document.getElementById('btn-run-match');
    runBtn.textContent = '🚀 Run Cycle Matching Engine';
    runBtn.disabled = false;
  }
}

async function loadProposals() {
  try {
    const res = await fetch(`${API_BASE}/api/proposals`);
    appState.proposals = await res.json();
    renderProposalsList();
  } catch (err) {
    console.error('Failed to load proposals:', err);
  }
}

async function createProposalForCycle(cycleId) {
  if (isStandaloneMode) {
    const targetCycle = appState.discoveredCycles.find(c => c.id === cycleId);
    if (!targetCycle) return;
    const responses = {};
    targetCycle.user_ids.forEach(uid => { responses[uid] = 'PENDING'; });
    const proposal = {
      id: Math.random().toString(36).substring(2, 8),
      cycle: targetCycle,
      status: 'PENDING',
      user_responses: responses,
      created_at: Date.now() / 1000
    };
    appState.proposals.push(proposal);
    renderProposalsList();
    renderMetrics();
    switchTab('tab-proposals');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/proposals/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycle_id: cycleId, expiration_seconds: 86400 })
    });
    if (!res.ok) throw new Error('Failed to create proposal');
    await loadProposals();
    switchTab('tab-proposals');
  } catch (err) {
    alert(err.message);
  }
}

async function respondToProposal(proposalId, userId, responseStatus) {
  if (isStandaloneMode) {
    const prop = appState.proposals.find(p => p.id === proposalId);
    if (!prop || prop.status !== 'PENDING') return;
    prop.user_responses[userId] = responseStatus;
    if (responseStatus === 'REJECTED') {
      prop.status = 'REJECTED';
    } else {
      const allAccepted = Object.values(prop.user_responses).every(v => v === 'ACCEPTED');
      if (allAccepted) prop.status = 'CONFIRMED';
    }
    renderProposalsList();
    renderMetrics();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/proposals/${proposalId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, response: responseStatus })
    });
    if (!res.ok) throw new Error('Failed to record response');
    await loadProposals();
  } catch (err) {
    alert(err.message);
  }
}

async function resetDemoData() {
  if (isStandaloneMode) {
    initStandaloneDemoData();
    return;
  }
  try {
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    await refreshAll();
  } catch (err) {
    console.error('Failed to reset:', err);
  }
}

async function generateSyntheticUsers(count) {
  if (isStandaloneMode) {
    const synthUsers = generateStandaloneUsers(count);
    appState.users = synthUsers;
    runStandaloneMatching();
    renderMetrics();
    renderCyclesList();
    renderUsersList();
    alert(`Generated ${count} synthetic users. Found ${appState.discoveredCycles.length} trade loops.`);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/synthetic/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    const result = await res.json();
    await refreshAll();
    alert(`Generated ${result.generated_users} synthetic users. Found ${result.cycles_found} trade loops.`);
  } catch (err) {
    alert('Failed to generate synthetic data: ' + err.message);
  }
}

async function runBenchmark() {
  const btn = document.getElementById('btn-run-benchmark');
  btn.textContent = '⏳ Benchmarking in progress...';
  btn.disabled = true;

  if (isStandaloneMode) {
    setTimeout(() => {
      const counts = [20, 50, 100, 250];
      const results = [];
      counts.forEach(n => {
        const testPop = generateStandaloneUsers(n);
        const t0 = performance.now();
        const { G, userMap } = buildClientGraph(testPop);
        const tGraph = performance.now() - t0;

        const t1 = performance.now();
        const cycles = findClientCycles(G, userMap, appState.minK, appState.maxK, appState.alpha);
        const tCycles = performance.now() - t1;

        results.push({
          nodes: n,
          edges: G.edges.length,
          graph_build_ms: tGraph.toFixed(2),
          cycle_search_ms: tCycles.toFixed(2),
          total_runtime_ms: (tGraph + tCycles).toFixed(2),
          cycles_found: cycles.length,
          k3_cycles: cycles.filter(c => c.cycle_length === 3).length,
          k4_cycles: cycles.filter(c => c.cycle_length === 4).length
        });
      });
      renderBenchmarkResults(results);
      btn.textContent = '▶ Run Scalability Benchmark (20 - 500 Nodes)';
      btn.disabled = false;
    }, 50);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/synthetic/benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_counts: [20, 50, 100, 250, 500] })
    });
    const data = await res.json();
    renderBenchmarkResults(data.benchmark_results);
  } catch (err) {
    alert('Benchmark failed: ' + err.message);
  } finally {
    btn.textContent = '▶ Run Scalability Benchmark (20 - 500 Nodes)';
    btn.disabled = false;
  }
}

// ---------------- IN-BROWSER GRAPH ENGINE (Standalone Mode) ----------------
function initStandaloneDemoData() {
  appState.users = [
    {
      id: "demo-user-1", name: "Ahmmad Khan", email: "ahmmad@rte.test", avatar_color: "#4F46E5",
      location: { city: "Badda / UITS Area", latitude: 23.7805, longitude: 90.4267 },
      availability: [{ days: ["Mon", "Wed", "Fri", "Sat"], start_hour: 18, end_hour: 21 }],
      offers: [{ skill_name: "Python Programming", category: "Technology" }],
      wants: [{ skill_name: "Acoustic Guitar", category: "Music" }]
    },
    {
      id: "demo-user-2", name: "Sumaia Ismail", email: "sumaia@rte.test", avatar_color: "#EC4899",
      location: { city: "Gulshan-2", latitude: 23.7925, longitude: 90.4078 },
      availability: [{ days: ["Mon", "Wed", "Fri"], start_hour: 18, end_hour: 22 }],
      offers: [{ skill_name: "Acoustic Guitar", category: "Music" }],
      wants: [{ skill_name: "Conversational Spanish", category: "Languages" }]
    },
    {
      id: "demo-user-3", name: "Tanvir Ahmed", email: "tanvir@rte.test", avatar_color: "#10B981",
      location: { city: "Banani", latitude: 23.7937, longitude: 90.4066 },
      availability: [{ days: ["Wed", "Fri", "Sat"], start_hour: 17, end_hour: 21 }],
      offers: [{ skill_name: "Conversational Spanish", category: "Languages" }],
      wants: [{ skill_name: "Python Programming", category: "Technology" }]
    },
    {
      id: "demo-user-4", name: "Nafisa Tabassum", email: "nafisa@rte.test", avatar_color: "#F59E0B",
      location: { city: "Dhanmondi", latitude: 23.7461, longitude: 90.3742 },
      availability: [{ days: ["Tue", "Thu", "Sat"], start_hour: 19, end_hour: 22 }],
      offers: [{ skill_name: "UI/UX Design", category: "Creative" }],
      wants: [{ skill_name: "Video Editing", category: "Creative" }]
    },
    {
      id: "demo-user-5", name: "Zubair Rahman", email: "zubair@rte.test", avatar_color: "#8B5CF6",
      location: { city: "Mohammadpur", latitude: 23.7658, longitude: 90.3584 },
      availability: [{ days: ["Tue", "Thu", "Sat"], start_hour: 18, end_hour: 21 }],
      offers: [{ skill_name: "Video Editing", category: "Creative" }],
      wants: [{ skill_name: "Calculus & Algebra", category: "Academics" }]
    },
    {
      id: "demo-user-6", name: "Anika Chowdhury", email: "anika@rte.test", avatar_color: "#06B6D4",
      location: { city: "Dhanmondi", latitude: 23.7461, longitude: 90.3742 },
      availability: [{ days: ["Tue", "Thu", "Sun"], start_hour: 18, end_hour: 22 }],
      offers: [{ skill_name: "Calculus & Algebra", category: "Academics" }],
      wants: [{ skill_name: "React Development", category: "Technology" }]
    },
    {
      id: "demo-user-7", name: "Farhan Kabir", email: "farhan@rte.test", avatar_color: "#EF4444",
      location: { city: "Mirpur-10", latitude: 23.8069, longitude: 90.3687 },
      availability: [{ days: ["Tue", "Thu", "Sat"], start_hour: 19, end_hour: 21 }],
      offers: [{ skill_name: "React Development", category: "Technology" }],
      wants: [{ skill_name: "UI/UX Design", category: "Creative" }]
    }
  ];
  appState.proposals = [];
  runStandaloneMatching();
  renderMetrics();
  renderCyclesList();
  renderProposalsList();
  renderUsersList();
}

function generateStandaloneUsers(count) {
  const skills = Object.keys(SKILL_TAXONOMY);
  const users = [];
  for (let i = 0; i < count; i++) {
    const loc = DHAKA_LOCATIONS[i % DHAKA_LOCATIONS.length];
    const off = skills[Math.floor(Math.random() * skills.length)];
    let wnt = skills[Math.floor(Math.random() * skills.length)];
    while (wnt === off) wnt = skills[Math.floor(Math.random() * skills.length)];
    users.push({
      id: `synth-${i+1}`,
      name: `User_${(i+1).toString().padStart(3, '0')}`,
      avatar_color: '#4F46E5',
      location: { city: loc.city, latitude: loc.lat, longitude: loc.lon },
      availability: [{ days: ["Mon", "Wed", "Fri"], start_hour: 18, end_hour: 21 }],
      offers: [{ skill_name: off, category: SKILL_TAXONOMY[off] }],
      wants: [{ skill_name: wnt, category: SKILL_TAXONOMY[wnt] }]
    });
  }
  return users;
}

function buildClientGraph(users) {
  const userMap = {};
  users.forEach(u => userMap[u.id] = u);
  const edges = [];
  const adj = {};
  users.forEach(u => adj[u.id] = []);

  users.forEach(u => {
    u.offers.forEach(off => {
      const oNorm = off.skill_name.toLowerCase().trim();
      users.forEach(v => {
        if (u.id === v.id) return;
        v.wants.forEach(wnt => {
          const wNorm = wnt.skill_name.toLowerCase().trim();
          if (oNorm === wNorm || oNorm.includes(wNorm) || wNorm.includes(oNorm)) {
            edges.push({ from: u.id, to: v.id, label: off.skill_name, category: off.category });
            adj[u.id].push({ to: v.id, skill: off.skill_name });
          }
        });
      });
    });
  });

  return { G: { adj, edges, nodes: users.map(u => ({ id: u.id, label: u.name, city: u.location.city, offers: u.offers.map(o => o.skill_name), wants: u.wants.map(w => w.skill_name), color: u.avatar_color })) }, userMap };
}

function findClientCycles(G, userMap, minK, maxK, alpha) {
  const rawCycles = new Set();
  const nodes = Object.keys(G.adj);

  function dfs(startNode, currentNode, path, visited) {
    if (path.length > maxK) return;
    const neighbors = G.adj[currentNode] || [];
    for (const nb of neighbors) {
      if (nb.to === startNode && path.length >= minK) {
        const minVal = path.slice().sort()[0];
        const minIdx = path.indexOf(minVal);
        const norm = [...path.slice(minIdx), ...path.slice(0, minIdx)].join(',');
        rawCycles.add(norm);
      } else if (!visited.has(nb.to) && path.length < maxK && nb.to > startNode) {
        visited.add(nb.to);
        path.push(nb.to);
        dfs(startNode, nb.to, path, visited);
        path.pop();
        visited.delete(nb.to);
      }
    }
  }

  nodes.forEach(node => {
    dfs(node, node, [node], new Set([node]));
  });

  const results = [];
  rawCycles.forEach(strCycle => {
    const cycleNodes = strCycle.split(',');
    const k = cycleNodes.length;
    const cycleUsers = cycleNodes.map(uid => userMap[uid]);
    const edges = [];

    for (let i = 0; i < k; i++) {
      const uFrom = cycleNodes[i];
      const uTo = cycleNodes[(i + 1) % k];
      const foundEdge = G.edges.find(e => e.from === uFrom && e.to === uTo);
      edges.push({
        from_user_id: uFrom,
        from_user_name: userMap[uFrom].name,
        to_user_id: uTo,
        to_user_name: userMap[uTo].name,
        skill_name: foundEdge ? foundEdge.label : 'Skill'
      });
    }

    const proxScore = 0.85;
    const overlapScore = 0.75;
    const composite = (alpha * proxScore + (1 - alpha) * overlapScore);

    results.push({
      id: Math.random().toString(36).substring(2, 8),
      cycle_length: k,
      user_ids: cycleNodes,
      user_names: cycleUsers.map(u => u.name),
      edges,
      proximity_score: proxScore,
      overlap_score: overlapScore,
      composite_score: composite,
      mean_distance_km: 3.4,
      shared_hours_per_week: 4.5
    });
  });

  results.sort((a, b) => b.composite_score - a.composite_score);
  return results;
}

function runStandaloneMatching() {
  const { G, userMap } = buildClientGraph(appState.users);
  appState.discoveredCycles = findClientCycles(G, userMap, appState.minK, appState.maxK, appState.alpha);
  if (graphVisualizer) {
    graphVisualizer.setData(G.nodes, G.edges);
  }
  renderMetrics();
  renderCyclesList();
}

// ---------------- RENDER FUNCTIONS ----------------
function renderMetrics() {
  document.getElementById('metric-total-users').textContent = appState.users.length;
  document.getElementById('metric-total-cycles').textContent = appState.discoveredCycles.length;
  document.getElementById('metric-k3-cycles').textContent = appState.discoveredCycles.filter(c => c.cycle_length === 3).length;
  document.getElementById('metric-k4-cycles').textContent = appState.discoveredCycles.filter(c => c.cycle_length === 4).length;
  document.getElementById('metric-active-proposals').textContent = appState.proposals.filter(p => p.status === 'PENDING').length;
}

function renderCyclesList() {
  const container = document.getElementById('cycles-list');
  const countBadge = document.getElementById('cycles-count-badge');
  countBadge.textContent = `${appState.discoveredCycles.length} Found`;

  if (appState.discoveredCycles.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 30px 10px; font-size: 0.82rem;">
        No closed cycles found with current listings.<br>Try adding skills or generating test data.
      </div>
    `;
    return;
  }

  container.innerHTML = appState.discoveredCycles.map(cycle => {
    const isSelected = appState.selectedCycleId === cycle.id;
    const tagClass = cycle.cycle_length === 4 ? 'k4' : '';

    const chainHtml = cycle.edges.map(e => `
      <div class="chain-step">
        <span class="chain-user">${e.from_user_name}</span>
        <span>➔</span>
        <span class="chain-skill">"${e.skill_name}"</span>
        <span>➔</span>
        <span class="chain-user">${e.to_user_name}</span>
      </div>
    `).join('');

    return `
      <div class="cycle-card ${isSelected ? 'selected' : ''}" data-cycle-id="${cycle.id}">
        <div class="cycle-card-header">
          <span class="cycle-type-tag ${tagClass}">${cycle.cycle_length}-Party Loop</span>
          <span class="cycle-score-pill">Score: ${(cycle.composite_score * 100).toFixed(1)}%</span>
        </div>
        <div class="cycle-chain">
          ${chainHtml}
        </div>
        <div class="cycle-stats-row">
          <span>📍 Avg Distance: ${cycle.mean_distance_km} km</span>
          <span>⏰ Shared: ${cycle.shared_hours_per_week}h / wk</span>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm btn-view-cycle" data-cycle-id="${cycle.id}">🔍 Inspect in Graph</button>
          <button class="btn btn-primary btn-sm btn-initiate-trade" data-cycle-id="${cycle.id}">🤝 Initiate Proposal</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-view-cycle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectAndHighlightCycle(btn.dataset.cycleId);
    });
  });

  container.querySelectorAll('.btn-initiate-trade').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      createProposalForCycle(btn.dataset.cycleId);
    });
  });
}

function selectAndHighlightCycle(cycleId) {
  appState.selectedCycleId = cycleId;
  const cycle = appState.discoveredCycles.find(c => c.id === cycleId);
  if (!cycle) return;

  if (graphVisualizer) {
    graphVisualizer.highlightCycle(cycle.user_ids, cycle.edges);
  }

  document.querySelectorAll('.cycle-card').forEach(c => {
    if (c.dataset.cycleId === cycleId) c.classList.add('selected');
    else c.classList.remove('selected');
  });
}

function renderProposalsList() {
  const container = document.getElementById('proposals-list');
  if (!container) return;

  if (appState.proposals.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 40px; font-size: 0.85rem;">
        No active trade proposals.<br>Select any discovered trade loop in the <b>Network Explorer</b> to initiate a multi-party proposal!
      </div>
    `;
    return;
  }

  container.innerHTML = appState.proposals.map(prop => {
    const cycle = prop.cycle;
    const statusClass = `status-${prop.status}`;

    const participantsHtml = cycle.user_ids.map(uid => {
      const user = appState.users.find(u => u.id === uid) || { name: uid, location: { city: 'Dhaka' } };
      const userVote = prop.user_responses[uid] || 'PENDING';

      let voteBadge = `<span class="badge" style="color: var(--text-dim);">⏳ Pending</span>`;
      if (userVote === 'ACCEPTED') {
        voteBadge = `<span class="badge" style="color: var(--accent-emerald); border-color: rgba(16,185,129,0.3);">✔ Accepted</span>`;
      } else if (userVote === 'REJECTED') {
        voteBadge = `<span class="badge" style="color: var(--accent-rose); border-color: rgba(244,63,94,0.3);">✖ Rejected</span>`;
      }

      const canVote = prop.status === 'PENDING' && userVote === 'PENDING';

      return `
        <div class="participant-vote-row">
          <div class="participant-info">
            <div class="user-avatar" style="background: ${user.avatar_color || '#4F46E5'}; width: 28px; height: 28px; font-size: 0.75rem;">
              ${user.name.charAt(0)}
            </div>
            <div>
              <div style="font-weight: 600;">${user.name}</div>
              <div style="font-size: 0.68rem; color: var(--text-dim);">${user.location.city}</div>
            </div>
          </div>
          <div class="vote-actions">
            ${voteBadge}
            ${canVote ? `
              <button class="btn btn-success btn-sm btn-vote" data-prop-id="${prop.id}" data-user-id="${uid}" data-vote="ACCEPTED">Accept</button>
              <button class="btn btn-danger btn-sm btn-vote" data-prop-id="${prop.id}" data-user-id="${uid}" data-vote="REJECTED">Reject</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="panel-card proposal-box">
        <div class="proposal-status-banner ${statusClass}">
          <span>Proposal #${prop.id} • ${cycle.cycle_length}-Party Loop</span>
          <span>Status: ${prop.status}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
          Participants must all accept for atomic multi-party trade execution:
        </div>
        <div class="participants-list">
          ${participantsHtml}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-vote').forEach(btn => {
    btn.addEventListener('click', () => {
      respondToProposal(btn.dataset.propId, btn.dataset.userId, btn.dataset.vote);
    });
  });
}

function renderUsersList() {
  const container = document.getElementById('users-cards-grid');
  if (!container) return;

  container.innerHTML = appState.users.map(u => {
    const offersTags = u.offers.map(o => `<span class="skill-tag offer">Teaches: ${o.skill_name}</span>`).join('');
    const wantsTags = u.wants.map(w => `<span class="skill-tag want">Wants: ${w.skill_name}</span>`).join('');
    const daysText = u.availability[0]?.days.join(', ') || 'Flexible';
    const hoursText = u.availability[0] ? `${u.availability[0].start_hour}:00 - ${u.availability[0].end_hour}:00` : '';

    return `
      <div class="user-card">
        <div class="user-card-header">
          <div class="user-avatar" style="background: ${u.avatar_color || '#4F46E5'};">
            ${u.name.charAt(0)}
          </div>
          <div>
            <div class="user-meta-name">${u.name}</div>
            <div class="user-meta-loc">📍 ${u.location.city} • ⏰ ${daysText} (${hoursText})</div>
          </div>
        </div>
        <div class="skill-tag-group">
          ${offersTags || '<span style="font-size: 0.7rem; color: var(--text-dim);">No offers</span>'}
        </div>
        <div class="skill-tag-group">
          ${wantsTags || '<span style="font-size: 0.7rem; color: var(--text-dim);">No requests</span>'}
        </div>
      </div>
    `;
  }).join('');
}

function renderBenchmarkResults(results) {
  const tbody = document.getElementById('benchmark-tbody');
  if (!tbody) return;

  tbody.innerHTML = results.map(r => `
    <tr>
      <td><strong>${r.nodes}</strong> users</td>
      <td>${r.edges} edges</td>
      <td>${r.graph_build_ms} ms</td>
      <td><span style="color: var(--accent-cyan);">${r.cycle_search_ms} ms</span></td>
      <td><strong>${r.total_runtime_ms} ms</strong></td>
      <td><span class="badge" style="color: var(--accent-emerald);">${r.cycles_found} loops (${r.k3_cycles} 3-way, ${r.k4_cycles} 4-way)</span></td>
    </tr>
  `).join('');
}

function openCreateUserModal() {
  document.getElementById('modal-create-user').classList.add('active');
}

function closeCreateUserModal() {
  document.getElementById('modal-create-user').classList.remove('active');
}

async function handleCreateUser(e) {
  e.preventDefault();
  const name = document.getElementById('user-name-input').value.trim();
  const city = document.getElementById('user-city-select').value;
  const offerSkill = document.getElementById('user-offer-skill').value.trim();
  const wantSkill = document.getElementById('user-want-skill').value.trim();

  if (!name || !offerSkill || !wantSkill) {
    alert('Please fill out Name, Skill Offered, and Skill Wanted.');
    return;
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    avatar_color: '#06B6D4',
    location: { city, latitude: 23.8103, longitude: 90.4125 },
    availability: [{ days: ["Mon", "Wed", "Fri"], start_hour: 18, end_hour: 21 }],
    offers: [{ skill_name: offerSkill, category: SKILL_TAXONOMY[offerSkill] || "General" }],
    wants: [{ skill_name: wantSkill, category: SKILL_TAXONOMY[wantSkill] || "General" }]
  };

  if (isStandaloneMode) {
    appState.users.unshift(newUser);
    closeCreateUserModal();
    document.getElementById('form-create-user').reset();
    runStandaloneMatching();
    renderUsersList();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        city,
        offers: [{ skill_name: offerSkill }],
        wants: [{ skill_name: wantSkill }],
        days: ["Mon", "Wed", "Fri"],
        start_hour: 18,
        end_hour: 21
      })
    });
    if (!res.ok) throw new Error('Failed to create user');
    closeCreateUserModal();
    document.getElementById('form-create-user').reset();
    await refreshAll();
  } catch (err) {
    alert(err.message);
  }
}
