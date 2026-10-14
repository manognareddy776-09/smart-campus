from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Campus
from app.schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    Token,
    UserUpdate,
    PasswordChange
)
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def build_user_response(user: User) -> UserResponse:
    campus_name = user.campus.name if user.campus else None
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        college_id=user.college_id,
        campus_id=user.campus_id,
        campus_name=campus_name,
        role=user.role,
        phone_number=user.phone_number,
        contact_preferences=user.contact_preferences,
        created_at=user.created_at
    )

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    if user_in.campus_id:
        campus = db.query(Campus).filter(Campus.id == user_in.campus_id).first()
        if not campus:
            raise HTTPException(status_code=400, detail="Specified campus not found")

    new_user = User(
        email=email_clean,
        hashed_password=get_password_hash(user_in.password),
        display_name=user_in.display_name.strip(),
        college_id=user_in.college_id.strip() if user_in.college_id else None,
        campus_id=user_in.campus_id,
        role="user",
        phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
        contact_preferences=user_in.contact_preferences or "in_app"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.id, "role": new_user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(new_user)
    )

@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    email_clean = login_in.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled. Contact campus support.")

    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(user)
    )

@router.post("/token", response_model=Token)
def login_for_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password flow support for FastAPI Swagger UI."""
    email_clean = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return build_user_response(current_user)

@router.patch("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name.strip()
    if user_update.campus_id is not None:
        if user_update.campus_id:
            campus = db.query(Campus).filter(Campus.id == user_update.campus_id).first()
            if not campus:
                raise HTTPException(status_code=400, detail="Invalid campus selected")
        current_user.campus_id = user_update.campus_id or None
    if user_update.college_id is not None:
        current_user.college_id = user_update.college_id.strip() if user_update.college_id else None
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number.strip() if user_update.phone_number else None
    if user_update.contact_preferences is not None:
        current_user.contact_preferences = user_update.contact_preferences

    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)

@router.post("/change-password")
def change_password(
    pwd_in: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match")
    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
