const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const base = process.env.HARNESS_BASE_URL || 'http://127.0.0.1:3080'
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))

  try {
    await page.goto(base)
    await page.waitForLoadState('networkidle')

    await page.getByText('AI Editorial Desk', { exact: true }).first().waitFor()
    await page.getByRole('heading', { name: '今日视野', exact: true }).waitFor()
    await page.getByText('洗碗机真的可能比手洗更省水吗？', { exact: true }).waitFor()
    assert.equal(await page.getByText('机会总数').locator('..').getByText('3', { exact: true }).count(), 1)
    console.log('PASS: Harness root is replaced by the AI Editorial Desk product shell and reads Editorial API data')

    await page.getByRole('button', { name: '切换到 Harness 原生工作台', exact: true }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true }).waitFor()
    assert.equal(await page.getByRole('heading', { name: '今日视野', exact: true }).count(), 0)
    console.log('PASS: stock Harness AppFrame returns when the plugin stops occupying root')

    await page.getByRole('button', { name: '进入 AI Editorial Desk', exact: true }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('heading', { name: '今日视野', exact: true }).waitFor()
    console.log('PASS: workbench mode can switch back to AI Editorial Desk')

    assert.deepEqual(errors, [])
  } finally {
    await browser.close()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
