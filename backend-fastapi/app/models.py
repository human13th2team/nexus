from app.core.database import Base
from sqlalchemy import String, ForeignKey, Integer, SmallInteger, Boolean, Text, Date, TIMESTAMP, JSON, DOUBLE_PRECISION
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
import datetime
import uuid

class RegionCode(Base):
    __tablename__ = "region_codes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    region_code: Mapped[int] = mapped_column(Integer, nullable=False)
    city_name: Mapped[str] = mapped_column(String(10), nullable=False)
    county_name: Mapped[str] = mapped_column(String(10), nullable=False)

class IndustryCategory(Base):
    __tablename__ = "industry_categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("industry_categories.id", ondelete="SET NULL"))
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    ksic_code: Mapped[Optional[str]] = mapped_column(String(20))

    # Relationships
    parent: Mapped[Optional["IndustryCategory"]] = relationship("IndustryCategory", remote_side=[id], back_populates="children")
    children: Mapped[List["IndustryCategory"]] = relationship("IndustryCategory", back_populates="parent")
    equipment_prices: Mapped[List["EquipmentPrice"]] = relationship(back_populates="industry_category")

class EquipmentPrice(Base):
    __tablename__ = "equipment_prices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("industry_categories.id", ondelete="CASCADE"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(100), nullable=False)
    standard_price: Mapped[Optional[int]] = mapped_column(Integer)
    unit: Mapped[Optional[str]] = mapped_column(String(20))

    # Relationships
    industry_category: Mapped["IndustryCategory"] = relationship(back_populates="equipment_prices")

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nickname: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    passwd: Mapped[str] = mapped_column(String(255), nullable=False)
    user_type: Mapped[Optional[int]] = mapped_column(Integer)
    biz_no: Mapped[Optional[str]] = mapped_column(String(12))
    address: Mapped[Optional[str]] = mapped_column(String(255))
    login_type: Mapped[Optional[int]] = mapped_column(Integer)
    access_token: Mapped[Optional[str]] = mapped_column(String(255))

    # Relationships
    brandings: Mapped[list["Branding"]] = relationship(back_populates="user", cascade="all, delete-orphan")

# Import types for relationship resolution at the end of the file or use string references

class Branding(Base):
    __tablename__ = "brandings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    industry_category_id: Mapped[uuid.UUID] = mapped_column(nullable=False) # FK to industry_categories
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    keywords: Mapped[Optional[dict]] = mapped_column(JSON)
    current_step: Mapped[Optional[str]] = mapped_column(String(20))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="brandings")
    identities: Mapped[list["BrandIdentity"]] = relationship(back_populates="branding", cascade="all, delete-orphan")

class BrandIdentity(Base):
    __tablename__ = "brand_identities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    branding_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("brandings.id", ondelete="CASCADE"), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(100), nullable=False)
    slogan: Mapped[Optional[str]] = mapped_column(String(255))
    brand_story: Mapped[Optional[str]] = mapped_column(Text)
    is_selected: Mapped[Optional[bool]] = mapped_column(Boolean)
    # embedding column (vector) is skipped or mapped to Text/JSON for now if pgvector is not available in the model
    
    # Relationships
    branding: Mapped["Branding"] = relationship(back_populates="identities")
    logo_assets: Mapped[list["LogoAsset"]] = relationship(back_populates="brand_identity", cascade="all, delete-orphan")
    marketing_assets: Mapped[list["MarketingAsset"]] = relationship(back_populates="brand_identity", cascade="all, delete-orphan")

class LogoAsset(Base):
    __tablename__ = "logo_assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    identity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("brand_identities.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    style_tag: Mapped[Optional[str]] = mapped_column(String(50))
    is_final: Mapped[Optional[bool]] = mapped_column(Boolean)

    # Relationships
    brand_identity: Mapped["BrandIdentity"] = relationship(back_populates="logo_assets")

class MarketingAsset(Base):
    __tablename__ = "marketing_assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    identity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("brand_identities.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    brand_identity: Mapped["BrandIdentity"] = relationship(back_populates="marketing_assets")

# To fix circular imports, import User here or use string refs

class LicenseIndustry(Base):
    __tablename__ = "license_industries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    law_name: Mapped[str] = mapped_column(String(200), nullable=False)
    law_article: Mapped[Optional[str]] = mapped_column(String(100))
    license_type: Mapped[str] = mapped_column(String(20), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    surveys: Mapped[List["Survey"]] = relationship(back_populates="license_industry", cascade="all, delete-orphan")
    documents: Mapped[List["Document"]] = relationship(back_populates="license_industry", cascade="all, delete-orphan")
    checklist_steps: Mapped[List["ChecklistStep"]] = relationship(back_populates="license_industry", cascade="all, delete-orphan")

class Survey(Base):
    __tablename__ = "surveys"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id", ondelete="CASCADE"), nullable=False)
    question: Mapped[str] = mapped_column(String(300), nullable=False)
    order_num: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    # Relationships
    license_industry: Mapped["LicenseIndustry"] = relationship(back_populates="surveys")
    condition_documents: Mapped[List["ConditionDocument"]] = relationship(back_populates="survey", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuer: Mapped[str] = mapped_column(String(100), nullable=False)
    is_common: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Relationships
    license_industry: Mapped["LicenseIndustry"] = relationship(back_populates="documents")
    condition_links: Mapped[List["ConditionDocument"]] = relationship(back_populates="document")

class ConditionDocument(Base):
    __tablename__ = "condition_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    survey_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    answer: Mapped[bool] = mapped_column(Boolean, nullable=False)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id"), nullable=False)

    # Relationships
    survey: Mapped["Survey"] = relationship(back_populates="condition_documents")
    document: Mapped["Document"] = relationship(back_populates="condition_links")

class ChecklistStep(Base):
    __tablename__ = "checklist_steps"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id", ondelete="CASCADE"), nullable=False)
    order_num: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    place: Mapped[str] = mapped_column(String(100), nullable=False)
    task: Mapped[str] = mapped_column(String(300), nullable=False)
    estimated_days: Mapped[Optional[str]] = mapped_column(String(50))

    # Relationships
    license_industry: Mapped["LicenseIndustry"] = relationship(back_populates="checklist_steps")

class LicenseIndustryMapping(Base):
    __tablename__ = "license_industry_mappings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("industry_categories.id"), nullable=False)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id"), nullable=False)

class LaborContract(Base):
    __tablename__ = "labor_contracts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    employer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    workplace: Mapped[str] = mapped_column(String(200), nullable=False)
    job_description: Mapped[str] = mapped_column(String(300), nullable=False)
    daily_work_hours: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    weekly_work_days: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    hourly_wage: Mapped[int] = mapped_column(Integer, nullable=False)
    weekly_allowance: Mapped[Optional[int]] = mapped_column(Integer)
    employee_type: Mapped[str] = mapped_column(String(20), nullable=False)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500))

class Subsidy(Base):
    __tablename__ = "subsidies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    organization: Mapped[str] = mapped_column(String(100), nullable=False)
    max_amount: Mapped[Optional[str]] = mapped_column(String(50))
    deadline: Mapped[Optional[str]] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(Text)
    eligibility: Mapped[Optional[str]] = mapped_column(Text)
    apply_url: Mapped[Optional[str]] = mapped_column(String(500))
    # embedding column (vector) is skipped

class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sales_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    total_amount: Mapped[Optional[int]] = mapped_column(Integer)
    file_url: Mapped[Optional[str]] = mapped_column(String(255))

    # Relationships
    user: Mapped["User"] = relationship()
    items: Mapped[List["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sales_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    item_name: Mapped[Optional[str]] = mapped_column(String(255))
    price: Mapped[Optional[int]] = mapped_column(Integer)
    quantity: Mapped[Optional[int]] = mapped_column(Integer)

    # Relationships
    sale: Mapped["Sale"] = relationship(back_populates="items")

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    base_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    total_sales: Mapped[Optional[int]] = mapped_column(Integer)
    predicted_cost: Mapped[Optional[int]] = mapped_column(Integer)

    # Relationships
    user: Mapped["User"] = relationship()
    daily_predictions: Mapped[List["DailyPrediction"]] = relationship(back_populates="prediction", cascade="all, delete-orphan")

class DailyPrediction(Base):
    __tablename__ = "daily_predictions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    prediction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False)
    target_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    pred_sales: Mapped[Optional[int]] = mapped_column(Integer)

    # Relationships
    prediction: Mapped["Prediction"] = relationship(back_populates="daily_predictions")

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text)
    tokens: Mapped[Optional[str]] = mapped_column(Text)
    sentiment_score: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    sentiment_label: Mapped[Optional[str]] = mapped_column(String(20))

    # Relationships
    user: Mapped["User"] = relationship()

class AIReport(Base):
    __tablename__ = "ai_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    evaluation_summary: Mapped[Optional[str]] = mapped_column(Text)
    report_file_url: Mapped[Optional[str]] = mapped_column(String(255))
    pos_ratio: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    neg_ratio: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)

    # Relationships
    user: Mapped["User"] = relationship()

# Import User for relationships

class Board(Base):
    __tablename__ = "boards"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text)
    region_name: Mapped[Optional[str]] = mapped_column(String(20))
    category_name: Mapped[Optional[str]] = mapped_column(String(20))
    view_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    image_url: Mapped[Optional[str]] = mapped_column(String(255))
    is_anonymous: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="boards")
    comments: Mapped[List["Comment"]] = relationship(back_populates="board", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_comment_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"))

    # Relationships
    board: Mapped["Board"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship()
    parent: Mapped[Optional["Comment"]] = relationship("Comment", remote_side=[id], back_populates="children")
    children: Mapped[List["Comment"]] = relationship("Comment", back_populates="parent")

class GroupPurchase(Base):
    __tablename__ = "group_purchases"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    item_name: Mapped[str] = mapped_column(String(100), nullable=False)
    item_price: Mapped[int] = mapped_column(Integer, nullable=False)
    target_count: Mapped[int] = mapped_column(Integer, nullable=False)
    current_count: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    start_date: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP)
    end_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(20))

    # Relationships
    orders: Mapped[List["GroupOrder"]] = relationship(back_populates="group_purchase")

class GroupOrder(Base):
    __tablename__ = "group_orders"

    id: Mapped[str] = mapped_column(String(50), primary_key=True) # Order ID
    gp_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("group_purchases.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    order_count: Mapped[Optional[int]] = mapped_column(Integer)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    pg_provider: Mapped[Optional[str]] = mapped_column(String(20))
    pg_tid: Mapped[Optional[str]] = mapped_column(String(200))
    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    payment_status: Mapped[Optional[str]] = mapped_column(String(20))
    paid_at: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP)

    # Relationships
    group_purchase: Mapped["GroupPurchase"] = relationship(back_populates="orders")

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[Optional[str]] = mapped_column(String(100))

    # Relationships
    participants: Mapped[List["ChatParticipant"]] = relationship(back_populates="chat_room")
    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="chat_room")

class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP)

    # Relationships
    chat_room: Mapped["ChatRoom"] = relationship(back_populates="participants")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)

    # Relationships
    chat_room: Mapped["ChatRoom"] = relationship(back_populates="messages")

# Import User to avoid circular import issues in relationships
