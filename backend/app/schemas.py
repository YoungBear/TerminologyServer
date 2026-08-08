from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime


class TermCreate(BaseModel):
    domain: str = Field(..., min_length=1, max_length=100)
    status: Literal["draft", "approved", "deprecated"] = "draft"
    name_zh: str = Field(..., min_length=1, max_length=500)
    abbr_zh: str = Field(..., min_length=1, max_length=500)
    def_zh: Optional[str] = Field(default=None, max_length=2000)
    name_en: str = Field(..., min_length=1, max_length=500)
    abbr_en: str = Field(..., min_length=1, max_length=500)
    def_en: Optional[str] = Field(default=None, max_length=2000)


class TermUpdate(BaseModel):
    domain: str = Field(..., min_length=1, max_length=100)
    status: Literal["draft", "approved", "deprecated"]
    name_zh: str = Field(..., min_length=1, max_length=500)
    abbr_zh: str = Field(..., min_length=1, max_length=500)
    def_zh: Optional[str] = Field(default=None, max_length=2000)
    name_en: str = Field(..., min_length=1, max_length=500)
    abbr_en: str = Field(..., min_length=1, max_length=500)
    def_en: Optional[str] = Field(default=None, max_length=2000)


class TermResponse(BaseModel):
    id: int
    domain: str
    status: str
    name_zh: str
    abbr_zh: str
    def_zh: Optional[str] = None
    name_en: str
    abbr_en: str
    def_en: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TermListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[TermResponse]
