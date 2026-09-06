import os
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.models import (
    User, SkillListing, ListingType, Location, ScheduleWindow,
    TradeCycle, TradeProposal, ProposalStatus, ResponseStatus
)
from backend.graph_engine import MatchingEngine
from backend.workflow import ProposalWorkflowManager
from backend.synthetic_data import (
    generate_preset_demo_users,
    generate_synthetic_population,
    run_scalability_benchmark,
    SKILL_TAXONOMY,
    DHAKA_LOCATIONS
)

app = FastAPI(title="The Round Table Exchange (RTE) API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory State Store
users_db: Dict[str, User] = {}
matching_engine = MatchingEngine(alpha=0.5, max_cycle_length=4, min_cycle_length=3)
workflow_manager = ProposalWorkflowManager()
discovered_cycles_cache: List[TradeCycle] = []


def initialize_default_data():
    """Initializes the in-memory database with default demo users containing 3-party & 4-party loops."""
    global users_db, discovered_cycles_cache
    demo_users = generate_preset_demo_users()
    users_db = {u.id: u for u in demo_users}
    # Run initial matching
    G, user_map = matching_engine.build_graph(list(users_db.values()))
    discovered_cycles_cache = matching_engine.find_cycles_bounded_dfs(G, user_map)


initialize_default_data()


# ---------------- API ROUTES ----------------

@app.get("/api/meta")
def get_metadata():
    """Returns available skills taxonomy and Dhaka location presets."""
    return {
        "skills": SKILL_TAXONOMY,
        "locations": [loc[0] for loc in DHAKA_LOCATIONS],
        "default_alpha": matching_engine.alpha
    }


@app.get("/api/users", response_model=List[User])
def get_users():
    """List all registered users."""
    return list(users_db.values())


class CreateUserRequest(BaseModel):
    name: str
    email: Optional[str] = None
    city: str = "Gulshan-2"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    days: List[str] = ["Mon", "Wed", "Fri"]
    start_hour: int = 18
    end_hour: int = 21
    offers: List[Dict[str, str]] = []  # [{"skill_name": "...", "category": "..."}]
    wants: List[Dict[str, str]] = []


@app.post("/api/users", response_model=User)
def create_user(req: CreateUserRequest):
    """Creates a new user profile with skill offers and wants."""
    # Find lat/lng if not provided
    lat = req.latitude or 23.8103
    lon = req.longitude or 90.4125
    for loc_name, loc_lat, loc_lon in DHAKA_LOCATIONS:
        if loc_name.lower() in req.city.lower() or req.city.lower() in loc_name.lower():
            lat, lon = loc_lat, loc_lon
            break

    user = User(
        name=req.name,
        email=req.email or f"{req.name.lower().replace(' ', '.')}@rte.test",
        location=Location(city=req.city, latitude=lat, longitude=lon),
        availability=[ScheduleWindow(days=req.days, start_hour=req.start_hour, end_hour=req.end_hour)],
    )

    for off in req.offers:
        s_name = off.get("skill_name", "").strip()
        if s_name:
            cat = off.get("category") or SKILL_TAXONOMY.get(s_name, "General")
            user.offers.append(
                SkillListing(user_id=user.id, type=ListingType.OFFER, skill_name=s_name, category=cat)
            )

    for wnt in req.wants:
        s_name = wnt.get("skill_name", "").strip()
        if s_name:
            cat = wnt.get("category") or SKILL_TAXONOMY.get(s_name, "General")
            user.wants.append(
                SkillListing(user_id=user.id, type=ListingType.WANT, skill_name=s_name, category=cat)
            )

    users_db[user.id] = user
    return user


@app.delete("/api/users/{user_id}")
def delete_user(user_id: str):
    """Deletes a user."""
    if user_id in users_db:
        del users_db[user_id]
        return {"status": "success", "message": f"User {user_id} deleted."}
    raise HTTPException(status_code=404, detail="User not found.")


@app.post("/api/reset")
def reset_to_demo_preset():
    """Resets database to preset demo users."""
    initialize_default_data()
    return {"status": "success", "message": "Reset to default demo dataset."}


# Matching Engine Endpoints
class MatchRunRequest(BaseModel):
    alpha: float = 0.5
    min_k: int = 3
    max_k: int = 4


@app.post("/api/match/run")
def run_matching(req: Optional[MatchRunRequest] = None):
    """
    Executes the Bounded-Depth DFS cycle detection on all active users
    and computes multi-signal ranking.
    """
    global discovered_cycles_cache, matching_engine
    if req:
        matching_engine.alpha = req.alpha
        matching_engine.min_cycle_length = req.min_k
        matching_engine.max_cycle_length = req.max_k

    users = list(users_db.values())
    G, user_map = matching_engine.build_graph(users)
    cycles = matching_engine.find_cycles_bounded_dfs(G, user_map)
    discovered_cycles_cache = cycles

    # Construct network graph visualization payload
    nodes_payload = [
        {
            "id": u.id,
            "label": u.name,
            "city": u.location.city,
            "offers": [o.skill_name for o in u.offers],
            "wants": [w.skill_name for w in u.wants],
            "color": u.avatar_color
        }
        for u in users
    ]

    edges_payload = []
    for u, v, k, data in G.edges(keys=True, data=True):
        edges_payload.append({
            "from": u,
            "to": v,
            "label": data.get("skill_name", "Skill"),
            "category": data.get("category", "General")
        })

    return {
        "cycles": cycles,
        "cycles_count": len(cycles),
        "graph": {
            "nodes": nodes_payload,
            "edges": edges_payload,
            "total_nodes": len(nodes_payload),
            "total_edges": len(edges_payload)
        }
    }


@app.get("/api/match/cycles", response_model=List[TradeCycle])
def get_cached_cycles():
    """Returns previously discovered cycles from the cache."""
    return discovered_cycles_cache


# Group Confirmation Workflow Endpoints
class CreateProposalRequest(BaseModel):
    cycle_id: str
    expiration_seconds: int = 86400


@app.post("/api/proposals/create", response_model=TradeProposal)
def create_trade_proposal(req: CreateProposalRequest):
    """Creates a multi-party trade proposal from a detected cycle."""
    target_cycle = next((c for c in discovered_cycles_cache if c.id == req.cycle_id), None)
    if not target_cycle:
        raise HTTPException(status_code=404, detail="Trade cycle not found.")

    proposal = workflow_manager.create_proposal(target_cycle, req.expiration_seconds)
    return proposal


class RespondProposalRequest(BaseModel):
    user_id: str
    response: ResponseStatus


@app.post("/api/proposals/{proposal_id}/respond", response_model=TradeProposal)
def respond_to_proposal(proposal_id: str, req: RespondProposalRequest):
    """Submits a user's Accept/Reject decision for a trade proposal."""
    try:
        updated_proposal = workflow_manager.respond_to_proposal(proposal_id, req.user_id, req.response)
        return updated_proposal
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/proposals", response_model=List[TradeProposal])
def get_proposals():
    """List all active and past trade proposals."""
    return workflow_manager.list_proposals()


# Synthetic Benchmark Endpoints
class GenerateSyntheticRequest(BaseModel):
    count: int = 50


@app.post("/api/synthetic/generate")
def generate_synthetic(req: GenerateSyntheticRequest):
    """Populates the database with N synthetic users and runs matching."""
    global users_db, discovered_cycles_cache
    synth_users = generate_synthetic_population(req.count)
    users_db = {u.id: u for u in synth_users}
    G, user_map = matching_engine.build_graph(synth_users)
    discovered_cycles_cache = matching_engine.find_cycles_bounded_dfs(G, user_map)
    return {
        "status": "success",
        "generated_users": len(synth_users),
        "cycles_found": len(discovered_cycles_cache)
    }


class BenchmarkRequest(BaseModel):
    node_counts: List[int] = [20, 50, 100, 200, 400]


@app.post("/api/synthetic/benchmark")
def run_benchmark(req: Optional[BenchmarkRequest] = None):
    """Runs scalability benchmark measuring runtime vs node count."""
    counts = req.node_counts if req and req.node_counts else [20, 50, 100, 200, 400]
    results = run_scalability_benchmark(counts)
    return {"benchmark_results": results}


# Static Frontend Files Mount
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
if os.path.exists(frontend_dir):
    css_dir = os.path.join(frontend_dir, "css")
    js_dir = os.path.join(frontend_dir, "js")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")

    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
