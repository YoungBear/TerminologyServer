import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TermStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    DEPRECATED = "deprecated"


class NameType(str, enum.Enum):
    FULL_NAME = "full_name"
    ABBREVIATION = "abbreviation"
    SYNONYM = "synonym"


class Term(Base):
    __tablename__ = "term"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(100), nullable=False, index=True)
    status = Column(String(20), nullable=False, default=TermStatus.DRAFT.value)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    names = relationship("TermName", back_populates="term", cascade="all, delete-orphan", lazy="joined")


class TermName(Base):
    __tablename__ = "term_name"

    id = Column(Integer, primary_key=True, index=True)
    term_id = Column(Integer, ForeignKey("term.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(10), nullable=False, index=True)
    name_type = Column(String(20), nullable=False)
    name = Column(String(500), nullable=False)
    definition = Column(Text, nullable=True)

    term = relationship("Term", back_populates="names")
