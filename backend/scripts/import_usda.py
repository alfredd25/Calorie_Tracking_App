import sys

# This allows the script to find your app modules
sys.path.append("/app")

import pandas as pd
from app.models.food import Food
from app.core.database import SessionLocal

FOOD_FILE = "usda/FoodData_Central_sr_legacy_food_csv_2018-04/food.csv"
NUTRIENT_FILE = "usda/FoodData_Central_sr_legacy_food_csv_2018-04/food_nutrient.csv"

TARGET_NUTRIENTS = {1008: "calories", 1003: "protein", 1005: "carbs", 1004: "fat"}


def main():
    print("Loading CSV files...")
    foods = pd.read_csv(FOOD_FILE)
    nutrients = pd.read_csv(NUTRIENT_FILE)

    print("Filtering nutrients...")
    nutrients = nutrients[nutrients["nutrient_id"].isin(TARGET_NUTRIENTS.keys())]

    nutrients = nutrients.pivot_table(
        index="fdc_id", columns="nutrient_id", values="amount"
    ).reset_index()

    nutrients = nutrients.rename(columns=TARGET_NUTRIENTS)

    print("Merging datasets...")
    merged = foods.merge(nutrients, on="fdc_id", how="inner")
    merged = merged[["fdc_id", "description", "calories", "protein", "carbs", "fat"]]
    merged.rename(columns={"description": "name"}, inplace=True)
    merged = merged.dropna()

    print(f"Inserting {len(merged)} foods into database...")
    db = SessionLocal()

    food_objects = [
        Food(
            name=row["name"],
            calories=row["calories"],
            protein=row["protein"],
            carbs=row["carbs"],
            fat=row["fat"],
        )
        for _, row in merged.iterrows()
    ]

    db.bulk_save_objects(food_objects)
    db.commit()
    db.close()

    print("Done!")


if __name__ == "__main__":
    main()
