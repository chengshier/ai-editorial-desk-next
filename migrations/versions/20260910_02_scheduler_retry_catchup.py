"""add scheduler retry, catch-up and attempt history

Revision ID: 20260910_02
Revises: 20260910_01
Create Date: 2026-09-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260910_02"
down_revision: str | None = "20260910_01"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "scheduler_tasks",
        sa.Column("catch_up_policy", sa.String(length=20), nullable=False, server_default="skip"),
    )
    op.add_column(
        "scheduler_tasks",
        sa.Column("catch_up_limit", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "scheduler_tasks",
        sa.Column("retry_max_attempts", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "scheduler_tasks",
        sa.Column("retry_backoff_seconds", sa.Integer(), nullable=False, server_default="60"),
    )
    op.add_column(
        "scheduler_tasks",
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.add_column(
        "scheduler_runs",
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "scheduler_runs",
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_scheduler_runs_next_retry_at",
        "scheduler_runs",
        ["next_retry_at"],
        unique=False,
    )

    op.create_table(
        "scheduler_run_attempts",
        sa.Column("attempt_id", sa.String(length=64), nullable=False),
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("attempt", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_code", sa.String(length=120), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("runtime_provenance", sa.JSON(), nullable=False),
        sa.Column("execution_provenance", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("attempt_id"),
        sa.UniqueConstraint("run_id", "attempt", name="uq_scheduler_run_attempt"),
    )
    op.create_index(
        "ix_scheduler_run_attempts_run_id",
        "scheduler_run_attempts",
        ["run_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_scheduler_run_attempts_run_id", table_name="scheduler_run_attempts")
    op.drop_table("scheduler_run_attempts")
    op.drop_index("ix_scheduler_runs_next_retry_at", table_name="scheduler_runs")
    op.drop_column("scheduler_runs", "next_retry_at")
    op.drop_column("scheduler_runs", "scheduled_for")
    op.drop_column("scheduler_tasks", "last_run_at")
    op.drop_column("scheduler_tasks", "retry_backoff_seconds")
    op.drop_column("scheduler_tasks", "retry_max_attempts")
    op.drop_column("scheduler_tasks", "catch_up_limit")
    op.drop_column("scheduler_tasks", "catch_up_policy")
