from pydantic import BaseModel
from typing import List, Literal
from datetime import datetime


class TermCreate(BaseModel):
    domain: str
    status: Literal["draft", "approved", "deprecated"] = "draft"
    name_zh: str
    abbr_zh: str
    def_zh: str
    name_en: str
    abbr_en: str
    def_en: str


class TermUpdate(BaseModel):
    domain: str
    status: Literal["draft", "approved", "deprecated"]
    name_zh: str
    abbr_zh: str
    def_zh: str
    name_en: str
    abbr_en: str
    def_en: str


class TermResponse(BaseModel):
    id: int
    domain: str
    status: str
    name_zh: str
    abbr_zh: str
    def_zh: str
    name_en: str
    abbr_en: str
    def_en: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TermListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[TermResponse]
