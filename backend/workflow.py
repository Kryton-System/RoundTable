import time
from typing import Dict, List, Optional
from backend.models import TradeProposal, TradeCycle, ProposalStatus, ResponseStatus


class ProposalWorkflowManager:
    def __init__(self):
        self.proposals: Dict[str, TradeProposal] = {}

    def create_proposal(self, cycle: TradeCycle, expiration_seconds: int = 86400) -> TradeProposal:
        """Initializes a new trade proposal for a discovered cycle."""
        # Initialize responses for all participants as PENDING
        responses = {uid: ResponseStatus.PENDING for uid in cycle.user_ids}

        proposal = TradeProposal(
            cycle=cycle,
            status=ProposalStatus.PENDING,
            user_responses=responses,
            created_at=time.time(),
            expires_at=time.time() + expiration_seconds
        )
        self.proposals[proposal.id] = proposal
        return proposal

    def respond_to_proposal(self, proposal_id: str, user_id: str, response: ResponseStatus) -> TradeProposal:
        """Processes a single user's accept or reject decision within a multi-party proposal."""
        if proposal_id not in self.proposals:
            raise ValueError("Proposal not found.")

        prop = self.proposals[proposal_id]

        # Check if expired
        if time.time() > prop.expires_at and prop.status == ProposalStatus.PENDING:
            prop.status = ProposalStatus.EXPIRED
            return prop

        if prop.status != ProposalStatus.PENDING:
            return prop  # Already finalized

        if user_id not in prop.user_responses:
            raise ValueError(f"User {user_id} is not part of this trade proposal.")

        prop.user_responses[user_id] = response

        # Evaluate group confirmation state
        if response == ResponseStatus.REJECTED:
            # Single rejection cancels the entire loop
            prop.status = ProposalStatus.REJECTED
        else:
            # Check if all participants have accepted
            all_accepted = all(
                res == ResponseStatus.ACCEPTED for res in prop.user_responses.values()
            )
            if all_accepted:
                prop.status = ProposalStatus.CONFIRMED

        return prop

    def list_proposals(self) -> List[TradeProposal]:
        """Returns all proposals with auto-expiration applied."""
        now = time.time()
        for prop in self.proposals.values():
            if prop.status == ProposalStatus.PENDING and now > prop.expires_at:
                prop.status = ProposalStatus.EXPIRED
        return list(self.proposals.values())

    def get_proposal(self, proposal_id: str) -> Optional[TradeProposal]:
        return self.proposals.get(proposal_id)
