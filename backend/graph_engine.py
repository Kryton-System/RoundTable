import math
from typing import List, Dict, Tuple, Set, Optional
import networkx as nx
from backend.models import User, TradeCycle, CycleEdge, ScheduleWindow, Location


def haversine_distance_km(loc1: Location, loc2: Location) -> float:
    """Calculate the great-circle distance between two geographic points in kilometers."""
    R = 6371.0  # Earth's radius in km
    lat1, lon1 = math.radians(loc1.latitude), math.radians(loc1.longitude)
    lat2, lon2 = math.radians(loc2.latitude), math.radians(loc2.longitude)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def calculate_schedule_overlap_hours(users: List[User]) -> float:
    """
    Calculate the total shared hours per week where ALL users in the group are available simultaneously.
    Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    Hours: 0 to 23
    """
    if not users:
        return 0.0

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    # Create weekly grid (7 days * 24 hours) for each user
    user_grids = []
    for user in users:
        grid = set()
        for win in user.availability:
            for day in win.days:
                if day in days:
                    day_idx = days.index(day)
                    for h in range(max(0, win.start_hour), min(24, win.end_hour)):
                        grid.add((day_idx, h))
        user_grids.append(grid)

    # Intersection of all user slots
    common_slots = set.intersection(*user_grids) if user_grids else set()
    return float(len(common_slots))


class MatchingEngine:
    def __init__(self, alpha: float = 0.5, max_cycle_length: int = 4, min_cycle_length: int = 3):
        self.alpha = alpha  # Weight for proximity (1 - alpha for schedule)
        self.max_cycle_length = max_cycle_length
        self.min_cycle_length = min_cycle_length

    def build_graph(self, users: List[User]) -> Tuple[nx.MultiDiGraph, Dict[str, User]]:
        """
        Builds a directed multigraph where:
        - Nodes are user IDs.
        - Directed edge (u, v) exists if user u offers a skill that user v wants.
        """
        G = nx.MultiDiGraph()
        user_map: Dict[str, User] = {u.id: u for u in users}

        for u in users:
            G.add_node(u.id, name=u.name, user=u)

        for u in users:
            for offer in u.offers:
                norm_offer = offer.skill_name.strip().lower()
                for v in users:
                    if u.id == v.id:
                        continue
                    for want in v.wants:
                        norm_want = want.skill_name.strip().lower()
                        # Direct or substring match
                        if norm_offer == norm_want or (norm_offer in norm_want or norm_want in norm_offer):
                            G.add_edge(
                                u.id,
                                v.id,
                                key=f"{u.id}->{v.id}:{norm_offer}",
                                skill_name=offer.skill_name,
                                category=offer.category
                            )
        return G, user_map

    def find_cycles_bounded_dfs(self, G: nx.MultiDiGraph, user_map: Dict[str, User]) -> List[TradeCycle]:
        """
        Finds all elementary cycles of length between min_cycle_length and max_cycle_length
        using Bounded-Depth Depth-First Search.
        Deduplicates rotated representations of the same cycle.
        """
        discovered_raw_cycles: Set[Tuple[str, ...]] = set()
        cycles: List[TradeCycle] = []
        nodes = list(G.nodes())

        def dfs(start_node: str, current_node: str, path: List[str], visited: Set[str]):
            if len(path) > self.max_cycle_length:
                return

            for neighbor in G.successors(current_node):
                if neighbor == start_node and len(path) >= self.min_cycle_length:
                    # Valid cycle found
                    # Normalize cycle rotation so the minimum node id comes first
                    min_idx = path.index(min(path))
                    normalized_cycle = tuple(path[min_idx:] + path[:min_idx])
                    if normalized_cycle not in discovered_raw_cycles:
                        discovered_raw_cycles.add(normalized_cycle)
                elif neighbor not in visited and len(path) < self.max_cycle_length:
                    # Continue search
                    # Optimization: ensure neighbor >= start_node to avoid scanning permutations
                    if neighbor > start_node:
                        visited.add(neighbor)
                        path.append(neighbor)
                        dfs(start_node, neighbor, path, visited)
                        path.pop()
                        visited.remove(neighbor)

        for node in nodes:
            dfs(node, node, [node], {node})

        # Convert raw cycles to TradeCycle objects and score them
        for raw_cycle in discovered_raw_cycles:
            cycle_nodes = list(raw_cycle)
            k = len(cycle_nodes)
            cycle_users = [user_map[uid] for uid in cycle_nodes]
            user_names = [u.name for u in cycle_users]

            # Construct cycle edges
            edges: List[CycleEdge] = []
            for i in range(k):
                u_from = cycle_nodes[i]
                u_to = cycle_nodes[(i + 1) % k]
                # Pick the matching edge data between u_from and u_to
                edge_data = G.get_edge_data(u_from, u_to)
                if edge_data:
                    first_key = list(edge_data.keys())[0]
                    skill_name = edge_data[first_key].get("skill_name", "Skill")
                    category = edge_data[first_key].get("category", "General")
                else:
                    skill_name = "Skill"
                    category = "General"

                edges.append(
                    CycleEdge(
                        from_user_id=u_from,
                        from_user_name=user_map[u_from].name,
                        to_user_id=u_to,
                        to_user_name=user_map[u_to].name,
                        skill_name=skill_name,
                        category=category
                    )
                )

            # Compute Geographic Proximity Score
            distances = []
            for i in range(k):
                u1 = cycle_users[i]
                u2 = cycle_users[(i + 1) % k]
                d = haversine_distance_km(u1.location, u2.location)
                distances.append(d)

            mean_dist = sum(distances) / len(distances) if distances else 0.0
            # Proximity score decay: 1.0 at 0km, ~0.5 at 15km, decays with exponential
            prox_score = math.exp(-mean_dist / 15.0)

            # Compute Schedule Overlap Score
            shared_hrs = calculate_schedule_overlap_hours(cycle_users)
            # Overlap score: 1.0 at 6+ shared hours/week
            overlap_score = min(1.0, shared_hrs / 6.0)

            # Composite Score: alpha * prox + (1 - alpha) * overlap
            composite_score = self.alpha * prox_score + (1.0 - self.alpha) * overlap_score

            cycles.append(
                TradeCycle(
                    cycle_length=k,
                    user_ids=cycle_nodes,
                    user_names=user_names,
                    edges=edges,
                    proximity_score=round(prox_score, 3),
                    overlap_score=round(overlap_score, 3),
                    composite_score=round(composite_score, 3),
                    mean_distance_km=round(mean_dist, 2),
                    shared_hours_per_week=round(shared_hrs, 1)
                )
            )

        # Sort cycles by descending composite score
        cycles.sort(key=lambda c: c.composite_score, reverse=True)
        return cycles
