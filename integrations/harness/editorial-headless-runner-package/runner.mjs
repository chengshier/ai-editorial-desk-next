import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const HARNESS_COMMIT = '99f6f02fecdb7dff40c3fbc9470f5907c29f74ca'
const HARNESS_RELEASE = 'dsh@0.1.0-rc.7'
const EXECUTION_SEAM = 'typescript-sdk-jsonrpc-stdio'

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const harnessRoot = path.resolve(packageDir, '../../..')
const runtimeEntry = path.join(harnessRoot, 'packages/examples/jsonrpc-demo/lib/bin.js')
const cordisPath = path.join(packageDir, 'cordis.yml')

function writeResult(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`)
}

function redact(text) {
  let result = String(text ?? '')
  for (const [name, value] of Object.entries(process.env)) {
    if (!value || !/(API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/iu.test(name)) continue
    result = result.split(value).join('[REDACTED]')
  }
  return result.slice(0, 2000)
}

function readRequest() {
  const raw = fs.readFileSync(0, 'utf8').trim()
  if (!raw) throw new Error('headless runner request is empty')
  const request = JSON.parse(raw)
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new Error('headless runner request must be a JSON object')
  }
  return request
}

function requireString(request, key) {
  const value = request[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string`)
  }
  return value.trim()
}

function hasCanonicalResearchResult(value, researchCaseId, seen = new Set()) {
  if (value === null || value === undefined) return false
  if (typeof value !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)

  if (!Array.isArray(value)
    && value.research_case_id === researchCaseId
    && Array.isArray(value.evidence)
    && typeof value.conclusion === 'string') {
    return true
  }

  if (Array.isArray(value)) {
    return value.some(item => hasCanonicalResearchResult(item, researchCaseId, seen))
  }
  return Object.values(value).some(item => hasCanonicalResearchResult(item, researchCaseId, seen))
}

function researchPrompt({ schedulerRunId, researchCaseId, opportunityId }) {
  return [
    '这是 AI Editorial Desk Scheduler 主动发起的后台 Research Case rehydrate 任务。',
    `scheduler_run_id: ${schedulerRunId}`,
    `research_case_id: ${researchCaseId}`,
    `opportunity_id: ${opportunityId}`,
    '不要创建新的 Research Case，不要修改 business id，不要要求用户进入 Chat。',
    '必须调用 get_editorial_research_result，参数 research_case_id 必须等于上面的值。',
    '本次任务只验证并恢复既有 canonical Research Case 的结构化结果。',
    'Tool 调用完成后只需简短确认。',
  ].join('\n')
}

async function probe() {
  const failures = []
  if (!fs.existsSync(runtimeEntry)) failures.push(`runtime entry missing: ${runtimeEntry}`)
  if (!fs.existsSync(cordisPath)) failures.push(`cordis missing: ${cordisPath}`)
  writeResult({
    ok: failures.length === 0,
    mode: 'probe',
    sdk: '@deepseek-ai/dsh-sdk-client',
    execution_seam: EXECUTION_SEAM,
    harness_commit: HARNESS_COMMIT,
    harness_release: HARNESS_RELEASE,
    runtime_entry_exists: fs.existsSync(runtimeEntry),
    cordis_exists: fs.existsSync(cordisPath),
    failures,
  })
  if (failures.length > 0) process.exitCode = 1
}

async function run() {
  const request = readRequest()
  const schedulerRunId = requireString(request, 'scheduler_run_id')
  const operation = requireString(request, 'operation')
  const researchCaseId = requireString(request, 'research_case_id')
  const opportunityId = requireString(request, 'opportunity_id')
  if (operation !== 'research.rehydrate') {
    throw new Error(`unsupported operation: ${operation}`)
  }
  if (!fs.existsSync(runtimeEntry)) {
    throw new Error(`exact-pinned Harness runtime entry is missing: ${runtimeEntry}`)
  }
  if (!fs.existsSync(cordisPath)) {
    throw new Error(`headless Cordis config is missing: ${cordisPath}`)
  }

  const suppliedSessionId = typeof request.harness_session_id === 'string'
    && request.harness_session_id.trim().length > 0
    ? request.harness_session_id.trim()
    : undefined
  const sessionId = suppliedSessionId ?? `ed-scheduler-${schedulerRunId.replace(/[^a-zA-Z0-9_-]/gu, '')}`
  const provider = process.env.EDITORIAL_HARNESS_PROVIDER ?? 'deepseek-official'
  const model = process.env.EDITORIAL_HARNESS_MODEL ?? 'deepseek-v4-flash'
  const maxTokensRaw = Number(process.env.EDITORIAL_HARNESS_MAX_TOKENS ?? '8192')
  const maxTokens = Number.isSafeInteger(maxTokensRaw) && maxTokensRaw > 0 ? maxTokensRaw : 8192
  const requestTimeoutMsRaw = Number(process.env.EDITORIAL_HARNESS_REQUEST_TIMEOUT_MS ?? '15000')
  const requestTimeoutMs = Number.isFinite(requestTimeoutMsRaw) && requestTimeoutMsRaw > 0
    ? requestTimeoutMsRaw
    : 15000
  const sessionRoot = process.env.EDITORIAL_HARNESS_SESSION_ROOT
    ?? path.join(harnessRoot, '.dsh-editorial-scheduler-sessions')
  const editorialApiBase = process.env.EDITORIAL_API_BASE_URL ?? 'http://127.0.0.1:18000'
  const childEnv = {
    ...process.env,
    DSH_CORDIS_CONFIG: cordisPath,
    DSH_SESSION_ROOT: sessionRoot,
    DSH_CWD: harnessRoot,
    EDITORIAL_API_BASE_URL: editorialApiBase,
  }

  const harness = new DeepSeekHarness({
    launch: {
      command: process.execPath,
      args: [runtimeEntry, cordisPath],
      cwd: harnessRoot,
      env: childEnv,
      requestTimeoutMs,
    },
    cwd: harnessRoot,
    provider,
    model,
    maxTokens,
  })

  try {
    const result = await harness.run(
      researchPrompt({ schedulerRunId, researchCaseId, opportunityId }),
      { sessionId },
    )
    const toolResultObserved = hasCanonicalResearchResult(result.events, researchCaseId)
    if (!toolResultObserved) {
      writeResult({
        ok: false,
        scheduler_run_id: schedulerRunId,
        operation,
        research_case_id: researchCaseId,
        opportunity_id: opportunityId,
        harness_session_id: result.sessionId,
        completion_signal: 'agent_idle_without_canonical_tool_result',
        tool_result_observed: false,
        failure_code: 'canonical_tool_result_missing',
        failure_reason: 'Harness reached idle but the owned event interval did not contain the canonical Research Tool Result.',
        harness_commit: HARNESS_COMMIT,
        harness_release: HARNESS_RELEASE,
        execution_seam: EXECUTION_SEAM,
        provider,
        model,
      })
      process.exitCode = 2
      return
    }

    writeResult({
      ok: true,
      scheduler_run_id: schedulerRunId,
      operation,
      research_case_id: researchCaseId,
      opportunity_id: opportunityId,
      harness_session_id: result.sessionId,
      completion_signal: 'agent_idle+canonical_tool_result',
      tool_result_observed: true,
      harness_commit: HARNESS_COMMIT,
      harness_release: HARNESS_RELEASE,
      execution_seam: EXECUTION_SEAM,
      provider,
      model,
    })
  } finally {
    await harness.close()
  }
}

try {
  if (process.argv.includes('--probe')) await probe()
  else await run()
} catch (error) {
  writeResult({
    ok: false,
    failure_code: 'headless_runner_error',
    failure_reason: redact(error instanceof Error ? `${error.name}: ${error.message}` : error),
    harness_commit: HARNESS_COMMIT,
    harness_release: HARNESS_RELEASE,
    execution_seam: EXECUTION_SEAM,
  })
  process.exitCode = 1
}
