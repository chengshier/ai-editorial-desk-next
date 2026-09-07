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

async function decodeFile(path: string): Promise<string> {
  const source = await readFile(path)
  if (!path.endsWith('.zstd')) return source.toString('utf8')

  const scan = scanZstdFrames(source)
  if (scan.tornStart !== undefined) {
    throw new Error(`refusing to rewrite torn zstd session log: ${path}`)
  }
  const chunks: Buffer[] = []
  for (const frame of scan.frames) {
    chunks.push(await decompressZstdFrame(source.subarray(frame.start, frame.end)))
  }
  return Buffer.concat(chunks).toString('utf8')
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

async function encodeFile(path: string, text: string): Promise<Buffer> {
  if (!path.endsWith('.zstd')) return Buffer.from(text, 'utf8')
  return compressZstdFrame(Buffer.from(text, 'utf8'))
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
    const decoded = await decodeFile(path)
    const marked = markLegacyEvents(decoded)
    if (marked.changed === 0) continue
    affectedFiles += 1
    affectedEvents += marked.changed
    console.log(`${args.apply ? 'repair' : 'would repair'} ${path}: ${marked.changed} legacy event(s)`)

    if (!args.apply) continue
    const backupDir = join(dirname(path), '.editorial-repair-backup')
    await mkdir(backupDir, { recursive: true })
    const backupPath = join(backupDir, `${basename(path)}.before-ignorable`)
    await copyFile(path, backupPath)
    const encoded = await encodeFile(path, marked.text)
    await writeFile(path, encoded)
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
