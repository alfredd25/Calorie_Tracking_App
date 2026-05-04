from datetime import date


def test_create_meal(authorized_client):
    response = authorized_client.post(
        "/meals/create",
        json={"date": str(date.today()), "meal_type": "breakfast"},
    )
    assert response.status_code == 200


def test_get_day_summary_not_found(authorized_client):
    response = authorized_client.get("/meals/day-summary?date=2000-01-01")
    assert response.status_code == 404


def test_create_meal_invalid_meal_type(authorized_client):
    response = authorized_client.post(
        "/meals/create",
        json={"date": str(date.today()), "meal_type": "midnight_snack"},
    )
    assert response.status_code == 422


def test_create_meal_missing_fields(authorized_client):
    response = authorized_client.post("/meals/create", json={})
    assert response.status_code == 422


def test_add_food_to_nonexistent_meal(authorized_client):
    response = authorized_client.post(
        "/meals/add-food", json={"meal_id": 99999, "food_id": 1, "quantity": 1.0}
    )
    assert response.status_code == 404


def test_add_food_negative_quantity(authorized_client):
    meal = authorized_client.post(
        "/meals/create",
        json={"date": str(date.today()), "meal_type": "lunch"},
    ).json()
    response = authorized_client.post(
        "/meals/add-food",
        json={"meal_id": meal["meal_id"], "food_id": 1, "quantity": -1.0},
    )
    assert response.status_code == 422


def test_add_food_zero_quantity(authorized_client):
    meal = authorized_client.post(
        "/meals/create",
        json={"date": str(date.today()), "meal_type": "dinner"},
    ).json()
    response = authorized_client.post(
        "/meals/add-food",
        json={"meal_id": meal["meal_id"], "food_id": 1, "quantity": 0.0},
    )
    assert response.status_code == 422


def test_day_summary_invalid_date_format(authorized_client):
    response = authorized_client.get("/meals/day-summary?date=not-a-date")
    assert response.status_code == 422