# -*- coding: utf-8 -*-
"""自动打开三个招聘平台页面，用户登录后定时保存Cookie"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright


async def save_cookies(context):
    cookies = await context.cookies()
    cookies_by_domain = {}
    for c in cookies:
        domain = c['domain'].lstrip('.')
        for target in ['zhipin.com', 'liepin.com', 'zhaopin.com']:
            if target in domain:
                cookies_by_domain.setdefault(target, {})[c['name']] = c['value']
    out_dir = Path('data')
    out_dir.mkdir(exist_ok=True)
    with open(out_dir / 'cookies_playwright.json', 'w', encoding='utf-8') as f:
        json.dump(cookies_by_domain, f, ensure_ascii=False, indent=2)
    return cookies_by_domain


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='zh-CN',
            viewport={'width': 1280, 'height': 800},
        )

        # 打开三个平台的页面
        page_boss = await context.new_page()
        page_liepin = await context.new_page()
        page_zhaopin = await context.new_page()

        await page_boss.goto('https://www.zhipin.com/', wait_until='domcontentloaded')
        await page_liepin.goto('https://www.liepin.com/', wait_until='domcontentloaded')
        await page_zhaopin.goto('https://www.zhaopin.com/', wait_until='domcontentloaded')

        print('\n' + '=' * 60)
        print('  已打开 3 个标签页：BOSS直聘 / 猎聘 / 智联招聘')
        print('  请在每个标签页中点击"登录"并完成登录')
        print('  脚本每15秒保存Cookie，登录后自动捕获')
        print('=' * 60 + '\n')

        # 定时保存Cookie，最多10分钟
        for i in range(40):
            await asyncio.sleep(15)
            result = await save_cookies(context)
            total = sum(len(v) for v in result.values())
            domains = {d: len(c) for d, c in result.items()}
            print(f'  [{(i+1)*15}s] 总数: {total} | {domains}')

        print('\n[完成]')
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
