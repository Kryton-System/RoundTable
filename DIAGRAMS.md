# 📊 DIAGRAMS.md — Complete Mermaid.js Diagrams for Draw.io

This document contains all architectural, algorithmic, workflow, and sequence diagrams for **The Round Table Exchange (RTE)**.

> ### 💡 How to use these in Draw.io:
> 1. Open **[draw.io](https://app.diagrams.net)** (or the Draw.io desktop app).
> 2. Click on the top menu: **`Arrange` $\rightarrow$ `Insert` $\rightarrow$ `Advanced` $\rightarrow$ `Mermaid`**.
> 3. Copy & paste any of the code blocks below into the text box and click **`Insert`**.

---

## 📑 Diagram Directory
1. [Diagram 1: End-to-End System Architecture & Data Flow](#diagram-1-end-to-end-system-architecture--data-flow)
2. [Diagram 2: Multi-Party Barter Loop vs Bilateral 1-to-1 Trade](#diagram-2-multi-party-barter-loop-vs-bilateral-1-to-1-trade)
3. [Diagram 3: Bounded-Depth DFS Cycle Detection Logic](#diagram-3-bounded-depth-dfs-cycle-detection-logic)
4. [Diagram 4: Multi-Signal Ranking Heuristic Engine](#diagram-4-multi-signal-ranking-heuristic-engine)
5. [Diagram 5: Group Confirmation State Machine](#diagram-5-group-confirmation-state-machine)
6. [Diagram 6: Cycle Discovery & Inspection Sequence](#diagram-6-cycle-discovery--inspection-sequence)
7. [Diagram 7: Atomic Multi-User Proposal Consensus Sequence](#diagram-7-atomic-multi-user-proposal-consensus-sequence)
8. [Diagram 8: Dual-Engine Client-Side vs API Execution Flow](#diagram-8-dual-engine-client-side-vs-api-execution-flow)
9. [Diagram 9: Frontend Component Hierarchy & UI Scaffolding](#diagram-9-frontend-component-hierarchy--ui-scaffolding)

---

## Diagram 1: End-to-End System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client["Frontend Application Layer (Vanilla JS + Vis.js)"]
        UI_Visualizer["Live Graph Canvas\n(ForceAtlas2 Physics)"]
        UI_Loops["Ranked Cycle Explorer\n(Sidebar Cards)"]
        UI_Proposals["Group Confirmation Console\n(State Machine UI)"]
        UI_Users["User & Listing Manager\n(Profile Cards & Modals)"]
        UI_Benchmark["Scalability Benchmark View\n(Telemetry Table)"]
    end

    subgraph BackendAPI["Backend API Gateway (FastAPI / Python)"]
        Router["REST API Router (app.py)"]
        Models["Pydantic Data Models (models.py)"]
        Store[("In-Memory State Store / DB")]
    end

    subgraph Engine["Core Algorithmic Engine"]
        GraphBuilder["Directed Multigraph Builder"]
        DFS["Bounded-Depth DFS Finder\n(k = 3, 4 with Early Pruning)"]
        Ranking["Multi-Signal Ranking Engine\n(Haversine Distance + Schedule Overlap)"]
        StateMachine["Group Confirmation Workflow Engine\n(Atomic Consensus)"]
    end

    subgraph BenchmarkLayer["Synthetic & Benchmarking Module"]
        SynthGen["Dhaka Synthetic Population Generator"]
        BenchRunner["Scalability Benchmarking Runner"]
    end

    UI_Visualizer <-->|REST / JSON| Router
    UI_Loops <-->|REST / JSON| Router
    UI_Proposals <-->|REST / JSON| Router
    UI_Users <-->|REST / JSON| Router
    UI_Benchmark <-->|REST / JSON| Router

    Router --> Store
    Store --> GraphBuilder
    GraphBuilder --> DFS
    DFS --> Ranking
    Ranking --> Router
    Router --> StateMachine
    Router --> SynthGen
    SynthGen --> BenchRunner
```

---

## Diagram 2: Multi-Party Barter Loop vs Bilateral 1-to-1 Trade

```mermaid
flowchart LR
    subgraph Traditional["1-to-1 Bilateral Trade (Double Coincidence Bottleneck)"]
        U_A1["User A\nOffers: Python\nWants: Guitar"] --x|No Direct Match| U_B1["User B\nOffers: Guitar\nWants: Spanish"]
    end

    subgraph RTE["The Round Table Exchange (3-Party & 4-Party Cycles)"]
        U_A2["User A (Ahmmad)\nOffers: Python\nWants: Guitar"] -->|Teaches Python| U_C2["User C (Tanvir)\nOffers: Spanish\nWants: Python"]
        U_B2["User B (Sumaia)\nOffers: Guitar\nWants: Spanish"] -->|Teaches Guitar| U_A2
        U_C2 -->|Teaches Spanish| U_B2
    end
```

---

## Diagram 3: Bounded-Depth DFS Cycle Detection Logic

```mermaid
flowchart TD
    Start([Start Cycle Discovery]) --> InitSet[Initialize discovered_cycles = Set and max_cycles = 100]
    InitSet --> LoopNodes[Iterate each start_node in Graph G]
    
    LoopNodes --> CheckCap{discovered_cycles >= max_cycles?}
    CheckCap -- Yes --> End([Return Ranked Cycles])
    CheckCap -- No --> CallDFS[Call DFS path=[start_node], visited={start_node}]

    CallDFS --> CheckPathLen{Path Length > max_k?}
    CheckPathLen -- Yes --> Backtrack[Backtrack / Return]
    CheckPathLen -- No --> IterateNeighbors[Iterate Successors of current_node]

    IterateNeighbors --> CheckClosingEdge{Neighbor == start_node AND Path Length >= min_k?}
    CheckClosingEdge -- Yes --> Canonical[Normalize Cycle Rotation: Min Node ID First]
    Canonical --> AddCycle[Add to discovered_cycles Set]
    AddCycle --> CheckCap

    CheckClosingEdge -- No --> CheckValidNext{Neighbor not in visited AND Neighbor > start_node?}
    CheckValidNext -- Yes --> PushPath[Push neighbor to path & visited]
    PushPath --> RecurseDFS[Recursive DFS Visit]
    RecurseDFS --> PopPath[Pop neighbor from path & visited]
    PopPath --> IterateNeighbors
    CheckValidNext -- No --> IterateNeighbors
```

---

## Diagram 4: Multi-Signal Ranking Heuristic Engine

```mermaid
flowchart TD
    subgraph Inputs["Discovered Cycle Input"]
        Cycle["Cycle C = (v1, v2, ... vk)"]
    end

    subgraph Signal1["Signal 1: Geographic Proximity"]
        GPS["Participant GPS Coordinates\n(Lat, Lon)"] --> Haversine["Calculate Pairwise Haversine Distances"]
        Haversine --> MeanDist["Compute Mean Cycle Distance (d_mean in km)"]
        MeanDist --> ProxFormula["prox(C) = exp(-d_mean / 15.0)"]
    end

    subgraph Signal2["Signal 2: Schedule Overlap"]
        Schedule["Weekly Availability Windows\n(7 Days x 24 Hours)"] --> Intersect["Compute Common Active Time Slot Intersection"]
        Intersect --> SharedHours["Total Shared Hours per Week"]
        SharedHours --> OverlapFormula["overlap(C) = min(1.0, shared_hours / 6.0)"]
    end

    subgraph Composite["Composite Ranking Formula"]
        Weight["Tunable Alpha Weight (α in [0.0, 1.0])"]
        ProxFormula --> ScoreCalc["score(C) = α · prox(C) + (1 - α) · overlap(C)"]
        OverlapFormula --> ScoreCalc
        Weight --> ScoreCalc
        ScoreCalc --> SortedCycles["Sorted List of Trade Loops (Highest Score First)"]
    end
```

---

## Diagram 5: Group Confirmation State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Proposal Dispatched to All Cycle Members
    
    state PENDING {
        [*] --> AwaitingVotes
        AwaitingVotes --> MemberVote: Participant Submits Decision
        MemberVote --> AwaitingVotes: Member Accepted (Others Pending)
    }

    PENDING --> CONFIRMED: All k Participants Accepted (Atomic Consensus)
    PENDING --> REJECTED: Any Participant Rejects (Single Veto)
    PENDING --> EXPIRED: Decision Deadline Exceeded (24h Timeout)

    CONFIRMED --> [*]: Trade Executed & Contact Shared
    REJECTED --> [*]: Proposal Cancelled
    EXPIRED --> [*]: Proposal Voided
```

---

## Diagram 6: Cycle Discovery & Inspection Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Tester / Evaluator
    participant UI as Frontend Dashboard
    participant Canvas as Vis.js Network Canvas
    participant Backend as FastAPI Matching Engine

    User->>UI: Adjusts α slider & Clicks "🚀 Run Cycle Matching Engine"
    UI->>Backend: POST /api/match/run { alpha: 0.50, min_k: 3, max_k: 4 }
    Backend->>Backend: Build multigraph & execute Bounded DFS (k=3,4)
    Backend->>Backend: Compute Haversine distance & schedule overlap ranking
    Backend-->>UI: Returns { cycles: [...], graph: { nodes, edges } }

    UI->>Canvas: Loads formatted nodes & edges with ForceAtlas2 physics
    UI->>UI: Injects Ranked Cycle Cards into Sidebar
    
    User->>UI: Clicks "🔍 Inspect in Graph" on 3-Party Loop
    UI->>Canvas: Calls highlightCycle(userIds, cycleEdges)
    Canvas-->>Canvas: Enlarges cycle nodes (Mint Green)
    Canvas-->>Canvas: Illuminates cycle edges (Hot Coral with Skill Badges)
    Canvas-->>Canvas: Dims non-cycle nodes/edges to 18% opacity
```

---

## Diagram 7: Atomic Multi-User Proposal Consensus Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Alice as User 1 (Alice)
    actor Bob as User 2 (Bob)
    actor Charlie as User 3 (Charlie)
    participant Engine as Workflow State Machine
    participant UI as Group Confirmation Console

    Note over Engine: Trade Proposal #a3f9 Created for Loop (Alice ➔ Bob ➔ Charlie ➔ Alice)
    Engine->>UI: Broadcast Proposal (Status: PENDING)

    Alice->>Engine: POST /api/proposals/a3f9/respond { user_id: 'alice', response: 'ACCEPTED' }
    Engine-->>UI: Update Status: Alice (ACCEPTED), Bob (PENDING), Charlie (PENDING) -> Status: PENDING

    Bob->>Engine: POST /api/proposals/a3f9/respond { user_id: 'bob', response: 'ACCEPTED' }
    Engine-->>UI: Update Status: Alice (ACCEPTED), Bob (ACCEPTED), Charlie (PENDING) -> Status: PENDING

    alt Charlie Accepts
        Charlie->>Engine: POST /api/proposals/a3f9/respond { user_id: 'charlie', response: 'ACCEPTED' }
        Note over Engine: All 3 Members Accepted! Atomic Consensus Reached.
        Engine-->>UI: Status Transitions to CONFIRMED (Green Banner)
    else Charlie Rejects
        Charlie->>Engine: POST /api/proposals/a3f9/respond { user_id: 'charlie', response: 'REJECTED' }
        Note over Engine: Single Veto Triggered!
        Engine-->>UI: Status Transitions to REJECTED (Red Banner)
    end
```

---

## Diagram 8: Dual-Engine Client-Side vs API Execution Flow

```mermaid
flowchart TD
    Start([Page Loads / DOM Ready]) --> TestPing{HTTP GET /api/meta}
    
    TestPing -- 200 OK Response --> ModeAPI[API Mode Activated: Live FastAPI Backend]
    TestPing -- Network Error / 404 / GitHub Pages --> ModeClient[Standalone Mode Activated: In-Browser Pure JS Engine]

    subgraph API_Path["Live Backend Mode"]
        ModeAPI --> CallFastAPI["UI triggers fetch() to FastAPI endpoints"]
        CallFastAPI --> PyEngine["Python networkx & graph_engine.py execute matching"]
        PyEngine --> JSONResponse["JSON response returned to UI"]
    end

    subgraph Client_Path["GitHub Pages Standalone Mode"]
        ModeClient --> JSLocal["app.js initializes in-memory client state"]
        JSLocal --> JSGraph["buildClientGraph() constructs graph in JavaScript"]
        JSGraph --> JSSearch["findClientCycles() runs Bounded DFS in browser"]
    end

    JSONResponse --> RenderCanvas["Vis.js renders interactive network canvas"]
    JSSearch --> RenderCanvas
```

---

## Diagram 9: Frontend Component Hierarchy & UI Scaffolding

```mermaid
classDiagram
    class AppRoot {
        +appState
        +graphVisualizer
        +init()
        +switchTab(tabId)
    }

    class AppHeader {
        +BrandTitle
        +NavTabs
        +StatusBadge
        +ResetDemoBtn
    }

    class MetricsStrip {
        +TotalUsersCounter
        +DiscoveredCyclesCounter
        +K3LoopsCounter
        +K4LoopsCounter
        +ActiveProposalsCounter
    }

    class TabExplorer {
        +AlphaWeightSlider
        +MinMaxKSelectors
        +RunMatchButton
        +SyntheticInjectButtons
        +NetworkCanvasContainer
        +DiscoveredCyclesSidebar
    }

    class TabProposals {
        +ProposalsListContainer
        +ProposalStatusBanner
        +ParticipantVoteRows
        +AcceptRejectButtons
    }

    class TabUsers {
        +AddUserTrigger
        +UserCardsGrid
        +SkillOfferWantTags
        +ScheduleBadges
    }

    class TabBenchmarks {
        +RunBenchmarkButton
        +TelemetryDataTable
        +LatencyMetrics
    }

    class CreateUserModal {
        +NameInput
        +DhakaCityDropdown
        +OfferSkillInput
        +WantSkillInput
        +SubmitButton
    }

    AppRoot *-- AppHeader
    AppRoot *-- MetricsStrip
    AppRoot *-- TabExplorer
    AppRoot *-- TabProposals
    AppRoot *-- TabUsers
    AppRoot *-- TabBenchmarks
    AppRoot *-- CreateUserModal
```
