from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import Optional

from app.database import engine, Base, get_db
from app.schemas import TermCreate, TermUpdate, TermResponse, TermListResponse
from app.crud import create_term, get_terms, get_term, update_term, delete_term, search_terms

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TerminologyServer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/terms", response_model=TermResponse, status_code=201)
def create_term_endpoint(term: TermCreate, db: Session = Depends(get_db)):
    try:
        return create_term(db, term.model_dump())
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Duplicate name: (language, name_type) must be unique per term")


@app.get("/api/terms", response_model=TermListResponse)
def list_terms_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    domain: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return get_terms(db, page=page, page_size=page_size, domain=domain, status=status, language=language)


@app.get("/api/terms/search", response_model=TermListResponse)
def search_terms_endpoint(
    q: str = Query(..., min_length=1),
    language: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_terms(db, q=q, language=language, domain=domain, status=status, page=page, page_size=page_size)


@app.get("/api/terms/{term_id}", response_model=TermResponse)
def get_term_endpoint(term_id: int, db: Session = Depends(get_db)):
    term = get_term(db, term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    return term


@app.put("/api/terms/{term_id}", response_model=TermResponse)
def update_term_endpoint(term_id: int, term_data: TermUpdate, db: Session = Depends(get_db)):
    term = update_term(db, term_id, term_data.model_dump())
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    return term


@app.delete("/api/terms/{term_id}", status_code=204)
def delete_term_endpoint(term_id: int, db: Session = Depends(get_db)):
    if not delete_term(db, term_id):
        raise HTTPException(status_code=404, detail="Term not found")
