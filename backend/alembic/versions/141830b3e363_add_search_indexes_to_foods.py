"""add search indexes to foods

Revision ID: 141830b3e363
Revises: 0f530edccae8
Create Date: 2026-03-08 05:06:52.331696

"""

from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "141830b3e363"
down_revision: Union[str, Sequence[str], None] = "0f530edccae8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Enable trigram extension
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Populate search vector
    op.execute("UPDATE foods SET search_vector = to_tsvector('english', name)")

    # Create GIN index for full text search
    op.execute("""
        CREATE INDEX idx_food_search
        ON foods
        USING GIN(search_vector)
    """)

    # Create trigram index for typo tolerance
    op.execute("""
        CREATE INDEX idx_food_name_trgm
        ON foods
        USING GIN (name gin_trgm_ops)
    """)


def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_food_search")
    op.execute("DROP INDEX IF EXISTS idx_food_name_trgm")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
