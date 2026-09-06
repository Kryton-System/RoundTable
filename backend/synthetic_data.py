import random
import time
from typing import List, Dict, Any
from backend.models import User, SkillListing, ListingType, Location, ScheduleWindow
from backend.graph_engine import MatchingEngine

# Realistic broad skill taxonomies across diverse domains
SKILL_TAXONOMY = {
    "Python Programming": "Technology",
    "React Development": "Technology",
    "Machine Learning": "Technology",
    "Docker & DevOps": "Technology",
    "Data Structures": "Technology",
    "PostgreSQL DB": "Technology",
    "Graphic Design": "Creative",
    "UI/UX Design": "Creative",
    "Video Editing": "Creative",
    "3D Blender Modeling": "Creative",
    "Digital Illustration": "Creative",
    "Acoustic Guitar": "Music",
    "Electric Bass": "Music",
    "Vocal Coaching": "Music",
    "Piano & Keyboards": "Music",
    "Music Production": "Music",
    "Conversational Spanish": "Languages",
    "Conversational French": "Languages",
    "Spoken German": "Languages",
    "Japanese N5 Basics": "Languages",
    "IELTS Speaking Prep": "Languages",
    "Calculus & Algebra": "Academics",
    "Organic Chemistry": "Academics",
    "Physics Mechanics": "Academics",
    "Discrete Mathematics": "Academics",
    "Digital Photography": "Creative",
    "Content Writing": "Lifestyle",
    "Chess Strategy": "Lifestyle",
    "Yoga & Fitness": "Lifestyle"
}

# Neighborhoods in Dhaka with approximate GPS coords
DHAKA_LOCATIONS = [
    ("Dhanmondi", 23.7461, 90.3742),
    ("Gulshan-2", 23.7925, 90.4078),
    ("Banani", 23.7937, 90.4066),
    ("Uttara", 23.8759, 90.3795),
    ("Mirpur-10", 23.8069, 90.3687),
    ("Bashundhara R/A", 23.8191, 90.4326),
    ("Mohammadpur", 23.7658, 90.3584),
    ("Badda / UITS Area", 23.7805, 90.4267),
]

DAYS_LIST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
AVATAR_COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#14B8A6"]

SAMPLE_NAMES = [
    "Ahmmad Khan", "Sumaia Ismail", "Tanvir Ahmed", "Nafisa Tabassum", "Zubair Rahman",
    "Anika Chowdhury", "Farhan Kabir", "Sadia Afrin", "Mahir Shahriar", "Tasnim Jahan",
    "Arif Hossain", "Nabila Haque", "Rifat Hasan", "Mehnaz Parveen", "Shahidul Islam",
    "Rubina Yasmin", "Asif Mahmud", "Shamima Akter", "Imtiaz Ali", "Lamia Sultana"
]


def generate_preset_demo_users() -> List[User]:
    """
    Generates a deterministic starter dataset containing known 3-party and 4-party trade loops.
    """
    users: List[User] = []

    # Loop 1 (3-Party Cycle):
    # Ahmmad (Python -> Guitar) -> Sumaia (Guitar -> Spanish) -> Tanvir (Spanish -> Python) -> Ahmmad
    u1 = User(
        id="demo-user-1",
        name="Ahmmad Khan",
        email="ahmmad@example.com",
        avatar_color="#4F46E5",
        location=Location(city="Badda / UITS Area", latitude=23.7805, longitude=90.4267),
        availability=[ScheduleWindow(days=["Mon", "Wed", "Fri", "Sat"], start_hour=18, end_hour=21)],
        offers=[SkillListing(user_id="demo-user-1", type=ListingType.OFFER, skill_name="Python Programming", category="Technology", description="Full-stack & data scripts in Python")],
        wants=[SkillListing(user_id="demo-user-1", type=ListingType.WANT, skill_name="Acoustic Guitar", category="Music", description="Beginner chords and rhythm guitar")]
    )

    u2 = User(
        id="demo-user-2",
        name="Sumaia Ismail",
        email="sumaia@example.com",
        avatar_color="#EC4899",
        location=Location(city="Gulshan-2", latitude=23.7925, longitude=90.4078),
        availability=[ScheduleWindow(days=["Mon", "Wed", "Fri"], start_hour=18, end_hour=22)],
        offers=[SkillListing(user_id="demo-user-2", type=ListingType.OFFER, skill_name="Acoustic Guitar", category="Music", description="Fingerstyle and acoustic chords")],
        wants=[SkillListing(user_id="demo-user-2", type=ListingType.WANT, skill_name="Conversational Spanish", category="Languages", description="Conversational Spanish basics")]
    )

    u3 = User(
        id="demo-user-3",
        name="Tanvir Ahmed",
        email="tanvir@example.com",
        avatar_color="#10B981",
        location=Location(city="Banani", latitude=23.7937, longitude=90.4066),
        availability=[ScheduleWindow(days=["Wed", "Fri", "Sat"], start_hour=17, end_hour=21)],
        offers=[SkillListing(user_id="demo-user-3", type=ListingType.OFFER, skill_name="Conversational Spanish", category="Languages", description="Native-level spoken Spanish")],
        wants=[SkillListing(user_id="demo-user-3", type=ListingType.WANT, skill_name="Python Programming", category="Technology", description="Backend APIs and automation")]
    )

    # Loop 2 (4-Party Cycle):
    # Nafisa (UI/UX -> Video) -> Zubair (Video -> Calculus) -> Anika (Calculus -> React) -> Farhan (React -> UI/UX) -> Nafisa
    u4 = User(
        id="demo-user-4",
        name="Nafisa Tabassum",
        email="nafisa@example.com",
        avatar_color="#F59E0B",
        location=Location(city="Dhanmondi", latitude=23.7461, longitude=90.3742),
        availability=[ScheduleWindow(days=["Tue", "Thu", "Sat"], start_hour=19, end_hour=22)],
        offers=[SkillListing(user_id="demo-user-4", type=ListingType.OFFER, skill_name="UI/UX Design", category="Creative", description="Figma prototypes and wireframing")],
        wants=[SkillListing(user_id="demo-user-4", type=ListingType.WANT, skill_name="Video Editing", category="Creative", description="Premiere Pro reel editing")]
    )

    u5 = User(
        id="demo-user-5",
        name="Zubair Rahman",
        email="zubair@example.com",
        avatar_color="#8B5CF6",
        location=Location(city="Mohammadpur", latitude=23.7658, longitude=90.3584),
        availability=[ScheduleWindow(days=["Tue", "Thu", "Sat"], start_hour=18, end_hour=21)],
        offers=[SkillListing(user_id="demo-user-5", type=ListingType.OFFER, skill_name="Video Editing", category="Creative", description="Color grading & dynamic reels")],
        wants=[SkillListing(user_id="demo-user-5", type=ListingType.WANT, skill_name="Calculus & Algebra", category="Academics", description="Differential equations & calculus")]
    )

    u6 = User(
        id="demo-user-6",
        name="Anika Chowdhury",
        email="anika@example.com",
        avatar_color="#06B6D4",
        location=Location(city="Dhanmondi", latitude=23.7461, longitude=90.3742),
        availability=[ScheduleWindow(days=["Tue", "Thu", "Sun"], start_hour=18, end_hour=22)],
        offers=[SkillListing(user_id="demo-user-6", type=ListingType.OFFER, skill_name="Calculus & Algebra", category="Academics", description="University-level math tutoring")],
        wants=[SkillListing(user_id="demo-user-6", type=ListingType.WANT, skill_name="React Development", category="Technology", description="Component development and state hooks")]
    )

    u7 = User(
        id="demo-user-7",
        name="Farhan Kabir",
        email="farhan@example.com",
        avatar_color="#EF4444",
        location=Location(city="Mirpur-10", latitude=23.8069, longitude=90.3687),
        availability=[ScheduleWindow(days=["Tue", "Thu", "Sat"], start_hour=19, end_hour=21)],
        offers=[SkillListing(user_id="demo-user-7", type=ListingType.OFFER, skill_name="React Development", category="Technology", description="Modern React with Tailwind and TypeScript")],
        wants=[SkillListing(user_id="demo-user-7", type=ListingType.WANT, skill_name="UI/UX Design", category="Creative", description="Figma design system guidelines")]
    )

    users.extend([u1, u2, u3, u4, u5, u6, u7])
    return users


def generate_synthetic_population(num_users: int = 50) -> List[User]:
    """Generates a synthetic population of users with random skills and schedules."""
    skills_list = list(SKILL_TAXONOMY.keys())
    users: List[User] = []

    for i in range(num_users):
        name = f"User_{i+1:03d} ({SAMPLE_NAMES[i % len(SAMPLE_NAMES)].split()[0]})"
        loc_city, lat, lon = random.choice(DHAKA_LOCATIONS)
        # Add slight GPS jitter (+/- 0.01 deg)
        lat += random.uniform(-0.015, 0.015)
        lon += random.uniform(-0.015, 0.015)

        # Pick 1-2 offers and 1-2 wants
        offer_skills = random.sample(skills_list, k=random.randint(1, 2))
        remaining_skills = [s for s in skills_list if s not in offer_skills]
        want_skills = random.sample(remaining_skills, k=random.randint(1, 2))

        # Random days and time windows
        selected_days = random.sample(DAYS_LIST, k=random.randint(3, 5))
        start_h = random.choice([16, 17, 18, 19])
        end_h = start_h + random.randint(2, 4)

        user_id = f"synth-{i+1:03d}"
        u = User(
            id=user_id,
            name=name,
            email=f"user{i+1}@rte.test",
            avatar_color=random.choice(AVATAR_COLORS),
            location=Location(city=loc_city, latitude=round(lat, 4), longitude=round(lon, 4)),
            availability=[ScheduleWindow(days=selected_days, start_hour=start_h, end_hour=end_h)],
            offers=[
                SkillListing(
                    user_id=user_id,
                    type=ListingType.OFFER,
                    skill_name=s,
                    category=SKILL_TAXONOMY[s],
                    description=f"Can teach {s}"
                )
                for s in offer_skills
            ],
            wants=[
                SkillListing(
                    user_id=user_id,
                    type=ListingType.WANT,
                    skill_name=s,
                    category=SKILL_TAXONOMY[s],
                    description=f"Wants to learn {s}"
                )
                for s in want_skills
            ]
        )
        users.append(u)

    return users


def run_scalability_benchmark(node_counts: List[int] = [20, 50, 100, 250, 500]) -> List[Dict[str, Any]]:
    """Runs empirical runtime complexity benchmark across varying graph sizes."""
    engine = MatchingEngine(max_cycle_length=4, min_cycle_length=3)
    results = []

    for n in node_counts:
        pop = generate_synthetic_population(n)

        # Measure Graph Construction Time
        t0 = time.perf_counter()
        G, user_map = engine.build_graph(pop)
        t_graph = (time.perf_counter() - t0) * 1000.0  # in ms

        # Measure Cycle Discovery Time
        t1 = time.perf_counter()
        cycles = engine.find_cycles_bounded_dfs(G, user_map)
        t_cycles = (time.perf_counter() - t1) * 1000.0  # in ms

        k3_count = sum(1 for c in cycles if c.cycle_length == 3)
        k4_count = sum(1 for c in cycles if c.cycle_length == 4)

        results.append({
            "nodes": n,
            "edges": G.number_of_edges(),
            "graph_build_ms": round(t_graph, 2),
            "cycle_search_ms": round(t_cycles, 2),
            "total_runtime_ms": round(t_graph + t_cycles, 2),
            "cycles_found": len(cycles),
            "k3_cycles": k3_count,
            "k4_cycles": k4_count
        })

    return results
