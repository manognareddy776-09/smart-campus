from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Item, Claim, Flag, User, Notification, AuditLog
from app.schemas import (
    AdminStatsResponse,
    AdminModerationUpdate,
    FlagResponse,
    FlagStatusUpdate,
    ItemDetailResponse,
    ItemPublicSummary
)
from app.auth import get_current_admin
from app.routers.items import build_summary

router = APIRouter(prefix="/admin", tags=["Administration"])

def log_admin_action(
    db: Session,
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: Optional[str] = None
):
    audit = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.add(audit)
    db.commit()

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_items = db.query(Item).count()
    lost_items = db.query(Item).filter(Item.report_type == "lost").count()
    found_items = db.query(Item).filter(Item.report_type == "found").count()
    pending_mod = db.query(Item).filter(Item.moderation_status == "pending").count()
    active_claims = db.query(Claim).filter(Claim.status.in_(["pending", "accepted"])).count()
    returned_items = db.query(Item).filter(Item.status == "returned").count()
    total_users = db.query(User).count()
    flagged = db.query(Flag).filter(Flag.status == "pending").count()

    return AdminStatsResponse(
        total_reports=total_items,
        lost_reports=lost_items,
        found_reports=found_items,
        pending_moderation=pending_mod,
        active_claims=active_claims,
        successfully_returned=returned_items,
        total_users=total_users,
        flagged_listings=flagged
    )

@router.get("/items", response_model=List[ItemPublicSummary])
def get_admin_items(
    moderation_status: Optional[str] = None,
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(Item)
    if moderation_status and moderation_status != "all":
        query = query.filter(Item.moderation_status == moderation_status.lower())
    if report_type and report_type != "all":
        query = query.filter(Item.report_type == report_type.lower())
    
    items = query.order_by(Item.created_at.desc()).limit(100).all()
    return [build_summary(i) for i in items]

@router.patch("/items/{public_id}/moderation")
def update_item_moderation(
    public_id: str,
    update_in: AdminModerationUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    new_mod = update_in.moderation_status.lower()
    if new_mod not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid moderation status")

    item.moderation_status = new_mod

    # Audit log
    log_admin_action(
        db=db,
        actor_id=admin.id,
        action=f"moderation_{new_mod}",
        resource_type="item",
        resource_id=item.public_id,
        details=update_in.notes
    )

    # Notify item owner
    notif = Notification(
        user_id=item.owner_id,
        type="moderation_update",
        title=f"Report Moderation: {new_mod.capitalize()}",
        message=f"Your report '{item.title}' has been reviewed by campus admins and marked as {new_mod}.",
        related_resource_id=item.public_id,
        link_url=f"/items/{item.public_id}"
    )
    db.add(notif)
    db.commit()

    return {"message": f"Item moderation status updated to {new_mod}", "status": new_mod}

@router.get("/flags", response_model=List[FlagResponse])
def get_all_flags(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(Flag)
    if status_filter and status_filter != "all":
        query = query.filter(Flag.status == status_filter.lower())
    flags = query.order_by(Flag.created_at.desc()).all()

    return [
        FlagResponse(
            id=f.id,
            item_id=f.item.id,
            item_public_id=f.item.public_id,
            item_title=f.item.title,
            reporter_id=f.reporter.id,
            reporter_name=f.reporter.display_name,
            reason=f.reason,
            details=f.details,
            status=f.status,
            created_at=f.created_at
        )
        for f in flags if f.item and f.reporter
    ]

@router.patch("/flags/{flag_id}")
def update_flag_status(
    flag_id: str,
    update_in: FlagStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    flag = db.query(Flag).filter(Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    new_st = update_in.status.lower()
    if new_st not in ["reviewed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    flag.status = new_st
    log_admin_action(
        db=db,
        actor_id=admin.id,
        action=f"flag_{new_st}",
        resource_type="flag",
        resource_id=flag.id
    )
    db.commit()
    return {"message": f"Flag marked as {new_st}"}

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "created_at": l.created_at
        }
        for l in logs
    ]
