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

    # Harness stores session logs as concatenated Zstd frames. The repair must
    # scan and rewrite frames independently, preserve untouched frames verbatim,
    # and only recompress the individual frame containing a changed event.
    assert "scanZstdFrames(source)" in repair
    assert "for (const frame of scan.frames)" in repair
    assert "const rawFrame = source.subarray(frame.start, frame.end)" in repair
    assert "decompressZstdFrame(rawFrame)" in repair
    assert "marked.changed === 0" in repair
    assert "compressZstdFrame(Buffer.from(marked.text, 'utf8'))" in repair
    assert "Buffer.concat(rewrittenFrames)" in repair


def test_legacy_repair_verifies_persisted_result_is_idempotent() -> None:
    repair = (
        SPIKE_ROOT / "scripts" / "repair_legacy_research_events.ts"
    ).read_text(encoding="utf-8")

    assert "const verification = await rewriteFile(path)" in repair
    assert "verification.changed !== 0" in repair
    assert "verified: no unmarked legacy editorial/research-* events remain" in repair
