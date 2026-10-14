from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Campus, User
from app.schemas import CampusResponse, CampusCreate
from app.auth import get_current_admin

router = APIRouter(prefix="/campuses", tags=["Campuses"])

@router.get("", response_model=List[CampusResponse])
def get_all_campuses(db: Session = Depends(get_db)):
    return db.query(Campus).order_by(Campus.name.asc()).all()

@router.post("", response_model=CampusResponse, status_code=status.HTTP_201_CREATED)
def create_campus(
    campus_in: CampusCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    existing = db.query(Campus).filter(Campus.name == campus_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Campus name already exists")
    campus = Campus(
        name=campus_in.name,
        location=campus_in.location,
        code=campus_in.code
    )
    db.add(campus)
    db.commit()
    db.refresh(campus)
    return campus
