"""add password reset fields

Revision ID: 6b8e2b0e7c0d
Revises: f3187a03f702
Create Date: 2026-05-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6b8e2b0e7c0d"
down_revision: Union[str, Sequence[str], None] = "f3187a03f702"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("reset_token", sa.String(), nullable=True))
    op.add_column(
        "users", sa.Column("reset_token_expiry", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(op.f("ix_users_reset_token"), "users", ["reset_token"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_reset_token"), table_name="users")
    op.drop_column("users", "reset_token_expiry")
    op.drop_column("users", "reset_token")
