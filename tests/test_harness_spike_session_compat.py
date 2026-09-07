# ruff: noqa: I001
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPIKE_ROOT = ROOT / "integrations" / "harness" / "spike-package"


def test_research_runtime_does_not_persist_plugin_owned_session_events() -> None:
    server = (SPIKE_ROOT / "src" / "index.ts").read_text(encoding="utf-8")

    # Out-of-repo SessionEventMap additions are not part of Harness's generated
    # KNOWN_SESSION_EVENT_TYPES. New sessions must therefore keep Research
    # truth in Editorial API / ordinary Tool results rather than appending
    # editorial/research-* events into the durable Harness session log.
    assert "session.append('editorial/research-start'" not in server
    assert "session.append('editorial/research-progress'" not in server
    assert "session.append('editorial/research-end'" not in server
    assert "agent.session.append('editorial/research" not in server


def test_legacy_research_session_repair_marks_exact_events_ignorable() -> None:
    repair = (
        SPIKE_ROOT / "scripts" / "repair_legacy_research_events.ts"
    ).read_text(encoding="utf-8")

    assert "editorial/research-start" in repair
    assert "editorial/research-progress" in repair
    assert "editorial/research-end" in repair
    assert "record.ignorable = true" in repair
    assert ".editorial-repair-backup" in repair


def test_legacy_repair_preserves_zstd_frame_boundaries() -> None:
    repair = (
        SPIKE_ROOT / "scripts" / "repair_legacy_research_events.ts"
    ).read_text(encoding="utf-8")

    # Harness requires the first Zstd frame to remain exactly one header line.
    # The repair must therefore rewrite frames independently instead of
    # flattening the whole decoded JSONL into one new frame.
    assert "for (const frame of scan.frames)" in repair
    assert "Buffer.concat(rewrittenFrames)" in repair
    assert "marked.changed === 0" in repair
    assert "first frame" in repair
