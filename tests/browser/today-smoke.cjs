/* Browser regression against a running Web Shell and an isolated Editorial API.
 * PLAYWRIGHT_MODULE may point to a preinstalled Playwright package; no Web dependency is added.
 * TODAY_BASE_URL defaults to http://127.0.0.1:4174. BROWSER_CHANNEL is optional.
 * Successful Opportunity / Research responses always come from the real API.
 * Interception below is limited to testing empty, loading and failure states.
 */
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs/promises')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const base = process.env.TODAY_BASE_URL || 'http://127.0.0.1:4174'
  const output = process.env.TODAY_SCREENSHOTS
  if (output) await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const listUrl = `${base}/api/v1/spike/shell/opportunities`
  const apiList = await page.request.get(listUrl)
  assert.equal(apiList.status(), 200)
  const { items } = await apiList.json()
  assert.equal(items.length, 3, 'S2 API must return its three integration opportunities')
  const item = items.find((candidate) => !candidate.latest_research_case_id)
  assert.ok(item, 'Use a fresh isolated API instance to verify Research Case creation')
  const detailUrl = `${listUrl}/${encodeURIComponent(item.opportunity_id)}`
  const focus = `${base}/today?opportunity=${encodeURIComponent(item.opportunity_id)}&inspector=overview`
  const cards = page.locator('.opportunity-card')
  const inspector = page.getByRole('complementary', { name: '机会详情' })
  const tab = (name) => page.getByRole('tab', { name, exact: true })
  async function settled() { await page.waitForLoadState('networkidle') }
  async function screenshot(name) { if (output) await page.screenshot({ path: path.join(output, `${name}.png`) }) }

  try {
    await page.goto(`${base}/today`)
    await settled()
    assert.equal(await cards.count(), 3)
    for (const candidate of items) assert.ok((await cards.allTextContents()).some((text) => text.includes(candidate.headline)))
    assert.match(await page.locator('.radar-source-note').innerText(), /非真实外部发现结果/)
    await screenshot('today-empty-inspector')
    await page.getByRole('button', { name: item.headline, exact: true }).click()
    await tab('概览').waitFor()
    assert.equal(new URL(page.url()).searchParams.get('opportunity'), item.opportunity_id)
    assert.equal(new URL(page.url()).searchParams.get('inspector'), 'overview')
    console.log('PASS: three API opportunities, selectable card, URL-backed focus')

    for (const [value, label] of [['overview', '概览'], ['evidence', '证据'], ['research', '研究'], ['timeline', '时间线'], ['history', '历史']]) {
      await tab(label).click()
      assert.equal(new URL(page.url()).searchParams.get('inspector'), value)
      await page.reload()
      await settled()
      assert.equal(await tab(label).getAttribute('aria-selected'), 'true')
      assert.match(await inspector.innerText(), new RegExp(item.headline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
    await tab('历史').press('Home')
    assert.equal(await tab('概览').getAttribute('aria-selected'), 'true')
    await tab('概览').press('ArrowRight')
    assert.equal(await tab('证据').getAttribute('aria-selected'), 'true')
    await page.goBack()
    assert.equal(await tab('概览').getAttribute('aria-selected'), 'true')
    await page.goForward()
    assert.equal(await tab('证据').getAttribute('aria-selected'), 'true')
    await tab('概览').click()
    console.log('PASS: all five tabs survive refresh; keyboard and browser history work')

    for (const width of [1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      const sizes = await page.locator('.top-nav,.sidebar,.today-feed,.today-inspector').evaluateAll((elements) => elements.map((element) => ({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        overflow: element.scrollWidth > element.clientWidth,
      })))
      assert.equal(sizes[0].height, 56)
      assert.equal(sizes[1].width, 240)
      assert.equal(sizes[3].width, 416)
      assert.ok(sizes.every((size) => !size.overflow), `No horizontal overflow at ${width}`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await screenshot(`today-${width}`)
    }
    await page.setViewportSize({ width: 1280, height: 600 })
    await page.locator('.today-feed__scroll').evaluate((element) => { element.scrollTop = element.scrollHeight })
    assert.equal(await page.locator('.today-inspector__body').evaluate((element) => element.scrollTop), 0)
    assert.ok(await page.locator('.today-feed__scroll').evaluate((element) => element.scrollTop > 0))
    const headerTop = await page.locator('.today-toolbar').evaluate((element) => element.getBoundingClientRect().top)
    await page.locator('.today-inspector__body').evaluate((element) => { element.scrollTop = element.scrollHeight })
    assert.ok(await page.locator('.today-inspector__body').evaluate((element) => element.scrollTop > 0))
    assert.equal(await page.locator('.today-toolbar').evaluate((element) => element.getBoundingClientRect().top), headerTop)
    await page.setViewportSize({ width: 900, height: 800 })
    await inspector.getByRole('button', { name: '关闭机会详情' }).click()
    assert.equal(new URL(page.url()).searchParams.has('opportunity'), false)
    assert.equal(await inspector.isVisible(), false)
    await page.getByRole('button', { name: '查看详情' }).first().click()
    await tab('概览').waitFor()
    await page.setViewportSize({ width: 1440, height: 900 })
    console.log('PASS: 56/240/416 desktop layout, independent scroll, compact Inspector close/open')

    for (const [label, predicate] of [
      ['今日主推', (candidate) => candidate.recommendation === 'today_main'],
      ['高置信', (candidate) => candidate.confidence === 'high'],
      ['待研究', (candidate) => candidate.research_status === 'not_started'],
      ['长期储备', (candidate) => candidate.recommendation === 'evergreen'],
    ]) {
      await page.getByRole('button', { name: label, exact: true }).click()
      assert.equal(await cards.count(), items.filter(predicate).length)
    }
    await page.getByRole('button', { name: '全部', exact: true }).click()
    assert.equal(await cards.count(), 3)
    console.log('PASS: filters match recommendation / confidence / research_status from API')

    await page.goto(focus)
    await settled()
    const creation = page.waitForResponse((response) => response.url().endsWith('/api/v1/spike/research-cases') && response.request().method() === 'POST')
    await inspector.getByRole('button', { name: '开始研究', exact: true }).click()
    const response = await creation
    assert.equal(response.status(), 201)
    assert.deepEqual(response.request().postDataJSON(), { opportunity_id: item.opportunity_id })
    const created = await response.json()
    assert.match(created.research_case_id, /^rc_/)
    await page.waitForURL(`**/research/${created.research_case_id}?**`)
    assert.ok(!page.url().includes('harness_session_id'))
    let createRequests = 0
    const trackCreate = (request) => { if (request.method() === 'POST' && request.url().endsWith('/research-cases')) createRequests++ }
    page.on('request', trackCreate)
    await page.goto(focus.replace('inspector=overview', 'inspector=research'))
    await settled()
    assert.ok((await inspector.innerText()).includes(created.research_case_id))
    await inspector.getByRole('button', { name: '进入研究', exact: true }).click()
    await page.waitForURL(`**/research/${created.research_case_id}?**`)
    assert.equal(createRequests, 0, 'Existing case must not POST a duplicate')
    page.off('request', trackCreate)
    console.log('PASS: real POST creates rc_; existing case reuses the same product route without POST')

    await page.route(`${base}/api/v1/spike/research-cases`, (route) => route.abort())
    await page.goto(`${base}/today`)
    await settled()
    await page.getByRole('button', { name: '开始研究', exact: true }).first().click()
    await page.locator('.radar-action-error').waitFor()
    assert.equal(await cards.count(), 3, 'Research failure must not discard the opportunity list')
    assert.equal(await page.locator('.today-feed__count').innerText(), '3 条机会')
    await page.unroute(`${base}/api/v1/spike/research-cases`)

    await page.route(listUrl, (route) => route.abort())
    await page.goto(focus)
    await settled()
    await tab('概览').waitFor()
    await page.locator('.radar-error').waitFor()
    assert.equal(await cards.count(), 0)
    assert.equal(await page.locator('.radar-empty').count(), 0)
    assert.equal(await page.locator('.today-feed__count').innerText(), '读取失败')
    await screenshot('today-list-error')
    await page.unroute(listUrl)
    await page.getByRole('button', { name: '重新读取', exact: true }).click()
    await cards.first().waitFor()
    await settled()
    assert.equal(await cards.count(), 3)
    assert.equal(await page.locator('.radar-error').count(), 0)

    await page.route(detailUrl, (route) => route.abort())
    await page.goto(focus)
    await settled()
    await page.locator('.inspector-failure').waitFor()
    assert.equal(await cards.count(), 3)
    assert.equal(await inspector.locator('h2').count(), 0, 'Failed detail must not retain a stale headline')
    await page.unroute(detailUrl)
    await page.getByRole('button', { name: '重新读取详情' }).click()
    await tab('概览').waitFor()

    await page.route(`${base}/api/**`, (route) => route.abort())
    await page.goto(focus)
    await settled()
    assert.equal(await page.locator('.radar-error').count(), 1)
    assert.equal(await page.locator('.inspector-failure').count(), 1)
    assert.equal(await cards.count(), 0)
    assert.equal(await page.locator('.radar-empty').count(), 0)
    await page.unroute(`${base}/api/**`)
    console.log('PASS: independent list/detail/research errors, retry, total API failure without fake zero/empty/data')

    await page.route(listUrl, (route) => route.fulfill({ json: { items: [], count: 0 } }))
    await page.goto(`${base}/today`)
    await settled()
    assert.equal(await page.locator('.radar-empty').count(), 1)
    assert.equal(await page.locator('.today-feed__count').innerText(), '0 条机会')
    await screenshot('today-empty-feed')
    await page.unroute(listUrl)

    let releaseList
    const listGate = new Promise((resolve) => { releaseList = resolve })
    await page.route(listUrl, async (route) => { await listGate; await route.continue() })
    await page.goto(`${base}/today`)
    await page.locator('.radar-skeleton').waitFor()
    assert.equal(await cards.count(), 0)
    await screenshot('today-loading')
    releaseList()
    await cards.first().waitFor()
    await settled()
    await page.unroute(listUrl)
    assert.equal(await cards.count(), 3)
    console.log('PASS: successful empty list and in-flight skeleton are distinct from errors')
    assert.deepEqual(errors, [], 'No unhandled browser runtime errors')
    console.log('ALL TODAY BROWSER CHECKS PASSED')
  } finally { await browser.close() }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
