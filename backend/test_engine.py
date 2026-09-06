import pytest
from backend.models import (
    User, SkillListing, ListingType, Location, ScheduleWindow,
    ProposalStatus, ResponseStatus
)
from backend.graph_engine import MatchingEngine, haversine_distance_km
from backend.workflow import ProposalWorkflowManager
from backend.synthetic_data import generate_preset_demo_users, run_scalability_benchmark


def test_3_cycle_detection():
    """Test that a direct 3-party loop A -> B -> C -> A is correctly discovered."""
    engine = MatchingEngine(min_cycle_length=3, max_cycle_length=4)

    u1 = User(
        id="u1", name="Alice",
        offers=[SkillListing(user_id="u1", type=ListingType.OFFER, skill_name="Python")],
        wants=[SkillListing(user_id="u1", type=ListingType.WANT, skill_name="Guitar")]
    )
    u2 = User(
        id="u2", name="Bob",
        offers=[SkillListing(user_id="u2", type=ListingType.OFFER, skill_name="Guitar")],
        wants=[SkillListing(user_id="u2", type=ListingType.WANT, skill_name="Spanish")]
    )
    u3 = User(
        id="u3", name="Charlie",
        offers=[SkillListing(user_id="u3", type=ListingType.OFFER, skill_name="Spanish")],
        wants=[SkillListing(user_id="u3", type=ListingType.WANT, skill_name="Python")]
    )

    G, user_map = engine.build_graph([u1, u2, u3])
    cycles = engine.find_cycles_bounded_dfs(G, user_map)

    assert len(cycles) == 1
    assert cycles[0].cycle_length == 3
    assert set(cycles[0].user_ids) == {"u1", "u2", "u3"}


def test_4_cycle_detection():
    """Test that a 4-party loop A -> B -> C -> D -> A is correctly discovered."""
    engine = MatchingEngine(min_cycle_length=3, max_cycle_length=4)

    u1 = User(id="u1", name="Alice", offers=[SkillListing(user_id="u1", type=ListingType.OFFER, skill_name="Python")], wants=[SkillListing(user_id="u1", type=ListingType.WANT, skill_name="Guitar")])
    u2 = User(id="u2", name="Bob", offers=[SkillListing(user_id="u2", type=ListingType.OFFER, skill_name="Guitar")], wants=[SkillListing(user_id="u2", type=ListingType.WANT, skill_name="Spanish")])
    u3 = User(id="u3", name="Charlie", offers=[SkillListing(user_id="u3", type=ListingType.OFFER, skill_name="Spanish")], wants=[SkillListing(user_id="u3", type=ListingType.WANT, skill_name="Design")])
    u4 = User(id="u4", name="David", offers=[SkillListing(user_id="u4", type=ListingType.OFFER, skill_name="Design")], wants=[SkillListing(user_id="u4", type=ListingType.WANT, skill_name="Python")])

    G, user_map = engine.build_graph([u1, u2, u3, u4])
    cycles = engine.find_cycles_bounded_dfs(G, user_map)

    assert len(cycles) == 1
    assert cycles[0].cycle_length == 4
    assert set(cycles[0].user_ids) == {"u1", "u2", "u3", "u4"}


def test_acyclic_graph_no_cycles():
    """Test that a DAG (no closed loops) yields 0 cycles."""
    engine = MatchingEngine(min_cycle_length=3, max_cycle_length=4)

    u1 = User(id="u1", name="Alice", offers=[SkillListing(user_id="u1", type=ListingType.OFFER, skill_name="Python")], wants=[])
    u2 = User(id="u2", name="Bob", offers=[SkillListing(user_id="u2", type=ListingType.OFFER, skill_name="Guitar")], wants=[SkillListing(user_id="u2", type=ListingType.WANT, skill_name="Python")])
    u3 = User(id="u3", name="Charlie", offers=[], wants=[SkillListing(user_id="u3", type=ListingType.WANT, skill_name="Guitar")])

    G, user_map = engine.build_graph([u1, u2, u3])
    cycles = engine.find_cycles_bounded_dfs(G, user_map)

    assert len(cycles) == 0


def test_haversine_distance_and_ranking():
    """Test Haversine distance computation and ranking formula."""
    loc_gulshan = Location(city="Gulshan", latitude=23.7925, longitude=90.4078)
    loc_banani = Location(city="Banani", latitude=23.7937, longitude=90.4066)

    dist = haversine_distance_km(loc_gulshan, loc_banani)
    # Distance between Gulshan-2 and Banani is roughly ~0.2 to ~1 km
    assert 0.05 < dist < 2.0


def test_workflow_state_machine_confirmation():
    """Test that all participants accepting marks proposal as CONFIRMED."""
    users = generate_preset_demo_users()
    engine = MatchingEngine()
    G, user_map = engine.build_graph(users)
    cycles = engine.find_cycles_bounded_dfs(G, user_map)
    assert len(cycles) >= 1

    first_cycle = cycles[0]
    manager = ProposalWorkflowManager()
    proposal = manager.create_proposal(first_cycle)

    assert proposal.status == ProposalStatus.PENDING

    # Accept for each user except the last one
    for uid in first_cycle.user_ids[:-1]:
        prop = manager.respond_to_proposal(proposal.id, uid, ResponseStatus.ACCEPTED)
        assert prop.status == ProposalStatus.PENDING

    # Accept for final user
    final_prop = manager.respond_to_proposal(proposal.id, first_cycle.user_ids[-1], ResponseStatus.ACCEPTED)
    assert final_prop.status == ProposalStatus.CONFIRMED


def test_workflow_state_machine_rejection():
    """Test that a single rejection sets proposal to REJECTED."""
    users = generate_preset_demo_users()
    engine = MatchingEngine()
    G, user_map = engine.build_graph(users)
    cycles = engine.find_cycles_bounded_dfs(G, user_map)

    first_cycle = cycles[0]
    manager = ProposalWorkflowManager()
    proposal = manager.create_proposal(first_cycle)

    # First user accepts
    manager.respond_to_proposal(proposal.id, first_cycle.user_ids[0], ResponseStatus.ACCEPTED)
    # Second user rejects
    prop = manager.respond_to_proposal(proposal.id, first_cycle.user_ids[1], ResponseStatus.REJECTED)

    assert prop.status == ProposalStatus.REJECTED


def test_scalability_benchmark():
    """Test scalability benchmark execution."""
    results = run_scalability_benchmark([10, 20])
    assert len(results) == 2
    assert "total_runtime_ms" in results[0]
    assert results[0]["nodes"] == 10
