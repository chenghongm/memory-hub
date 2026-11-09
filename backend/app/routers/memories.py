from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import Memory
from ..schemas import MemoryCreate, MemoryOut, MemoryPage, MemoryUpdate, TagCount

router = APIRouter(prefix="/api", tags=["memories"])


def _escape_like(text: str) -> str:
    """So a search for '50%' matches the literal text, not 'anything after 50'."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/memories", response_model=MemoryPage)
def list_memories(
    q: str | None = Query(default=None, description="Keyword, matched in title or content"),
    tag: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
):
    stmt = select(Memory)
    if q and q.strip():
        # ILIKE instead of Postgres full-text search: the 'simple'/'english'
        # parsers don't split Chinese into words. See README "Next steps".
        pattern = f"%{_escape_like(q.strip())}%"
        stmt = stmt.where(
            or_(Memory.title.ilike(pattern, escape="\\"), Memory.content.ilike(pattern, escape="\\"))
        )
    if tag and tag.strip():
        stmt = stmt.where(Memory.tags.contains([tag.strip().lower()]))

    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = session.scalars(
        stmt.order_by(Memory.updated_at.desc(), Memory.id.desc()).limit(limit).offset(offset)
    ).all()
    return MemoryPage(items=rows, total=total or 0)


@router.post("/memories", response_model=MemoryOut, status_code=status.HTTP_201_CREATED)
def create_memory(body: MemoryCreate, session: Session = Depends(get_session)):
    memory = Memory(**body.model_dump())
    session.add(memory)
    session.commit()
    session.refresh(memory)
    return memory


def _get_or_404(session: Session, memory_id: int) -> Memory:
    memory = session.get(Memory, memory_id)
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.get("/memories/{memory_id}", response_model=MemoryOut)
def get_memory(memory_id: int, session: Session = Depends(get_session)):
    return _get_or_404(session, memory_id)


@router.patch("/memories/{memory_id}", response_model=MemoryOut)
def update_memory(memory_id: int, body: MemoryUpdate, session: Session = Depends(get_session)):
    memory = _get_or_404(session, memory_id)
    # exclude_unset: only touch the fields the client actually sent
    # (same idea as "save only the fields the user touched" in the QPR fix).
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is None:
            raise HTTPException(status_code=422, detail=f"'{field}' cannot be null")
        setattr(memory, field, value)
    session.commit()
    session.refresh(memory)
    return memory


@router.delete("/memories/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: int, session: Session = Depends(get_session)):
    memory = _get_or_404(session, memory_id)
    session.delete(memory)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/tags", response_model=list[TagCount])
def list_tags(session: Session = Depends(get_session)):
    tag = func.unnest(Memory.tags).label("tag")
    sub = select(tag).subquery()
    rows = session.execute(
        select(sub.c.tag, func.count().label("count"))
        .group_by(sub.c.tag)
        .order_by(func.count().desc(), sub.c.tag)
    ).all()
    return [TagCount(tag=r.tag, count=r.count) for r in rows]
