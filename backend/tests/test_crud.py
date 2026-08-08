"""Basic CRUD smoke tests using an in-memory SQLite database."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Term, TermName
from app import crud


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


NEW_TERM = {
    "domain": "医学",
    "status": "draft",
    "name_zh": "急性心肌梗死",
    "abbr_zh": "心梗",
    "def_zh": "因冠状动脉急性闭塞导致心肌缺血坏死的临床综合征",
    "name_en": "acute myocardial infarction",
    "abbr_en": "AMI",
    "def_en": "Myocardial necrosis from acute coronary occlusion",
}


class TestCreate:
    def test_create_term_success(self, db):
        t = crud.create_term(db, NEW_TERM)
        assert t["id"] == 1
        assert t["domain"] == "医学"
        assert t["name_zh"] == "急性心肌梗死"
        assert t["abbr_en"] == "AMI"

    def test_create_term_defs_null(self, db):
        data = {**NEW_TERM, "def_zh": None, "def_en": None}
        t = crud.create_term(db, data)
        assert t["def_zh"] == ""
        assert t["def_en"] == ""


class TestGet:
    def test_get_term_exists(self, db):
        crud.create_term(db, NEW_TERM)
        t = crud.get_term(db, 1)
        assert t is not None
        assert t["name_zh"] == "急性心肌梗死"

    def test_get_term_not_found(self, db):
        assert crud.get_term(db, 999) is None


class TestList:
    def test_list_empty(self, db):
        result = crud.get_terms(db)
        assert result["total"] == 0
        assert result["items"] == []

    def test_list_with_filters(self, db):
        crud.create_term(db, NEW_TERM)
        assert crud.get_terms(db, domain="医学")["total"] == 1
        assert crud.get_terms(db, domain="IT")["total"] == 0
        assert crud.get_terms(db, status="draft")["total"] == 1
        assert crud.get_terms(db, status="approved")["total"] == 0


class TestSearch:
    def test_search_by_name(self, db):
        crud.create_term(db, NEW_TERM)
        assert crud.search_terms(db, "心梗")["total"] == 1
        assert crud.search_terms(db, "AMI")["total"] == 1

    def test_search_by_definition(self, db):
        crud.create_term(db, NEW_TERM)
        assert crud.search_terms(db, "冠状动脉")["total"] == 1
        assert crud.search_terms(db, "occlusion")["total"] == 1

    def test_search_no_match(self, db):
        crud.create_term(db, NEW_TERM)
        assert crud.search_terms(db, "NOTFOUND")["total"] == 0

    def test_search_with_language_filter(self, db):
        crud.create_term(db, NEW_TERM)
        assert crud.search_terms(db, "心梗", language="zh")["total"] == 1
        assert crud.search_terms(db, "心梗", language="en")["total"] == 0


class TestUpdate:
    def test_update_domain_and_status(self, db):
        crud.create_term(db, NEW_TERM)
        t = crud.update_term(db, 1, {**NEW_TERM, "domain": "IT", "status": "approved"})
        assert t["domain"] == "IT"
        assert t["status"] == "approved"

    def test_update_names(self, db):
        crud.create_term(db, NEW_TERM)
        t = crud.update_term(db, 1, {**NEW_TERM, "name_zh": "新名称", "abbr_en": "NEW"})
        assert t["name_zh"] == "新名称"
        assert t["abbr_en"] == "NEW"

    def test_update_term_not_found(self, db):
        assert crud.update_term(db, 999, NEW_TERM) is None


class TestDelete:
    def test_delete_term(self, db):
        crud.create_term(db, NEW_TERM)
        assert crud.delete_term(db, 1) is True
        assert crud.get_term(db, 1) is None

    def test_delete_not_found(self, db):
        assert crud.delete_term(db, 999) is False
