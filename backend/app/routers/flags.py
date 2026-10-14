from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Flag, Item, User
from app.schemas import FlagCreate, FlagResponse
from app.auth import get_current_user

router = APIRouter(tags=["Flags"])

@router.post("/items/{public_id}/flag", response_model=FlagResponse, status_code=status.HTTP_201_CREATED)
def flag_item(
    public_id: str,
    flag_in: FlagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing_flag = db.query(Flag).filter(
        Flag.item_id == item.id,
        Flag.reporter_id == current_user.id
    ).first()
    if existing_flag:
        raise HTTPException(status_code=400, detail="You have already flagged this listing")

    new_flag = Flag(
        reporter_id=current_user.id,
        item_id=item.id,
        reason=flag_in.reason,
        details=flag_in.details.strip() if flag_in.details else None,
        status="pending"
    )
    db.add(new_flag)
    db.commit()
    db.refresh(new_flag)

    return FlagResponse(
        id=new_flag.id,
        item_id=item.id,
        item_public_id=item.public_id,
        item_title=item.title,
        reporter_id=current_user.id,
        reporter_name=current_user.display_name,
        reason=new_flag.reason,
        details=new_flag.details,
        status=new_flag.status,
        created_at=new_flag.created_at
    )
