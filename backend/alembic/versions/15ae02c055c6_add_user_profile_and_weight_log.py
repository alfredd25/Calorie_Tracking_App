"""add_user_profile_and_weight_log

Revision ID: 15ae02c055c6
Revises: 8e760c288915
Create Date: 2026-03-31 08:10:10.050681

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '15ae02c055c6'
down_revision: Union[str, Sequence[str], None] = '8e760c288915'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new profile columns to users table
    op.add_column('users', sa.Column('full_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('gender', sa.String(), nullable=True))
    op.add_column('users', sa.Column('height_cm', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('weight_kg', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('goal', sa.String(), nullable=True))
    op.add_column('users', sa.Column('target_weight_kg', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('activity_level', sa.String(), nullable=True))
    op.add_column('users', sa.Column('tdee', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('daily_calorie_target', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('daily_protein_target', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('daily_carbs_target', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('daily_fat_target', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('onboarding_complete', sa.Boolean(), nullable=False, server_default='false'))

    # Create weight_logs table
    op.create_table(
        'weight_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('weight_kg', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='weight_logs_user_id_fkey'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'date', name='uq_weight_logs_user_date')
    )


def downgrade() -> None:
    op.drop_table('weight_logs')
    op.drop_column('users', 'onboarding_complete')
    op.drop_column('users', 'daily_fat_target')
    op.drop_column('users', 'daily_carbs_target')
    op.drop_column('users', 'daily_protein_target')
    op.drop_column('users', 'daily_calorie_target')
    op.drop_column('users', 'tdee')
    op.drop_column('users', 'activity_level')
    op.drop_column('users', 'target_weight_kg')
    op.drop_column('users', 'goal')
    op.drop_column('users', 'weight_kg')
    op.drop_column('users', 'height_cm')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'age')
    op.drop_column('users', 'full_name')