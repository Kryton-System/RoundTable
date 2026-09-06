from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from enum import Enum
import uuid
import time


class ListingType(str, Enum):
    OFFER = "OFFER"
    WANT = "WANT"


class ScheduleWindow(BaseModel):
    days: List[str] = Field(default_factory=lambda: ["Mon", "Wed", "Fri"])  # e.g., ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    start_hour: int = 18  # 24h format, e.g. 18 = 6 PM
    end_hour: int = 21    # 24h format, e.g. 21 = 9 PM


class Location(BaseModel):
    city: str = "Dhaka"
    latitude: float = 23.8103
    longitude: float = 90.4125


class SkillListing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    user_id: str
    type: ListingType
    skill_name: str
    category: str = "Technology"
    description: str = ""


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    email: Optional[str] = None
    avatar_color: str = "#4F46E5"
    location: Location = Field(default_factory=Location)
    availability: List[ScheduleWindow] = Field(default_factory=lambda: [ScheduleWindow()])
    offers: List[SkillListing] = Field(default_factory=list)
    wants: List[SkillListing] = Field(default_factory=list)


class CycleEdge(BaseModel):
    from_user_id: str
    from_user_name: str
    to_user_id: str
    to_user_name: str
    skill_name: str
    category: str = "General"


class TradeCycle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    cycle_length: int
    user_ids: List[str]
    user_names: List[str]
    edges: List[CycleEdge]
    proximity_score: float = 0.0  # 0.0 to 1.0 (higher = closer)
    overlap_score: float = 0.0    # 0.0 to 1.0 (higher = more shared hours)
    composite_score: float = 0.0  # alpha * prox + (1 - alpha) * overlap
    mean_distance_km: float = 0.0
    shared_hours_per_week: float = 0.0


class ProposalStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ResponseStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class TradeProposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    cycle: TradeCycle
    status: ProposalStatus = ProposalStatus.PENDING
    user_responses: Dict[str, ResponseStatus] = Field(default_factory=dict)
    created_at: float = Field(default_factory=time.time)
    expires_at: float = Field(default_factory=lambda: time.time() + 86400)  # 24h default
