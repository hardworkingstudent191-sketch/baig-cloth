"""Add admin token_version and index products.created_at

Revision ID: b370dbf53b54
Revises: fa8a51c185f5
Create Date: 2026-09-06 14:37:16.541511

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b370dbf53b54'
down_revision: Union[str, None] = 'fa8a51c185f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # token_version backs JWT revocation on password change (app/auth.py).
    # server_default='0' means existing admin rows get version 0 with no
    # data migration; every token issued after this deploy carries "ver".
    op.add_column('admin_users', sa.Column('token_version', sa.Integer(), server_default='0', nullable=False))
    # GET /products always orders by created_at DESC — the only sort column
    # that was missing an index.
    op.create_index(op.f('ix_products_created_at'), 'products', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_products_created_at'), table_name='products')
    op.drop_column('admin_users', 'token_version')
