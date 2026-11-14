// 市场洞察模块 - 基于灵枢知岗真实招聘数据
(function () {
  const D = (window.MARKET_DATA || {});
  const MB = D.main_board || {};

  const COLORS = ['#6366f1', '#a855f7', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
  const AXIS = { axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: '#8b95a7' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } };

  function init(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return echarts.init(el, null, { renderer: 'svg' });
  }

  // ===== 指标卡 =====
  function renderMetrics() {
    const totalJobs = (D.jobs || []).length + (D.new_jobs || []).length + (D.pre_jobs || []).length;
    setText('mk-metric-jobs', totalJobs);
    setText('mk-metric-skills', (MB.hot_skills || []).length);
    setText('mk-metric-industries', (MB.industry_trend || []).length);
    setText('mk-metric-provinces', (D.map || []).length);
  }
  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

  // ===== 01 热门岗位排行 =====
  function renderHotJobs() {
    const chart = init('mk-chart-hot-jobs');
    if (!chart) return;
    const jobs = (MB.hot_jobs || []).slice().sort((a, b) => a.value - b.value);
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>需求量：${p[0].value}<br/>市场占比：${p[0].data.share || '-'}%` },
      grid: { left: 120, right: 60, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS, name: '需求量', nameTextStyle: { color: '#8b95a7' } },
      yAxis: { type: 'category', data: jobs.map(j => j.name), ...AXIS },
      series: [{
        type: 'bar', data: jobs.map(j => ({ value: j.value, share: j.share })),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#6366f1' }, { offset: 1, color: '#a855f7' }
        ]), borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 11, formatter: '{c}' }
      }]
    });
  }

  // ===== 02 热门技能 =====
  function renderHotSkills() {
    const chart = init('mk-chart-hot-skills');
    if (!chart) return;
    const skills = (MB.hot_skills || []).slice().sort((a, b) => a.value - b.value);
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 80, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS },
      yAxis: { type: 'category', data: skills.map(s => s.name), ...AXIS },
      series: [{
        type: 'bar', data: skills.map(s => s.value),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#22d3ee' }, { offset: 1, color: '#6366f1' }
        ]), borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 11 }
      }]
    });
  }

  // 技能频次
  function renderSkillFreq() {
    const chart = init('mk-chart-skill-freq');
    if (!chart) return;
    const freq = (D.skill_frequency || []).slice(0, 15).reverse();
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>出现次数：${p[0].value}` },
      grid: { left: 100, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS },
      yAxis: { type: 'category', data: freq.map(s => s[0]), ...AXIS },
      series: [{
        type: 'bar', data: freq.map(s => s[1]),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#a855f7' }, { offset: 1, color: '#ec4899' }
        ]), borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 11 }
      }]
    });
  }

  // ===== 03 行业分布 =====
  function renderIndustry() {
    const chart = init('mk-chart-industry');
    if (!chart) return;
    const ind = MB.industry_trend || [];
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#8b95a7' }, type: 'scroll' },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
        data: ind.map((i, idx) => ({ name: i.industry, value: i.count, itemStyle: { color: COLORS[idx % COLORS.length] } })),
        label: { color: '#e8ecf4', fontSize: 11 },
        labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
      }]
    });
  }

  function renderIndustryFreq() {
    const chart = init('mk-chart-industry-freq');
    if (!chart) return;
    const freq = (D.industry_frequency || []).filter(x => x[0] !== '本科').slice(0, 12).reverse();
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 90, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS },
      yAxis: { type: 'category', data: freq.map(s => s[0]), ...AXIS },
      series: [{
        type: 'bar', data: freq.map(s => s[1]),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#22c55e' }, { offset: 1, color: '#22d3ee' }
        ]), borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 11 }
      }]
    });
  }

  // ===== 04 薪资趋势 =====
  function renderSalary() {
    const chart = init('mk-chart-salary');
    if (!chart) return;
    const salaries = D.salaries || [];
    const periods = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'];
    // 默认展示热门岗位（main_board hot_jobs 对应的薪资）
    const hotNames = (MB.hot_jobs || []).map(j => j.name);
    const defaultJobs = salaries.filter(s => hotNames.includes(s.name)).slice(0, 8);
    const otherJobs = salaries.filter(s => !hotNames.includes(s.name));

    const series = defaultJobs.map((s, idx) => ({
      name: s.name, type: 'line', smooth: true, data: s.values,
      lineStyle: { width: 2 }, itemStyle: { color: COLORS[idx % COLORS.length] },
      emphasis: { focus: 'series' }
    }));
    // 其余岗位默认隐藏
    otherJobs.slice(0, 20).forEach((s, idx) => {
      series.push({
        name: s.name, type: 'line', smooth: true, data: s.values,
        lineStyle: { width: 1, type: 'dashed' }, itemStyle: { color: COLORS[(idx + 8) % COLORS.length] },
        emphasis: { focus: 'series' }
      });
    });

    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#8b95a7', fontSize: 11 }, type: 'scroll', data: salaries.map(s => s.name), selected: Object.fromEntries(otherJobs.slice(0, 20).map(s => [s.name, false])) },
      grid: { left: 50, right: 30, top: 60, bottom: 40 },
      xAxis: { type: 'category', data: periods, boundaryGap: false, ...AXIS },
      yAxis: { type: 'value', name: 'K/月', ...AXIS, nameTextStyle: { color: '#8b95a7' } },
      series: series
    });
  }

  // ===== 05 地域需求分布 =====
  function renderMap() {
    const chart = init('mk-chart-map');
    if (!chart) return;
    const mapData = D.map || [];
    // 统计各岗位在省份中的出现频次
    const jobCount = {};
    mapData.forEach(m => { jobCount[m.job] = (jobCount[m.job] || 0) + 1; });
    const topJobs = Object.entries(jobCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // 省份横向条形图，颜色按岗位分类
    const provinceNames = mapData.map(m => m.province.replace('省', '').replace('市', '').replace('自治区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', ''));
    const jobColorMap = {};
    topJobs.forEach((j, i) => { jobColorMap[j[0]] = COLORS[i % COLORS.length]; });

    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => {
        const m = mapData[p[0].dataIndex];
        return `${m.province}<br/>需求岗位：<strong>${m.job}</strong>`;
      }},
      grid: { left: 80, right: 100, top: 20, bottom: 30 },
      xAxis: { type: 'value', max: 1, show: false },
      yAxis: { type: 'category', data: provinceNames.reverse(), ...AXIS, axisLabel: { color: '#8b95a7', fontSize: 10 } },
      series: [{
        type: 'bar', data: mapData.slice().reverse().map(m => ({
          value: 1,
          itemStyle: { color: jobColorMap[m.job] || '#6b7280', borderRadius: [0, 4, 4, 0] }
        })),
        label: { show: true, position: 'right', color: '#e8ecf4', fontSize: 10, formatter: p => mapData.slice().reverse()[p.dataIndex].job },
        barWidth: '60%'
      }]
    });
  }

  // ===== 06 前瞻岗位新兴技能 =====
  function renderPreJobs() {
    const chart = init('mk-chart-pre-jobs');
    if (!chart) return;
    const preJobs = D.pre_jobs || [];
    // 统计所有新兴技能频次
    const skillCount = {};
    preJobs.forEach(p => {
      (p.new_skills || []).forEach(s => {
        const name = s.new_skill || s;
        skillCount[name] = (skillCount[name] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 15).reverse();

    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>关联前瞻岗位：${p[0].value} 个` },
      grid: { left: 130, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS },
      yAxis: { type: 'category', data: topSkills.map(s => s[0]), ...AXIS, axisLabel: { color: '#8b95a7', fontSize: 11 } },
      series: [{
        type: 'bar', data: topSkills.map(s => s[1]),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#f59e0b' }, { offset: 1, color: '#ef4444' }
        ]), borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 11 }
      }]
    });
  }

  // ===== 07 实时招聘动态 =====
  function renderLiveFeed() {
    const container = document.getElementById('mk-live-feed');
    if (!container) return;
    const feed = MB.live_feed || [];
    container.innerHTML = feed.map(f => {
      const text = f.text || '';
      // 高亮公司名（前两个字到第一个空格之间）
      const parts = text.split(' ');
      const company = parts.length > 1 ? parts[0] : '';
      const rest = parts.slice(1).join(' ');
      return `<div class="feed-item"><span class="feed-time">${f.time || ''}</span><span class="feed-text">${company ? `<strong>${company}</strong> ` : ''}${rest || text}</span></div>`;
    }).join('');
  }

  // ===== 实时拉取 RemoteOK 招聘数据 =====
  function fetchRealTimeFeed() {
    const proxyUrls = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://remoteok.com/api'),
      'https://corsproxy.io/?url=' + encodeURIComponent('https://remoteok.com/api'),
    ];
    const tryFetch = (idx) => {
      if (idx >= proxyUrls.length) return;
      fetch(proxyUrls[idx])
        .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status))
        .then(payload => {
          if (!Array.isArray(payload)) throw new Error('非列表');
          const rawJobs = payload.filter(x => x && typeof x === 'object' && x.id);
          const techJobs = rawJobs.filter(job => {
            const title = (job.position || job.title || '').toLowerCase();
            const desc = (job.description || '').toLowerCase();
            const tags = Array.isArray(job.tags) ? job.tags.join(' ').toLowerCase() : '';
            const text = title + ' ' + desc + ' ' + tags;
            return /python|java|javascript|typescript|react|vue|node|golang|rust|c\+\+|docker|kubernetes|aws|devops|machine learning|deep learning|ai|ml|data|backend|frontend|full ?stack|sql|security|blockchain|embedded|nlp|cv|rag|agent/.test(text);
          }).slice(0, 30);

          const now = new Date();
          const feed = techJobs.map((job, i) => {
            const company = (job.company || '').trim();
            const location = (job.location || 'Remote').trim();
            const title = (job.position || job.title || '未知岗位').trim();
            const minsAgo = i * 2;
            const d = new Date(now.getTime() - minsAgo * 60000);
            const time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            const parts = [];
            if (company) parts.push(company);
            if (location) parts.push(location);
            parts.push('发布' + title + '招聘');
            return { time, text: parts.join(' ').slice(0, 120) };
          });

          if (feed.length > 0) {
            MB.live_feed = feed;
            renderLiveFeed();
            const el = document.getElementById('mk-live-feed-title');
            if (el) el.textContent = '实时招聘动态（来自 RemoteOK · ' + now.toLocaleTimeString('zh-CN') + ' 刷新）';
          }
        })
        .catch(err => {
          console.warn('[实时拉取] 代理 ' + idx + ' 失败:', err);
          tryFetch(idx + 1);
        });
    };
    tryFetch(0);
  }

  // ===== 初始化 =====
  function initAll() {
    renderMetrics();
    renderHotJobs();
    renderHotSkills();
    renderSkillFreq();
    renderIndustry();
    renderIndustryFreq();
    renderSalary();
    renderMap();
    renderPreJobs();
    renderLiveFeed();
    // 尝试实时拉取 RemoteOK 数据更新招聘动态
    fetchRealTimeFeed();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // resize 支持
  window.addEventListener('resize', () => {
    ['mk-chart-hot-jobs', 'mk-chart-hot-skills', 'mk-chart-skill-freq', 'mk-chart-industry',
     'mk-chart-industry-freq', 'mk-chart-salary', 'mk-chart-map', 'mk-chart-pre-jobs'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.__echarts_instance__) {
        const inst = echarts.getInstanceByDom(el);
        if (inst) inst.resize();
      }
    });
  });
})();
