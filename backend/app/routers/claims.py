from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Claim, Item, User, Notification
from app.schemas import ClaimCreate, ClaimStatusUpdate, ClaimResponse
from app.auth import get_current_user

router = APIRouter(tags=["Claims"])

def build_claim_response(claim: Claim, include_private: bool = True) -> ClaimResponse:
    return ClaimResponse(
        id=claim.id,
        item_id=claim.item.id,
        item_public_id=claim.item.public_id,
        item_title=claim.item.title,
        item_report_type=claim.item.report_type,
        item_image_path=claim.item.image_path,
        claimant_id=claim.claimant.id,
        claimant_name=claim.claimant.display_name,
        status=claim.status,
        private_claim_details=claim.private_claim_details if include_private else None,
        finder_notes=claim.finder_notes,
        created_at=claim.created_at,
        updated_at=claim.updated_at
    )

@router.post("/items/{public_id}/claims", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def submit_claim(
    public_id: str,
    claim_in: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot file a claim on your own listing")

    if item.status in ["returned", "closed"]:
        raise HTTPException(status_code=400, detail="This item is already returned or closed")

    existing_claim = db.query(Claim).filter(
        Claim.item_id == item.id,
        Claim.claimant_id == current_user.id
    ).first()
    if existing_claim:
        raise HTTPException(status_code=400, detail="You have already submitted a claim for this item")

    new_claim = Claim(
        item_id=item.id,
        claimant_id=current_user.id,
        private_claim_details=claim_in.private_claim_details.strip(),
        proof_answers=claim_in.proof_answers.strip() if claim_in.proof_answers else None,
        status="pending"
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    # Notify item finder/owner
    notif = Notification(
        user_id=item.owner_id,
        type="claim_received",
        title="New Ownership Claim Received",
        message=f"{current_user.display_name} submitted an ownership claim on your reported item '{item.title}'.",
        related_resource_id=new_claim.id,
        link_url="/dashboard"
    )
    db.add(notif)
    db.commit()

    return build_claim_response(new_claim, include_private=True)

@router.get("/my/claims", response_model=List[ClaimResponse])
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claims = db.query(Claim).filter(Claim.claimant_id == current_user.id).order_by(Claim.created_at.desc()).all()
    return [build_claim_response(c, include_private=True) for c in claims]

@router.get("/items/{public_id}/claims", response_model=List[ClaimResponse])
def get_item_claims(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Only item owner or admin can view all claims on this item
    if item.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to view private claims for this item")

    claims = db.query(Claim).filter(Claim.item_id == item.id).order_by(Claim.created_at.desc()).all()
    return [build_claim_response(c, include_private=True) for c in claims]

@router.patch("/claims/{claim_id}", response_model=ClaimResponse)
def update_claim_status(
    claim_id: str,
    update_in: ClaimStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    is_owner = claim.item.owner_id == current_user.id
    is_claimant = claim.claimant_id == current_user.id
    is_admin = current_user.role == "admin"

    valid_statuses = ["pending", "accepted", "rejected", "cancelled", "completed"]
    new_status = update_in.status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status option")

    if is_claimant and new_status == "cancelled":
        claim.status = "cancelled"
    elif (is_owner or is_admin) and new_status in ["accepted", "rejected", "completed"]:
        claim.status = new_status
        if update_in.finder_notes:
            claim.finder_notes = update_in.finder_notes.strip()

        # If claim accepted, update item status to claimed
        if new_status == "accepted":
            claim.item.status = "claimed"
        elif new_status == "completed":
            claim.item.status = "returned"

        # Notify claimant of status change
        notif = Notification(
            user_id=claim.claimant_id,
            type="claim_updated",
            title=f"Claim Status Update: {new_status.capitalize()}",
            message=f"Your claim for '{claim.item.title}' has been marked as {new_status}.",
            related_resource_id=claim.id,
            link_url="/dashboard"
        )
        db.add(notif)
    else:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this claim action")

    db.commit()
    db.refresh(claim)
    return build_claim_response(claim, include_private=True)
