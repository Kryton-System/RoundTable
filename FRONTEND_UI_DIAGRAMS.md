# 🎨 FRONTEND_UI_DIAGRAMS.md — Frontend UI/UX Scaffolding Diagrams (Draw.io Mermaid.js)

This document contains **strictly Frontend UI/UX Scaffolding Diagrams**, visual wireframes, component hierarchies, user interaction flows, and screen state transitions for Draw.io.

> ### 💡 How to use in Draw.io:
> 1. Open **[draw.io](https://app.diagrams.net)**.
> 2. Click: **`Arrange` $\rightarrow$ `Insert` $\rightarrow$ `Advanced` $\rightarrow$ `Mermaid`**.
> 3. Copy & paste any diagram block below into the box and click **`Insert`**.

---

## 📑 Frontend Diagrams Directory
1. [Diagram 1: Screen Layout & Wireframe Grid Scaffolding](#diagram-1-screen-layout--wireframe-grid-scaffolding)
2. [Diagram 2: Frontend Component Tree & UI Hierarchy](#diagram-2-frontend-component-tree--ui-hierarchy)
3. [Diagram 3: Navigation & Tab Switching UX State Flow](#diagram-3-navigation--tab-switching-ux-state-flow)
4. [Diagram 4: Interactive Graph Visualizer UI States & Highlighting](#diagram-4-interactive-graph-visualizer-ui-states--highlighting)
5. [Diagram 5: Group Confirmation Console UI & Voting States](#diagram-5-group-confirmation-console-ui--voting-states)
6. [Diagram 6: User Registration Modal UX Flow](#diagram-6-user-registration-modal-ux-flow)

---

## Diagram 1: Screen Layout & Wireframe Grid Scaffolding
*Visual layout mapping of all interface sections, control panels, interactive canvas, and sidebar feeds.*

```mermaid
flowchart TD
    subgraph Viewport["Browser Viewport (100vw x 100vh)"]
        
        subgraph TopBar["Header Section (Sticky Top - 68px)"]
            Logo["[🔄] Brand Icon & Title"] --- NavTabs["[🌐 Explorer] [🤝 Confirmations] [👥 Users] [⚡ Benchmarks]"] --- TopActions["[● Engine Active] [🔄 Reset Demo]"]
        end

        subgraph StatsBar["Metrics Strip Section (Real-Time Counter Cards)"]
            M1["Total Users\n[ 7 ]"] --- M2["Discovered Cycles\n[ 2 ]"] --- M3["3-Party Loops\n[ 1 ]"] --- M4["4-Party Loops\n[ 1 ]"] --- M5["Active Proposals\n[ 0 ]"]
        end

        subgraph MainGrid["Tab 1 Workspace: 3-Column Explorer Grid (calc(100vh - 220px))"]
            
            subgraph LeftCol["Left Panel: Controls (320px)"]
                L1["Ranking Weight Slider (α)\n[===●=======] 0.50"]
                L2["Loop Depth Bounds (k)\n[Min: 3] [Max: 4]"]
                L3["Action Trigger\n[🚀 Run Cycle Matching]"]
                L4["Quick Synthetic Inject\n[+20 Users] [+50 Users]"]
                L5["User Action\n[➕ Add Custom Profile]"]
            end

            subgraph CenterCol["Center: Interactive Graph Canvas (Fluid Width)"]
                G_Overlay["Top Overlay: [🎯 Center View] [✨ Reset Highlights]"]
                G_Canvas["Vis.js Physics Canvas\n(Floating User Nodes + Directional Skill Edges)"]
                G_Legend["Bottom Legend: (● User) (-- Skill Link) (● Active Loop)"]
            end

            subgraph RightCol["Right Panel: Discovered Cycles (380px)"]
                R_Header["Header: 🔁 Discovered Loops [2 Found]"]
                R_Card1["Cycle Card #1 (3-Party)\nScore: 92.4%\nAlice ➔ Bob ➔ Charlie ➔ Alice\n[🔍 Inspect]  [🤝 Propose]"]
                R_Card2["Cycle Card #2 (4-Party)\nScore: 84.1%\nNafisa ➔ Zubair ➔ Anika ➔ Farhan\n[🔍 Inspect]  [🤝 Propose]"]
            end
        end

        subgraph ModalLayer["Modal Overlay Layer (Fixed Backdrop Blur)"]
            ModalBox["➕ Register User Profile Modal\n[Name] [City Dropdown] [Offer Skill] [Want Skill]\n[Cancel]  [Create Profile]"]
        end
    end

    TopBar --> StatsBar
    StatsBar --> MainGrid
```

---

## Diagram 2: Frontend Component Tree & UI Hierarchy
*Component structure representing DOM nodes, template containers, and UI widgets.*

```mermaid
graph TD
    App["<AppRoot> (#app)"]
    
    Header["<Header.app-header>"]
    Brand["<BrandWrapper>"]
    Nav["<NavTabs.nav-tabs>"]
    StatusBadge["<EngineBadge.badge>"]
    ResetBtn["<Button#btn-reset-demo>"]

    Metrics["<Section.metrics-strip>"]
    MCard1["<MetricCard: Users>"]
    MCard2["<MetricCard: Cycles>"]
    MCard3["<MetricCard: K3>"]
    MCard4["<MetricCard: K4>"]
    MCard5["<MetricCard: Proposals>"]

    Main["<Main.app-main>"]
    Tab1["<TabContent#tab-explorer> (Active)"]
    Tab2["<TabContent#tab-proposals>"]
    Tab3["<TabContent#tab-users>"]
    Tab4["<TabContent#tab-benchmarks>"]

    %% Tab 1 Subcomponents
    Grid1["<Grid.explorer-grid>"]
    PanelCtrl["<Panel: Algorithm Controls>"]
    SliderAlpha["<Slider#alpha-slider>"]
    SelectK["<Select#min-k-select / #max-k-select>"]
    BtnMatch["<Button#btn-run-match>"]

    CanvasContainer["<Section.graph-container>"]
    VisCanvas["<Div#network-canvas>"]
    ControlsOverlay["<Div.graph-overlay-controls>"]
    LegendOverlay["<Div.graph-legend>"]

    PanelCycles["<Panel: Discovered Cycles>"]
    CyclesList["<Div#cycles-list>"]
    CycleCard["<Div.cycle-card>"]
    BtnInspect["<Button.btn-view-cycle>"]
    BtnPropose["<Button.btn-initiate-trade>"]

    %% Tab 2 Subcomponents
    ProposalsList["<Div#proposals-list>"]
    ProposalBox["<Div.proposal-box>"]
    VoteRow["<Div.participant-vote-row>"]
    BtnVote["<Button.btn-vote (Accept/Reject)>"]

    %% Modal
    Modal["<Modal#modal-create-user>"]
    FormUser["<Form#form-create-user>"]

    App --> Header
    App --> Metrics
    App --> Main
    App --> Modal

    Header --> Brand
    Header --> Nav
    Header --> StatusBadge
    Header --> ResetBtn

    Metrics --> MCard1
    Metrics --> MCard2
    Metrics --> MCard3
    Metrics --> MCard4
    Metrics --> MCard5

    Main --> Tab1
    Main --> Tab2
    Main --> Tab3
    Main --> Tab4

    Tab1 --> Grid1
    Grid1 --> PanelCtrl
    Grid1 --> CanvasContainer
    Grid1 --> PanelCycles

    PanelCtrl --> SliderAlpha
    PanelCtrl --> SelectK
    PanelCtrl --> BtnMatch

    CanvasContainer --> VisCanvas
    CanvasContainer --> ControlsOverlay
    CanvasContainer --> LegendOverlay

    PanelCycles --> CyclesList
    CyclesList --> CycleCard
    CycleCard --> BtnInspect
    CycleCard --> BtnPropose

    Tab2 --> ProposalsList
    ProposalsList --> ProposalBox
    ProposalBox --> VoteRow
    VoteRow --> BtnVote

    Modal --> FormUser
```

---

## Diagram 3: Navigation & Tab Switching UX State Flow
*User navigation flow across the 4 main workspaces.*

```mermaid
stateDiagram-v2
    [*] --> TabExplorer: Initial Page Load

    state TabExplorer {
        [*] --> ViewNetworkGraph
        ViewNetworkGraph --> InspectCycle: Click "Inspect in Graph"
        ViewNetworkGraph --> TuneRanking: Adjust α Slider
        ViewNetworkGraph --> InjectUsers: Click "+20 / +50 Users"
    }

    state TabProposals {
        [*] --> ViewActiveProposals
        ViewActiveProposals --> CastVote: Click "Accept" or "Reject"
        CastVote --> InstantStateUpdate: UI updates to Confirmed / Rejected
    }

    state TabUsers {
        [*] --> BrowseUserCards
        BrowseUserCards --> OpenAddModal: Click "Add New User Profile"
        OpenAddModal --> BrowseUserCards: User Created & Grid Refreshed
    }

    state TabBenchmarks {
        [*] --> ViewEmptyBenchmark
        ViewEmptyBenchmark --> RunBenchmark: Click "Run Scalability Benchmark"
        RunBenchmark --> RenderTelemetry: Telemetry Table Populated (ms Latencies)
    }

    TabExplorer --> TabProposals: Click "🤝 Trade Confirmations" Tab OR Click "🤝 Initiate Proposal" on Card
    TabExplorer --> TabUsers: Click "👥 User Profiles" Tab
    TabExplorer --> TabBenchmarks: Click "⚡ Scalability Benchmarks" Tab

    TabProposals --> TabExplorer: Click "🌐 Network Explorer" Tab
    TabUsers --> TabExplorer: Click "🌐 Network Explorer" Tab
    TabBenchmarks --> TabExplorer: Click "🌐 Network Explorer" Tab
```

---

## Diagram 4: Interactive Graph Visualizer UI States & Highlighting
*Visual states of the ForceAtlas2 physics canvas and cycle illumination mechanism.*

```mermaid
stateDiagram-v2
    [*] --> LivingOrganicFloat: Graph Rendered (ForceAtlas2 Physics)

    state LivingOrganicFloat {
        note right of LivingOrganicFloat: All nodes colored with pop palette\nEdges at 45% opacity\nGraceful continuous drift
    }

    LivingOrganicFloat --> NodeHoverState: Mouse hovers over User Node
    state NodeHoverState {
        note right of NodeHoverState: Tooltip displays: Name, City, Offered Skills, Wanted Skills\nNode borders glow #FFE600 (Yellow)
    }
    NodeHoverState --> LivingOrganicFloat: Mouse leaves node

    LivingOrganicFloat --> CycleHighlightedState: User clicks "Inspect in Graph" on a Cycle Card
    state CycleHighlightedState {
        note right of CycleHighlightedState: Cycle Nodes: Scale up (28px), turn #00F5D4 (Electric Mint)\nCycle Edges: Width 4.0px, #FF0055 (Neon Coral), Yellow Skill Badges\nNon-Cycle Nodes & Edges: Dimmed to 18% opacity
    }

    CycleHighlightedState --> CycleHighlightedState: User selects another Cycle Card
    CycleHighlightedState --> LivingOrganicFloat: User clicks "✨ Reset Highlights"
    CycleHighlightedState --> LivingOrganicFloat: User clicks "🎯 Center View"
```

---

## Diagram 5: Group Confirmation Console UI & Voting States
*Atomic multi-user voting card states in Tab 2.*

```mermaid
flowchart TD
    subgraph CardUI["Trade Proposal Card Component (#tab-proposals)"]
        Banner["Status Banner\n[Proposal #a3f9 • 3-Party Loop]  [STATUS: ⏳ PENDING]"]
        
        subgraph Participant1["Participant 1: Ahmmad (Badda)"]
            P1_Info["Ahmmad Khan"] --- P1_Badge["Badge: ✔ Accepted"]
        end

        subgraph Participant2["Participant 2: Sumaia (Gulshan)"]
            P2_Info["Sumaia Ismail"] --- P2_Actions["[ ✔ Accept ]   [ ✖ Reject ]"]
        end

        subgraph Participant3["Participant 3: Tanvir (Banani)"]
            P3_Info["Tanvir Ahmed"] --- P3_Actions["[ ✔ Accept ]   [ ✖ Reject ]"]
        end
    end

    Banner --> Participant1
    Participant1 --> Participant2
    Participant2 --> Participant3

    P2_Actions -->|Click Accept| CheckAllVotes{Did All Members Accept?}
    P2_Actions -->|Click Reject| TriggerVeto[Immediate Single Veto]

    CheckAllVotes -- Yes --> StateConfirmed["Banner changes to: 🟢 STATUS: CONFIRMED\nButtons disappear\nTrade successfully executed"]
    CheckAllVotes -- No --> StatePending["Banner remains: 🟡 STATUS: PENDING\nWaiting for remaining members"]
    TriggerVeto --> StateRejected["Banner changes to: 🔴 STATUS: REJECTED\nProposal cancelled"]
```

---

## Diagram 6: User Registration Modal UX Flow
*Dialog opening, form validation, and instant state update flow.*

```mermaid
sequenceDiagram
    autonumber
    actor User as Tester
    participant UI as Dashboard View
    participant Modal as Create User Modal (#modal-create-user)
    participant State as Application State (appState)
    participant Graph as Vis.js Network

    User->>UI: Clicks "➕ Add Custom User Profile" Button
    UI->>Modal: Adds class .active (Backdrop blur + Scale in)
    Modal-->>User: Displays Form (Name, Dhaka Neighborhood, Skill Offered, Skill Wanted)

    User->>Modal: Enters: "Farhan", "Mirpur-10", Teaches: "React", Wants: "UI/UX"
    User->>Modal: Clicks "Create Profile" Submit Button

    Modal->>Modal: Validates required input fields
    Modal->>State: Appends new user object with random avatar color
    Modal->>UI: Removes class .active (Dismisses modal)
    
    State->>State: Re-runs Cycle Matching Engine
    State->>Graph: Injects new node & re-evaluates barter edges
    State->>UI: Updates User Cards Grid & Metrics Bar (Total Users: +1)
```
