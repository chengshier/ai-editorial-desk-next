const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

const DIAGNOSTIC_LOG = '/tmp/native-shell-browser.log'
const DIAGNOSTIC_SCREENSHOT = '/tmp/native-shell-browser.png'
const DIAGNOSTIC_BODY = '/tmp/native-shell-browser-body.txt'
const WORKSPACE_MODE_KEY = 'ai-editorial-desk:workspace-mode'

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

    // Mode switching currently persists a workspace mode and reloads the same
    // Harness URL. waitForNavigation() is unnecessarily racy for this same-URL
    // reload, so accept the switch on the destination workbench DOM instead.
    await page.getByRole('button', { name: '切换到 Harness 原生工作台', exact: true }).click()
    await page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(
      await page.evaluate(key => window.localStorage.getItem(key), WORKSPACE_MODE_KEY),
      'harness',
    )
    assert.equal(await page.getByRole('heading', { name: '今日视野', exact: true }).count(), 0)
    console.log('PASS: stock Harness AppFrame returns when the plugin stops occupying root')

    // A pristine Harness profile shows its stock first-use Internal Testing
    // Notice when the native AppFrame becomes visible. This is part of Harness
    // UX, not our plugin. Follow the same path a real user would: acknowledge
    // the notice before interacting with the sidebar footer action. Never
    // force-click through the presentation mask because that would hide a real
    // product interaction problem.
    const internalTestingNotice = page.getByText('Internal Testing Notice', { exact: true })
    const noticeVisible = await internalTestingNotice
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)

    if (noticeVisible) {
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
      await internalTestingNotice.waitFor({ state: 'hidden', timeout: 10_000 })
      console.log('INFO: dismissed stock Harness Internal Testing Notice')
    }

    await page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true }).click()
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