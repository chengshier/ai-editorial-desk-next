from __future__ import annotations

import os
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text, UniqueConstraint, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class SchedulerTaskRow(Base):
    __tablename__ = "scheduler_tasks"

    task_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    operation: Mapped[str] = mapped_column(String(120), nullable=False)
    business_object_type: Mapped[str] = mapped_column(String(80), nullable=False)
    business_object_id: Mapped[str] = mapped_column(String(160), nullable=False)
    trigger_kind: Mapped[str] = mapped_column(String(40), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    schedule_kind: Mapped[str | None] = mapped_column(String(40), nullable=True)
    schedule_expression: Mapped[str | None] = mapped_column(String(255), nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SchedulerRunRow(Base):
    __tablename__ = "scheduler_runs"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_scheduler_runs_idempotency_key"),
    )

    run_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    task_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    operation: Mapped[str] = mapped_column(String(120), nullable=False)
    business_object_type: Mapped[str] = mapped_column(String(80), nullable=False)
    business_object_id: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    opportunity_id: Mapped[str] = mapped_column(String(160), nullable=False)
    trigger_kind: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(160), nullable=False)
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    runtime_provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    execution_provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class SchedulerPostgresStore:
    """Durable Scheduler Task/Run repository backed by PostgreSQL.

    The repository stores business identity and execution/runtime provenance separately.
    Harness session ids are runtime metadata only and never participate in primary keys.
    """

    def __init__(self, database_url: str) -> None:
        self.engine: AsyncEngine = create_async_engine(database_url, pool_pre_ping=True)
        self.sessions: async_sessionmaker[AsyncSession] = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
        )

    async def close(self) -> None:
        await self.engine.dispose()

    async def get_run(self, run_id: str) -> dict[str, Any] | None:
        async with self.sessions() as session:
            row = await session.get(SchedulerRunRow, run_id)
            return _row_to_wire(row) if row is not None else None

    async def get_by_idempotency(self, idempotency_key: str) -> dict[str, Any] | None:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerRunRow).where(
                    SchedulerRunRow.idempotency_key == idempotency_key
                )
            )
            row = result.scalar_one_or_none()
            return _row_to_wire(row) if row is not None else None

    async def create_run(self, run: dict[str, Any], input_hash: str) -> tuple[dict[str, Any], bool]:
        async with self.sessions() as session:
            row = _wire_to_row(run, input_hash)
            session.add(row)
            try:
                await session.commit()
                return _row_to_wire(row), False
            except IntegrityError:
                await session.rollback()
                existing = await session.execute(
                    select(SchedulerRunRow).where(
                        SchedulerRunRow.idempotency_key == run["idempotency_key"]
                    )
                )
                found = existing.scalar_one_or_none()
                if found is None:
                    raise
                return _row_to_wire(found), True

    async def update_run(self, run: dict[str, Any]) -> dict[str, Any]:
        async with self.sessions() as session:
            row = await session.get(SchedulerRunRow, run["run_id"])
            if row is None:
                raise KeyError(run["run_id"])
            row.status = str(run["status"])
            row.finished_at = run.get("finished_at")
            row.failure_code = run.get("failure_code")
            row.failure_reason = run.get("failure_reason")
            row.runtime_provenance = dict(run["runtime_provenance"])
            row.execution_provenance = dict(run["execution_provenance"])
            await session.commit()
            return _row_to_wire(row)

    async def list_runs(self, *, business_object_id: str, limit: int = 50) -> list[dict[str, Any]]:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerRunRow)
                .where(SchedulerRunRow.business_object_id == business_object_id)
                .order_by(SchedulerRunRow.started_at.desc())
                .limit(limit)
            )
            return [_row_to_wire(row) for row in result.scalars()]


def scheduler_database_url() -> str | None:
    raw = os.getenv("DATABASE_URL", "").strip()
    return raw or None


def _wire_to_row(run: dict[str, Any], input_hash: str) -> SchedulerRunRow:
    return SchedulerRunRow(
        run_id=str(run["run_id"]),
        task_id=run.get("task_id"),
        operation=str(run["operation"]),
        business_object_type=str(run["business_object_type"]),
        business_object_id=str(run["business_object_id"]),
        opportunity_id=str(run["opportunity_id"]),
        trigger_kind=str(run["trigger_kind"]),
        status=str(run["status"]),
        idempotency_key=str(run["idempotency_key"]),
        input_hash=input_hash,
        attempt=int(run["attempt"]),
        started_at=run["started_at"],
        finished_at=run.get("finished_at"),
        failure_code=run.get("failure_code"),
        failure_reason=run.get("failure_reason"),
        runtime_provenance=dict(run["runtime_provenance"]),
        execution_provenance=dict(run["execution_provenance"]),
    )


def _row_to_wire(row: SchedulerRunRow) -> dict[str, Any]:
    return {
        "run_id": row.run_id,
        "task_id": row.task_id,
        "operation": row.operation,
        "business_object_type": row.business_object_type,
        "business_object_id": row.business_object_id,
        "opportunity_id": row.opportunity_id,
        "trigger_kind": row.trigger_kind,
        "status": row.status,
        "idempotency_key": row.idempotency_key,
        "attempt": row.attempt,
        "started_at": row.started_at,
        "finished_at": row.finished_at,
        "failure_code": row.failure_code,
        "failure_reason": row.failure_reason,
        "runtime_provenance": dict(row.runtime_provenance),
        "execution_provenance": dict(row.execution_provenance),
        "persistence": "postgresql",
        "input_hash": row.input_hash,
    }
