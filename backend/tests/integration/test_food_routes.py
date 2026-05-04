def test_food_search(authorized_client):
    response = authorized_client.get("/foods/search?q=chicken")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_food_autocomplete(authorized_client):
    response = authorized_client.get("/foods/autocomplete?q=chick")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_empty_search_returns_results(authorized_client):
    response = authorized_client.get("/foods/search?q=rice")
    assert response.status_code == 200


def test_food_search_typo(authorized_client):
    response = authorized_client.get("/foods/search?q=chiken")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_food_search_empty_query(authorized_client):
    response = authorized_client.get("/foods/search?q=")
    assert response.status_code in (200, 422)


def test_food_search_long_query(authorized_client):
    long_query = "a" * 300
    response = authorized_client.get(f"/foods/search?q={long_query}")
    assert response.status_code in (200, 422)


def test_food_search_sql_injection(authorized_client):
    response = authorized_client.get("/foods/search?q=' OR '1'='1")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_food_search_missing_query_param(authorized_client):
    response = authorized_client.get("/foods/search")
    assert response.status_code == 422


def test_food_autocomplete_short_query(authorized_client):
    response = authorized_client.get("/foods/autocomplete?q=a")
    assert response.status_code == 200
    assert isinstance(response.json(), list)