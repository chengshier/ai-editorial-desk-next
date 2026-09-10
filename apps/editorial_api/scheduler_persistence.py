from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text, UniqueConstraint, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
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
    catch_up_policy: Mapped[str] = mapped_column(String(20), nullable=False, default="skip")
    catch_up_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    retry_max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    retry_backoff_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    failure_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    runtime_provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    execution_provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class SchedulerRunAttemptRow(Base):
    __tablename__ = "scheduler_run_attempts"
    __table_args__ = (
        UniqueConstraint("run_id", "attempt", name="uq_scheduler_run_attempt"),
    )

    attempt_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    runtime_provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    execution_provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class SchedulerPostgresStore:
    """Durable Scheduler Task/Run repository backed by PostgreSQL."""

    def __init__(self, database_url: str) -> None:
        self.engine: AsyncEngine = create_async_engine(database_url, pool_pre_ping=True)
        self.sessions: async_sessionmaker[AsyncSession] = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
        )

    async def close(self) -> None:
        await self.engine.dispose()

    async def get_task(self, task_id: str) -> dict[str, Any] | None:
        async with self.sessions() as session:
            row = await session.get(SchedulerTaskRow, task_id)
            return _task_to_wire(row) if row is not None else None

    async def upsert_interval_task(self, task: dict[str, Any]) -> dict[str, Any]:
        async with self.sessions() as session:
            row = await session.get(SchedulerTaskRow, task["task_id"])
            if row is None:
                row = SchedulerTaskRow(
                    task_id=str(task["task_id"]),
                    operation=str(task["operation"]),
                    business_object_type=str(task["business_object_type"]),
                    business_object_id=str(task["business_object_id"]),
                    trigger_kind="schedule",
                    enabled=bool(task["enabled"]),
                    schedule_kind="interval",
                    schedule_expression=str(task["interval_seconds"]),
                    catch_up_policy=str(task.get("catch_up_policy", "skip")),
                    catch_up_limit=int(task.get("catch_up_limit", 1)),
                    retry_max_attempts=int(task.get("retry_max_attempts", 1)),
                    retry_backoff_seconds=int(task.get("retry_backoff_seconds", 60)),
                    next_run_at=task["next_run_at"],
                    last_run_at=task.get("last_run_at"),
                    created_at=task["created_at"],
                    updated_at=task["updated_at"],
                )
                session.add(row)
            else:
                if (
                    row.operation != task["operation"]
                    or row.business_object_type != task["business_object_type"]
                    or row.business_object_id != task["business_object_id"]
                ):
                    raise ValueError("task_id is already bound to a different business operation")
                row.enabled = bool(task["enabled"])
                row.schedule_kind = "interval"
                row.schedule_expression = str(task["interval_seconds"])
                row.catch_up_policy = str(task.get("catch_up_policy", row.catch_up_policy))
                row.catch_up_limit = int(task.get("catch_up_limit", row.catch_up_limit))
                row.retry_max_attempts = int(task.get("retry_max_attempts", row.retry_max_attempts))
                row.retry_backoff_seconds = int(
                    task.get("retry_backoff_seconds", row.retry_backoff_seconds)
                )
                row.next_run_at = task["next_run_at"]
                row.updated_at = task["updated_at"]
            await session.commit()
            return _task_to_wire(row)

    async def set_task_policy(
        self,
        task_id: str,
        *,
        catch_up_policy: str,
        catch_up_limit: int,
        retry_max_attempts: int,
        retry_backoff_seconds: int,
        updated_at: datetime,
    ) -> dict[str, Any] | None:
        async with self.sessions() as session:
            row = await session.get(SchedulerTaskRow, task_id)
            if row is None:
                return None
            row.catch_up_policy = catch_up_policy
            row.catch_up_limit = catch_up_limit
            row.retry_max_attempts = retry_max_attempts
            row.retry_backoff_seconds = retry_backoff_seconds
            row.updated_at = updated_at
            await session.commit()
            return _task_to_wire(row)

    async def set_task_enabled(
        self,
        task_id: str,
        *,
        enabled: bool,
        updated_at: datetime,
    ) -> dict[str, Any] | None:
        async with self.sessions() as session:
            row = await session.get(SchedulerTaskRow, task_id)
            if row is None:
                return None
            row.enabled = enabled
            row.updated_at = updated_at
            if not enabled:
                pending = await session.execute(
                    select(SchedulerRunRow).where(
                        SchedulerRunRow.task_id == task_id,
                        SchedulerRunRow.next_retry_at.is_not(None),
                    )
                )
                for run in pending.scalars():
                    run.next_retry_at = None
            await session.commit()
            return _task_to_wire(row)

    async def claim_due_interval_tasks(
        self,
        *,
        now: datetime,
        limit: int,
    ) -> list[dict[str, Any]]:
        """Claim due interval occurrences with bounded catch-up and row locks."""
        async with self.sessions() as session:
            async with session.begin():
                result = await session.execute(
                    select(SchedulerTaskRow)
                    .where(
                        SchedulerTaskRow.enabled.is_(True),
                        SchedulerTaskRow.schedule_kind == "interval",
                        SchedulerTaskRow.next_run_at.is_not(None),
                        SchedulerTaskRow.next_run_at <= now,
                    )
                    .order_by(SchedulerTaskRow.next_run_at.asc())
                    .with_for_update(skip_locked=True)
                    .limit(limit)
                )
                claimed: list[dict[str, Any]] = []
                for row in result.scalars():
                    if len(claimed) >= limit:
                        break
                    try:
                        interval_seconds = int(row.schedule_expression or "")
                    except ValueError as exc:
                        raise RuntimeError(f"invalid interval task {row.task_id}") from exc
                    if interval_seconds <= 0:
                        raise RuntimeError(f"invalid interval task {row.task_id}")
                    if row.next_run_at is None:
                        continue

                    per_task_limit = 1 if row.catch_up_policy == "skip" else max(1, row.catch_up_limit)
                    cursor = row.next_run_at
                    claimed_for: list[datetime] = []
                    while cursor <= now and len(claimed_for) < per_task_limit:
                        if len(claimed) + len(claimed_for) >= limit:
                            break
                        claimed_for.append(cursor)
                        cursor = cursor + timedelta(seconds=interval_seconds)

                    discard_backlog = row.catch_up_policy == "skip" or (
                        len(claimed_for) >= per_task_limit and cursor <= now
                    )
                    if discard_backlog:
                        row.next_run_at = now + timedelta(seconds=interval_seconds)
                    else:
                        row.next_run_at = cursor
                    row.updated_at = now

                    for claimed_for_at in claimed_for:
                        wire = _task_to_wire(row)
                        wire["claimed_for_at"] = claimed_for_at
                        claimed.append(wire)
            return claimed

    async def get_run(self, run_id: str) -> dict[str, Any] | None:
        async with self.sessions() as session:
            row = await session.get(SchedulerRunRow, run_id)
            return _run_to_wire(row) if row is not None else None

    async def get_by_idempotency(self, idempotency_key: str) -> dict[str, Any] | None:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerRunRow).where(
                    SchedulerRunRow.idempotency_key == idempotency_key
                )
            )
            row = result.scalar_one_or_none()
            return _run_to_wire(row) if row is not None else None

    async def create_run(self, run: dict[str, Any], input_hash: str) -> tuple[dict[str, Any], bool]:
        async with self.sessions() as session:
            row = _wire_to_run_row(run, input_hash)
            session.add(row)
            session.add(_attempt_from_run(run))
            try:
                await session.commit()
                return _run_to_wire(row), False
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
                return _run_to_wire(found), True

    async def update_run(self, run: dict[str, Any]) -> dict[str, Any]:
        async with self.sessions() as session:
            row = await session.get(SchedulerRunRow, run["run_id"])
            if row is None:
                raise KeyError(run["run_id"])
            row.status = str(run["status"])
            row.attempt = int(run["attempt"])
            row.started_at = run["started_at"]
            row.finished_at = run.get("finished_at")
            row.failure_code = run.get("failure_code")
            row.failure_reason = run.get("failure_reason")
            row.runtime_provenance = dict(run["runtime_provenance"])
            row.execution_provenance = dict(run["execution_provenance"])
            row.next_retry_at = None

            task: SchedulerTaskRow | None = None
            if row.task_id is not None:
                task = await session.get(SchedulerTaskRow, row.task_id)
                if task is not None and row.finished_at is not None:
                    task.last_run_at = row.finished_at
                    task.updated_at = row.finished_at

            if (
                row.status == "failed"
                and row.finished_at is not None
                and task is not None
                and task.enabled
                and row.attempt < task.retry_max_attempts
            ):
                multiplier = 2 ** (row.attempt - 1)
                row.next_retry_at = row.finished_at + timedelta(
                    seconds=task.retry_backoff_seconds * multiplier
                )

            attempt_result = await session.execute(
                select(SchedulerRunAttemptRow).where(
                    SchedulerRunAttemptRow.run_id == row.run_id,
                    SchedulerRunAttemptRow.attempt == row.attempt,
                )
            )
            attempt_row = attempt_result.scalar_one_or_none()
            if attempt_row is None:
                attempt_row = _attempt_from_run(run)
                session.add(attempt_row)
            else:
                attempt_row.status = row.status
                attempt_row.started_at = row.started_at
                attempt_row.finished_at = row.finished_at
                attempt_row.failure_code = row.failure_code
                attempt_row.failure_reason = row.failure_reason
                attempt_row.runtime_provenance = dict(row.runtime_provenance)
                attempt_row.execution_provenance = dict(row.execution_provenance)
            await session.commit()
            return _run_to_wire(row)

    async def claim_due_retries(
        self,
        *,
        now: datetime,
        limit: int,
    ) -> list[dict[str, Any]]:
        async with self.sessions() as session:
            async with session.begin():
                result = await session.execute(
                    select(SchedulerRunRow)
                    .where(
                        SchedulerRunRow.status == "failed",
                        SchedulerRunRow.next_retry_at.is_not(None),
                        SchedulerRunRow.next_retry_at <= now,
                    )
                    .order_by(SchedulerRunRow.next_retry_at.asc())
                    .with_for_update(skip_locked=True)
                    .limit(limit)
                )
                claimed: list[dict[str, Any]] = []
                for row in result.scalars():
                    task = None
                    if row.task_id is not None:
                        task = await session.get(SchedulerTaskRow, row.task_id)
                    if task is None or not task.enabled or row.attempt >= task.retry_max_attempts:
                        row.next_retry_at = None
                        continue

                    row.attempt += 1
                    row.status = "running"
                    row.started_at = now
                    row.finished_at = None
                    row.next_retry_at = None
                    row.failure_code = None
                    row.failure_reason = None
                    runtime = dict(row.runtime_provenance)
                    runtime["harness_session_id"] = None
                    runtime["completion_signal"] = None
                    row.runtime_provenance = runtime
                    execution = dict(row.execution_provenance)
                    execution["attempt"] = row.attempt
                    row.execution_provenance = execution
                    session.add(
                        SchedulerRunAttemptRow(
                            attempt_id=f"attempt_{uuid4().hex}",
                            run_id=row.run_id,
                            attempt=row.attempt,
                            status="running",
                            started_at=now,
                            finished_at=None,
                            failure_code=None,
                            failure_reason=None,
                            runtime_provenance=dict(row.runtime_provenance),
                            execution_provenance=dict(row.execution_provenance),
                        )
                    )
                    claimed.append(_run_to_wire(row))
            return claimed

    async def list_attempts(self, run_id: str) -> list[dict[str, Any]]:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerRunAttemptRow)
                .where(SchedulerRunAttemptRow.run_id == run_id)
                .order_by(SchedulerRunAttemptRow.attempt.asc())
            )
            return [_attempt_to_wire(row) for row in result.scalars()]

    async def list_runs(self, *, business_object_id: str, limit: int = 50) -> list[dict[str, Any]]:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerRunRow)
                .where(SchedulerRunRow.business_object_id == business_object_id)
                .order_by(SchedulerRunRow.started_at.desc())
                .limit(limit)
            )
            return [_run_to_wire(row) for row in result.scalars()]


def scheduler_database_url() -> str | None:
    raw = os.getenv("DATABASE_URL", "").strip()
    return raw or None


def _wire_to_run_row(run: dict[str, Any], input_hash: str) -> SchedulerRunRow:
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
        scheduled_for=run.get("scheduled_for"),
        started_at=run["started_at"],
        finished_at=run.get("finished_at"),
        next_retry_at=run.get("next_retry_at"),
        failure_code=run.get("failure_code"),
        failure_reason=run.get("failure_reason"),
        runtime_provenance=dict(run["runtime_provenance"]),
        execution_provenance=dict(run["execution_provenance"]),
    )


def _attempt_from_run(run: dict[str, Any]) -> SchedulerRunAttemptRow:
    return SchedulerRunAttemptRow(
        attempt_id=f"attempt_{uuid4().hex}",
        run_id=str(run["run_id"]),
        attempt=int(run["attempt"]),
        status=str(run["status"]),
        started_at=run["started_at"],
        finished_at=run.get("finished_at"),
        failure_code=run.get("failure_code"),
        failure_reason=run.get("failure_reason"),
        runtime_provenance=dict(run["runtime_provenance"]),
        execution_provenance=dict(run["execution_provenance"]),
    )


def _task_to_wire(row: SchedulerTaskRow) -> dict[str, Any]:
    return {
        "task_id": row.task_id,
        "operation": row.operation,
        "business_object_type": row.business_object_type,
        "business_object_id": row.business_object_id,
        "trigger_kind": row.trigger_kind,
        "enabled": row.enabled,
        "schedule_kind": row.schedule_kind,
        "schedule_expression": row.schedule_expression,
        "catch_up_policy": row.catch_up_policy,
        "catch_up_limit": row.catch_up_limit,
        "retry_max_attempts": row.retry_max_attempts,
        "retry_backoff_seconds": row.retry_backoff_seconds,
        "next_run_at": row.next_run_at,
        "last_run_at": row.last_run_at,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "persistence": "postgresql",
    }


def _run_to_wire(row: SchedulerRunRow) -> dict[str, Any]:
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
        "scheduled_for": row.scheduled_for,
        "started_at": row.started_at,
        "finished_at": row.finished_at,
        "next_retry_at": row.next_retry_at,
        "failure_code": row.failure_code,
        "failure_reason": row.failure_reason,
        "runtime_provenance": dict(row.runtime_provenance),
        "execution_provenance": dict(row.execution_provenance),
        "persistence": "postgresql",
        "input_hash": row.input_hash,
    }


def _attempt_to_wire(row: SchedulerRunAttemptRow) -> dict[str, Any]:
    return {
        "attempt_id": row.attempt_id,
        "run_id": row.run_id,
        "attempt": row.attempt,
        "status": row.status,
        "started_at": row.started_at,
        "finished_at": row.finished_at,
        "failure_code": row.failure_code,
        "failure_reason": row.failure_reason,
        "runtime_provenance": dict(row.runtime_provenance),
        "execution_provenance": dict(row.execution_provenance),
    }
