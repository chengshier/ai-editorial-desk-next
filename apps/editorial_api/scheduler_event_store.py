from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select

from apps.editorial_api.scheduler_persistence import (
    SchedulerPostgresStore,
    SchedulerRunRow,
    SchedulerTaskRow,
    _run_to_wire,
    _task_to_wire,
)


class SchedulerEventPostgresStore(SchedulerPostgresStore):
    """PostgreSQL repository extensions for event-triggered Scheduler tasks."""

    async def upsert_event_task(self, task: dict[str, Any]) -> dict[str, Any]:
        async with self.sessions() as session:
            row = await session.get(SchedulerTaskRow, task["task_id"])
            if row is None:
                row = SchedulerTaskRow(
                    task_id=str(task["task_id"]),
                    operation=str(task["operation"]),
                    business_object_type=str(task["business_object_type"]),
                    business_object_id=str(task["business_object_id"]),
                    trigger_kind="event",
                    enabled=bool(task["enabled"]),
                    schedule_kind="event",
                    schedule_expression=str(task["event_name"]),
                    catch_up_policy="skip",
                    catch_up_limit=1,
                    retry_max_attempts=int(task.get("retry_max_attempts", 1)),
                    retry_backoff_seconds=int(task.get("retry_backoff_seconds", 60)),
                    next_run_at=None,
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
                    or row.trigger_kind != "event"
                ):
                    raise ValueError("task_id is already bound to a different business operation")
                row.enabled = bool(task["enabled"])
                row.schedule_kind = "event"
                row.schedule_expression = str(task["event_name"])
                row.retry_max_attempts = int(task.get("retry_max_attempts", row.retry_max_attempts))
                row.retry_backoff_seconds = int(
                    task.get("retry_backoff_seconds", row.retry_backoff_seconds)
                )
                row.next_run_at = None
                row.updated_at = task["updated_at"]
            await session.commit()
            return _task_to_wire(row)

    async def list_matching_event_tasks(
        self,
        *,
        event_name: str,
        business_object_type: str,
        business_object_id: str,
    ) -> list[dict[str, Any]]:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerTaskRow)
                .where(
                    SchedulerTaskRow.enabled.is_(True),
                    SchedulerTaskRow.trigger_kind == "event",
                    SchedulerTaskRow.schedule_kind == "event",
                    SchedulerTaskRow.schedule_expression == event_name,
                    SchedulerTaskRow.business_object_type == business_object_type,
                    SchedulerTaskRow.business_object_id == business_object_id,
                )
                .order_by(SchedulerTaskRow.created_at.asc())
            )
            return [_task_to_wire(row) for row in result.scalars()]

    async def list_tasks_for_business_object(
        self,
        *,
        business_object_type: str,
        business_object_id: str,
    ) -> list[dict[str, Any]]:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerTaskRow)
                .where(
                    SchedulerTaskRow.business_object_type == business_object_type,
                    SchedulerTaskRow.business_object_id == business_object_id,
                )
                .order_by(SchedulerTaskRow.created_at.desc())
            )
            return [_task_to_wire(row) for row in result.scalars()]

    async def set_event_task_enabled(
        self,
        task_id: str,
        *,
        enabled: bool,
        updated_at: datetime,
    ) -> dict[str, Any] | None:
        async with self.sessions() as session:
            row = await session.get(SchedulerTaskRow, task_id)
            if row is None or row.trigger_kind != "event":
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

    async def list_runs_for_business_object(
        self,
        *,
        business_object_type: str,
        business_object_id: str,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        async with self.sessions() as session:
            result = await session.execute(
                select(SchedulerRunRow)
                .where(
                    SchedulerRunRow.business_object_type == business_object_type,
                    SchedulerRunRow.business_object_id == business_object_id,
                )
                .order_by(SchedulerRunRow.started_at.desc())
                .limit(limit)
            )
            return [_run_to_wire(row) for row in result.scalars()]
