const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

const DIAGNOSTIC_LOG = '/tmp/native-shell-browser.log'
const DIAGNOSTIC_SCREENSHOT = '/tmp/native-shell-browser.png'
const DIAGNOSTIC_BODY = '/tmp/native-shell-browser-body.txt'

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

    // Mode switches call location.reload(). Wait for that concrete navigation
    // rather than waiting for all Harness background connections to go idle.
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }),
      page.getByRole('button', { name: '切换到 Harness 原生工作台', exact: true }).click(),
    ])
    await page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
    assert.equal(await page.getByRole('heading', { name: '今日视野', exact: true }).count(), 0)
    console.log('PASS: stock Harness AppFrame returns when the plugin stops occupying root')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }),
      page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true }).click(),
    ])
    await page.getByRole('heading', { name: '今日视野', exact: true }).waitFor({ state: 'visible', timeout: 30_000 })
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
