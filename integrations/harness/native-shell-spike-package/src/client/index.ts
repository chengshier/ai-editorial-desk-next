import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only imports: pull the shipped SlotMap declarations into this
// compilation unit without taking runtime dependencies on the layout/sidebar
// plugins. The exact-pinned Harness uses this declaration-merge pattern across
// its own client plugins.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
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

  // In stock Harness mode, leave AppFrame untouched and expose the return
  // switch through the sidebar's additive footer-action seat. This is a normal
  // sidebar control beside Settings, rather than a shell overlay that can sit
  // underneath Harness modal/presentation masks and become unclickable.
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'ai-editorial-desk-workbench-switch',
    order: 1000,
  }, NativeWorkbenchSwitch))
}
