import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only import: pull the stock AppFrame's SlotMap declarations into this
// compilation unit so `shell.overlay` is typed without taking a runtime
// dependency on the layout plugin. The exact-pinned Harness uses this same
// declaration-merge pattern across its own client plugins.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import {
  EditorialWorkbenchRoot,
  NativeWorkbenchSwitch,
  readMode,
} from './workbench.tsx'

export const name = 'ai-editorial-desk-harness-native-shell-spike-client'
export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  if (readMode() === 'editorial') {
    // `root` is the built-in single slot. The shipped AppFrame currently
    // occupies priority 0. Single slots reject two registrations at the same
    // priority, and the exact-pinned Harness renders the lowest priority.
    // Use an explicit negative priority so Editorial mode deterministically
    // shadows AppFrame without patching Harness core. Reloading with mode
    // `harness` skips this registration entirely and restores the stock UI.
    ctx.slots.register({ name: 'root', priority: -100 }, EditorialWorkbenchRoot)
    return
  }

  // In stock Harness mode, keep the shipped AppFrame and add only an opt-in
  // switch through its additive overlay seat.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'ai-editorial-desk-workbench-switch',
    order: 1000,
  }, NativeWorkbenchSwitch))
}
