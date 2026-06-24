import { expect, test } from '@playwright/test';

const backendOrigin = `http://127.0.0.1:${process.env.PORT ?? '4000'}`;
const loginPasswords = Array.from(new Set([
  process.env.ADMIN_PASSWORD,
  'e2e-password',
  'admin1234'
].filter(Boolean))) as string[];

test('backend exposes robots and baseline security headers', async ({ request }) => {
  const homeResponse = await request.get(`${backendOrigin}/`);
  expect(homeResponse.status()).toBe(200);

  const csp = homeResponse.headers()['content-security-policy'] ?? '';
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'self'");

  const robotsResponse = await request.get(`${backendOrigin}/robots.txt`);
  expect(robotsResponse.status()).toBe(200);
  expect(robotsResponse.headers()['content-type']).toContain('text/plain');

  const robots = await robotsResponse.text();
  expect(robots).toContain('User-agent: *');
  expect(robots).toContain('Allow: /');
  expect(robots).toContain('Sitemap: https://tech.hamwoo.co.kr/sitemap.xml');
});

test('admin can publish a simple post and view it publicly', async ({ page }) => {
  const uniqueId = Date.now();
  const title = `E2E Editor Smoke ${uniqueId}`;
  const slug = `e2e-editor-smoke-${uniqueId}`;
  const body = `This post was created by an editor smoke test ${uniqueId}.`;

  await page.goto('/admin');

  for (const password of loginPasswords) {
    const passwordInput = page.getByLabel('관리자 비밀번호');
    if (!(await passwordInput.isVisible().catch(() => false))) break;

    await expect(passwordInput).toBeEnabled();
    await passwordInput.fill(password);
    await page.getByRole('button', { name: '로그인' }).click();

    const titleInput = page.getByPlaceholder('제목을 입력하세요');
    const loginError = page.getByText('비밀번호가 올바르지 않습니다.');

    await Promise.race([
      titleInput.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined),
      loginError.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined),
      passwordInput.waitFor({ state: 'attached', timeout: 5_000 }).then(async () => {
        await expect(passwordInput).toBeEnabled({ timeout: 5_000 });
      }).catch(() => undefined)
    ]);

    if (await titleInput.isVisible().catch(() => false)) {
      break;
    }
  }

  await expect(page.getByPlaceholder('제목을 입력하세요')).toBeVisible();
  await page.getByPlaceholder('제목을 입력하세요').fill(title);

  const editor = page.locator('.ProseMirror').first();
  await editor.click();
  await page.keyboard.type(body);

  await page.getByRole('button', { name: '발행' }).click();
  await expect(page.getByRole('heading', { name: '발행' })).toBeVisible();
  await page.locator('input[type="radio"]').first().check();

  await Promise.all([
    page.waitForResponse(response =>
      response.url().includes('/api/posts') && response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: '공개 발행' }).click()
  ]);

  await expect(page.getByText('발행되었습니다.')).toBeVisible();

  await page.goto(`/posts/${slug}`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText(body)).toBeVisible();

  const seoResponse = await page.request.get(`${backendOrigin}/posts/${slug}`);
  expect(seoResponse.status()).toBe(200);
  const seoHtml = await seoResponse.text();
  expect(seoHtml).toContain(`<title>${title}</title>`);
  expect(seoHtml).toContain(`<meta property="og:type" content="article" />`);
  expect(seoHtml).toContain(`/posts/${slug}`);

  await page.goto('/admin');
  await page.evaluate(async (postSlug) => {
    const listResponse = await fetch('/api/posts', { credentials: 'include' });
    const { posts } = await listResponse.json();
    const target = posts.find((post: { id: string; slug: string }) => post.slug === postSlug);
    if (target) {
      await fetch(`/api/posts/${target.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    }
  }, slug);
});
