"""add custom_foods, custom_meals, custom_meal_items; add name to meal_items

Revision ID: 7d2c9e1a4b30
Revises: 6b8e2b0e7c0d
Create Date: 2026-05-25 09:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "7d2c9e1a4b30"
down_revision: Union[str, Sequence[str], None] = "6b8e2b0e7c0d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Allow MealItem.food_id to be nullable to support custom foods without a DB food row
    op.alter_column("meal_items", "food_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("meal_items", sa.Column("name", sa.String(), nullable=True))

    # Custom foods
    op.create_table(
        "custom_foods",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("calories", sa.Float(), nullable=False, server_default="0"),
        sa.Column("protein", sa.Float(), nullable=False, server_default="0"),
        sa.Column("carbs", sa.Float(), nullable=False, server_default="0"),
        sa.Column("fat", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index(
        op.f("ix_custom_foods_user_id"), "custom_foods", ["user_id"], unique=False
    )

    # Custom meals
    op.create_table(
        "custom_meals",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index(
        op.f("ix_custom_meals_user_id"), "custom_meals", ["user_id"], unique=False
    )

    # Custom meal items
    op.create_table(
        "custom_meal_items",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("custom_meal_id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("food_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False, server_default="1"),
        sa.ForeignKeyConstraint(
            ["custom_meal_id"], ["custom_meals.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_custom_meal_items_custom_meal_id"),
        "custom_meal_items",
        ["custom_meal_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_custom_meal_items_custom_meal_id"), table_name="custom_meal_items"
    )
    op.drop_table("custom_meal_items")

    op.drop_index(op.f("ix_custom_meals_user_id"), table_name="custom_meals")
    op.drop_table("custom_meals")

    op.drop_index(op.f("ix_custom_foods_user_id"), table_name="custom_foods")
    op.drop_table("custom_foods")

    op.drop_column("meal_items", "name")
    op.alter_column("meal_items", "food_id", existing_type=sa.Integer(), nullable=False)
