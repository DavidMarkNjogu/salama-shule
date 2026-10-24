"""End-to-end test of the hackathon demo flow, with the network really switched off."""
import os, re
from playwright.sync_api import sync_playwright, expect

BASE = 'http://localhost:3000'
SHOTS = '/home/claude/salama-shule/docs/screenshots'
os.makedirs(SHOTS, exist_ok=True)

def shot(page, name):
    page.screenshot(path=f'{SHOTS}/{name}.png', full_page=True)

try:
  pass
finally:
  pass
with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 412, 'height': 860}, device_scale_factor=2)
    page = ctx.new_page()
    page.on('pageerror', lambda e: print('PAGE ERROR', e))

    # 1. Sign in as Amina
    page.goto(f'{BASE}/login')
    shot(page, '01-login')
    page.get_by_role('button', name='Student · Amina').click()
    page.get_by_role('button', name='Sign in').click()
    expect(page.get_by_text('Learning units')).to_be_visible()

    # 2. Download Unit 1 for offline use
    page.get_by_role('button', name=re.compile('Download for offline')).first.click()
    expect(page.get_by_text('✓ Available offline')).to_be_visible()
    page.evaluate('navigator.serviceWorker.ready')
    page.reload()
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    shot(page, '02-dashboard-downloaded')
    print('OK  unit downloaded, service worker in control')

    # 3. Go offline, reload — the app must still open
    ctx.set_offline(True)
    page.reload()
    expect(page.get_by_text('Offline', exact=True)).to_be_visible()
    expect(page.get_by_text('✓ Available offline')).to_be_visible()
    print('OK  app shell loads with network off')

    # 4. Read a lesson offline
    page.get_by_role('link', name='Open').first.click()
    page.get_by_role('link', name=re.compile('Phishing and social engineering')).click()
    expect(page.get_by_text('Common warning signs')).to_be_visible()
    shot(page, '03-lesson-offline')
    print('OK  lesson readable offline')

    # 5. Practice quiz offline: instant score
    page.goto(f'{BASE}/student/quiz/asm_phish_practice')
    page.get_by_role('button', name='Start').click()
    for i in range(5):
        page.locator('.option').nth(1).click()  # option B is correct for 4/5 in practice
        expect(page.locator('.option.selected')).to_have_count(1)
        if i < 4:
            page.get_by_role('button', name='Next →').click()
    page.get_by_role('button', name='Submit').click()
    expect(page.locator('.score')).to_contain_text('/5')
    shot(page, '04-practice-result-offline')
    print('OK  practice quiz graded instantly offline:', page.locator('.score b').inner_text())

    # 6. Formal CAT offline, with a reload mid-quiz to prove answers persist
    page.goto(f'{BASE}/student/quiz/asm_cat1')
    page.get_by_role('button', name='Start').click()
    page.locator('.option').nth(1).click()
    page.get_by_role('button', name='Next →').click()
    page.locator('.option').nth(1).click()
    expect(page.locator('.qdot.ans')).to_have_count(2)
    page.reload()  # simulate the browser being closed mid-quiz
    expect(page.locator('.qdot.ans')).to_have_count(2)
    print('OK  in-progress answers survived a reload')
    answers = [1, 1, 2, 2, 1, 2]
    for i, a in enumerate(answers):
        page.locator('.qdot').nth(i).click()
        page.locator('.option').nth(a).click()
        expect(page.locator('.qdot.ans')).to_have_count(max(2, i + 1) if i >= 2 else 2)
    page.get_by_role('button', name='Submit').click()
    expect(page.locator('.result .badge')).to_have_text(re.compile('Saved on device|Waiting to retry'))
    shot(page, '05-formal-saved-offline')
    print('OK  formal CAT saved on device while offline')

    # 7. Reload offline, check Sync Center is honest
    page.goto(f'{BASE}/student/sync')
    expect(page.locator('td .badge', has_text='Synced')).to_have_count(0); expect(page.locator('td .badge')).to_have_count(2)
    shot(page, '06-sync-center-offline')
    print('OK  nothing claims "Synced" while offline')

    # 8. Reconnect: outbox drains automatically
    ctx.set_offline(False)
    page.evaluate("window.dispatchEvent(new Event('online'))")
    expect(page.locator('td .badge', has_text='Synced ✓')).to_have_count(2, timeout=20000)
    shot(page, '07-sync-center-synced')
    print('OK  both attempts synced after reconnect')

    # 9. Lecturer sees server-confirmed submissions
    lctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    lp = lctx.new_page()
    lp.goto(f'{BASE}/login')
    lp.get_by_role('button', name='Lecturer · Dr. Mwangi').click()
    lp.get_by_role('button', name='Sign in').click()
    expect(lp.get_by_text('Live submissions')).to_be_visible()
    expect(lp.locator('tbody tr', has_text='Amina Wanjiku')).to_have_count(2)
    shot(lp, '08-lecturer-dashboard')
    lp.locator('tbody tr', has_text='CAT 1').get_by_role('link').click()
    expect(lp.get_by_text('Received & graded by server')).to_be_visible()
    shot(lp, '09-lecturer-attempt-detail')
    print('OK  lecturer sees both submissions with server grades')

    # 10. Formal answer key must not be on the student device
    leaked = page.evaluate("""async () => {
      const dbs = await indexedDB.databases();
      const name = dbs.find(d => d.name.startsWith('salama-')).name;
      return await new Promise(res => {
        const r = indexedDB.open(name);
        r.onsuccess = () => {
          const tx = r.result.transaction('assessments'); const g = tx.objectStore('assessments').get('asm_cat1');
          g.onsuccess = () => res(JSON.stringify(g.result).includes('correctOptionId'));
        };
      });
    }""")
    assert leaked is False, 'formal answer key leaked to device!'
    print('OK  formal answer key is not stored on the device')
    browser.close()
print('ALL E2E CHECKS PASSED')
