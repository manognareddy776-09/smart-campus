from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import ContactRequest, Item, User, Notification
from app.schemas import ContactRequestCreate, ContactRequestResponse
from app.auth import get_current_user

router = APIRouter(tags=["Contact"])

def build_contact_response(cr: ContactRequest, current_user_id: str) -> ContactRequestResponse:
    return ContactRequestResponse(
        id=cr.id,
        item_id=cr.item.id,
        item_public_id=cr.item.public_id,
        item_title=cr.item.title,
        requester_id=cr.requester.id,
        requester_name=cr.requester.display_name,
        recipient_id=cr.recipient.id,
        recipient_name=cr.recipient.display_name,
        message=cr.message,
        status=cr.status,
        is_sender=cr.requester_id == current_user_id,
        created_at=cr.created_at
    )

@router.post("/items/{public_id}/contact", response_model=ContactRequestResponse, status_code=status.HTTP_201_CREATED)
def send_contact_request(
    public_id: str,
    contact_in: ContactRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send a contact request to yourself")

    new_cr = ContactRequest(
        item_id=item.id,
        requester_id=current_user.id,
        recipient_id=item.owner_id,
        message=contact_in.message.strip(),
        status="unread"
    )
    db.add(new_cr)
    db.commit()
    db.refresh(new_cr)

    # Notify recipient
    notif = Notification(
        user_id=item.owner_id,
        type="contact_received",
        title="New Message Regarding Your Listing",
        message=f"{current_user.display_name} sent you a message about '{item.title}'.",
        related_resource_id=new_cr.id,
        link_url="/dashboard"
    )
    db.add(notif)
    db.commit()

    return build_contact_response(new_cr, current_user.id)

@router.get("/my/contact-requests", response_model=List[ContactRequestResponse])
def get_my_contact_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.query(ContactRequest).filter(
        or_(
            ContactRequest.recipient_id == current_user.id,
            ContactRequest.requester_id == current_user.id
        )
    ).order_by(ContactRequest.created_at.desc()).all()

    return [build_contact_response(r, current_user.id) for r in requests]

@router.patch("/contact-requests/{request_id}/status")
def mark_contact_status(
    request_id: str,
    status_val: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cr = db.query(ContactRequest).filter(ContactRequest.id == request_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Contact request not found")

    if cr.recipient_id != current_user.id and cr.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if status_val in ["read", "replied", "resolved"]:
        cr.status = status_val
        db.commit()
    return {"message": "Status updated successfully"}
