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
      grid: { left: 120, right: 70, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS, name: '需求量', nameTextStyle: { color: '#8b95a7' } },
      yAxis: { type: 'category', data: jobs.map(j => j.name), ...AXIS },
      series: [{
        type: 'bar', data: jobs.map(j => ({ value: j.value, share: j.share })),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#6366f1' }, { offset: 1, color: '#a855f7' }
        ]), borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 11,
          formatter: p => `${p.value}  (${p.data.share}%)`
        }
      }]
    });
  }

  // ===== 02 热门技能 =====
  function renderHotSkills() {
    const chart = init('mk-chart-hot-skills');
    if (!chart) return;
    const skills = (MB.hot_skills || []).slice().sort((a, b) => a.value - b.value);
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => {
        const s = skills[p[0].dataIndex];
        const growth = s.growth_rate != null ? s.growth_rate : 0;
        const sign = growth >= 0 ? '+' : '';
        return `${s.name}<br/>需求量：${s.value}<br/>增长率：${sign}${growth}%`;
      }},
      grid: { left: 80, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS },
      yAxis: { type: 'category', data: skills.map(s => s.name), ...AXIS },
      series: [{
        type: 'bar', data: skills.map(s => ({
          value: s.value,
          growth: s.growth_rate || 0,
          itemStyle: {
            color: s.growth_rate != null && s.growth_rate >= 0
              ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#22c55e' }])
              : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#ef4444' }]),
            borderRadius: [0, 5, 5, 0]
          }
        })),
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 11,
          formatter: p => {
            const g = p.data.growth || 0;
            const sign = g >= 0 ? '▲' : '▼';
            return `${p.value}  ${sign}${Math.abs(g)}%`;
          }
        }
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
        data: ind.map((i, idx) => ({ name: i.name, value: i.value, itemStyle: { color: COLORS[idx % COLORS.length] } })),
        label: { color: '#e8ecf4', fontSize: 11, formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } }
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

    // 判断数据格式：有 demand 字段则直接使用，否则按省份计数
    const hasDemand = mapData.length > 0 && mapData[0].demand != null;
    const provinceData = mapData.map(m => {
      const p = (m.province || '').replace('省', '').replace('市', '').replace('自治区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', '');
      return { name: p, demand: hasDemand ? m.demand : 1, job: m.job || '技术开发' };
    });

    // 按需求量排序，取 Top 20
    const sorted = provinceData.sort((a, b) => a.demand - b.demand).slice(-20);
    const names = sorted.map(s => s.name);
    const values = sorted.map(s => s.demand);

    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => {
        const idx = p[0].dataIndex;
        const item = sorted[idx];
        return `${item.name}<br/>需求指数：<strong>${item.demand}</strong><br/>热门岗位：${item.job || '-'}`;
      }},
      grid: { left: 80, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', ...AXIS, name: '需求指数', nameTextStyle: { color: '#8b95a7' } },
      yAxis: { type: 'category', data: names, ...AXIS, axisLabel: { color: '#8b95a7', fontSize: 10 } },
      visualMap: {
        show: false, min: Math.min(...values), max: Math.max(...values),
        inRange: { color: ['#22d3ee', '#6366f1', '#a855f7', '#ec4899'] }
      },
      series: [{
        type: 'bar', data: values,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 10, formatter: '{c}' },
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
  var liveScrollRaf = null;
  var liveScrollPaused = false;
  var liveFeedCloned = false;

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
    liveFeedCloned = false;
    startLiveFeedAutoScroll();
  }

  // 招聘动态自动滚动（无缝循环，悬停暂停）
  function startLiveFeedAutoScroll() {
    var container = document.getElementById('mk-live-feed');
    if (!container) return;
    if (liveScrollRaf) { cancelAnimationFrame(liveScrollRaf); liveScrollRaf = null; }
    liveScrollPaused = false;

    // 只绑定一次交互事件：悬停/触摸暂停，移开继续
    if (!container.dataset.scrollBound) {
      container.dataset.scrollBound = '1';
      container.addEventListener('mouseenter', function () { liveScrollPaused = true; });
      container.addEventListener('mouseleave', function () { liveScrollPaused = false; });
      container.addEventListener('touchstart', function () { liveScrollPaused = true; }, { passive: true });
      container.addEventListener('touchend', function () { liveScrollPaused = false; }, { passive: true });
    }

    // 内容超出可视高度时复制一份，实现无缝循环
    if (!liveFeedCloned) {
      if (container.scrollHeight <= container.clientHeight + 4) return;
      Array.prototype.slice.call(container.children).forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        container.appendChild(clone);
      });
      liveFeedCloned = true;
    }

    var loopHeight = container.scrollHeight / 2;
    var lastTs = 0;
    function step(ts) {
      if (!lastTs) lastTs = ts;
      var dt = Math.min(ts - lastTs, 100);
      lastTs = ts;
      // 标签页隐藏或容器不可见时不滚动
      if (!liveScrollPaused && container.offsetParent !== null) {
        container.scrollTop += 0.4 * (dt / 16.67); // 约 24px/s
        if (container.scrollTop >= loopHeight - 1) container.scrollTop -= loopHeight;
      }
      liveScrollRaf = requestAnimationFrame(step);
    }
    liveScrollRaf = requestAnimationFrame(step);
  }

  // ===== 实时拉取 RemoteOK 招聘数据 =====
  var autoRefreshTimer = null;

  function updateFeedTimestamp(source) {
    var sub = document.getElementById('mk-live-feed-sub');
    if (sub) {
      var now = new Date();
      var timeStr = now.toLocaleString('zh-CN', { hour12: false });
      sub.textContent = '数据来源：51job前程无忧 + RemoteOK · 上次更新：' + timeStr + '（' + source + '）';
    }
  }

  function fetchRealTimeFeed() {
    var proxyUrls = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://remoteok.com/api'),
      'https://corsproxy.io/?url=' + encodeURIComponent('https://remoteok.com/api'),
    ];
    var tryFetch = function (idx) {
      if (idx >= proxyUrls.length) {
        // 所有代理失败，保留原有 51job 数据
        updateFeedTimestamp('51job静态数据');
        return;
      }
      fetch(proxyUrls[idx])
        .then(function (r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
        .then(function (payload) {
          if (!Array.isArray(payload)) throw new Error('非列表');
          var rawJobs = payload.filter(function (x) { return x && typeof x === 'object' && x.id; });
          var techJobs = rawJobs.filter(function (job) {
            var title = (job.position || job.title || '').toLowerCase();
            var desc = (job.description || '').toLowerCase();
            var tags = Array.isArray(job.tags) ? job.tags.join(' ').toLowerCase() : '';
            var text = title + ' ' + desc + ' ' + tags;
            return /python|java|javascript|typescript|react|vue|node|golang|rust|c\+\+|docker|kubernetes|aws|devops|machine learning|deep learning|ai|ml|data|backend|frontend|full ?stack|sql|security|blockchain|embedded|nlp|cv|rag|agent/.test(text);
          }).slice(0, 20);

          if (techJobs.length === 0) {
            updateFeedTimestamp('51job静态数据');
            return;
          }

          // 保存原有的 51job 静态数据
          var staticFeed = (MB.live_feed || []).filter(function (f) {
            // 判断是否为中文岗位（51job数据）
            return /[\u4e00-\u9fa5]/.test(f.text || '');
          });

          var now = new Date();
          var remoteFeed = techJobs.map(function (job, i) {
            var company = (job.company || '').trim();
            var location = (job.location || 'Remote').trim();
            var title = (job.position || job.title || '未知岗位').trim();
            var minsAgo = i * 2;
            var d = new Date(now.getTime() - minsAgo * 60000);
            var time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            var parts = [];
            if (company) parts.push(company);
            if (location) parts.push(location);
            parts.push('发布' + title + '招聘');
            return { time: time, text: parts.join(' ').slice(0, 120), source: 'RemoteOK' };
          });

          // 合并：远程岗位在前，51job 静态数据在后
          MB.live_feed = remoteFeed.concat(staticFeed).slice(0, 30);
          renderLiveFeed();
          updateFeedTimestamp('RemoteOK实时 + 51job');
        })
        .catch(function (err) {
          console.warn('[实时拉取] 代理 ' + idx + ' 失败:', err);
          tryFetch(idx + 1);
        });
    };
    tryFetch(0);
  }

  // 启动自动刷新（每60秒）
  function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(function () {
      // 仅在市场洞察标签页可见时刷新
      var marketView = document.getElementById('view-market');
      if (marketView && marketView.classList.contains('active')) {
        fetchRealTimeFeed();
      }
    }, 60000);
  }

  // ===== 初始化（懒加载：仅在市场洞察标签页首次显示时执行）=====
  var marketInited = false;
  function initAll() {
    if (marketInited) return;
    marketInited = true;
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
    updateFeedTimestamp('51job静态数据');
    // 尝试实时拉取 RemoteOK 数据更新招聘动态
    fetchRealTimeFeed();
    // 绑定刷新按钮
    var refreshBtn = document.getElementById('mk-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        refreshBtn.textContent = '刷新中...';
        refreshBtn.disabled = true;
        fetchRealTimeFeed();
        setTimeout(function () {
          refreshBtn.textContent = '🔄 刷新数据';
          refreshBtn.disabled = false;
        }, 2000);
      });
    }
    // 启动自动刷新（每60秒）
    startAutoRefresh();
  }

  // 暴露给外部，由标签页切换时调用
  window.initMarketCharts = initAll;

  // 兼容：如果页面加载时市场洞察已是激活状态，则直接初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('view-market') && document.getElementById('view-market').classList.contains('active')) {
        initAll();
      }
    });
  } else {
    if (document.getElementById('view-market') && document.getElementById('view-market').classList.contains('active')) {
      initAll();
    }
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
