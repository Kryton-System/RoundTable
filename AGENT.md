# AGENT.md — AI Agent Guidelines & Context

This file serves as the universal context, architectural blueprint, and operational instruction manual for any AI coding assistant (e.g., Antigravity, Claude, ChatGPT, Cursor, Copilot, Roo Code) working on **The Round Table Exchange (RTE)**.

---

## 🎯 Project Overview & Mission

**The Round Table Exchange (RTE)** is a multi-party skill bartering network designed to solve the **"Double Coincidence of Wants"** problem in direct peer-to-peer exchanges without requiring synthetic currency or time credits.

Instead of only matching $A \leftrightarrow B$ (1-to-1), RTE models users and their skills as a directed compatibility graph and detects closed multi-person barter loops of length $k=3$ (triangular) and $k=4$ (quad):
$$\text{User A } \xrightarrow{\text{teaches Python}} \text{User B } \xrightarrow{\text{teaches Guitar}} \text{User C } \xrightarrow{\text{teaches Spanish}} \text{User A}$$

---

## 🏗️ Repository Architecture

```
RoundTable/
├── backend/
│   ├── app.py                 # FastAPI REST API routes & static asset serving
│   ├── models.py              # Pydantic data schemas (User, SkillListing, TradeCycle, TradeProposal)
│   ├── graph_engine.py        # Directed multigraph construction, Bounded DFS (k=3,4), Ranking
│   ├── workflow.py            # Multi-party atomic confirmation state machine
│   ├── synthetic_data.py      # Dhaka geographic presets, synthetic population generator & benchmarks
│   ├── requirements.txt       # Python dependencies (fastapi, uvicorn, networkx, pydantic, numpy, pytest)
│   └── test_engine.py         # Pytest test suite (7 comprehensive test cases)
├── frontend/
│   ├── index.html             # Semantic Single-Page Application (SPA) dashboard layout
│   ├── css/
│   │   └── style.css          # Dark-mode glassmorphic design system (CSS variables, responsive)
│   └── js/
│       ├── app.js             # Dual-mode client (FastAPI REST API + In-Browser pure JS engine fallback)
│       └── graph_viz.js       # Vis.js interactive network visualizer & cycle highlighter
├── docs/                      # Academic LaTeX proposal sources, reports, and diagrams
├── .github/workflows/
│   └── deploy-pages.yml       # Automated GitHub Pages CI/CD deployment
├── README.md                  # Public repository documentation
├── PROJECT.md                 # Full technical specification & project manual
└── AGENT.md                   # This instruction file for AI agents
```

---

## ⚙️ Technology Stack & Dependencies

| Component | Technology | Role / Purpose |
|---|---|---|
| **Backend Framework** | FastAPI (Python 3.10+) | High-performance async REST API |
| **Server Runtime** | Uvicorn | ASGI web server |
| **Graph Processing** | NetworkX & NumPy | Directed graph manipulation & data structures |
| **Data Validation** | Pydantic v2 | Type safety & request/response modeling |
| **Testing** | Pytest | Automated verification of graph algorithms & state machine |
| **Frontend Core** | Vanilla HTML5 / ES6+ JS / Vanilla CSS | Lightweight, dependency-free dashboard |
| **Graph Visualization** | Vis-Network (CDN) | Interactive physics-based graph rendering |
| **Hosting & CI/CD** | GitHub Pages & GitHub Actions | Static hosting with automated deployment |

---

## 🧠 Core Algorithmic Invariants & Critical Rules

### 1. Dual-Engine Architecture (Local Server + GitHub Pages Standalone)
- **Local / Server Mode**: The frontend connects to the FastAPI backend at `http://127.0.0.1:8000`.
- **Standalone Mode (GitHub Pages)**: `frontend/js/app.js` contains an in-browser pure JavaScript matching engine (`buildClientGraph`, `findClientCycles`). If the backend is unavailable or when running on GitHub Pages, the app automatically runs fully client-side with zero backend dependencies.
- **Agent Guideline**: Whenever you update matching rules, Dhaka location presets, or skill taxonomy in `backend/`, **always keep `frontend/js/app.js` in sync** so the live demo stays functional.

### 2. Bounded-Depth DFS Cycle Detection ($k \in [3, 4]$)
- Cycle search is bounded to depth $k=3$ and $k=4$ (and optionally $k=2$).
- Theoretical complexity: $O(n \cdot m^{k-1})$.
- **Canonical Cycle Deduplication**: Cycles must be normalized to start with the minimum node ID (e.g. `(u1, u2, u3)`) to prevent duplicate rotations (`(u2, u3, u1)`).
- **⚠️ Memory Protection Rule**: On dense synthetic graphs, cycle count can explode combinatorially. `find_cycles_bounded_dfs` MUST maintain a safety cap (`max_cycles=100` by default) and stop search early once the limit is reached. **Never remove the safety cap.**

### 3. Multi-Signal Ranking Function
Discovered cycles are scored using:
$$\text{score}(C) = \alpha \cdot \text{prox}(C) + (1 - \alpha) \cdot \text{overlap}(C)$$
- $\alpha \in [0.0, 1.0]$: Tunable weight (default `0.5`).
- $\text{prox}(C) = \exp(-d_{\text{mean}} / 15.0)$: Geographic proximity decay using Haversine great-circle distance between participants.
- $\text{overlap}(C) = \min(1.0, \text{shared\_hours} / 6.0)$: Weekly schedule time window intersection across all participants.

### 4. Group Confirmation State Machine
- Lifecycle: `PENDING` $\to$ `CONFIRMED` | `REJECTED` | `EXPIRED`.
- **Atomic Requirement**: Every participant in the cycle must respond with `ACCEPTED` for the proposal to become `CONFIRMED`.
- **Single Veto**: Any participant responding with `REJECTED` immediately transitions the entire proposal to `REJECTED`.

---

## 🛠️ Common Commands & Workflows

### Run the Backend Server
```bash
python -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

### Run the Test Suite
```bash
python -m pytest backend/test_engine.py -v
```

### Deploy / Sync to GitHub Pages
The project deploys via GitHub Actions (`.github/workflows/deploy-pages.yml`) and also supports the `gh-pages` subtree:
```bash
git add .
git commit -m "your commit message"
git push origin main
git subtree push --prefix frontend origin gh-pages
```

---

## 🚨 Guidelines for AI Assistants Modifying this Repo

1. **Preserve Compatibility**: Keep the frontend compatible with both the FastAPI backend and standalone static GitHub Pages hosting.
2. **Never Break Unit Tests**: Always run `python -m pytest backend/test_engine.py -v` after modifying backend code.
3. **Guard Against Memory Leaks**: When adjusting synthetic data generator or graph algorithms, ensure memory usage remains bounded ($< 50\text{ MB}$).
4. **Maintain Documentation**: If modifying APIs or data schemas, update both `PROJECT.md` and `README.md`.
