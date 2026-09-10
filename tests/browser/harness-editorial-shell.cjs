const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

const DIAGNOSTIC_LOG = '/tmp/editorial-shell-browser.log'
const DIAGNOSTIC_SCREENSHOT = '/tmp/editorial-shell-browser.png'
const DIAGNOSTIC_BODY = '/tmp/editorial-shell-browser-body.txt'
const WORKSPACE_MODE_KEY = 'ai-editorial-desk:workspace-mode'
const EDITORIAL_API_BASE = 'http://127.0.0.1:18000'

async function optionalVisible(locator, timeout = 5_000) {
  return locator.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
}

async function openProductShellWhenHarnessIsReady(page, base, diagnostics) {
  const deadline = Date.now() + 75_000
  let attempt = 0

  while (Date.now() < deadline) {
    attempt += 1
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    // `dsh web` starts listening before every browser-side Cordis service is
    // necessarily ready. Opening the page in that short window can produce the
    // exact-pin Harness "Failed to load plugins" screen with core entries still
    // waiting for `connection` / `remote`. That is a boot-readiness race, not a
    // Product Shell acceptance failure. Reload only that explicit Harness boot
    // state; the final Product Shell assertions below remain strict.
    const bootFailure = page.getByText('Failed to load plugins', { exact: true })
    if (await optionalVisible(bootFailure, 5_000)) {
      const body = await page.locator('body').innerText().catch(() => '')
      diagnostics.push(`[harness-boot-retry:${attempt}] ${body.slice(0, 1200)}`)
      await page.waitForTimeout(1_500)
      continue
    }

    const productShell = page.getByText('AI Editorial Desk', { exact: true }).first()
    if (await optionalVisible(productShell, 12_000)) {
      if (attempt > 1) diagnostics.push(`[harness-boot-ready] recovered on attempt ${attempt}`)
      return
    }

    diagnostics.push(`[harness-boot-retry:${attempt}] HTTP is up but Product Shell is not visible yet`)
    await page.waitForTimeout(1_500)
  }

  throw new Error('Harness Web did not reach a fully activated Product Shell state within 75s')
}

async function dismissHarnessFirstUseModals(page) {
  const internalTestingNotice = page.getByText('Internal Testing Notice', { exact: true })
  if (await optionalVisible(internalTestingNotice)) {
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await internalTestingNotice.waitFor({ state: 'hidden', timeout: 10_000 })
  }

  const apiKeyOnboarding = page.getByText('Add an API key to get started', { exact: true })
  if (await optionalVisible(apiKeyOnboarding)) {
    await page.getByRole('button', { name: 'Configure later', exact: true }).click()
    await apiKeyOnboarding.waitFor({ state: 'hidden', timeout: 10_000 })
  }
}

async function waitForRuntimeBinding(page, researchCaseId) {
  const deadline = Date.now() + 25_000
  while (Date.now() < deadline) {
    const binding = await page.evaluate(async ({ apiBase, researchCaseId: caseId }) => {
      const response = await fetch(`${apiBase}/api/v1/integrations/harness/runtime/research/${encodeURIComponent(caseId)}`)
      if (!response.ok) return null
      return response.json()
    }, { apiBase: EDITORIAL_API_BASE, researchCaseId })
    if (binding?.harness_session_id) return binding
    await page.waitForTimeout(250)
  }
  throw new Error(`Harness runtime binding for ${researchCaseId} did not acquire a Session`)
}

async function main() {
  const base = process.env.HARNESS_BASE_URL || 'http://127.0.0.1:3080'
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const pageErrors = []
  const diagnostics = []

  page.on('console', message => diagnostics.push(`[console:${message.type()}] ${message.text()}`))
  page.on('pageerror', error => {
    pageErrors.push(error.message)
    diagnostics.push(`[pageerror] ${error.stack || error.message}`)
  })
  page.on('requestfailed', request => diagnostics.push(`[requestfailed] ${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`))

  try {
    await openProductShellWhenHarnessIsReady(page, base, diagnostics)
    await page.getByText('Harness-native Product Shell', { exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    await page.getByRole('heading', { name: '今日视野', exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    await page.getByText('洗碗机真的可能比手洗更省水吗？', { exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(await page.getByText('API: http://127.0.0.1:18000 · Runtime: DeepSeek Harness', { exact: true }).count(), 1)

    // Today is no longer a static spike list: selecting a real Opportunity opens
    // the migrated five-tab Inspector without manufacturing unavailable data.
    await page.getByRole('button', { name: /洗碗机真的可能比手洗更省水吗？/ }).click()
    await page.getByText('Opportunity Inspector', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    // Playwright's accessible-name lookup for role=tab is not stable when this
    // out-of-tree root shadows Harness AppFrame. Assert the actual ARIA DOM
    // contract instead: one tablist with exactly these five role=tab children.
    const inspectorTabs = page.locator('[role="tablist"][aria-label="Opportunity Inspector"] [role="tab"]')
    assert.deepEqual(await inspectorTabs.allTextContents(), ['概览', '证据', '研究', '时间线', '历史'])
    await inspectorTabs.filter({ hasText: '证据' }).click()
    await page.getByText('证据详情暂未开放', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    await inspectorTabs.filter({ hasText: '研究' }).click()
    await page.getByText('N2 负责创建/复用业务 Research Case；N3 再由 Runtime Adapter 主动绑定 Harness Session 并执行 Agent。', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    console.log('PASS: Today migrates Opportunity selection and the five-tab Inspector into the Harness-native Product Shell')

    // Opportunities migrates the real search/filter surface and keeps the
    // business Research Case id as the next-hop identity.
    await page.getByRole('button', { name: '全部机会', exact: true }).click()
    await page.getByRole('heading', { name: '全部机会', exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    const search = page.getByRole('textbox', { name: '搜索机会', exact: true })
    await search.fill('招聘骗局')
    await page.getByText('找工作时只回复一个 YES，也可能进入招聘骗局', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    assert.equal(await page.getByText('洗碗机真的可能比手洗更省水吗？', { exact: true }).count(), 0)

    await page.getByRole('button', { name: '开始研究', exact: true }).click()
    await page.getByRole('heading', { name: 'Research Case 已就绪', exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    await page.getByText('opp_job_scam_yes', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    const researchCaseText = await page.locator('dd').first().innerText()
    assert.match(researchCaseText, /^rc_[a-zA-Z0-9]+$/)
    assert.match(page.url(), /ed_research_case=rc_/)
    assert.doesNotMatch(page.url(), /session-/)
    console.log('PASS: Product actions create/restore a canonical Research Case without routing through Harness Session ids')

    const runtimeBinding = await waitForRuntimeBinding(page, researchCaseText)
    assert.equal(runtimeBinding.research_case_id, researchCaseText)
    assert.equal(runtimeBinding.opportunity_id, 'opp_job_scam_yes')
    assert.equal(typeof runtimeBinding.harness_session_id, 'string')
    assert.ok(runtimeBinding.harness_session_id.length > 0)
    assert.equal(page.url().includes(runtimeBinding.harness_session_id), false)
    await page.getByText('harness_session_id · runtime metadata', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    console.log('PASS: Product Research automatically binds a Harness Session while keeping Session identity out of the business URL')

    await page.getByRole('button', { name: '返回机会', exact: true }).click()
    await page.getByRole('heading', { name: '全部机会', exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
    await expectValue(search, '招聘骗局')

    // Preserve product state while round-tripping to the stock Harness workbench.
    await page.getByRole('button', { name: '切换到 Harness 原生工作台', exact: true }).click()
    await page.getByText('Workspaces', { exact: true }).first().waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(await page.evaluate(key => window.localStorage.getItem(key), WORKSPACE_MODE_KEY), 'harness')

    await dismissHarnessFirstUseModals(page)
    const returnToEditorial = page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true })
    await returnToEditorial.waitFor({ state: 'visible', timeout: 30_000 })
    await returnToEditorial.click()
    await page.getByRole('heading', { name: '全部机会', exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    await expectValue(page.getByRole('textbox', { name: '搜索机会', exact: true }), '招聘骗局')
    assert.equal(await page.evaluate(key => window.localStorage.getItem(key), WORKSPACE_MODE_KEY), 'editorial')
    assert.deepEqual(pageErrors, [])

    console.log('PASS: formal Product Shell migrates Today/Opportunities, auto-binds Research runtime, and round-trips to stock Harness')
  } catch (error) {
    diagnostics.push(`[failure] ${error?.stack || String(error)}`)
    diagnostics.push(`[state] url=${page.url()}`)
    await page.screenshot({ path: DIAGNOSTIC_SCREENSHOT, fullPage: true }).catch(() => {})
    const bodyText = await page.locator('body').innerText({ timeout: 5_000 }).catch(reason => `BODY UNAVAILABLE: ${reason}`)
    await fs.writeFile(DIAGNOSTIC_BODY, bodyText, 'utf8').catch(() => {})
    throw error
  } finally {
    await fs.writeFile(DIAGNOSTIC_LOG, diagnostics.join('\n') + '\n', 'utf8').catch(() => {})
    await browser.close()
  }
}

async function expectValue(locator, expected) {
  await locator.waitFor({ state: 'visible', timeout: 10_000 })
  assert.equal(await locator.inputValue(), expected)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
