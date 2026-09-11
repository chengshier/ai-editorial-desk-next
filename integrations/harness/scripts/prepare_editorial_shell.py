from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

PACKAGE_NAME = "@ai-editorial-desk/harness-editorial-shell"
TARGET_RELATIVE = Path("packages/client/editorial-shell")
HEADLESS_PACKAGE_NAME = "@ai-editorial-desk/harness-editorial-headless-runner"
HEADLESS_TARGET_RELATIVE = Path("packages/examples/editorial-headless-runner")


def _git_head(path: Path) -> str:
    completed = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=path,
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def _safe_replace(source: Path, target: Path, expected_package_name: str) -> None:
    if target.exists():
        package_json = target / "package.json"
        if not package_json.exists():
            raise SystemExit(f"refusing to replace non-editorial integration directory: {target}")
        current = json.loads(package_json.read_text(encoding="utf-8"))
        if current.get("name") != expected_package_name:
            raise SystemExit(f"refusing to replace package {current.get('name')!r}: {target}")
        shutil.rmtree(target)
    shutil.copytree(source, target)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Prepare the formal AI Editorial Desk Harness product shell and headless runner in an exact-pinned Harness checkout."
    )
    parser.add_argument("harness_root", type=Path)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    integration_root = script_dir.parent
    source = integration_root / "editorial-shell-package"
    headless_source = integration_root / "editorial-headless-runner-package"
    pin = json.loads((integration_root / "HARNESS_PIN.json").read_text(encoding="utf-8"))

    harness_root = args.harness_root.resolve()
    if not (harness_root / "package.json").exists():
        raise SystemExit(f"not a DeepSeek Harness checkout: {harness_root}")

    actual_head = _git_head(harness_root)
    expected_head = pin["commit"]
    if actual_head != expected_head:
        raise SystemExit(
            "Harness checkout is not at the pinned commit:\n"
            f"  expected: {expected_head}\n"
            f"  actual:   {actual_head}"
        )

    target = harness_root / TARGET_RELATIVE
    headless_target = harness_root / HEADLESS_TARGET_RELATIVE
    _safe_replace(source, target, PACKAGE_NAME)
    _safe_replace(headless_source, headless_target, HEADLESS_PACKAGE_NAME)

    print(f"Prepared {PACKAGE_NAME}")
    print(f"Prepared {HEADLESS_PACKAGE_NAME}")
    print(f"Harness pin: {expected_head}")
    print(f"Product Shell target: {target}")
    print(f"Headless runner target: {headless_target}")
    print("Next:")
    print("  pnpm install --no-frozen-lockfile")
    print("  pnpm exec tsc -b packages/client/editorial-shell/tsconfig.json")
    print("  pnpm --filter @ai-editorial-desk/harness-editorial-shell run bundle")
    print("  node packages/examples/editorial-headless-runner/runner.mjs --probe")
    print('  export DSH_HOME="$PWD/.dsh-editorial-shell-home"')
    print("  pnpm dsh plugin --profile web add ./packages/client/editorial-shell")
    print("  pnpm dsh web")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
