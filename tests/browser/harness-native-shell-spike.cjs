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
    // meaningful readiness signal. Gate on DOMContentLoaded and then on the
    // exact product DOM that proves the plugin has taken over the root slot.
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    await page.getByText('AI Editorial Desk', { exact: true }).first().waitFor({ state: 'visible', timeout: 30_000 })
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