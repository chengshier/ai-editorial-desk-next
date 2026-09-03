from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

PACKAGE_NAME = "@ai-editorial-desk/harness-spike"
TARGET_RELATIVE = Path("packages/client/editorial-spike")


def _git_head(path: Path) -> str:
    completed = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=path,
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def _safe_replace(source: Path, target: Path) -> None:
    if target.exists():
        package_json = target / "package.json"
        if not package_json.exists():
            raise SystemExit(f"refusing to replace non-spike directory: {target}")
        current = json.loads(package_json.read_text(encoding="utf-8"))
        if current.get("name") != PACKAGE_NAME:
            raise SystemExit(f"refusing to replace package {current.get('name')!r}: {target}")
        shutil.rmtree(target)
    shutil.copytree(source, target)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Copy the Harness integration spike into an already-built exact pinned "
            "DeepSeek Harness checkout."
        )
    )
    parser.add_argument("harness_root", type=Path, help="Path to a deepseek-harness checkout")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    integration_root = script_dir.parent
    source = integration_root / "spike-package"
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
            f"  actual:   {actual_head}\n"
            "Checkout the pinned commit before preparing the spike."
        )

    target = harness_root / TARGET_RELATIVE
    _safe_replace(source, target)

    print(f"Prepared {PACKAGE_NAME}")
    print(f"Harness pin: {expected_head} ({pin.get('release', 'unknown release')})")
    print(f"Target: {target}")
    print("Assumption: pristine pinned Harness dependencies and root build are already complete.")
    print("Next commands from the Harness root:")
    print("  pnpm install --no-frozen-lockfile")
    print("  pnpm exec tsc -b packages/client/editorial-spike/tsconfig.json")
    print("  pnpm --filter @ai-editorial-desk/harness-spike run bundle")
    print("  export DSH_HOME=\"$PWD/.dsh-spike-home\"")
    print("  pnpm dsh plugin --profile web add ./packages/client/editorial-spike")
    print("  EDITORIAL_API_BASE_URL=http://127.0.0.1:8000 pnpm dsh web")
    print(
        "Runtime resolution is profile-relative. Copying the package into the upstream "
        "workspace is only for exact-pin build compatibility; the active profile still "
        "must install the plugin."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
