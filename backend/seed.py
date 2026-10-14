import sys
from datetime import datetime, timedelta, timezone
from app.database import engine, Base, SessionLocal
from app.models import Campus, User, Item, Claim, ContactRequest, Notification, Favorite
from app.auth import get_password_hash

def seed_database():
    print("Clearing and initializing tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Item).count() > 0:
            print("Database already contains items. Skipping seed.")
            return

        print("Seeding campuses...")
        c1 = Campus(
            name="Main Engineering Campus",
            location="Academic Block A-D, Tech Boulevard",
            code="MEC-01"
        )
        c2 = Campus(
            name="North Campus (Science & Tech)",
            location="Research Hub, Innovation Avenue",
            code="NCT-02"
        )
        c3 = Campus(
            name="South Campus (Arts & Humanities)",
            location="Old Quadrangle, University Road",
            code="SCA-03"
        )
        db.add_all([c1, c2, c3])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)
        db.refresh(c3)

        print("Seeding users...")
        # Admin
        admin = User(
            email="admin@campus.edu",
            hashed_password=get_password_hash("Admin@123456"),
            display_name="Campus Admin Office",
            role="admin",
            college_id="ADM-2024-001",
            campus_id=c1.id,
            contact_preferences="email"
        )
        # Student Users
        alex = User(
            email="alex.chen@campus.edu",
            hashed_password=get_password_hash("Student@123"),
            display_name="Alex Chen",
            role="user",
            college_id="CSE-2023-042",
            campus_id=c1.id,
            phone_number="555-0192",
            contact_preferences="in_app"
        )
        priya = User(
            email="priya.sharma@campus.edu",
            hashed_password=get_password_hash("Student@123"),
            display_name="Priya Sharma",
            role="user",
            college_id="ECE-2024-118",
            campus_id=c1.id,
            phone_number="555-0144",
            contact_preferences="in_app"
        )
        marcus = User(
            email="marcus.wright@campus.edu",
            hashed_password=get_password_hash("Student@123"),
            display_name="Marcus Wright",
            role="user",
            college_id="MECH-2022-089",
            campus_id=c2.id,
            contact_preferences="in_app"
        )
        db.add_all([admin, alex, priya, marcus])
        db.commit()
        db.refresh(alex)
        db.refresh(priya)
        db.refresh(marcus)

        print("Seeding realistic sample reports...")
        now = datetime.now(timezone.utc)

        items = [
            # 1. Lost Backpack
            Item(
                public_id="LF-10492",
                owner_id=alex.id,
                campus_id=c1.id,
                title="Navy Blue Herschel Backpack",
                description="Navy blue canvas backpack with brown leather accents. Contains a data structures notebook and a graphite pencil pouch.",
                category="Bags",
                report_type="lost",
                general_location="Central Library 2nd Floor Reading Room",
                event_date=now - timedelta(days=1),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(days=1, hours=2)
            ),
            # 2. Found Backpack (High match with #1)
            Item(
                public_id="FD-82019",
                owner_id=priya.id,
                campus_id=c1.id,
                title="Found Herschel Blue Backpack",
                description="Found a dark blue Herschel backpack left on a study desk near the second floor elevators.",
                category="Bags",
                report_type="found",
                general_location="Central Library 2nd Floor elevator lobby",
                event_date=now - timedelta(days=1, hours=1),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(days=1)
            ),
            # 3. Lost Student ID Card
            Item(
                public_id="LF-33821",
                owner_id=marcus.id,
                campus_id=c1.id,
                title="University Student ID Card - Marcus Wright",
                description="Lost university student smart badge in a clear lanyard holder with blue campus neck ribbon.",
                category="ID Cards",
                report_type="lost",
                general_location="Cafeteria Ground Floor Food Court",
                event_date=now - timedelta(days=2),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(days=2)
            ),
            # 4. Found Student ID Card (High match with #3)
            Item(
                public_id="FD-91204",
                owner_id=alex.id,
                campus_id=c1.id,
                title="Found Student ID Card in Cafeteria",
                description="Turned in a student smart card found near counter #3. Handed to security reception desk.",
                category="ID Cards",
                report_type="found",
                general_location="Cafeteria Ground Floor counter #3",
                event_date=now - timedelta(days=2, hours=1),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(days=2)
            ),
            # 5. Lost Apple AirPods Pro
            Item(
                public_id="LF-55410",
                owner_id=priya.id,
                campus_id=c1.id,
                title="Apple AirPods Pro (2nd Gen) in White MagSafe Case",
                description="White AirPods Pro case with a small anime cat sticker on the front lid. Lost during morning lecture.",
                category="Electronics",
                report_type="lost",
                general_location="Science Lecture Hall B, Row 5",
                event_date=now - timedelta(days=3),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(days=3)
            ),
            # 6. Found Wireless Earbuds Case
            Item(
                public_id="FD-48291",
                owner_id=marcus.id,
                campus_id=c1.id,
                title="Found White Apple Earbuds Case",
                description="Found white wireless charging earbuds case under the wooden lecture benches in Hall B.",
                category="Electronics",
                report_type="found",
                general_location="Science Lecture Hall B",
                event_date=now - timedelta(days=3, hours=2),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(days=3)
            ),
            # 7. Lost Water Bottle
            Item(
                public_id="LF-67123",
                owner_id=alex.id,
                campus_id=c2.id,
                title="HydroFlask 32oz Cobalt Blue Water Bottle",
                description="Stainless steel vacuum insulated flask with black flex cap. Has minor dent on bottom rim.",
                category="Accessories",
                report_type="lost",
                general_location="Sports Complex Gym Weight Room",
                event_date=now - timedelta(days=4),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(days=4)
            ),
            # 8. Found Car & Hostel Keys
            Item(
                public_id="FD-12948",
                owner_id=priya.id,
                campus_id=c1.id,
                title="Set of 3 Keys with Red Honda Keyring",
                description="Ring with 2 brass keys and one car remote key on a red fabric keychain.",
                category="Keys",
                report_type="found",
                general_location="North Parking Lot B walkway",
                event_date=now - timedelta(hours=10),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="approved",
                created_at=now - timedelta(hours=8)
            ),
            # 9. Successfully Returned Item (Demonstration)
            Item(
                public_id="LF-99201",
                owner_id=marcus.id,
                campus_id=c1.id,
                title="Casio Scientific Calculator fx-991EX",
                description="Black scientific calculator with slide cover. Lost after engineering math midterm exam.",
                category="Electronics",
                report_type="lost",
                general_location="Exam Hall 102",
                event_date=now - timedelta(days=8),
                image_path=None,
                preferred_contact="in_app",
                status="returned",
                moderation_status="approved",
                created_at=now - timedelta(days=8)
            ),
            # 10. Pending Moderation Item
            Item(
                public_id="LF-88412",
                owner_id=alex.id,
                campus_id=c1.id,
                title="TI-84 Graphing Calculator",
                description="Silver edition graphing calculator left in computer lab 3.",
                category="Electronics",
                report_type="lost",
                general_location="Computer Lab 3, Workstation 12",
                event_date=now - timedelta(hours=2),
                image_path=None,
                preferred_contact="in_app",
                status="open",
                moderation_status="pending",
                created_at=now - timedelta(hours=2)
            ),
        ]
        db.add_all(items)
        db.commit()

        # Seed initial notification for demo
        notif = Notification(
            user_id=alex.id,
            type="match_found",
            title="Potential Match Detected (88%)",
            message="We found an active report 'Found Herschel Blue Backpack' that strongly matches your lost item.",
            related_resource_id="FD-82019",
            link_url="/items/FD-82019"
        )
        db.add(notif)
        db.commit()

        print("Database successfully seeded with realistic campus data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
