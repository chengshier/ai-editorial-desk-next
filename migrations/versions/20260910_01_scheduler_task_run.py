"""create durable scheduler task and run tables

Revision ID: 20260910_01
Revises:
Create Date: 2026-09-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260910_01"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "scheduler_tasks",
        sa.Column("task_id", sa.String(length=64), nullable=False),
        sa.Column("operation", sa.String(length=120), nullable=False),
        sa.Column("business_object_type", sa.String(length=80), nullable=False),
        sa.Column("business_object_id", sa.String(length=160), nullable=False),
        sa.Column("trigger_kind", sa.String(length=40), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("schedule_kind", sa.String(length=40), nullable=True),
        sa.Column("schedule_expression", sa.String(length=255), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("task_id"),
    )
    op.create_table(
        "scheduler_runs",
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("task_id", sa.String(length=64), nullable=True),
        sa.Column("operation", sa.String(length=120), nullable=False),
        sa.Column("business_object_type", sa.String(length=80), nullable=False),
        sa.Column("business_object_id", sa.String(length=160), nullable=False),
        sa.Column("opportunity_id", sa.String(length=160), nullable=False),
        sa.Column("trigger_kind", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("idempotency_key", sa.String(length=160), nullable=False),
        sa.Column("input_hash", sa.String(length=64), nullable=False),
        sa.Column("attempt", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_code", sa.String(length=120), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("runtime_provenance", sa.JSON(), nullable=False),
        sa.Column("execution_provenance", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("run_id"),
        sa.UniqueConstraint("idempotency_key", name="uq_scheduler_runs_idempotency_key"),
    )
    op.create_index("ix_scheduler_runs_task_id", "scheduler_runs", ["task_id"], unique=False)
    op.create_index(
        "ix_scheduler_runs_business_object_id",
        "scheduler_runs",
        ["business_object_id"],
        unique=False,
    )
    op.create_index("ix_scheduler_runs_status", "scheduler_runs", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_scheduler_runs_status", table_name="scheduler_runs")
    op.drop_index("ix_scheduler_runs_business_object_id", table_name="scheduler_runs")
    op.drop_index("ix_scheduler_runs_task_id", table_name="scheduler_runs")
    op.drop_table("scheduler_runs")
    op.drop_table("scheduler_tasks")
