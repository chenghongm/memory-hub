def make(client, **overrides):
    body = {"title": "Coffee", "content": "Prefers pour-over", "tags": ["food"]}
    body.update(overrides)
    r = client.post("/api/memories", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_create_and_get(client):
    m = make(client, tags=[" Food ", "food", "", "Daily"])
    assert m["id"] == 1
    assert m["tags"] == ["food", "daily"]  # trimmed, lowercased, de-duplicated
    assert m["source"] == "manual"
    assert client.get(f"/api/memories/{m['id']}").json()["title"] == "Coffee"


def test_create_validation(client):
    assert client.post("/api/memories", json={"title": "", "content": "x"}).status_code == 422
    assert client.post("/api/memories", json={"title": "x"}).status_code == 422


def test_get_missing_returns_404(client):
    assert client.get("/api/memories/999").status_code == 404


def test_list_newest_first_with_total(client):
    for i in range(3):
        make(client, title=f"m{i}")
    page = client.get("/api/memories", params={"limit": 2}).json()
    assert page["total"] == 3
    assert [m["title"] for m in page["items"]] == ["m2", "m1"]
    page2 = client.get("/api/memories", params={"limit": 2, "offset": 2}).json()
    assert [m["title"] for m in page2["items"]] == ["m0"]


def test_search_title_and_content_case_insensitive(client):
    make(client, title="Job search", content="NVIDIA interview on Thursday")
    make(client, title="Sprint", content="AI x Epistemics")
    titles = lambda q: [m["title"] for m in client.get("/api/memories", params={"q": q}).json()["items"]]
    assert titles("nvidia") == ["Job search"]
    assert titles("SPRINT") == ["Sprint"]
    assert titles("nothing-matches") == []


def test_search_chinese(client):
    make(client, title="印章测试", content="一方一圆两枚印")
    make(client, title="Other", content="unrelated")
    page = client.get("/api/memories", params={"q": "圆"}).json()
    assert [m["title"] for m in page["items"]] == ["印章测试"]


def test_search_escapes_like_wildcards(client):
    make(client, title="Discount", content="50% off")
    make(client, title="Plain", content="500 items")
    page = client.get("/api/memories", params={"q": "50%"}).json()
    assert [m["title"] for m in page["items"]] == ["Discount"]


def test_filter_by_tag_combined_with_search(client):
    make(client, title="A", content="alpha", tags=["work"])
    make(client, title="B", content="alpha", tags=["life"])
    page = client.get("/api/memories", params={"q": "alpha", "tag": "WORK"}).json()
    assert [m["title"] for m in page["items"]] == ["A"]
    assert page["total"] == 1


def test_patch_only_changes_sent_fields(client):
    m = make(client)
    r = client.patch(f"/api/memories/{m['id']}", json={"content": "Now drinks tea"})
    assert r.status_code == 200
    updated = r.json()
    assert updated["content"] == "Now drinks tea"
    assert updated["title"] == "Coffee"
    assert updated["tags"] == ["food"]
    assert updated["updated_at"] >= m["updated_at"]


def test_patch_rejects_null(client):
    m = make(client)
    assert client.patch(f"/api/memories/{m['id']}", json={"title": None}).status_code == 422


def test_delete(client):
    m = make(client)
    assert client.delete(f"/api/memories/{m['id']}").status_code == 204
    assert client.get(f"/api/memories/{m['id']}").status_code == 404
    assert client.delete(f"/api/memories/{m['id']}").status_code == 404


def test_tags_counts(client):
    make(client, tags=["work", "ai"])
    make(client, tags=["work"])
    make(client, tags=[])
    assert client.get("/api/tags").json() == [
        {"tag": "work", "count": 2},
        {"tag": "ai", "count": 1},
    ]
