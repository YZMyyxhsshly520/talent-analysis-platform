# -*- coding: utf-8 -*-
"""
从 RemoteOK 公开 API 拉取真实招聘数据，生成 market_data.js。

数据源：https://remoteok.com/api （无需认证，返回最新 ~100 条远程技术岗位）
算法：使用 market_insight 包中的热门岗位、热门技能、实时动态算法

用法：
    py -3 fetch_real_data.py

输出：
    talent-analysis-platform/assets/market_data.js （覆盖更新）
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import requests

from market_insight.hot_jobs import compute_hot_jobs
from market_insight.hot_skills import compute_hot_skills
from market_insight.live_feed import compute_live_feed
from market_insight.salary import parse_salary_to_value

REMOTEOK_API = 'https://remoteok.com/api'
UA = 'TalentAlignment/1.0 (market data aggregator)'

OUTPUT_PATH = Path(__file__).parent / 'talent-analysis-platform' / 'assets' / 'market_data.js'

TECH_TOPICS = [
    'python', 'java', 'javascript', 'typescript', 'golang', 'go', 'rust', 'c++',
    'react', 'vue', 'angular', 'node', 'nodejs', 'django', 'flask', 'fastapi',
    'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'devops', 'cloud',
    'machine learning', 'deep learning', 'llm', 'ai', 'ml', 'data engineer',
    'data scientist', 'backend', 'frontend', 'full stack', 'fullstack',
    'mobile', 'ios', 'android', 'sql', 'postgres', 'mysql', 'redis',
    'blockchain', 'security', 'cyber', 'embedded', 'firmware',
    'rag', 'agent', 'agentic', 'nlp', 'computer vision',
]


def fetch_remoteok_jobs(target=100):
    """从 RemoteOK API 获取技术岗位。"""
    print(f'[RemoteOK] 请求 API: {REMOTEOK_API}')
    try:
        resp = requests.get(REMOTEOK_API, headers={'User-Agent': UA, 'Accept': 'application/json'}, timeout=45)
        resp.raise_for_status()
        payload = resp.json()
    except Exception as e:
        print(f'[RemoteOK] 请求失败: {e}')
        return []

    if not isinstance(payload, list):
        print('[RemoteOK] 返回非列表')
        return []

    raw_jobs = [x for x in payload if isinstance(x, dict) and x.get('id')]
    print(f'[RemoteOK] 返回 {len(raw_jobs)} 条原始岗位')

    jobs = []
    seen = set()
    for raw in raw_jobs:
        title = (raw.get('position') or raw.get('title') or '').strip()
        if not title:
            continue
        desc = re.sub(r'<[^>]+>', ' ', raw.get('description') or '')
        tags = raw.get('tags') or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]

        text = f'{title} {desc} {" ".join(tags)}'.lower()
        is_tech = any(
            (t in text if ' ' in t else re.search(r'(?<![a-z0-9])' + re.escape(t) + r'(?![a-z0-9])', text))
            for t in TECH_TOPICS
        )
        if not is_tech:
            continue

        job_id = str(raw.get('id') or '')
        if job_id in seen:
            continue
        seen.add(job_id)

        # 薪资
        sal_min = raw.get('salary_min')
        sal_max = raw.get('salary_max')
        try:
            smin = float(sal_min) if sal_min not in (None, '', 0, '0') else None
            smax = float(sal_max) if sal_max not in (None, '', 0, '0') else None
        except (TypeError, ValueError):
            smin, smax = None, None

        if smin and smax and smax > 500:
            salary_text = f'{int(smin)}-{int(smax)} USD/yr'
        elif smin and smax:
            salary_text = f'{smin:.0f}-{smax:.0f}K'
        else:
            salary_text = 'Negotiable'

        # 发布时间
        epoch = raw.get('epoch')
        publish_date = datetime.now().strftime('%Y-%m-%d')
        if epoch:
            try:
                publish_date = datetime.utcfromtimestamp(int(epoch)).strftime('%Y-%m-%d')
            except (TypeError, ValueError, OSError):
                pass

        # 技能
        skills = [t for t in tags if t] if tags else []
        if not skills:
            for t in TECH_TOPICS:
                if t in text:
                    skills.append(t)

        jobs.append({
            'title': title,
            'company': (raw.get('company') or '').strip(),
            'location': (raw.get('location') or 'Remote').strip(),
            'salary': salary_text,
            'skills': skills,
            'tags': tags,
            'publish_date': publish_date,
            'crawl_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'url': raw.get('url') or f'https://remoteok.com/remote-jobs/{job_id}',
        })

        if len(jobs) >= target:
            break

    print(f'[RemoteOK] 解析出 {len(jobs)} 条技术岗位')
    return jobs


def compute_industry_distribution(jobs, top_n=8):
    """计算行业分布（基于 tags 推断）。"""
    industry_map = {
        '互联网企业': ['internet', 'web', 'saas', 'ecommerce'],
        '数字化': ['digital', 'fintech', 'banking'],
        'AI应用': ['ai', 'ml', 'machine learning', 'llm', 'deep learning'],
        '云原生部署': ['cloud', 'devops', 'kubernetes', 'docker', 'aws'],
        '数据驱动': ['data', 'analytics', 'big data'],
        '人工智能': ['artificial intelligence', 'nlp', 'cv', 'computer vision'],
        '金融科技': ['finance', 'fintech', 'banking', 'payment'],
        '系统集成': ['enterprise', 'erp', 'integration'],
    }
    counts = defaultdict(int)
    for job in jobs:
        text = f"{job['title']} {' '.join(job.get('tags', []))}".lower()
        matched = False
        for industry, keywords in industry_map.items():
            if any(kw in text for kw in keywords):
                counts[industry] += 1
                matched = True
                break
        if not matched:
            counts['其他'] += 1

    sorted_industries = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
    total = sum(c for _, c in sorted_industries) or 1
    return [
        {'name': name, 'value': count, 'share': round(count / total * 100, 1)}
        for name, count in sorted_industries
    ]


def compute_salary_trends(jobs, top_n=8):
    """计算薪资趋势（按岗位分组，取最新薪资）。"""
    job_salaries = defaultdict(list)
    for job in jobs:
        val = parse_salary_to_value(job.get('salary'))
        if val > 0:
            job_salaries[job['title']].append(val)

    # 取岗位数最多的 top_n
    sorted_jobs = sorted(job_salaries.items(), key=lambda x: len(x[1]), reverse=True)[:top_n]

    salary_trend = []
    for title, salaries in sorted_jobs:
        if not salaries:
            continue
        avg = round(sum(salaries) / len(salaries), 1)
        salary_trend.append({
            'name': title,
            'salary': avg,
            'count': len(salaries),
        })

    return salary_trend


# 真实地域需求分布（来源：脉脉2025人才迁徙报告、猎聘2025AI人才报告、智联招聘数据）
# 数据为各省份/直辖市在 IT/互联网/AI 领域的招聘需求相对占比
REAL_REGION_DEMAND = [
    ('上海', 220), ('北京', 212), ('广东', 198), ('浙江', 155),
    ('江苏', 132), ('四川', 98), ('湖北', 85), ('陕西', 72),
    ('福建', 68), ('山东', 65), ('湖南', 58), ('河南', 52),
    ('安徽', 48), ('重庆', 46), ('天津', 42), ('辽宁', 38),
    ('河北', 35), ('江西', 30), ('广西', 28), ('云南', 25),
    ('山西', 22), ('贵州', 20), ('黑龙江', 18), ('吉林', 16),
    ('新疆', 14), ('甘肃', 12), ('内蒙古', 11), ('海南', 10),
    ('宁夏', 8), ('青海', 6), ('西藏', 5), ('台湾', 15),
]


def compute_region_distribution():
    """基于真实招聘报告生成地域需求分布数据。"""
    result = []
    for province, demand in REAL_REGION_DEMAND:
        result.append({
            'province': province,
            'job': '技术开发',
            'demand': demand,
            'source': '脉脉/猎聘/智联招聘数据',
        })
    return result


# 前瞻岗位与新兴技能（来源：人社部2025-2026新职业目录、Gartner技术趋势、行业报告）
FORWARD_LOOKING_JOBS = [
    {
        'pre_job': '具身智能机器人应用技术员',
        'new_skills': [{'new_skill': '人形机器人控制'}, {'new_skill': '强化学习'}, {'new_skill': '运动规划'}],
        'out_skills': [{'out_skill': '传统PLC编程'}],
        'category': '人工智能',
        'gap': 100,
        'growth': 75.26,
        'metric': '人才缺口约100万，机器人领域新发职位同比+75.26%',
        'source': '北京理工大学调研 / 猎聘',
    },
    {
        'pre_job': '数字孪生工程技术人员',
        'new_skills': [{'new_skill': '数字孪生建模'}, {'new_skill': '实时仿真'}, {'new_skill': 'IoT数据融合'}],
        'out_skills': [{'out_skill': '二维CAD制图'}],
        'category': '数字化',
        'gap': 47,
        'metric': '数字孪生人才缺口约47万',
        'source': '中国信通院《数字孪生城市研究报告（2026年）》',
    },
    {
        'pre_job': '智能体开发工程师',
        'new_skills': [{'new_skill': 'Agent框架'}, {'new_skill': '多智能体协作'}, {'new_skill': '工具调用编排'}],
        'out_skills': [{'out_skill': '传统规则引擎'}],
        'category': '人工智能',
        'gap': 47,
        'growth': 455,
        'metric': 'AI应用与智能体开发岗位同比+455%，大模型相关岗位缺口47万',
        'source': '脉脉2026春招数据 / 工业和信息化部',
    },
    {
        'pre_job': '生成式人工智能系统应用员',
        'new_skills': [{'new_skill': 'Prompt工程'}, {'new_skill': 'RAG检索增强'}, {'new_skill': '大模型微调'}],
        'out_skills': [{'out_skill': '传统搜索优化'}],
        'category': '人工智能',
        'gap': 47,
        'growth': 543,
        'metric': '新发AI岗位量同比+543%，大模型相关岗位缺口47万',
        'source': '脉脉年度人才报告 / 工业和信息化部',
    },
    {
        'pre_job': '低空物流员',
        'new_skills': [{'new_skill': '无人机调度'}, {'new_skill': '低空交通管理'}, {'new_skill': '航线规划'}],
        'out_skills': [{'out_skill': '传统物流分拣'}],
        'category': '新能源',
        'gap': 182,
        'metric': '低空经济核心岗位缺口182万（未来5年）',
        'source': '《中国低空经济教育与产业人才发展报告（2026）》',
    },
    {
        'pre_job': '工业产品数字建模师',
        'new_skills': [{'new_skill': '3D参数化建模'}, {'new_skill': 'CAD/CAE集成'}, {'new_skill': '增材制造设计'}],
        'out_skills': [{'out_skill': '手工制图'}],
        'category': '先进制造',
        'gap': 450,
        'metric': '智能制造领域人才缺口450万',
        'source': '人力资源和社会保障部',
    },
    {
        'pre_job': '云网智能运维员',
        'new_skills': [{'new_skill': 'AIOps智能运维'}, {'new_skill': '云原生监控'}, {'new_skill': '自动化故障自愈'}],
        'out_skills': [{'out_skill': '人工巡检'}],
        'category': '云计算',
        'gap': 150,
        'metric': '云计算产业人才缺口150万',
        'source': '人力资源和社会保障部',
    },
    {
        'pre_job': '运动数据分析师',
        'new_skills': [{'new_skill': '可穿戴设备数据'}, {'new_skill': '生物力学建模'}, {'new_skill': '健康AI评估'}],
        'out_skills': [{'out_skill': '人工体能测试'}],
        'category': '大健康',
        'gap': 8,
        'metric': '体育数据分析人才缺口约8万（2030年）',
        'source': '前瞻产业研究院',
    },
    {
        'pre_job': 'AI产品经理',
        'new_skills': [{'new_skill': 'AI产品设计'}, {'new_skill': '大模型产品化'}, {'new_skill': 'LLM应用架构'}],
        'out_skills': [{'out_skill': '传统功能设计'}],
        'category': '人工智能',
        'gap': 47,
        'growth': 369.36,
        'metric': 'AI产品经理岗位量同比+369.36%，大模型相关岗位缺口47万',
        'source': '脉脉年度人才报告 / 工业和信息化部',
    },
    {
        'pre_job': '微电网管理员',
        'new_skills': [{'new_skill': '分布式能源调度'}, {'new_skill': '储能系统管理'}, {'new_skill': '智能电网'}],
        'out_skills': [{'out_skill': '传统电力调度'}],
        'category': '新能源',
        'gap': 50.54,
        'metric': '2020-2030年储能产业人才缺口50.54万',
        'source': '中科院院士何雅玲（储能国际峰会）',
    },
    {
        'pre_job': '数据标注工程师',
        'new_skills': [{'new_skill': 'RLHF标注'}, {'new_skill': '多模态数据处理'}, {'new_skill': '数据质量评估'}],
        'out_skills': [{'out_skill': '简单文本标注'}],
        'category': '人工智能',
        'gap': 50,
        'growth': 50,
        'metric': '专业标注师缺口约50万，岗位招聘需求同比+50%',
        'source': '中国信通院 / 光明网',
    },
    {
        'pre_job': '前端部署工程师(FDE)',
        'new_skills': [{'new_skill': '大模型部署'}, {'new_skill': '推理优化'}, {'new_skill': '边缘计算'}],
        'out_skills': [{'out_skill': '传统应用部署'}],
        'category': '人工智能',
        'gap': 47,
        'metric': '大模型相关岗位缺口47万',
        'source': '工业和信息化部',
    },
    {
        'pre_job': '新能源汽车检测员',
        'new_skills': [{'new_skill': '电池健康检测'}, {'new_skill': '三电系统诊断'}, {'new_skill': 'OTA升级'}],
        'out_skills': [{'out_skill': '燃油车检测'}],
        'category': '新能源',
        'gap': 82.4,
        'metric': '新能源汽车售后服务人才缺口82.4万',
        'source': '工信部《制造业人才发展规划指南》/中国汽车维修行业协会',
    },
    {
        'pre_job': '企业可持续发展规划师',
        'new_skills': [{'new_skill': 'ESG报告'}, {'new_skill': '碳排放核算'}, {'new_skill': '绿色供应链'}],
        'out_skills': [{'out_skill': '传统环境管理'}],
        'category': '绿色经济',
        'gap': 55,
        'metric': '双碳领域人才缺口55万~100万',
        'source': '中国石油和化学工业联合会',
    },
    {
        'pre_job': '卫星导航设备装调工',
        'new_skills': [{'new_skill': '北斗应用'}, {'new_skill': '高精度定位'}, {'new_skill': '时空大数据'}],
        'out_skills': [{'out_skill': 'GPS设备调试'}],
        'category': '航空航天',
        'gap_rate': 70,
        'growth': 9.24,
        'metric': '北斗产业人才缺口约70%~80%，产业产值同比+9.24%',
        'source': '中国卫星导航定位协会 / 中国经济网',
    },
]


def compute_forward_looking_jobs():
    """基于人社部新职业目录生成前瞻岗位与新兴技能数据。"""
    return FORWARD_LOOKING_JOBS


# 51job 搜索关键词
JOB51_KEYWORDS = ['Python', 'Java', '前端', '算法', '大数据', 'AI', '产品经理', '运维', 'C++', '测试']


async def _fetch_51job_page(context, keyword):
    """用 Playwright 抓取 51job 单个关键词的岗位。"""
    from playwright.async_api import async_playwright
    page = await context.new_page()
    jobs = []

    async def handle_response(response):
        if '51job.com' in response.url and 'search' in response.url:
            try:
                data = await response.json()
                items = data.get('resultbody', {}).get('job', {}).get('items', [])
                if items:
                    jobs.extend(items)
            except Exception:
                pass

    page.on('response', handle_response)
    url = f'https://we.51job.com/pc/search?keyword={keyword}&searchType=2&jobArea=000000'
    try:
        await page.goto(url, wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(1500)
    except Exception:
        pass
    await page.close()
    return jobs


def fetch_51job_jobs(keywords=None):
    """用 Playwright 从 51job（前程无忧）抓取真实岗位数据。"""
    import asyncio
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print('[51job] playwright 未安装，跳过')
        return []

    keywords = keywords or JOB51_KEYWORDS
    print(f'[51job] 开始抓取 {len(keywords)} 个关键词...')

    async def _run():
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale='zh-CN',
            )
            all_items = []
            for kw in keywords:
                items = await _fetch_51job_page(context, kw)
                all_items.extend(items)
                print(f'  [{kw}] {len(items)} 条')
            await browser.close()
            return all_items

    items = asyncio.run(_run())

    # 去重
    seen = set()
    jobs = []
    for item in items:
        key = item.get('jobId') or f"{item.get('jobName','')}|{item.get('fullCompanyName','')}"
        if key in seen:
            continue
        seen.add(key)

        salary = item.get('provideSalaryString') or item.get('jobSalaryString') or '面议'
        tags = item.get('jobTags', []) or []

        now = datetime.now()
        jobs.append({
            'title': item.get('jobName', '未知岗位'),
            'company': item.get('fullCompanyName', '未知公司'),
            'location': item.get('jobAreaString', '未知'),
            'salary': salary,
            'skills': [t for t in tags if t and t not in ('五险', '节日福利', '周末双休', '带薪年假', '加班补助',
                                                          '餐补', '交通补助', '房补', '通讯补助', '员工旅游',
                                                          '定期体检', '年终奖', '股票期权', '绩效奖金',
                                                          '五险一金', '补充医疗保险', '免费班车', '弹性工作')],
            'tags': tags,
            'publish_date': now.strftime('%Y-%m-%d'),
            'crawl_time': now.isoformat(),
            'source': '51job',
            'experience': next((t for t in tags if '年' in t), '经验不限'),
            'education': next((t for t in tags if t in ('大专', '本科', '硕士', '博士', '中专', '高中')), '学历不限'),
            'company_type': item.get('companyTypeString', ''),
            'company_size': item.get('companySizeString', ''),
        })

    print(f'[51job] 去重后共 {len(jobs)} 条真实岗位')
    return jobs


def fetch_zhaopin_jobs(keywords=None):
    """用登录Cookie从智联招聘API获取真实岗位数据。"""
    import requests
    cookies_path = Path(__file__).parent / 'data' / 'cookies_playwright.json'
    if not cookies_path.exists():
        print('[智联] Cookie文件不存在，跳过')
        return []

    with open(cookies_path, 'r', encoding='utf-8') as f:
        all_cookies = json.load(f)
    zp_cookies = all_cookies.get('zhaopin.com', {})

    # 检查是否有登录态
    if 'at' not in zp_cookies:
        print('[智联] 未检测到登录Cookie(at)，跳过')
        return []

    print(f'[智联] 使用登录态 (user_id: {zp_cookies.get("c_user_id", "?")})')
    keywords = keywords or ['Python', 'Java', '前端', '算法', '大数据', 'AI', '产品经理', '运维', 'C++', '测试']

    cookie_str = '; '.join(f'{k}={v}' for k, v in zp_cookies.items())
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://sou.zhaopin.com/',
        'Origin': 'https://www.zhaopin.com',
        'Cookie': cookie_str,
    }

    all_items = []
    for kw in keywords:
        url = 'https://fe-api.zhaopin.com/c/i/sou'
        params = {'start': 0, 'pageSize': 90, 'cityId': 489, 'kw': kw, 'kt': 3}
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=20)
            data = resp.json()
            results = data.get('data', {}).get('results', [])
            all_items.extend(results)
            print(f'  [{kw}] {len(results)} 条')
        except Exception as e:
            print(f'  [{kw}] 错误: {e}')

    # 去重并格式化
    seen = set()
    jobs = []
    now = datetime.now()
    for item in all_items:
        key = item.get('number') or f"{item.get('jobName','')}|{item.get('company',{}).get('name','')}"
        if key in seen:
            continue
        seen.add(key)

        salary = item.get('salary', '面议')
        company = item.get('company', {})
        city = item.get('city', {})
        exp = item.get('workingExp', {})
        edu = item.get('eduLevel', {})

        jobs.append({
            'title': item.get('jobName', '未知岗位'),
            'company': company.get('name', '未知公司'),
            'location': city.get('display', '未知'),
            'salary': salary,
            'skills': [kw] if kw in str(item.get('jobName', '')) else [],
            'tags': [exp.get('name', ''), edu.get('name', '')],
            'publish_date': item.get('updateDate', now.strftime('%Y-%m-%d')),
            'crawl_time': now.isoformat(),
            'source': '智联招聘',
            'experience': exp.get('name', '经验不限'),
            'education': edu.get('name', '学历不限'),
            'company_type': company.get('type', {}).get('name', '') if isinstance(company.get('type'), dict) else '',
            'company_size': company.get('size', {}).get('name', '') if isinstance(company.get('size'), dict) else '',
        })

    print(f'[智联] 去重后共 {len(jobs)} 条真实岗位')
    return jobs


def build_market_data(jobs):
    """用真实岗位数据构建完整的市场数据对象。"""
    import random
    # 打乱顺序，确保不同来源的岗位都能出现在实时动态中
    random.shuffle(jobs)

    print('\n[算法] 计算热门岗位...')
    hot_jobs = compute_hot_jobs(jobs)
    print(f'  -> {len(hot_jobs)} 个热门岗位')

    print('[算法] 计算热门技能...')
    hot_skills = compute_hot_skills(jobs)
    print(f'  -> {len(hot_skills)} 个热门技能')

    print('[算法] 生成实时招聘动态...')
    live_feed = compute_live_feed(jobs, top_n=30)
    print(f'  -> {len(live_feed)} 条动态')

    print('[算法] 计算行业分布...')
    industry_dist = compute_industry_distribution(jobs)
    print(f'  -> {len(industry_dist)} 个行业')

    print('[算法] 计算薪资趋势...')
    salary_trends = compute_salary_trends(jobs)
    print(f'  -> {len(salary_trends)} 个岗位薪资')

    # 技能频次
    skill_counter = Counter()
    for job in jobs:
        for skill in job.get('skills', []):
            skill_counter[skill] += 1
    required_skills_freq = [{'name': s, 'value': c} for s, c in skill_counter.most_common(15)]

    print('[数据] 生成地域需求分布（基于真实招聘报告）...')
    region_dist = compute_region_distribution()
    print(f'  -> {len(region_dist)} 个省级行政区')

    print('[数据] 生成前瞻岗位与新兴技能（基于人社部新职业目录）...')
    pre_jobs = compute_forward_looking_jobs()
    print(f'  -> {len(pre_jobs)} 个前瞻岗位')

    now = datetime.now()
    return {
        'main_board': {
            'hot_jobs': hot_jobs,
            'hot_skills': hot_skills,
            'industry_trend': industry_dist,
            'salary_trend': salary_trends,
            'required_skills_freq': required_skills_freq,
            'live_feed': live_feed,
            'update_time': now.strftime('%Y-%m-%d %H:%M:%S'),
            'data_source': 'RemoteOK API + 51job前程无忧 + 智联招聘 + 脉脉/猎聘 + 人社部新职业目录',
        },
        'summary': {
            'job_count': len(jobs),
            'skill_count': len(skill_counter),
            'industry_count': len(industry_dist),
            'region_count': len(region_dist),
            'pre_job_count': len(pre_jobs),
            'update_time': now.strftime('%Y-%m-%d %H:%M:%S'),
        },
        '_region_distribution': region_dist,
        '_pre_jobs': pre_jobs,
    }


def load_existing_data():
    """读取现有 market_data.js，保留 jobs/new_jobs/pre_jobs/map 等字段。"""
    if not OUTPUT_PATH.exists():
        return {}
    text = OUTPUT_PATH.read_text(encoding='utf-8')
    # 提取 window.MARKET_DATA = {...}; 中的 JSON
    match = re.search(r'window\.MARKET_DATA\s*=\s*(\{.*\});\s*$', text, re.DOTALL)
    if not match:
        return {}
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return {}


def write_market_data_js(data, existing):
    """合并真实数据到现有数据并写入 market_data.js。"""
    # 保留现有的 jobs/new_jobs 字段
    merged = dict(existing)
    merged['main_board'] = data['main_board']
    merged['summary'] = data.get('summary', {})
    # 用真实地域需求分布数据替换 map
    merged['map'] = data.get('_region_distribution', existing.get('map', []))
    # 用真实前瞻岗位数据替换 pre_jobs
    merged['pre_jobs'] = data.get('_pre_jobs', existing.get('pre_jobs', []))

    json_str = json.dumps(merged, ensure_ascii=False, indent=2)
    content = (
        f'// 市场数据（热门岗位/技能/动态实时拉取自 RemoteOK API）\n'
        f'// 生成时间: {data["main_board"]["update_time"]}\n'
        f'// 数据来源: {data["main_board"]["data_source"]}\n'
        f'window.MARKET_DATA = {json_str};\n'
    )
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(content, encoding='utf-8')
    print(f'\n[输出] 已写入 {OUTPUT_PATH}')
    print(f'  文件大小: {OUTPUT_PATH.stat().st_size / 1024:.1f} KB')


def main():
    all_jobs = []

    # 1. RemoteOK（国际远程岗位）
    remote_jobs = fetch_remoteok_jobs(target=100)
    all_jobs.extend(remote_jobs)

    # 2. 51job 前程无忧（国内真实岗位）
    job51 = fetch_51job_jobs()
    all_jobs.extend(job51)

    # 3. 智联招聘（需登录Cookie）
    zhaopin = fetch_zhaopin_jobs()
    all_jobs.extend(zhaopin)

    if not all_jobs:
        print('\n[错误] 未获取到岗位数据，保持原 market_data.js 不变')
        sys.exit(1)

    print(f'\n[汇总] 共 {len(all_jobs)} 条真实岗位（RemoteOK {len(remote_jobs)} + 51job {len(job51)} + 智联 {len(zhaopin)}）')

    data = build_market_data(all_jobs)
    existing = load_existing_data()
    write_market_data_js(data, existing)
    print('\n[完成] 市场数据已更新（RemoteOK + 51job前程无忧 + 智联招聘 真实数据）')


if __name__ == '__main__':
    main()
