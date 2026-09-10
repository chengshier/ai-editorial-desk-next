import type { Context } from '@deepseek-ai/cordis'

export const name = 'ai-editorial-desk-harness-editorial-shell'
export const inject: string[] = []

export function apply(_ctx: Context): void {
  // Host face intentionally remains empty in S4-N1. Product UI runs through
  // the Harness client plugin while business state stays in Editorial API.
}
