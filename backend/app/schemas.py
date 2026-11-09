from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _clean_tags(tags: list[str] | None) -> list[str] | None:
    """Trim, lowercase, drop empties and duplicates, keep order."""
    if tags is None:
        return None
    seen: list[str] = []
    for t in tags:
        t = t.strip().lower()
        if t and t not in seen:
            seen.append(t)
    return seen


class MemoryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)
    source: str = Field(default="manual", max_length=50)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v):
        return _clean_tags(v)


class MemoryUpdate(BaseModel):
    """PATCH body: every field optional, only sent fields are changed."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    tags: list[str] | None = None
    source: str | None = Field(default=None, max_length=50)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v):
        return _clean_tags(v)


class MemoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    tags: list[str]
    source: str
    created_at: datetime
    updated_at: datetime


class MemoryPage(BaseModel):
    items: list[MemoryOut]
    total: int


class TagCount(BaseModel):
    tag: str
    count: int
