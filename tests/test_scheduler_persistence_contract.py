from pathlib import Path

from apps.editorial_api.scheduler_persistence import SchedulerRunRow, SchedulerTaskRow

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "migrations" / "versions" / "20260910_01_scheduler_task_run.py"
SCHEDULER = ROOT / "apps" / "editorial_api" / "scheduler.py"
PERSISTENCE = ROOT / "apps" / "editorial_api" / "scheduler_persistence.py"


def test_scheduler_rows_keep_business_identity_separate_from_runtime_metadata() -> None:
    run_columns = SchedulerRunRow.__table__.columns
    assert "business_object_id" in run_columns
    assert "idempotency_key" in run_columns
    assert "input_hash" in run_columns
    assert "runtime_provenance" in run_columns
    assert "execution_provenance" in run_columns
    assert "harness_session_id" not in run_columns

    task_columns = SchedulerTaskRow.__table__.columns
    assert "task_id" in task_columns
    assert "enabled" in task_columns
    assert "schedule_kind" in task_columns
    assert "schedule_expression" in task_columns
    assert "next_run_at" in task_columns


def test_scheduler_migration_owns_unique_idempotency_and_history_indexes() -> None:
    migration = MIGRATION.read_text(encoding="utf-8")
    assert "scheduler_tasks" in migration
    assert "scheduler_runs" in migration
    assert "uq_scheduler_runs_idempotency_key" in migration
    assert "ix_scheduler_runs_business_object_id" in migration
    assert "ix_scheduler_runs_status" in migration


def test_scheduler_api_selects_postgresql_when_database_url_is_configured() -> None:
    source = SCHEDULER.read_text(encoding="utf-8")
    assert "SchedulerPostgresStore" in source
    assert 'persistence="postgresql" if store is not None' in source
    assert '"/research/{research_case_id}/runs"' in source


def test_interval_scheduler_exposes_durable_task_and_tick_surface() -> None:
    source = SCHEDULER.read_text(encoding="utf-8")
    persistence = PERSISTENCE.read_text(encoding="utf-8")

    assert '"/research/{research_case_id}/tasks/interval"' in source
    assert '"/tasks/{task_id}"' in source
    assert '"/tasks/{task_id}/enabled"' in source
    assert '"/tick"' in source
    assert "DATABASE_URL is required for durable scheduler tasks" in source
    assert 'trigger_kind: Literal["manual", "schedule"]' in source
    assert 'f"schedule:{task.task_id}:{claimed_for_at.isoformat()}"' in source

    assert "with_for_update(skip_locked=True)" in persistence
    assert "SchedulerTaskRow.next_run_at <= now" in persistence
    assert "row.next_run_at = now + timedelta(seconds=interval_seconds)" in persistence
