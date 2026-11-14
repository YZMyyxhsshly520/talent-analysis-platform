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
        type: 'bar', barWidth: '42%', data: jobs.map(j => ({ value: j.value, share: j.share })),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(129,140,248,.85)' }, { offset: 1, color: 'rgba(192,132,252,.85)' }
        ]), borderRadius: [0, 6, 6, 0], borderColor: 'rgba(255,255,255,.16)', borderWidth: 1 },
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
      name: s.name, type: 'line', smooth: true, symbol: 'none', data: s.values,
      lineStyle: { width: 1.6 }, itemStyle: { color: COLORS[idx % COLORS.length] },
      emphasis: { focus: 'series' }
    }));
    // 其余岗位默认隐藏
    otherJobs.slice(0, 20).forEach((s, idx) => {
      series.push({
        name: s.name, type: 'line', smooth: true, symbol: 'none', data: s.values,
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
        itemStyle: { borderRadius: [0, 4, 4, 0], opacity: .7, borderColor: 'rgba(255,255,255,.18)', borderWidth: 1 },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 10, formatter: '{c}' },
        barWidth: '42%'
      }]
    });
  }

  // ===== 06 前瞻岗位需求热度 =====
  // 需求热度指数 = 供需缺口分(0-70) + 招聘增速分(0-30)
  // 缺口分：人才缺口(万人)/200 封顶；仅有缺口率时按缺口率折算
  // 增速分：招聘同比增速(%)/500 封顶
  function computeDemandIndex(job) {
    let gapScore = 0;
    if (typeof job.gap === 'number') gapScore = Math.min(job.gap / 200, 1) * 70;
    else if (typeof job.gap_rate === 'number') gapScore = Math.min(job.gap_rate / 100, 1) * 70;
    const growthScore = typeof job.growth === 'number' ? Math.min(job.growth / 500, 1) * 30 : 0;
    return Math.max(1, Math.round(gapScore + growthScore));
  }

  function renderPreJobs() {
    const chart = init('mk-chart-pre-jobs');
    if (!chart) return;
    const preJobs = (D.pre_jobs || []).map(p => {
      const skills = (p.new_skills || []).map(s => s.new_skill || s);
      const outSkills = (p.out_skills || []).map(s => s.out_skill || s);
      return Object.assign({}, p, { index: computeDemandIndex(p), skills, outSkills });
    });
    // 按需求热度指数升序，条形图从下往上递增
    const sorted = preJobs.sort((a, b) => a.index - b.index);
    const names = sorted.map(p => p.pre_job);
    const values = sorted.map(p => p.index);

    chart.setOption({
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: params => {
          const item = sorted[params[0].dataIndex];
          return `<div style="max-width:320px;white-space:normal;line-height:1.7;">
            <b>${item.pre_job}</b>（${item.category || '-'}）<br/>
            需求热度指数：<b>${item.index}</b><br/>
            真实指标：${item.metric || '-'}<br/>
            数据来源：${item.source || '-'}<br/>
            新兴技能：${item.skills.join('、') || '-'}<br/>
            被替代技能：${item.outSkills.join('、') || '-'}
          </div>`;
        }
      },
      grid: { left: 165, right: 90, top: 15, bottom: 25 },
      xAxis: { type: 'value', max: 100, ...AXIS, name: '需求热度指数', nameTextStyle: { color: '#8b95a7' } },
      yAxis: { type: 'category', data: names, ...AXIS, axisLabel: { color: '#8b95a7', fontSize: 10 } },
      visualMap: {
        show: false, min: Math.min(...values), max: Math.max(...values),
        inRange: { color: ['#22d3ee', '#6366f1', '#a855f7', '#ec4899'] }
      },
      series: [{
        type: 'bar', data: values,
        itemStyle: { borderRadius: [0, 4, 4, 0], opacity: .7, borderColor: 'rgba(255,255,255,.18)', borderWidth: 1 },
        label: { show: true, position: 'right', color: '#8b95a7', fontSize: 10, formatter: '{c}' },
        barWidth: '42%'
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
    function ensureLoop() {
      if (liveFeedCloned) return true;
      if (container.scrollHeight <= container.clientHeight + 4) return false;
      Array.prototype.slice.call(container.children).forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        container.appendChild(clone);
      });
      liveFeedCloned = true;
      return true;
    }

    var lastTs = 0;
    var acc = 0; // 累计小数像素，避免部分浏览器将 scrollTop 取整导致无法滚动
    function step(ts) {
      if (!lastTs) lastTs = ts;
      var dt = Math.min(ts - lastTs, 100);
      lastTs = ts;
      // 标签页隐藏或容器不可见时不滚动
      if (!liveScrollPaused && container.offsetParent !== null && ensureLoop()) {
        var loopHeight = container.scrollHeight / 2;
        acc += 30 * (dt / 1000); // 约 30px/s
        var px = Math.floor(acc);
        if (px > 0) {
          acc -= px;
          container.scrollTop += px;
        }
        if (container.scrollTop >= loopHeight - 1) container.scrollTop -= loopHeight;
      } else {
        acc = 0;
      }
      liveScrollRaf = requestAnimationFrame(step);
    }
    liveScrollRaf = requestAnimationFrame(step);
  }

  // ===== 实时拉取招聘数据（Remotive / RemoteOK 多源，60 秒自动刷新）=====
  var autoRefreshTimer = null;
  var liveFeedRealJobs = [];
  var liveFeedRotation = 0;
  var liveFeedFetching = false;
  var lastFeedFetchAt = 0;

  var TECH_RE = /python|java\b|javascript|typescript|react|vue|node|golang|go\b|rust|c\+\+|docker|kubernetes|aws|devops|machine learning|deep learning|\bai\b|\bml\b|data engineer|data scientist|data analyst|backend|frontend|full ?stack|sql|security|blockchain|embedded|nlp|rag|agent|engineer|developer|programmer|architect/i;

  function updateFeedTimestamp(source) {
    var sub = document.getElementById('mk-live-feed-sub');
    if (sub) {
      var now = new Date();
      var timeStr = now.toLocaleString('zh-CN', { hour12: false });
      sub.textContent = '数据来源：' + source + ' · 上次更新：' + timeStr + '（每 60 秒自动刷新）';
    }
  }

  function fetchJSON(url) {
    return new Promise(function (resolve, reject) {
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (ctrl) ctrl.abort();
        reject(new Error('请求超时'));
      }, 12000);
      var opt = { cache: 'no-store' };
      if (ctrl) opt.signal = ctrl.signal;
      fetch(url, opt)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (d) { clearTimeout(timer); resolve(d); })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function relativeTime(input) {
    var t = new Date(input).getTime();
    if (!t || isNaN(t)) return '';
    var mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 60) return mins + '分钟前';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + '小时前';
    return Math.round(hrs / 24) + '天前';
  }

  function mapRemoteOKList(payload) {
    if (!Array.isArray(payload)) throw new Error('非列表');
    return payload.filter(function (x) {
      return x && typeof x === 'object' && x.id && (x.position || x.title);
    }).map(function (j) {
      var salary = '';
      if (j.salary_min && j.salary_max) {
        salary = '$' + Math.round(j.salary_min / 1000) + 'k-$' + Math.round(j.salary_max / 1000) + 'k';
      }
      return {
        id: 'remoteok-' + j.id,
        title: (j.position || j.title || '').trim(),
        company: (j.company || '').trim(),
        location: (j.location || 'Remote').trim(),
        salary: salary,
        date: j.date,
        tags: j.tags || [],
        source: 'RemoteOK'
      };
    });
  }

  function fetchRemotive() {
    return fetchJSON('https://remotive.com/api/remote-jobs?category=software-dev&limit=40').then(function (d) {
      var list = (d && d.jobs) || [];
      if (!list.length) throw new Error('无数据');
      return list.map(function (j) {
        return {
          id: 'remotive-' + j.id,
          title: (j.title || '').trim(),
          company: (j.company_name || '').trim(),
          location: (j.candidate_required_location || 'Remote').trim(),
          salary: (j.salary || '').trim(),
          date: j.publication_date,
          tags: j.tags || [],
          source: 'Remotive'
        };
      });
    });
  }

  function fetchRemoteOKDirect() {
    return fetchJSON('https://remoteok.com/api').then(mapRemoteOKList);
  }

  function fetchRemoteOKViaProxy() {
    var proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://remoteok.com/api'),
      'https://corsproxy.io/?url=' + encodeURIComponent('https://remoteok.com/api')
    ];
    return new Promise(function (resolve, reject) {
      var idx = 0;
      (function tryNext() {
        if (idx >= proxies.length) { reject(new Error('代理均不可用')); return; }
        fetchJSON(proxies[idx]).then(function (payload) {
          resolve(mapRemoteOKList(payload));
        }).catch(function (e) {
          console.warn('[实时拉取] 代理 ' + idx + ' 失败:', e);
          idx += 1;
          tryNext();
        });
      })();
    });
  }

  // 应用实时岗位：优先技术岗，按发布时间倒序，每次刷新轮换展示位置
  function applyRealJobs(jobs, sourceLabel) {
    var techJobs = jobs.filter(function (j) {
      var text = (j.title + ' ' + (j.tags || []).join(' ')).toLowerCase();
      return TECH_RE.test(text);
    });
    var pool = techJobs.length >= 10 ? techJobs : jobs;
    var seen = {};
    var uniq = [];
    pool.forEach(function (j) {
      if (!j.id || seen[j.id]) return;
      seen[j.id] = 1;
      uniq.push(j);
    });
    uniq.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); });
    if (!uniq.length) throw new Error('无匹配岗位');

    liveFeedRealJobs = uniq.slice(0, 80);
    var take = 10;
    var start = (liveFeedRotation * take) % liveFeedRealJobs.length;
    liveFeedRotation += 1;

    var realItems = [];
    for (var i = 0; i < Math.min(take, liveFeedRealJobs.length); i++) {
      var j = liveFeedRealJobs[(start + i) % liveFeedRealJobs.length];
      var parts = [];
      if (j.company) parts.push(j.company);
      if (j.location) parts.push(j.location);
      parts.push('发布 ' + j.title + ' 招聘');
      if (j.salary) parts.push(j.salary);
      realItems.push({ time: relativeTime(j.date), text: parts.join(' ').slice(0, 120), source: j.source });
    }

    var staticFeed = (MB.live_feed || []).filter(function (f) {
      return /[\u4e00-\u9fa5]/.test(f.text || '');
    });
    MB.live_feed = realItems.concat(staticFeed).slice(0, 30);
    renderLiveFeed();
    updateFeedTimestamp(sourceLabel + ' 实时 + 51job');
  }

  function fetchRealTimeFeed() {
    if (liveFeedFetching) return;
    liveFeedFetching = true;
    lastFeedFetchAt = Date.now();
    var sub = document.getElementById('mk-live-feed-sub');
    if (sub) sub.textContent = '正在获取实时招聘信息…';

    fetchRemotive()
      .then(function (jobs) { applyRealJobs(jobs, 'Remotive'); })
      .catch(function (e1) {
        console.warn('[实时拉取] Remotive 失败:', e1);
        return fetchRemoteOKDirect()
          .then(function (jobs) { applyRealJobs(jobs, 'RemoteOK'); })
          .catch(function (e2) {
            console.warn('[实时拉取] RemoteOK 直连失败:', e2);
            return fetchRemoteOKViaProxy().then(function (jobs) { applyRealJobs(jobs, 'RemoteOK'); });
          });
      })
      .catch(function (e3) {
        console.warn('[实时拉取] 全部数据源不可用:', e3);
        if (liveFeedRealJobs.length) {
          updateFeedTimestamp('沿用最近一次实时数据 + 51job');
        } else {
          updateFeedTimestamp('51job静态数据（实时源暂不可用）');
        }
      })
      .then(function () { liveFeedFetching = false; });
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

  // ===== 岗位详情抽屉 =====
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function findJobDetail(name) {
    var target = String(name || '').trim();
    var job = (D.jobs || []).filter(function (j) { return j.name === target; })[0];
    if (!job) {
      job = (D.jobs || []).filter(function (j) {
        return j.name && (j.name.indexOf(target) >= 0 || target.indexOf(j.name) >= 0);
      })[0];
    }
    if (job) {
      return {
        name: target, salary: job.salary || '', tags: job.tags || [],
        skills: job.required_skills || [], bonus: job.bonus_skills || [],
        kind: '在招岗位'
      };
    }
    var newJob = (D.new_jobs || []).filter(function (j) { return j.name === target; })[0];
    if (newJob) {
      return {
        name: target, salary: '', tags: [], skills: newJob.required_skills || [],
        bonus: newJob.bonus_skills || [], kind: '新兴岗位'
      };
    }
    var pre = (D.pre_jobs || []).filter(function (p) { return p.pre_job === target; })[0];
    if (pre) {
      return {
        name: target, salary: '', tags: [pre.category].filter(Boolean),
        skills: pre.new_skills || [], bonus: pre.out_skills || [],
        kind: '前瞻岗位', metric: pre.metric, source: pre.source
      };
    }
    var hot = (MB.hot_jobs || []).filter(function (h) { return h.name === target; })[0];
    if (hot) {
      return {
        name: target, salary: '', tags: [], skills: [], bonus: [], kind: '热门岗位',
        metric: '市场需求量 ' + hot.value + ' · 占比 ' + hot.share + '%', source: '灵枢知岗招聘数据'
      };
    }
    return { name: target, salary: '', tags: [], skills: [], bonus: [], kind: '岗位' };
  }

  function salaryText(salary) {
    if (!salary) return '面议（参考同行业水平）';
    var m = String(salary).match(/(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)\s*[kK]/);
    if (m) {
      var mid = (parseFloat(m[1]) + parseFloat(m[2])) / 2;
      return salary + '（中位约 ' + mid + 'K/月）';
    }
    return salary;
  }

  function experienceText(job) {
    var tagText = (job.tags || []).join(' ');
    var m = tagText.match(/\d+\s*[-~]\s*\d+\s*年/);
    if (m) return m[0];
    if (/高级|资深|专家|架构/.test(job.name)) return '3-5 年（参考）';
    if (/初级|助理|实习/.test(job.name)) return '1 年以内（参考）';
    return '1-3 年（参考）';
  }

  function buildJobDetailHtml(name) {
    var job = findJobDetail(name);
    var levels = window.getMySkillLevels ? window.getMySkillLevels() : {};
    var counts = { ok: 0, partial: 0, gap: 0, unknown: 0 };
    var chips = (job.skills || []).map(function (s) {
      var lv = levels[String(s).trim().toLowerCase()];
      var cls = lv == null ? 'unknown' : (lv >= 70 ? 'ok' : (lv >= 40 ? 'partial' : 'gap'));
      counts[cls] += 1;
      var label = lv == null ? '未评估' : lv + '%';
      return '<span class="jd-chip ' + cls + '">' + esc(s) + ' · ' + label + '</span>';
    }).join('');

    var bonusChips = (job.bonus || []).slice(0, 10).map(function (s) {
      return '<span class="jd-chip">' + esc(s) + '</span>';
    }).join('');

    var cities = (D.map || []).slice().sort(function (a, b) { return b.demand - a.demand; }).slice(0, 6);
    var maxDemand = cities.length ? cities[0].demand : 1;
    var cityHtml = cities.map(function (c) {
      return '<div class="jd-bar-row"><span class="nm">' + esc(c.province) + '</span>'
        + '<span class="jd-bar"><span style="width:' + Math.max(6, Math.round(c.demand / maxDemand * 100)) + '%"></span></span>'
        + '<span style="width:52px;text-align:right;">' + c.demand + '</span></div>';
    }).join('');

    var degree = (job.tags || []).filter(function (t) { return /本科|硕士|博士|大专|学历/.test(t); })[0] || '学历不限（参考）';
    var industry = (job.tags || []).filter(function (t) { return !/本科|硕士|博士|大专|学历/.test(t); }).slice(0, 4);

    var emptySkills = !(job.skills && job.skills.length);

    return '<div class="jd-title">' + esc(job.name) + '</div>'
      + '<div class="card-sub">' + esc(job.kind) + (job.metric ? ' · ' + esc(job.metric) : '') + '</div>'

      + '<div class="jd-block"><h4>技能覆盖 · 对照你的能力画像</h4>'
      + '<div class="jd-cover">'
      + '<div><b style="color:#34d399;">' + counts.ok + '</b>已覆盖</div>'
      + '<div><b style="color:#fbbf24;">' + counts.partial + '</b>部分覆盖</div>'
      + '<div><b style="color:#f87171;">' + counts.gap + '</b>缺口</div>'
      + '<div><b style="color:var(--muted);">' + counts.unknown + '</b>未评估</div>'
      + '</div>'
      + (emptySkills ? '<div style="font-size:12px;color:var(--muted);">该岗位暂未收录技能明细，可参考其薪资与地域需求。</div>' : '<div>' + chips + '</div>')
      + (bonusChips ? '<div style="margin-top:6px;font-size:11px;color:var(--muted);margin-bottom:8px;">加分技能</div><div>' + bonusChips + '</div>' : '')
      + '</div>'

      + '<div class="jd-block"><h4>薪资区间</h4><div style="font-size:15px;font-weight:600;">' + esc(salaryText(job.salary)) + '</div></div>'

      + '<div class="jd-block"><h4>城市 / 省份需求（全国需求最高地区参考）</h4>' + cityHtml + '</div>'

      + '<div class="jd-block"><h4>经验与要求</h4>'
      + '<div style="font-size:13px;line-height:2;">经验要求：' + esc(experienceText(job)) + '<br>学历要求：' + esc(degree) + '</div>'
      + (industry.length ? '<div style="margin-top:8px;">' + industry.map(function (t) { return '<span class="tag" style="margin-right:6px;">' + esc(t) + '</span>'; }).join('') + '</div>' : '')
      + '</div>'

      + (job.source ? '<div style="margin-top:18px;font-size:11px;color:var(--muted);">数据来源：' + esc(job.source) + '</div>' : '')
      + '<div style="margin-top:18px;"><button class="btn btn-primary" id="jd-to-plan">将缺口技能加入学习计划</button></div>';
  }

  function openJobDetail(name) {
    var body = document.getElementById('jd-body');
    var overlay = document.getElementById('jd-overlay');
    if (!body || !overlay) return;
    body.innerHTML = buildJobDetailHtml(name);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    var toPlan = document.getElementById('jd-to-plan');
    if (toPlan) {
      toPlan.addEventListener('click', function () {
        var job = findJobDetail(name);
        var rows = window.getMySkillProfile ? window.getMySkillProfile() : [];
        var levelMap = {};
        rows.forEach(function (r) { levelMap[String(r.name).toLowerCase()] = r; });
        var items = (job.skills || []).map(function (s) {
          var row = levelMap[String(s).trim().toLowerCase()];
          if (row) return { name: row.name, months: row.months };
          return { name: s, months: null };
        });
        var added = window.LearningPlan ? window.LearningPlan.addSkills(items) : 0;
        toPlan.textContent = added > 0 ? '已加入 ' + added + ' 项 ✓' : '已在学习计划中';
      });
    }
  }

  function closeJobDetail() {
    var overlay = document.getElementById('jd-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderJobChips() {
    var box = document.getElementById('mk-job-chips');
    if (!box) return;
    var prefer = ['算法工程师', '后端开发工程师', '前端开发工程师', '数据分析师', 'Python开发工程师', 'Java开发工程师', '测试工程师', '运维工程师'];
    var names = prefer.filter(function (n) {
      return (D.jobs || []).some(function (j) { return j.name === n; });
    });
    if (!names.length) names = (D.jobs || []).slice(0, 8).map(function (j) { return j.name; });
    box.innerHTML = names.map(function (n) {
      return '<button class="job-chip" data-job="' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');
  }

  document.addEventListener('click', function (e) {
    var chip = e.target && e.target.closest ? e.target.closest('.job-chip') : null;
    if (chip) openJobDetail(chip.getAttribute('data-job'));
    var overlay = document.getElementById('jd-overlay');
    if (e.target === overlay) closeJobDetail();
  });
  var jdCloseBtn = document.getElementById('jd-close');
  if (jdCloseBtn) jdCloseBtn.addEventListener('click', closeJobDetail);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeJobDetail();
  });


  var marketInited = false;
  function initAll() {
    if (marketInited) {
      // 再次进入市场洞察时，距上次拉取超过 30 秒则刷新实时招聘信息
      if (Date.now() - lastFeedFetchAt > 30000) fetchRealTimeFeed();
      return;
    }
    marketInited = true;
    renderMetrics();
    renderHotJobs();
    renderJobChips();
    renderHotSkills();
    renderSkillFreq();
    renderIndustry();
    renderIndustryFreq();
    renderSalary();
    renderMap();
    renderPreJobs();
    renderLiveFeed();
    // 图表点击下钻岗位详情
    var hotChart = echarts.getInstanceByDom(document.getElementById('mk-chart-hot-jobs'));
    if (hotChart) hotChart.on('click', function (p) { if (p && p.name) openJobDetail(p.name); });
    var preChart = echarts.getInstanceByDom(document.getElementById('mk-chart-pre-jobs'));
    if (preChart) preChart.on('click', function (p) { if (p && p.name) openJobDetail(p.name); });
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
