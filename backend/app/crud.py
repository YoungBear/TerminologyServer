from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import Term, TermName


def create_term(db: Session, data: dict) -> Term:
    term = Term(domain=data["domain"], status=data["status"])
    for name_data in data["names"]:
        term.names.append(TermName(**name_data))
    db.add(term)
    db.commit()
    db.refresh(term)
    return term


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
    return {"total": total, "page": page, "page_size": page_size, "items": items}


def get_term(db: Session, term_id: int) -> Term | None:
    return db.query(Term).filter(Term.id == term_id).first()


def update_term(db: Session, term_id: int, data: dict) -> Term | None:
    term = db.query(Term).filter(Term.id == term_id).first()
    if not term:
        return None

    term.domain = data["domain"]
    term.status = data["status"]

    existing_ids = {n.id for n in term.names}
    request_ids = {n["id"] for n in data["names"] if n.get("id")}
    ids_to_remove = existing_ids - request_ids

    term.names = [n for n in term.names if n.id not in ids_to_remove]

    for name_data in data["names"]:
        if name_data.get("id"):
            for n in term.names:
                if n.id == name_data["id"]:
                    n.language = name_data["language"]
                    n.name_type = name_data["name_type"]
                    n.name = name_data["name"]
                    n.definition = name_data.get("definition")
                    break
        else:
            term.names.append(TermName(
                language=name_data["language"],
                name_type=name_data["name_type"],
                name=name_data["name"],
                definition=name_data.get("definition"),
            ))

    db.commit()
    db.refresh(term)
    return term


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
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = db.query(Term).join(Term.names).filter(
        or_(TermName.name.ilike(f"%{q}%"), TermName.definition.ilike(f"%{q}%"))
    )
    if language:
        query = query.filter(TermName.language == language)
    query = query.distinct()

    total = query.count()
    items = query.order_by(Term.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size, "items": items}
