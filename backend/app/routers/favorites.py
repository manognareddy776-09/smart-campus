from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Favorite, Item, User
from app.schemas import ItemPublicSummary
from app.auth import get_current_user
from app.routers.items import build_summary

router = APIRouter(tags=["Favorites"])

@router.post("/items/{public_id}/favorite")
def add_favorite(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.item_id == item.id
    ).first()

    if not existing:
        fav = Favorite(user_id=current_user.id, item_id=item.id)
        db.add(fav)
        db.commit()
    return {"message": "Saved to favorites", "is_favorite": True}

@router.delete("/items/{public_id}/favorite")
def remove_favorite(
    public_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.public_id == public_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.item_id == item.id
    ).first()

    if fav:
        db.delete(fav)
        db.commit()
    return {"message": "Removed from favorites", "is_favorite": False}

@router.get("/my/favorites", response_model=List[ItemPublicSummary])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    return [build_summary(f.item) for f in favs if f.item]
