import random
import string
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.models import Item, Campus, User, Favorite, Claim, Notification
from app.schemas import (
    ItemCreate,
    ItemUpdate,
    ItemPublicSummary,
    ItemDetailResponse,
    PaginatedItemsResponse,
    MatchResult,
    MatchFactorBreakdown
)
from app.auth import get_current_user, get_current_user_optional
from app.storage import save_uploaded_image, remove_uploaded_image
from app.smart_matcher import calculate_match_score

router = APIRouter(prefix="/items", tags=["Items"])

def generate_public_id(db: Session, report_type: str) -> str:
    prefix = "LF" if report_type == "lost" else "FD"
    for _ in range(10):
        random_digits = "".join(random.choices(string.digits, k=5))
        public_id = f"{prefix}-{random_digits}"
        exists = db.query(Item).filter(Item.public_id == public_id).first()
        if not exists:
            return public_id
    # Fallback timestamp
    return f"{prefix}-{int(datetime.now(timezone.utc).timestamp()) % 100000}"

def build_summary(item: Item) -> ItemPublicSummary:
    return ItemPublicSummary(
        id=item.id,
        public_id=item.public_id,
        title=item.title,
        category=item.category,
        report_type=item.report_type,
        general_location=item.general_location,
        event_date=item.event_date,
        image_path=item.image_path,
        status=item.status,
        moderation_status=item.moderation_status,
        campus_name=item.campus.name if item.campus else "Main Campus",
        created_at=item.created_at
    )

@router.get("", response_model=PaginatedItemsResponse)
def list_items(
    q: Optional[str] = Query(None, description="Search keyword in title, description, or location"),
    report_type: Optional[str] = Query(None, description="'lost' or 'found'"),
    category: Optional[str] = Query(None, description="Category filter"),
    campus_id: Optional[str] = Query(None, description="Campus filter"),
    status_filter: Optional[str] = Query(None, alias="status", description="'open', 'claimed', 'returned'"),
    date_from: Optional[datetime] = Query(None, description="Filter items after this date"),
    date_to: Optional[datetime] = Query(None, description="Filter items before this date"),
    sort: Optional[str] = Query("newest", description="'newest' or 'oldest'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(Item).filter(Item.moderation_status == "approved")

    if report_type and report_type.lower() in ["lost", "found"]:
        query = query.filter(Item.report_type == report_type.lower())

    if category and category.strip().lower() not in ["all", "all categories"]:
        query = query.filter(Item.category.ilike(f"%{category.strip()}%"))

    if campus_id and campus_id.strip().lower() not in ["", "all"]:
        query = query.filter(Item.campus_id == campus_id.strip())

    if status_filter and status_filter.strip().lower() not in ["", "all"]:
        query = query.filter(Item.status == status_filter.strip().lower())

    if date_from:
        query = query.filter(Item.event_date >= date_from)

    if date_to:
        query = query.filter(Item.event_date <= date_to)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Item.title.ilike(term),
                Item.description.ilike(term),
                Item.general_location.ilike(term),
                Item.category.ilike(term)
            )
        )

    if sort == "oldest":
        query = query.order_by(Item.event_date.asc())
    else:
        query = query.order_by(Item.created_at.desc())

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return PaginatedItemsResponse(
        items=[build_summary(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/user/my", response_model=List[ItemPublicSummary])
def get_my_items(
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Item).filter(Item.owner_id == current_user.id)
    if report_type and report_type.lower() in ["lost", "found"]:
        query = query.filter(Item.report_type == report_type.lower())
    items = query.order_by(Item.created_at.desc()).all()
    return [build_summary(i) for i in items]

@router.get("/{public_id}", response_model=ItemDetailResponse)
def get_item_by_public_id(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Reported item not found")

    # If item is not approved, only owner or admin can view
    is_owner = bool(current_user and current_user.id == item.owner_id)
    is_admin = bool(current_user and current_user.role == "admin")
    if item.moderation_status != "approved" and not (is_owner or is_admin):
        raise HTTPException(status_code=404, detail="Item is under moderation or unavailable")

    is_favorite = False
    has_claimed = False
    if current_user:
        fav = db.query(Favorite).filter(
            Favorite.user_id == current_user.id,
            Favorite.item_id == item.id
        ).first()
        is_favorite = fav is not None

        claim = db.query(Claim).filter(
            Claim.claimant_id == current_user.id,
            Claim.item_id == item.id
        ).first()
        has_claimed = claim is not None

    return ItemDetailResponse(
        id=item.id,
        public_id=item.public_id,
        title=item.title,
        description=item.description,
        category=item.category,
        report_type=item.report_type,
        general_location=item.general_location,
        event_date=item.event_date,
        image_path=item.image_path,
        preferred_contact=item.preferred_contact,
        status=item.status,
        moderation_status=item.moderation_status,
        campus_id=item.campus_id,
        campus_name=item.campus.name if item.campus else "Main Campus",
        owner_display_name=item.owner.display_name if item.owner else "Campus Member",
        is_owner=is_owner,
        is_favorite=is_favorite,
        has_claimed=has_claimed,
        created_at=item.created_at,
        updated_at=item.updated_at
    )

@router.post("", response_model=ItemDetailResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_in: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campus_id = item_in.campus_id or current_user.campus_id
    if campus_id:
        campus = db.query(Campus).filter(Campus.id == campus_id).first()
        if not campus:
            campus_id = None

    public_id = generate_public_id(db, item_in.report_type)

    new_item = Item(
        public_id=public_id,
        owner_id=current_user.id,
        campus_id=campus_id,
        title=item_in.title.strip(),
        description=item_in.description.strip(),
        category=item_in.category.strip(),
        report_type=item_in.report_type.strip().lower(),
        general_location=item_in.general_location.strip(),
        event_date=item_in.event_date,
        image_path=item_in.image_path,
        preferred_contact=item_in.preferred_contact or "in_app",
        status="open",
        moderation_status="approved"  # Pre-approved by default in campus flow
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Check for potential matches in background and create notification if strong match exists
    opposite_type = "found" if new_item.report_type == "lost" else "lost"
    candidates = db.query(Item).filter(
        Item.report_type == opposite_type,
        Item.status == "open",
        Item.moderation_status == "approved"
    ).all()

    top_match = None
    highest_score = 0
    for cand in candidates:
        score, _, _ = calculate_match_score(new_item, cand)
        if score > highest_score and score >= 60:
            highest_score = score
            top_match = cand

    if top_match:
        notif = Notification(
            user_id=current_user.id,
            type="match_found",
            title=f"Potential Match Detected ({highest_score}%)",
            message=f"We found an active report '{top_match.title}' that strongly matches your {new_item.report_type} item '{new_item.title}'.",
            related_resource_id=top_match.public_id,
            link_url=f"/items/{top_match.public_id}"
        )
        db.add(notif)
        db.commit()

    return ItemDetailResponse(
        id=new_item.id,
        public_id=new_item.public_id,
        title=new_item.title,
        description=new_item.description,
        category=new_item.category,
        report_type=new_item.report_type,
        general_location=new_item.general_location,
        event_date=new_item.event_date,
        image_path=new_item.image_path,
        preferred_contact=new_item.preferred_contact,
        status=new_item.status,
        moderation_status=new_item.moderation_status,
        campus_id=new_item.campus_id,
        campus_name=new_item.campus.name if new_item.campus else "Main Campus",
        owner_display_name=current_user.display_name,
        is_owner=True,
        is_favorite=False,
        has_claimed=False,
        created_at=new_item.created_at,
        updated_at=new_item.updated_at
    )

@router.patch("/{public_id}", response_model=ItemDetailResponse)
def update_item(
    public_id: str,
    item_update: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to modify this report")

    if item_update.title is not None:
        item.title = item_update.title.strip()
    if item_update.description is not None:
        item.description = item_update.description.strip()
    if item_update.category is not None:
        item.category = item_update.category.strip()
    if item_update.general_location is not None:
        item.general_location = item_update.general_location.strip()
    if item_update.event_date is not None:
        item.event_date = item_update.event_date
    if item_update.campus_id is not None:
        item.campus_id = item_update.campus_id or None
    if item_update.preferred_contact is not None:
        item.preferred_contact = item_update.preferred_contact
    if item_update.status is not None:
        valid_statuses = ["open", "claimed", "returned", "closed"]
        if item_update.status.lower() in valid_statuses:
            item.status = item_update.status.lower()
    if item_update.image_path is not None:
        if item.image_path and item.image_path != item_update.image_path:
            remove_uploaded_image(item.image_path)
        item.image_path = item_update.image_path

    db.commit()
    db.refresh(item)

    return ItemDetailResponse(
        id=item.id,
        public_id=item.public_id,
        title=item.title,
        description=item.description,
        category=item.category,
        report_type=item.report_type,
        general_location=item.general_location,
        event_date=item.event_date,
        image_path=item.image_path,
        preferred_contact=item.preferred_contact,
        status=item.status,
        moderation_status=item.moderation_status,
        campus_id=item.campus_id,
        campus_name=item.campus.name if item.campus else "Main Campus",
        owner_display_name=item.owner.display_name if item.owner else "Campus Member",
        is_owner=True,
        is_favorite=False,
        has_claimed=False,
        created_at=item.created_at,
        updated_at=item.updated_at
    )

@router.delete("/{public_id}")
def delete_item(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied to delete this item")

    if item.image_path:
        remove_uploaded_image(item.image_path)

    db.delete(item)
    db.commit()
    return {"message": "Report deleted successfully"}

@router.post("/{public_id}/images")
async def upload_item_image(
    public_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    image_path = await save_uploaded_image(file)

    if item.image_path and item.image_path != image_path:
        remove_uploaded_image(item.image_path)

    item.image_path = image_path
    db.commit()

    return {"image_path": image_path, "message": "Image uploaded successfully"}

@router.get("/{public_id}/matches", response_model=List[MatchResult])
def get_item_matches(
    public_id: str,
    min_score: int = Query(35, ge=0, le=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    target = db.query(Item).filter(Item.public_id == public_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Item not found")

    opposite_type = "found" if target.report_type == "lost" else "lost"
    candidates = db.query(Item).filter(
        Item.report_type == opposite_type,
        Item.status.in_(["open", "claimed"]),
        Item.moderation_status == "approved",
        Item.id != target.id
    ).all()

    results: List[MatchResult] = []
    for candidate in candidates:
        score, shared_chars, breakdown = calculate_match_score(target, candidate)
        if score >= min_score:
            results.append(
                MatchResult(
                    item=build_summary(candidate),
                    match_score=score,
                    shared_characteristics=shared_chars,
                    breakdown=MatchFactorBreakdown(**breakdown)
                )
            )

    results.sort(key=lambda r: r.match_score, reverse=True)
    return results[:limit]
