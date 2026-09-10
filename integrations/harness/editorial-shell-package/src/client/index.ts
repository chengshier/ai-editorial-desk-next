import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
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

export const name = 'ai-editorial-desk-harness-editorial-shell-client'
export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  if (readMode() === 'editorial') {
    // Stock Harness AppFrame owns root at priority 0. The exact-pinned slot
    // contract renders the lowest priority occupant, so use a stable negative
    // priority rather than patching Harness core.
    ctx.slots.register({ name: 'root', priority: -100 }, EditorialWorkbenchRoot)
    return
  }

  // Harness mode leaves the stock AppFrame untouched. The return affordance is
  // an additive stock-sidebar footer action, not a global overlay.
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'ai-editorial-desk-workbench-switch',
    order: 1000,
  }, NativeWorkbenchSwitch))
}
