from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import Term, TermName


def _term_to_flat(term: Term) -> dict:
    flat = {
        "id": term.id,
        "domain": term.domain,
        "status": term.status,
        "name_zh": "", "abbr_zh": "", "def_zh": "",
        "name_en": "", "abbr_en": "", "def_en": "",
        "created_at": term.created_at,
        "updated_at": term.updated_at,
    }
    for n in term.names:
        if n.language == "zh" and n.name_type == "full_name":
            flat["name_zh"] = n.name
            flat["def_zh"] = n.definition or ""
        elif n.language == "zh" and n.name_type == "abbreviation":
            flat["abbr_zh"] = n.name
        elif n.language == "en" and n.name_type == "full_name":
            flat["name_en"] = n.name
            flat["def_en"] = n.definition or ""
        elif n.language == "en" and n.name_type == "abbreviation":
            flat["abbr_en"] = n.name
    return flat


def create_term(db: Session, data: dict) -> dict:
    term = Term(domain=data["domain"], status=data["status"])
    term.names = [
        TermName(language="zh", name_type="full_name", name=data["name_zh"], definition=data.get("def_zh")),
        TermName(language="zh", name_type="abbreviation", name=data["abbr_zh"]),
        TermName(language="en", name_type="full_name", name=data["name_en"], definition=data.get("def_en")),
        TermName(language="en", name_type="abbreviation", name=data["abbr_en"]),
    ]
    db.add(term)
    db.commit()
    db.refresh(term)
    return _term_to_flat(term)


def get_terms(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    domain: str | None = None,
    status: str | None = None,
    language: str | None = None,
) -> dict:
    query = db.query(Term)
    if domain:
        query = query.filter(Term.domain == domain)
    if status:
        query = query.filter(Term.status == status)
    if language:
        query = query.join(Term.names).filter(TermName.language == language).distinct()

    total = query.count()
    items = query.order_by(Term.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_term_to_flat(t) for t in items],
    }


def get_term(db: Session, term_id: int) -> dict | None:
    term = db.query(Term).filter(Term.id == term_id).first()
    if not term:
        return None
    return _term_to_flat(term)


def update_term(db: Session, term_id: int, data: dict) -> dict | None:
    term = db.query(Term).filter(Term.id == term_id).first()
    if not term:
        return None

    term.domain = data["domain"]
    term.status = data["status"]

    for n in term.names:
        if n.language == "zh" and n.name_type == "full_name":
            n.name = data["name_zh"]
            n.definition = data.get("def_zh")
        elif n.language == "zh" and n.name_type == "abbreviation":
            n.name = data["abbr_zh"]
        elif n.language == "en" and n.name_type == "full_name":
            n.name = data["name_en"]
            n.definition = data.get("def_en")
        elif n.language == "en" and n.name_type == "abbreviation":
            n.name = data["abbr_en"]

    db.commit()
    db.refresh(term)
    return _term_to_flat(term)


def delete_term(db: Session, term_id: int) -> bool:
    term = db.query(Term).filter(Term.id == term_id).first()
    if not term:
        return False
    db.delete(term)
    db.commit()
    return True


def search_terms(
    db: Session,
    q: str,
    language: str | None = None,
    domain: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = db.query(Term).join(Term.names).filter(
        or_(TermName.name.ilike(f"%{q}%"), TermName.definition.ilike(f"%{q}%"))
    )
    if language:
        query = query.filter(TermName.language == language)
    if domain:
        query = query.filter(Term.domain == domain)
    if status:
        query = query.filter(Term.status == status)
    query = query.distinct()

    total = query.count()
    items = query.order_by(Term.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_term_to_flat(t) for t in items],
    }
