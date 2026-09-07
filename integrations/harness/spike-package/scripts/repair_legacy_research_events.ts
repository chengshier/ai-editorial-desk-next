import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import {
  compressZstdFrame,
  decompressZstdFrame,
  scanZstdFrames,
} from '../../../session/session-persistence-jsonl/src/zstd.ts'

const LEGACY_TYPES = new Set([
  'editorial/research-start',
  'editorial/research-progress',
  'editorial/research-end',
])

interface Args {
  dshHome: string
  apply: boolean
  sessionId?: string
}

interface RewriteResult {
  encoded: Buffer
  changed: number
}

function parseArgs(argv: string[]): Args {
  const positional = argv.filter(arg => !arg.startsWith('--'))
  const dshHome = positional[0]
  if (!dshHome) {
    throw new Error(
      'usage: repair_legacy_research_events.ts <DSH_HOME> [--session=<session-id>] [--apply]',
    )
  }
  const sessionArg = argv.find(arg => arg.startsWith('--session='))
  return {
    dshHome: resolve(dshHome),
    apply: argv.includes('--apply'),
    sessionId: sessionArg?.slice('--session='.length),
  }
}

async function walk(root: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) {
      result.push(...await walk(path))
    } else if (entry.isFile() && (entry.name.endsWith('.jsonl') || entry.name.endsWith('.jsonl.zstd'))) {
      result.push(path)
    }
  }
  return result
}

function markLegacyEvents(text: string): { text: string; changed: number } {
  const trailingNewline = text.endsWith('\n')
  const lines = text.split('\n')
  if (trailingNewline) lines.pop()

  let changed = 0
  const rewritten = lines.map((line, index) => {
    if (line.trim().length === 0) return line
    let value: unknown
    try {
      value = JSON.parse(line)
    } catch (error: unknown) {
      throw new Error(`invalid JSONL at line ${index + 1}: ${String(error)}`)
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return line
    const record = value as Record<string, unknown>
    if (typeof record.type !== 'string' || !LEGACY_TYPES.has(record.type)) return line
    if (record.ignorable === true) return line
    record.ignorable = true
    changed += 1
    return JSON.stringify(record)
  })

  return {
    text: rewritten.join('\n') + (trailingNewline ? '\n' : ''),
    changed,
  }
}

async function rewritePlainJsonl(path: string): Promise<RewriteResult> {
  const source = await readFile(path)
  const marked = markLegacyEvents(source.toString('utf8'))
  return { encoded: Buffer.from(marked.text, 'utf8'), changed: marked.changed }
}

async function rewriteZstdJsonl(path: string): Promise<RewriteResult> {
  const source = await readFile(path)
  const scan = scanZstdFrames(source)
  if (scan.tornStart !== undefined) {
    throw new Error(`refusing to rewrite torn zstd session log: ${path}`)
  }
  if (scan.frames.length === 0) {
    throw new Error(`refusing to rewrite empty zstd session log: ${path}`)
  }

  // Harness owns a concatenated-frame container. In particular the FIRST frame
  // must remain exactly one header JSON line; subsequent frames contain durable
  // event batches. Recompressing the entire decoded JSONL into one frame would
  // destroy that physical contract and make the workspace fail at boot.
  const rewrittenFrames: Buffer[] = []
  let changed = 0

  for (const frame of scan.frames) {
    const rawFrame = source.subarray(frame.start, frame.end)
    const decoded = await decompressZstdFrame(rawFrame)
    const marked = markLegacyEvents(decoded.toString('utf8'))
    changed += marked.changed

    // Preserve untouched frames byte-for-byte. For changed event frames, keep
    // the original frame boundary and only recompress that frame's plaintext.
    rewrittenFrames.push(
      marked.changed === 0
        ? rawFrame
        : await compressZstdFrame(Buffer.from(marked.text, 'utf8')),
    )
  }

  return { encoded: Buffer.concat(rewrittenFrames), changed }
}

async function rewriteFile(path: string): Promise<RewriteResult> {
  return path.endsWith('.zstd') ? rewriteZstdJsonl(path) : rewritePlainJsonl(path)
}

function matchesSession(path: string, sessionId?: string): boolean {
  return sessionId === undefined || path.includes(sessionId)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const sessionsRoot = join(args.dshHome, 'sessions')
  const rootStat = await stat(sessionsRoot).catch(() => null)
  if (!rootStat?.isDirectory()) {
    throw new Error(`sessions directory not found: ${sessionsRoot}`)
  }

  const files = (await walk(sessionsRoot)).filter(path => matchesSession(path, args.sessionId))
  let affectedFiles = 0
  let affectedEvents = 0

  for (const path of files) {
    const rewritten = await rewriteFile(path)
    if (rewritten.changed === 0) continue
    affectedFiles += 1
    affectedEvents += rewritten.changed
    console.log(`${args.apply ? 'repair' : 'would repair'} ${path}: ${rewritten.changed} legacy event(s)`)

    if (!args.apply) continue
    const backupDir = join(dirname(path), '.editorial-repair-backup')
    await mkdir(backupDir, { recursive: true })
    const backupPath = join(backupDir, `${basename(path)}.before-ignorable`)
    await copyFile(path, backupPath)
    await writeFile(path, rewritten.encoded)
    console.log(`  backup: ${backupPath}`)
  }

  if (affectedEvents === 0) {
    console.log('No legacy editorial/research-* events require repair.')
    return
  }

  console.log(
    `${args.apply ? 'Repaired' : 'Dry run:'} ${affectedEvents} event(s) across ${affectedFiles} session file(s).`,
  )
  if (!args.apply) {
    console.log('Re-run with --apply after reviewing the paths above.')
  }
}

await main()
