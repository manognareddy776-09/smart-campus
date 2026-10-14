import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    Index,
    Enum as SAEnum,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Campus(Base):
    __tablename__ = "campuses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    location = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True, unique=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    users = relationship("User", back_populates="campus")
    items = relationship("Item", back_populates="campus")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    college_id = Column(String(50), nullable=True)  # e.g., Student roll or ID number
    campus_id = Column(String(36), ForeignKey("campuses.id", ondelete="SET NULL"), nullable=True)
    role = Column(String(20), default="user", nullable=False)  # "user" or "admin"
    phone_number = Column(String(30), nullable=True)
    contact_preferences = Column(String(50), default="in_app", nullable=False)  # "in_app", "email", "phone"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    campus = relationship("Campus", back_populates="users")
    items = relationship("Item", back_populates="owner", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="claimant", cascade="all, delete-orphan")
    sent_contacts = relationship("ContactRequest", foreign_keys="ContactRequest.requester_id", back_populates="requester")
    received_contacts = relationship("ContactRequest", foreign_keys="ContactRequest.recipient_id", back_populates="recipient")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    flags = relationship("Flag", back_populates="reporter")

class Item(Base):
    __tablename__ = "items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    public_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g., LF-12345
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    campus_id = Column(String(36), ForeignKey("campuses.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Electronics, ID Cards, Wallets, etc.
    report_type = Column(String(20), nullable=False, index=True)  # "lost" or "found"
    general_location = Column(String(200), nullable=False)  # e.g. "Main Library, 2nd Floor"
    event_date = Column(DateTime, nullable=False)  # Approximate date when lost or found
    image_path = Column(String(500), nullable=True)
    preferred_contact = Column(String(50), default="in_app", nullable=False)
    
    status = Column(String(30), default="open", nullable=False, index=True)  # "open", "claimed", "returned", "closed"
    moderation_status = Column(String(30), default="approved", nullable=False, index=True)  # "approved", "pending", "rejected"
    
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    owner = relationship("User", back_populates="items")
    campus = relationship("Campus", back_populates="items")
    claims = relationship("Claim", back_populates="item", cascade="all, delete-orphan")
    contact_requests = relationship("ContactRequest", back_populates="item", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="item", cascade="all, delete-orphan")
    flags = relationship("Flag", back_populates="item", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_items_search", "category", "report_type", "status", "moderation_status"),
    )

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    claimant_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    private_claim_details = Column(Text, nullable=False)  # Proof / description
    proof_answers = Column(Text, nullable=True)  # Additional answers or verification details
    status = Column(String(30), default="pending", nullable=False, index=True)  # "pending", "accepted", "rejected", "cancelled", "completed"
    finder_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    item = relationship("Item", back_populates="claims")
    claimant = relationship("User", back_populates="claims")

    __table_args__ = (
        UniqueConstraint("item_id", "claimant_id", name="uq_claim_item_claimant"),
    )

class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    requester_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), default="unread", nullable=False)  # "unread", "read", "replied", "resolved"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    item = relationship("Item", back_populates="contact_requests")
    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_contacts")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_contacts")

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(36), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="favorites")
    item = relationship("Item", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_favorite_user_item"),
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # "match_found", "claim_received", "claim_updated", "contact_received", "moderation_update"
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    related_resource_id = Column(String(50), nullable=True)  # item public_id or claim id
    link_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="notifications")

class Flag(Base):
    __tablename__ = "flags"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(36), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(100), nullable=False)  # "spam", "inappropriate", "fake", "privacy_violation", "other"
    details = Column(Text, nullable=True)
    status = Column(String(30), default="pending", nullable=False)  # "pending", "reviewed", "dismissed"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    reporter = relationship("User", back_populates="flags")
    item = relationship("Item", back_populates="flags")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # "approve_item", "reject_item", "delete_item", "resolve_claim", "resolve_flag"
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
