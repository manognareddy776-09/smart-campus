from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- User Schemas -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    display_name: str = Field(..., min_length=2, max_length=100)
    college_id: Optional[str] = None
    campus_id: Optional[str] = None
    phone_number: Optional[str] = None
    contact_preferences: Optional[str] = "in_app"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    campus_id: Optional[str] = None
    college_id: Optional[str] = None
    phone_number: Optional[str] = None
    contact_preferences: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    college_id: Optional[str] = None
    campus_id: Optional[str] = None
    campus_name: Optional[str] = None
    role: str
    phone_number: Optional[str] = None
    contact_preferences: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Campus Schemas -----------------
class CampusBase(BaseModel):
    name: str
    location: str
    code: Optional[str] = None

class CampusCreate(CampusBase):
    pass

class CampusResponse(CampusBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Item Schemas -----------------
class ItemCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    category: str = Field(..., description="Electronics, ID Cards, Wallets, Bags, Books, Keys, Accessories, Other")
    report_type: str = Field(..., description="'lost' or 'found'")
    general_location: str = Field(..., min_length=2, max_length=200)
    event_date: datetime
    campus_id: Optional[str] = None
    preferred_contact: Optional[str] = "in_app"
    image_path: Optional[str] = None

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    general_location: Optional[str] = None
    event_date: Optional[datetime] = None
    campus_id: Optional[str] = None
    preferred_contact: Optional[str] = None
    status: Optional[str] = None
    image_path: Optional[str] = None

class ItemPublicSummary(BaseModel):
    id: str
    public_id: str
    title: str
    category: str
    report_type: str
    general_location: str
    event_date: datetime
    image_path: Optional[str] = None
    status: str
    moderation_status: str
    campus_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ItemDetailResponse(BaseModel):
    id: str
    public_id: str
    title: str
    description: str
    category: str
    report_type: str
    general_location: str
    event_date: datetime
    image_path: Optional[str] = None
    preferred_contact: str
    status: str
    moderation_status: str
    campus_id: Optional[str] = None
    campus_name: Optional[str] = None
    owner_display_name: str
    is_owner: bool = False
    is_favorite: bool = False
    has_claimed: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedItemsResponse(BaseModel):
    items: List[ItemPublicSummary]
    total: int
    page: int
    page_size: int
    total_pages: int

# ----------------- Smart Match Schemas -----------------
class MatchFactorBreakdown(BaseModel):
    category_match: bool
    category_score: float
    keyword_overlap: List[str]
    text_similarity_score: float
    campus_match: bool
    campus_score: float
    date_proximity_days: int
    date_score: float

class MatchResult(BaseModel):
    item: ItemPublicSummary
    match_score: int  # 0 to 100
    shared_characteristics: List[str]
    breakdown: MatchFactorBreakdown

# ----------------- Claim Schemas -----------------
class ClaimCreate(BaseModel):
    private_claim_details: str = Field(..., min_length=10, description="Provide details proving ownership (e.g. wallpaper, serial digits, inside contents)")
    proof_answers: Optional[str] = None

class ClaimStatusUpdate(BaseModel):
    status: str = Field(..., description="'accepted', 'rejected', 'cancelled', 'completed'")
    finder_notes: Optional[str] = None

class ClaimResponse(BaseModel):
    id: str
    item_id: str
    item_public_id: str
    item_title: str
    item_report_type: str
    item_image_path: Optional[str] = None
    claimant_id: str
    claimant_name: str
    status: str
    private_claim_details: Optional[str] = None  # Redacted if unprivileged
    finder_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Contact Schemas -----------------
class ContactRequestCreate(BaseModel):
    message: str = Field(..., min_length=5, max_length=1000)

class ContactRequestResponse(BaseModel):
    id: str
    item_id: str
    item_public_id: str
    item_title: str
    requester_id: str
    requester_name: str
    recipient_id: str
    recipient_name: str
    message: str
    status: str
    is_sender: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Favorite Schemas -----------------
class FavoriteResponse(BaseModel):
    id: str
    item: ItemPublicSummary
    created_at: datetime

# ----------------- Notification Schemas -----------------
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    related_resource_id: Optional[str] = None
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Flag Schemas -----------------
class FlagCreate(BaseModel):
    reason: str = Field(..., description="'spam', 'inappropriate', 'fake', 'privacy_violation', 'other'")
    details: Optional[str] = None

class FlagResponse(BaseModel):
    id: str
    item_id: str
    item_public_id: str
    item_title: str
    reporter_id: str
    reporter_name: str
    reason: str
    details: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FlagStatusUpdate(BaseModel):
    status: str = Field(..., description="'reviewed', 'dismissed'")

# ----------------- Admin Schemas -----------------
class AdminModerationUpdate(BaseModel):
    moderation_status: str = Field(..., description="'approved', 'rejected'")
    notes: Optional[str] = None

class AdminStatsResponse(BaseModel):
    total_reports: int
    lost_reports: int
    found_reports: int
    pending_moderation: int
    active_claims: int
    successfully_returned: int
    total_users: int
    flagged_listings: int
