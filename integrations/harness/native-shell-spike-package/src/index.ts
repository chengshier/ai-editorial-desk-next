import type { Context } from '@deepseek-ai/cordis'

export const name = 'ai-editorial-desk-harness-native-shell-spike'
export const inject: string[] = []

export function apply(_ctx: Context): void {
  // Host face intentionally stays empty in this spike. The proof target is
  // whether a client plugin can own the product shell while Harness remains
  // the runtime and the stock Harness workbench stays available as a mode.
}
