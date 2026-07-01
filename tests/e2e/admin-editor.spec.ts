import { expect, test } from '@playwright/test';

const backendOrigin = `http://127.0.0.1:${process.env.PORT ?? '4000'}`;
const loginPasswords = Array.from(new Set([
  process.env.ADMIN_PASSWORD,
  'admin1234',
  'e2e-password'
].filter(Boolean))) as string[];

async function openAdminEditor(page: import('@playwright/test').Page) {
  await page.goto('/admin?section=posts');

  for (const password of loginPasswords) {
    const passwordInput = page.getByLabel('관리자 비밀번호');
    if (!(await passwordInput.isVisible().catch(() => false))) break;

    await passwordInput.fill(password);
    await page.getByRole('button', { name: '로그인' }).click();

    const titleInput = page.getByPlaceholder('제목을 입력하세요');
    const loginFailed = await page.getByText('비밀번호가 올바르지 않습니다.').isVisible()
      .catch(() => false);
    if (!loginFailed && await titleInput.isVisible().catch(() => false)) {
      break;
    }
  }

  await expect(page.getByPlaceholder('제목을 입력하세요')).toBeVisible();
}

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

test('admin editor toolbar is grouped and accessible', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await openAdminEditor(page);

  const toolbar = page.getByRole('toolbar', { name: '글 편집 도구' });
  await expect(toolbar).toBeVisible();

  for (const groupName of ['실행 기록', '문단 설정', '텍스트 서식', '정렬', '목록과 인용', '삽입']) {
    await expect(toolbar.getByRole('group', { name: groupName })).toBeVisible();
  }

  await expect(toolbar.getByRole('button', { name: '굵게' })).toHaveAttribute('aria-pressed', 'false');
  await expect(toolbar.getByRole('button', { name: /본문:/ })).toHaveAttribute('aria-expanded', 'false');

  const toolbarOverflow = await toolbar.locator('> div').evaluate(node => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth
  }));
  expect(toolbarOverflow.scrollWidth).toBeGreaterThan(toolbarOverflow.clientWidth);
});

test('admin can publish a simple post and view it publicly', async ({ page }) => {
  const uniqueId = Date.now();
  const title = `E2E Editor Smoke ${uniqueId}`;
  const slug = `e2e-editor-smoke-${uniqueId}`;
  const body = `This post was created by an editor smoke test ${uniqueId}.`;

  await openAdminEditor(page);
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
