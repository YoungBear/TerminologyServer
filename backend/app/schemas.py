from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TermNameBase(BaseModel):
    language: str
    name_type: str
    name: str
    definition: Optional[str] = None


class TermNameCreate(TermNameBase):
    pass


class TermNameUpdate(TermNameBase):
    id: Optional[int] = None


class TermNameResponse(TermNameBase):
    id: int
    term_id: int

    model_config = {"from_attributes": True}


class TermCreate(BaseModel):
    domain: str
    status: str = "draft"
    names: List[TermNameCreate] = Field(..., min_length=1)


class TermUpdate(BaseModel):
    domain: str
    status: str
    names: List[TermNameUpdate]


class TermResponse(BaseModel):
    id: int
    domain: str
    status: str
    names: List[TermNameResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TermListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[TermResponse]
