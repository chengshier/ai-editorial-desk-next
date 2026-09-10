import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Pull only the layout SlotMap merge. Importing ui-sidebar/client directly
// drags that package's source tree into this spike tsconfig rootDir at the
// exact-pinned workspace. For the one additive sidebar seat we consume, keep
// an out-of-tree copy of the public slot shape instead of compiling upstream
// sidebar implementation sources into this plugin.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * Additive footer action rendered by the stock Harness sidebar beside
     * Settings. This mirrors the exact-pinned public sidebar contract; the
     * runtime declaration still belongs to Harness, not this plugin.
     */
    'sidebar.footer.action': {
      kind: 'list'
      scope: 'root'
      owner: { wide: boolean }
    }
  }
}

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
