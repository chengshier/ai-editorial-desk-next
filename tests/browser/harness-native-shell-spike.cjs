const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

const DIAGNOSTIC_LOG = '/tmp/native-shell-browser.log'
const DIAGNOSTIC_SCREENSHOT = '/tmp/native-shell-browser.png'
const DIAGNOSTIC_BODY = '/tmp/native-shell-browser-body.txt'
const WORKSPACE_MODE_KEY = 'ai-editorial-desk:workspace-mode'

async function optionalVisible(locator, timeout = 5_000) {
  return locator
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false)
}

async function openProductShellWhenHarnessIsReady(page, base, diagnostics) {
  const deadline = Date.now() + 75_000
  let attempt = 0

  while (Date.now() < deadline) {
    attempt += 1
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    // `dsh web` can accept HTTP before every browser-side Cordis service is
    // fully activated. In that short window exact-pin Harness may render its
    // own "Failed to load plugins" boot state. Retry only that explicit
    // readiness race; the Product Shell acceptance assertions remain strict.
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
  // A pristine Harness profile shows two stock onboarding layers in sequence.
  // They intentionally make the AppFrame background non-interactive, so the
  // sidebar footer action is not part of the accessible interaction surface
  // until both layers are handled. Follow the real user path instead of using
  // force-clicks or hiding upstream UI from the test.
  const internalTestingNotice = page.getByText('Internal Testing Notice', { exact: true })
  if (await optionalVisible(internalTestingNotice)) {
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await internalTestingNotice.waitFor({ state: 'hidden', timeout: 10_000 })
    console.log('INFO: dismissed stock Harness Internal Testing Notice')
  }

  const apiKeyOnboarding = page.getByText('Add an API key to get started', { exact: true })
  if (await optionalVisible(apiKeyOnboarding)) {
    await page.getByRole('button', { name: 'Configure later', exact: true }).click()
    await apiKeyOnboarding.waitFor({ state: 'hidden', timeout: 10_000 })
    console.log('INFO: deferred stock Harness API-key onboarding')
  }
}

async function main() {
  const base = process.env.HARNESS_BASE_URL || 'http://127.0.0.1:3080'
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const pageErrors = []
  const diagnostics = []

  page.on('console', message => {
    diagnostics.push(`[console:${message.type()}] ${message.text()}`)
  })
  page.on('pageerror', error => {
    pageErrors.push(error.message)
    diagnostics.push(`[pageerror] ${error.stack || error.message}`)
  })
  page.on('requestfailed', request => {
    diagnostics.push(`[requestfailed] ${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`)
  })

  try {
    // Harness maintains live runtime connections, so networkidle is not a
    // meaningful readiness signal. Wait through Harness's explicit boot race
    // and only continue once the exact Product Shell DOM is actually visible.
    await openProductShellWhenHarnessIsReady(page, base, diagnostics)

    await page.getByRole('heading', { name: '今日视野', exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    await page.getByText('洗碗机真的可能比手洗更省水吗？', { exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(await page.getByText('机会总数').locator('..').getByText('3', { exact: true }).count(), 1)
    console.log('PASS: Harness root is replaced by the AI Editorial Desk product shell and reads Editorial API data')

    // Mode switching persists a workspace mode and reloads the same Harness
    // URL. Prove that stock AppFrame content is back before touching any
    // onboarding modal or our additive sidebar action.
    await page.getByRole('button', { name: '切换到 Harness 原生工作台', exact: true }).click()
    await page.getByText('Workspaces', { exact: true }).first().waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(
      await page.evaluate(key => window.localStorage.getItem(key), WORKSPACE_MODE_KEY),
      'harness',
    )
    assert.equal(await page.getByRole('heading', { name: '今日视野', exact: true }).count(), 0)
    console.log('PASS: stock Harness AppFrame returns when the plugin stops occupying root')

    await dismissHarnessFirstUseModals(page)

    const returnToEditorial = page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true })
    await returnToEditorial.waitFor({ state: 'visible', timeout: 30_000 })
    await returnToEditorial.click()
    await page.getByRole('heading', { name: '今日视野', exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(
      await page.evaluate(key => window.localStorage.getItem(key), WORKSPACE_MODE_KEY),
      'editorial',
    )
    console.log('PASS: workbench mode can switch back to AI Editorial Desk')

    assert.deepEqual(pageErrors, [])
  } catch (error) {
    diagnostics.push(`[failure] ${error?.stack || String(error)}`)
    diagnostics.push(`[state] url=${page.url()}`)
    diagnostics.push(`[state] title=${await page.title().catch(() => '<unavailable>')}`)
    await page.screenshot({ path: DIAGNOSTIC_SCREENSHOT, fullPage: true }).catch(() => {})
    const bodyText = await page.locator('body').innerText({ timeout: 5_000 }).catch(reason => `BODY UNAVAILABLE: ${reason}`)
    await fs.writeFile(DIAGNOSTIC_BODY, bodyText, 'utf8').catch(() => {})
    throw error
  } finally {
    await fs.writeFile(DIAGNOSTIC_LOG, diagnostics.join('\n') + '\n', 'utf8').catch(() => {})
    await browser.close()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})