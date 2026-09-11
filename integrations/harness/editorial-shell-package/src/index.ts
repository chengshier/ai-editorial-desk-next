import type { Context } from '@deepseek-ai/cordis'
import { registerEditorialResearchResultTool } from './research-tool.ts'

export const name = 'ai-editorial-desk-harness-editorial-shell'
export const inject = ['tools']

export function apply(ctx: Context): void {
  // Product Shell owns the structured business UI while this host face exposes
  // only tools that operate on already-existing canonical business objects.
  registerEditorialResearchResultTool(ctx)
}
