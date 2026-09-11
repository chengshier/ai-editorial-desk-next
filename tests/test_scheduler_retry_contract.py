from pathlib import Path

from apps.editorial_api.scheduler_persistence import (
    SchedulerRunAttemptRow,
    SchedulerRunRow,
    SchedulerTaskRow,
)

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "migrations" / "versions" / "20260910_02_scheduler_retry_catchup.py"
RETRY_API = ROOT / "apps" / "editorial_api" / "scheduler_retry.py"
STATE = ROOT / "docs" / "CURRENT_STATE.md"


def test_retry_schema_keeps_attempt_history_and_policy_durable() -> None:
    task_columns = SchedulerTaskRow.__table__.columns
    for name in (
        "catch_up_policy",
        "catch_up_limit",
        "retry_max_attempts",
        "retry_backoff_seconds",
        "last_run_at",
    ):
        assert name in task_columns

    run_columns = SchedulerRunRow.__table__.columns
    assert "scheduled_for" in run_columns
    assert "next_retry_at" in run_columns

    attempt_columns = SchedulerRunAttemptRow.__table__.columns
    assert "run_id" in attempt_columns
    assert "attempt" in attempt_columns
    assert "runtime_provenance" in attempt_columns
    assert "execution_provenance" in attempt_columns
    assert "harness_session_id" not in attempt_columns


def test_retry_migration_and_api_expose_bounded_policy_and_history() -> None:
    migration = MIGRATION.read_text(encoding="utf-8")
    api = RETRY_API.read_text(encoding="utf-8")

    assert "scheduler_run_attempts" in migration
    assert "uq_scheduler_run_attempt" in migration
    assert "ix_scheduler_runs_next_retry_at" in migration
    assert 'Literal["skip", "bounded"]' in api
    assert '"/runs/{run_id}/attempts"' in api
    assert '"/retry-tick"' in api
    assert "retry_max_attempts" in api
    assert "retry_backoff_seconds" in api


def test_current_state_records_scheduler_and_s4_engineering_complete() -> None:
    state = STATE.read_text(encoding="utf-8")
    assert "N4-D Interval / Schedule trigger       COMPLETE / CI PASS" in state
    assert "N4-E Retry / Catch-up / History        COMPLETE / CI PASS" in state
    assert "N4-F Event trigger + Product status UI COMPLETE / CI PASS" in state
    assert "S4-N4 Scheduler / Headless Orchestration COMPLETE / CI PASS" in state
    assert "S4-N5 Web Shell Retirement               COMPLETE / CI PASS" in state
    assert "S4 Engineering                           COMPLETE / CI PASS" in state
