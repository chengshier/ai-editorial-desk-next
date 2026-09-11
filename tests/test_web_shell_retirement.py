import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web"
STATE = ROOT / "docs" / "CURRENT_STATE.md"
AUDIT = ROOT / "docs" / "07_DELIVERY" / "S4_N5_WEB_SHELL_RETIREMENT_AUDIT.md"
UI_STRATEGY = ROOT / "docs" / "03_ARCHITECTURE" / "HARNESS_UI_STRATEGY.md"
APP = WEB / "src" / "App.tsx"
PACKAGE = WEB / "package.json"
README = WEB / "README.md"


def test_web_shell_is_quarantined_as_reference_only() -> None:
    readme = README.read_text(encoding="utf-8")
    app = APP.read_text(encoding="utf-8")
    package = json.loads(PACKAGE.read_text(encoding="utf-8"))

    assert "RETIRED_AS_PRODUCTION_HOST" in readme
    assert "migration/reference" in readme
    assert "Formal Product Shell runs inside DeepSeek Harness" in package["description"]
    assert "Legacy migration reference only" in app
    assert "正式产品入口已迁移到 DeepSeek Harness Product Shell" in app


def test_n5_docs_keep_single_production_host_invariant() -> None:
    state = STATE.read_text(encoding="utf-8")
    audit = AUDIT.read_text(encoding="utf-8")
    strategy = UI_STRATEGY.read_text(encoding="utf-8")

    assert "S4-N4 Scheduler / Headless Orchestration COMPLETE / CI PASS" in state
    assert "S4-N5 Web Shell Retirement               COMPLETE / CI PASS" in state
    assert "S4 Engineering                           COMPLETE / CI PASS" in state
    assert "Windows final local smoke                PASS" in state
    assert "apps/web = RETIRED_AS_PRODUCTION_HOST" in state
    assert "apps/web = MIGRATION_REFERENCE_ONLY" in state
    assert "RETIRED_AS_PRODUCTION_HOST" in audit
    assert "MIGRATION_REFERENCE_ONLY" in audit
    assert "WINDOWS SMOKE PASS" in audit
    assert "formal product host = DeepSeek Harness Product Shell" in state
    assert "把 `apps/web` 恢复为第二个 production Product Shell" in strategy
    assert "a56b7b9bbe8844df88fed7071f2827dcc0b672b5" in audit
