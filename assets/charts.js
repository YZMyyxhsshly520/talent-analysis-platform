// TalentAnalysis Platform — 数据总览
// 目标岗位可自主选择（市场上有需求的岗位均可选），成长曲线/匹配度/技能分析随岗位联动
// 竞争力排名与竞争池分数段分布需先录入其他候选人数据后才能分析
(function () {
  'use strict';

  var D = window.MARKET_DATA || {};
  var MB = D.main_board || {};

  var C = {
    accent: '#6366f1', accent2: '#a855f7', accent3: '#22d3ee',
    ink: '#e8ecf4', muted: '#8b95a7', rule: 'rgba(255,255,255,0.08)',
    bg2: 'rgba(255,255,255,0.04)', good: '#22c55e', warn: '#f59e0b', bad: '#ef4444',
  };
  var palette = ['#6366f1', '#a855f7', '#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#4ade80'];

  // 技能难度系数（与能力评估页知识库一致，未收录默认 1.0）
  var DIFFICULTY = {
    'python': 0.8, 'java': 1.0, 'javascript': 0.8, 'typescript': 0.9, 'vue': 0.7, 'react': 0.9,
    'springboot': 0.9, 'mysql': 0.7, 'redis': 0.8, 'docker': 0.8, 'kubernetes': 1.3, 'linux': 0.9,
    '算法': 1.2, '机器学习': 1.4, '深度学习': 1.5, 'pytorch': 1.1, 'tensorflow': 1.1, '大数据': 1.3,
    'go': 1.1, 'rust': 1.4, 'c++': 1.3, 'git': 0.5, 'node': 0.8, 'css': 0.6, 'html': 0.4,
    'mongodb': 0.8, 'nginx': 0.8, 'sql': 0.9, 'ai': 1.2, '云原生技术': 1.2, '系统架构设计': 1.3,
  };

  // =====================================================================
  // 工具函数
  // =====================================================================
  function hash01(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function round1(v) { return Math.round(v * 10) / 10; }
  function round2(v) { return Math.round(v * 100) / 100; }
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function getDifficulty(name) {
    return DIFFICULTY[(name || '').toLowerCase().trim()] || 1.0;
  }

  // =====================================================================
  // 岗位目录：热门 / 在招 / 新兴 / 前瞻（市场上有需求的岗位）
  // =====================================================================
  var catalog = [];
  var seenJob = {};

  function addJob(item) {
    if (!item.name || seenJob[item.name]) return;
    seenJob[item.name] = true;
    catalog.push(item);
  }

  var jobSkills = {};
  (D.jobs || []).forEach(function (j) { jobSkills[j.name] = (j.required_skills || []).slice(); });
  (D.new_jobs || []).forEach(function (j) { jobSkills[j.name] = (j.required_skills || []).slice(); });

  var hotSkillNames = (MB.hot_skills || []).map(function (s) { return s.name; }).slice(0, 9);

  (MB.hot_jobs || []).forEach(function (h) {
    var skills = jobSkills[h.name] && jobSkills[h.name].length ? jobSkills[h.name] : hotSkillNames;
    addJob({ name: h.name, group: '热门岗位', industry: '热门需求', skills: skills, note: h.share ? '市场占比 ' + h.share + '%' : '' });
  });
  (D.jobs || []).forEach(function (j) {
    addJob({
      name: j.name, group: '在招岗位', industry: (j.tags || [])[0] || '技术开发',
      skills: j.required_skills || [], note: j.salary ? '薪资 ' + j.salary : '',
    });
  });
  (D.new_jobs || []).forEach(function (j) {
    addJob({ name: j.name, group: '新兴岗位', industry: '新兴职业', skills: j.required_skills || [], note: '' });
  });
  (D.pre_jobs || []).forEach(function (p) {
    addJob({
      name: p.pre_job, group: '前瞻岗位', industry: p.category || '前瞻方向',
      skills: (p.new_skills || []).map(function (s) { return s.new_skill || s; }),
      note: p.metric || '',
    });
  });

  var selectEl = document.getElementById('ov-job-select');
  ['热门岗位', '在招岗位', '新兴岗位', '前瞻岗位'].forEach(function (group) {
    var items = catalog.filter(function (j) { return j.group === group; });
    if (!items.length) return;
    var og = document.createElement('optgroup');
    og.label = group + '（' + items.length + '）';
    items.forEach(function (j) {
      var opt = document.createElement('option');
      opt.value = j.name;
      opt.textContent = j.name + (j.industry ? ' · ' + j.industry : '');
      og.appendChild(opt);
    });
    if (selectEl) selectEl.appendChild(og);
  });

  // =====================================================================
  // 岗位画像：技能成长 / 匹配度 / 五维得分
  // =====================================================================
  var state = { job: null, profile: null, pool: [], analyzed: false };

  function buildProfile(job) {
    var names = [];
    (job.skills || []).forEach(function (n) {
      n = (n || '').trim();
      if (n && names.indexOf(n) === -1) names.push(n);
    });
    if (!names.length) names = hotSkillNames.slice();
    names = names.slice(0, 12);

    var rows = names.map(function (name) {
      var cur = clamp(0.6 + hash01(job.name + '|' + name + '|c') * 0.28, 0.55, 0.88);
      var target = 0.9;
      var rate = 0.5 + hash01(job.name + '|' + name + '|r') * 0.3;
      var difficulty = getDifficulty(name);
      var k = 0.15 * rate / difficulty;
      function at(t) { return Math.min(target, target - (target - cur) * Math.exp(-k * t)); }
      var months = null;
      if (cur < target) {
        var ratio = (target * 0.01) / (target - cur);
        if (ratio > 0 && ratio < 1) months = Math.round(-Math.log(ratio) / k * 10) / 10;
      }
      return {
        name: name, current: round2(cur), target: target, rate: round2(rate), difficulty: difficulty,
        p3: round2(at(3)), p6: round2(at(6)), p12: round2(at(12)), months: months,
      };
    });

    var avg = rows.reduce(function (s, r) { return s + r.current; }, 0) / rows.length;
    var gapCount = rows.filter(function (r) { return r.target - r.current >= 0.15; }).length;

    var focus = rows.slice().sort(function (a, b) {
      var ga = a.target - a.current, gb = b.target - b.current;
      if (Math.abs(gb - ga) > 0.001) return gb - ga;
      return b.difficulty - a.difficulty;
    })[0];

    var dims = [
      { name: '技能', score: round1(avg * 100) },
      { name: '经验', score: round1(55 + hash01(job.name + '|exp') * 35) },
      { name: '学历', score: round1(65 + hash01(job.name + '|edu') * 30) },
      { name: '项目', score: round1(50 + hash01(job.name + '|proj') * 40) },
      { name: '软技能', score: round1(65 + hash01(job.name + '|soft') * 30) },
    ];

    return { rows: rows, match: round1(avg * 100), gapCount: gapCount, focus: focus, dims: dims };
  }

  // =====================================================================
  // 图表实例
  // =====================================================================
  var chartGrowth = echarts.init(document.getElementById('ov-chart-growth'), null, { renderer: 'svg' });
  var chartSingle = echarts.init(document.getElementById('ov-chart-growth-single'), null, { renderer: 'svg' });
  var chartRadar = echarts.init(document.getElementById('ov-chart-radar'), null, { renderer: 'svg' });
  var chartDist = echarts.init(document.getElementById('ov-chart-distribution'), null, { renderer: 'svg' });

  // =====================================================================
  // 指标卡
  // =====================================================================
  function renderMetrics() {
    var job = state.job, p = state.profile;
    setText('ov-metric-job', job.name);
    setText('ov-metric-job-sub', [job.industry, job.group].filter(Boolean).join(' · '));
    setText('ov-metric-match', p.match.toFixed(1));
    setText('ov-metric-match-sub', p.rows.length + ' 项核心技能加权');
    setText('ov-metric-skills', p.rows.length);
    setText('ov-metric-skills-sub', '含 ' + p.gapCount + ' 项缺口技能');

    if (state.analyzed) {
      var st = poolStats();
      setText('ov-metric-comp', st.competitiveness.toFixed(1));
      setText('ov-metric-comp-sub', 'Top ' + Math.max(1, Math.round(100 - st.percentile)) + '% · 第 ' + st.rank + '/' + st.total + ' 名');
    } else {
      setText('ov-metric-comp', '--');
      setText('ov-metric-comp-sub', '待录入竞争池数据');
    }
  }

  // =====================================================================
  // 重点技能
  // =====================================================================
  function renderFocus() {
    var f = state.profile.focus;
    var monthsText = f.months ? '预计 ' + f.months + ' 个月达标' : '已达标';
    setText('ov-focus-name', '重点技能：' + f.name);
    setText('ov-focus-sub', '缺口 ' + Math.round((f.target - f.current) * 100) + '% · 难度系数 ' + f.difficulty.toFixed(1) + ' · ' + monthsText);

    var hint;
    if (!f.months) hint = '该技能已达标，可向更深层次或相关技能拓展。';
    else if (f.months <= 6) hint = '短期内可达标，保持当前学习节奏即可。';
    else if (f.months <= 18) hint = '预计需 ' + f.months + ' 个月达标，建议制定周计划并持续投入。';
    else hint = '难度较高且缺口较大，建议先补齐前置基础，再通过项目实战加速。';
    document.getElementById('ov-focus-hint').innerHTML = '<strong style="color:var(--ink);">学习建议：</strong>' + hint;
  }

  // =====================================================================
  // 成长曲线（Nelson 指数学习曲线）
  // =====================================================================
  function tooltipBase(valueFormatter) {
    return {
      trigger: 'axis', appendToBody: true,
      backgroundColor: 'rgba(10,14,26,0.92)', borderColor: C.rule,
      textStyle: { color: C.ink, fontSize: 12 },
      valueFormatter: valueFormatter || function (v) { return (v * 100).toFixed(0) + '%'; },
    };
  }

  function renderGrowth() {
    var rows = state.profile.rows;
    var xAxis = ['当前', '3个月', '6个月', '12个月'];
    chartGrowth.setOption({
      animation: false,
      tooltip: tooltipBase(),
      legend: { type: 'scroll', bottom: 0, textStyle: { color: C.muted, fontSize: 11 }, itemWidth: 14, itemHeight: 8 },
      grid: { left: 50, right: 20, top: 20, bottom: 60 },
      xAxis: { type: 'category', data: xAxis, boundaryGap: false, axisLine: { lineStyle: { color: C.rule } }, axisLabel: { color: C.muted, fontSize: 11 } },
      yAxis: { type: 'value', min: 0, max: 1, axisLabel: { color: C.muted, fontSize: 11, formatter: function (v) { return (v * 100).toFixed(0) + '%'; } }, splitLine: { lineStyle: { color: C.rule } } },
      series: rows.map(function (r, i) {
        var isGap = r.target - r.current >= 0.15;
        return {
          name: r.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
          lineStyle: { width: isGap ? 2.5 : 1.5, type: isGap ? 'solid' : 'dashed' },
          itemStyle: { color: palette[i % palette.length] },
          emphasis: { focus: 'series' },
          data: [r.current, r.p3, r.p6, r.p12],
        };
      }),
    }, true);
  }

  function renderSingle() {
    var f = state.profile.focus;
    var xAxis = ['当前', '3个月', '6个月', '12个月'];
    chartSingle.setOption({
      animation: false,
      tooltip: tooltipBase(),
      grid: { left: 45, right: 16, top: 16, bottom: 30 },
      xAxis: { type: 'category', data: xAxis, boundaryGap: false, axisLine: { lineStyle: { color: C.rule } }, axisLabel: { color: C.muted, fontSize: 11 } },
      yAxis: { type: 'value', min: 0, max: 1, axisLabel: { color: C.muted, fontSize: 11, formatter: function (v) { return (v * 100).toFixed(0) + '%'; } }, splitLine: { lineStyle: { color: C.rule } } },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 7,
        lineStyle: { width: 3, color: C.accent2 },
        itemStyle: { color: C.accent2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: C.accent2 + '55' }, { offset: 1, color: C.accent2 + '05' }] } },
        data: [f.current, f.p3, f.p6, f.p12],
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { color: C.muted, type: 'dashed', width: 1 },
          data: [{ yAxis: 0.9, label: { formatter: '目标 90%', color: C.muted, fontSize: 10, position: 'insideEndTop' } }],
        },
      }],
    }, true);
  }

  // =====================================================================
  // 成长明细表（「当前」列可编辑）
  // =====================================================================
  function statusOf(r) {
    if (r.p12 >= 0.85) return { text: '领先', cls: 'tag-good' };
    if (r.p12 >= 0.6) return { text: '可达', cls: 'tag-warn' };
    return { text: '待补', cls: 'tag-bad' };
  }

  function renderTable() {
    var tbody = document.getElementById('ov-growth-table');
    if (!tbody) return;
    var rows = state.profile.rows.map(function (r, i) { return { r: r, i: i }; }).sort(function (a, b) {
      return (b.r.months || 0) - (a.r.months || 0);
    });
    tbody.innerHTML = rows.map(function (item) {
      var r = item.r;
      var st = statusOf(r);
      var gapBadge = (r.target - r.current) >= 0.15
        ? '<span style="font-size:10px;color:' + C.bad + ';margin-left:4px;">缺口</span>' : '';
      return '<tr>'
        + '<td style="font-family:InstrumentSans;">' + r.name + gapBadge + '</td>'
        + '<td><input class="growth-input" type="number" min="0" max="95" step="1" data-idx="' + item.i
        + '" value="' + Math.round(r.current * 100) + '" title="可编辑当前掌握度（0-95）"></td>'
        + '<td>' + Math.round(r.p3 * 100) + '%</td>'
        + '<td>' + Math.round(r.p6 * 100) + '%</td>'
        + '<td>' + Math.round(r.p12 * 100) + '%</td>'
        + '<td>' + (r.months != null ? r.months + ' 月' : '已达标') + '</td>'
        + '<td class="' + st.cls + '">' + st.text + '</td>'
        + '</tr>';
    }).join('');
  }

  // 根据「当前」掌握度重算 3/6/12 个月预测与达标用时
  function setRowCurrent(row, cur) {
    var target = row.target;
    var k = 0.15 * row.rate / row.difficulty;
    cur = clamp(cur, 0, 0.95);
    function at(t) { return Math.min(target, target - (target - cur) * Math.exp(-k * t)); }
    row.current = round2(cur);
    row.p3 = round2(at(3));
    row.p6 = round2(at(6));
    row.p12 = round2(at(12));
    row.months = null;
    if (cur < target) {
      var ratio = (target * 0.01) / (target - cur);
      if (ratio > 0 && ratio < 1) row.months = Math.round(-Math.log(ratio) / k * 10) / 10;
    }
  }

  // 汇总：匹配总分、缺口技能、重点技能、技能维度得分
  function refreshProfileAggregates() {
    var p = state.profile;
    var avg = p.rows.reduce(function (s, r) { return s + r.current; }, 0) / p.rows.length;
    p.match = round1(avg * 100);
    p.gapCount = p.rows.filter(function (r) { return r.target - r.current >= 0.15; }).length;
    p.focus = p.rows.slice().sort(function (a, b) {
      var ga = a.target - a.current, gb = b.target - b.current;
      if (Math.abs(gb - ga) > 0.001) return gb - ga;
      return b.difficulty - a.difficulty;
    })[0];
    p.dims[0].score = round1(avg * 100);
  }

  function applySkillCurrent(idx, pct) {
    var row = state.profile.rows[idx];
    if (!row) return;
    setRowCurrent(row, pct / 100);
    refreshProfileAggregates();
    renderAll();
  }

  // 成长明细示例数据（按技能顺序填充当前掌握度，单位 %）
  var GROWTH_SAMPLE = [72, 58, 81, 46, 67, 88, 54, 76, 63, 49, 71, 84];

  function fillGrowthSample() {
    state.profile.rows.forEach(function (row, i) {
      setRowCurrent(row, GROWTH_SAMPLE[i % GROWTH_SAMPLE.length] / 100);
    });
    refreshProfileAggregates();
    renderAll();
  }

  // =====================================================================
  // 竞争池统计
  // =====================================================================
  function poolStats() {
    var self = state.profile.match;
    var others = state.pool;
    var total = others.length + 1;
    var below = others.filter(function (o) { return o.total < self; }).length;
    var percentile = round1(below / total * 100);
    var rank = 1 + others.filter(function (o) { return o.total > self; }).length;
    var competitiveness = round1(100 - percentile);
    var confidence = round2(1 - 1 / Math.sqrt(total + 1));
    return { self: self, total: total, percentile: percentile, rank: rank, competitiveness: competitiveness, confidence: confidence };
  }

  function dimSamples() {
    return state.pool.filter(function (o) { return o.dims && o.dims.length === 5; });
  }

  function dimPercentiles() {
    if (!state.analyzed) return null;
    var samples = dimSamples();
    if (!samples.length) return null;
    return state.profile.dims.map(function (d, i) {
      var below = samples.filter(function (o) { return o.dims[i] < d.score; }).length;
      return round1(below / samples.length * 100);
    });
  }

  function rankLevel(p) {
    if (p >= 90) return { title: '竞争力领先 · Top 10%', advice: '竞争力领先，可优先投递头部企业核心岗位。' };
    if (p >= 75) return { title: '竞争力较强 · Top 25%', advice: '竞争力较强，建议继续强化项目与经验。' };
    if (p >= 50) return { title: '竞争力中等 · Top 50%', advice: '竞争力中等，建议针对性提升薄弱维度后再投递。' };
    if (p >= 25) return { title: '竞争力偏弱 · Top 75%', advice: '竞争力偏弱，建议先补齐核心技能与项目经历。' };
    return { title: '竞争力待提升 · 后 25%', advice: '竞争力待提升，建议系统学习核心技能并积累项目经验。' };
  }

  // =====================================================================
  // 排名区
  // =====================================================================
  function renderRank() {
    var pctEl = document.getElementById('ov-rank-pct');
    var circle = document.querySelector('.rank-circle');
    if (!state.analyzed) {
      if (pctEl) pctEl.textContent = '--';
      if (circle) circle.style.background = 'conic-gradient(from -90deg, var(--bg3) 0deg, var(--bg3) 360deg)';
      setText('ov-rank-title', '待分析');
      var meta = document.getElementById('ov-rank-meta');
      if (meta) meta.textContent = '请先确认其他候选人数据，点击「开始分析」后生成竞争力排名。';
      return;
    }
    var st = poolStats();
    if (pctEl) pctEl.innerHTML = st.percentile.toFixed(1) + '<span style="font-size:16px;">%</span>';
    if (circle) {
      var deg = Math.max(0, Math.min(360, st.percentile * 3.6));
      circle.style.background = 'conic-gradient(from -90deg, var(--accent) 0deg, var(--accent2) ' + deg + 'deg, var(--bg3) ' + deg + 'deg)';
    }
    var lv = rankLevel(st.percentile);
    setText('ov-rank-title', lv.title);

    var weakest = state.profile.dims.slice().sort(function (a, b) { return a.score - b.score; })[0];
    var metaEl = document.getElementById('ov-rank-meta');
    if (metaEl) {
      metaEl.innerHTML = '排名：<strong>第 ' + st.rank + ' / ' + st.total + ' 名</strong>　|　置信度：<strong>'
        + st.confidence.toFixed(3) + '</strong><br>建议：' + lv.advice
        + '当前最薄弱维度为 <strong>' + weakest.name + '</strong>（' + weakest.score.toFixed(1) + ' 分）。';
    }
  }

  // =====================================================================
  // 五维雷达
  // =====================================================================
  function renderRadar() {
    var dims = state.profile.dims;
    var seriesData = [{
      value: dims.map(function (d) { return d.score; }), name: '本人得分',
      areaStyle: { color: C.accent + '33' }, lineStyle: { color: C.accent, width: 2 }, itemStyle: { color: C.accent },
    }];
    var samples = dimSamples();
    if (state.analyzed && samples.length) {
      var avg = dims.map(function (d, i) {
        return round1(samples.reduce(function (s, o) { return s + o.dims[i]; }, 0) / samples.length);
      });
      seriesData.push({
        value: avg, name: '竞争池平均',
        areaStyle: { color: C.accent2 + '22' }, lineStyle: { color: C.accent2, width: 2, type: 'dashed' }, itemStyle: { color: C.accent2 },
      });
    }
    chartRadar.setOption({
      animation: false,
      tooltip: { appendToBody: true, backgroundColor: 'rgba(10,14,26,0.92)', borderColor: C.rule, textStyle: { color: C.ink, fontSize: 12 } },
      legend: { bottom: 0, textStyle: { color: C.muted, fontSize: 11 } },
      radar: {
        indicator: dims.map(function (d) { return { name: d.name, max: 100 }; }),
        axisName: { color: C.ink, fontSize: 12 },
        splitLine: { lineStyle: { color: C.rule } },
        splitArea: { areaStyle: { color: ['transparent', C.bg2] } },
        axisLine: { lineStyle: { color: C.rule } },
      },
      series: [{ type: 'radar', data: seriesData }],
    }, true);
  }

  // =====================================================================
  // 五维明细
  // =====================================================================
  function renderDimList() {
    var pcts = dimPercentiles();
    var html = state.profile.dims.map(function (d, i) {
      var pct = pcts ? pcts[i] : null;
      var width = pct != null ? pct : d.score;
      var lvText, lvColor;
      if (pct == null) { lvText = '待分析'; lvColor = C.muted; }
      else if (pct >= 75) { lvText = '领先'; lvColor = C.good; }
      else if (pct >= 50) { lvText = '中上'; lvColor = C.warn; }
      else { lvText = '中等'; lvColor = C.accent3; }
      return '<div class="dim-row">'
        + '<div class="name">' + d.name + '</div>'
        + '<div class="track"><div class="fill" style="width:' + clamp(width, 0, 100) + '%;"></div></div>'
        + '<div class="sc">' + d.score.toFixed(1) + '</div>'
        + '<div class="lv" style="color:' + lvColor + ';">' + lvText + '</div>'
        + '</div>';
    }).join('');
    document.getElementById('ov-dim-list').innerHTML = html;
    setText('ov-dim-sub', pcts ? '各维度得分与在竞争池中的百分位' : '未录入五维数据时仅展示本人得分，录入后可计算百分位');
  }

  // =====================================================================
  // 分数段分布
  // =====================================================================
  function renderDistribution() {
    var caption = document.getElementById('ov-dist-caption');
    if (!state.analyzed) {
      if (caption) caption.textContent = '竞争池分数段分布（待分析）';
      chartDist.setOption({
        animation: false,
        graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: '点击「开始分析」后生成分数段分布', fill: C.muted, fontSize: 13 } }],
        xAxis: { show: false }, yAxis: { show: false },
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
        series: [],
      }, true);
      return;
    }

    var st = poolStats();
    var buckets = [
      { range: '90-100', min: 90, max: 100.01 },
      { range: '80-89', min: 80, max: 90 },
      { range: '70-79', min: 70, max: 80 },
      { range: '60-69', min: 60, max: 70 },
      { range: '0-59', min: 0, max: 60 },
    ];
    buckets.forEach(function (b) { b.count = 0; });
    var scores = state.pool.map(function (o) { return o.total; }).concat([st.self]);
    var mineRange = null;
    scores.forEach(function (s) {
      for (var i = 0; i < buckets.length; i++) {
        if (s >= buckets[i].min && s < buckets[i].max) {
          buckets[i].count++;
          if (s === st.self) mineRange = buckets[i].range;
          break;
        }
      }
    });
    if (caption) caption.textContent = '竞争池分数段分布（共 ' + st.total + ' 位候选人，含本人 ' + st.self.toFixed(1) + ' 分）';

    chartDist.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(10,14,26,0.92)', borderColor: C.rule, textStyle: { color: C.ink, fontSize: 12 } },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: buckets.map(function (b) { return b.range; }), axisLine: { lineStyle: { color: C.rule } }, axisLabel: { color: C.muted, fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { color: C.muted, fontSize: 11 }, splitLine: { lineStyle: { color: C.rule } } },
      series: [{
        type: 'bar', barWidth: '45%',
        data: buckets.map(function (b) {
          return {
            value: b.count,
            itemStyle: { color: b.range === mineRange ? C.accent : C.accent2 + '88', borderRadius: [4, 4, 0, 0] },
          };
        }),
        label: { show: true, position: 'top', color: C.ink, fontSize: 12, fontFamily: 'JetBrainsMono' },
      }],
    }, true);
  }

  // =====================================================================
  // 竞争池输入解析
  // =====================================================================
  function parsePool(text) {
    var items = [];
    var errors = [];
    text.split(/\r?\n/).forEach(function (line, idx) {
      line = line.trim();
      if (!line) return;
      var parts = line.split(/[,，\t]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!parts.length) return;
      var name = '候选人' + (items.length + 1);
      if (isNaN(parseFloat(parts[0]))) name = parts.shift();
      if (!parts.length) { errors.push('第 ' + (idx + 1) + ' 行缺少总分'); return; }
      var total = parseFloat(parts[0]);
      if (isNaN(total) || total < 0 || total > 100) { errors.push('第 ' + (idx + 1) + ' 行总分无效'); return; }
      var dims = null;
      if (parts.length >= 6) {
        var d = parts.slice(1, 6).map(parseFloat);
        if (d.every(function (x) { return !isNaN(x) && x >= 0 && x <= 100; })) dims = d;
      }
      items.push({ name: name, total: total, dims: dims });
    });
    return { items: items, errors: errors };
  }

  function renderAll() {
    renderMetrics();
    renderFocus();
    renderGrowth();
    renderSingle();
    renderTable();
    renderRank();
    renderRadar();
    renderDimList();
    renderDistribution();
  }

  function applyJob(name) {
    var job = catalog.filter(function (j) { return j.name === name; })[0];
    if (!job) return;
    state.job = job;
    state.profile = buildProfile(job);
    renderAll();
  }

  // =====================================================================
  // 交互事件
  // =====================================================================
  if (selectEl) {
    selectEl.addEventListener('change', function () { applyJob(selectEl.value); });
  }

  // 成长明细：编辑「当前」列 / 填入示例数据
  var growthTbody = document.getElementById('ov-growth-table');
  if (growthTbody) {
    growthTbody.addEventListener('change', function (e) {
      var input = e.target;
      if (!input || !input.classList || !input.classList.contains('growth-input')) return;
      var idx = parseInt(input.getAttribute('data-idx'), 10);
      var val = parseFloat(input.value);
      if (isNaN(val)) { renderTable(); return; }
      applySkillCurrent(idx, clamp(val, 0, 95));
    });
    growthTbody.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('growth-input')) {
        e.target.blur();
      }
    });
  }

  var growthSampleBtn = document.getElementById('ov-growth-sample');
  if (growthSampleBtn) {
    growthSampleBtn.addEventListener('click', fillGrowthSample);
  }

  var analyzeBtn = document.getElementById('ov-pool-analyze');
  var sampleBtn = document.getElementById('ov-pool-sample');
  var clearBtn = document.getElementById('ov-pool-clear');
  var poolInput = document.getElementById('ov-pool-input');
  var poolMsg = document.getElementById('ov-pool-msg');

  function runPoolAnalysis(okText) {
    var parsed = parsePool(poolInput ? poolInput.value : '');
    if (!parsed.items.length) {
      state.pool = [];
      state.analyzed = false;
      if (poolMsg) {
        poolMsg.textContent = parsed.errors.length ? parsed.errors[0] : '请输入至少一位其他候选人的匹配总分';
        poolMsg.style.color = C.bad;
      }
      renderAll();
      return;
    }
    state.pool = parsed.items;
    state.analyzed = true;
    if (poolMsg) {
      poolMsg.textContent = (okText || ('已录入 ' + parsed.items.length + ' 位候选人'))
        + (parsed.errors.length ? '，另有 ' + parsed.errors.length + ' 行格式有误已跳过' : '');
      poolMsg.style.color = C.good;
    }
    renderAll();
  }

  // 示例竞争池数据（20 位候选人，含五维分数），用于项目演示
  var SAMPLE_POOL_LINES = [
    '陈晨,95.6,94.2,90.5,96.8,92.4,95.1',
    '李明,91.2,92.8,86.4,93.5,88.9,90.2',
    '王芳,88.4,86.5,89.2,91.4,84.7,88.8',
    '张伟,85.1,83.6,86.9,82.4,87.5,84.2',
    '刘洋,82.6,84.1,79.8,85.7,80.3,83.6',
    '赵敏,80.3,78.9,82.6,84.2,77.8,81.1',
    '周杰,78.9,80.2,76.4,79.8,77.1,78.5',
    '吴倩,77.2,75.8,78.9,81.6,73.4,76.8',
    '徐磊,75.8,74.6,77.2,72.9,76.5,75.3',
    '孙悦,71.0,70.6,72.4,74.2,69.3,71.5',
    '马超,71.1,72.6,68.4,73.2,69.8,71.6',
    '朱婷,68.5,67.2,70.4,72.8,65.9,68.1',
    '胡军,66.2,68.4,63.1,64.8,66.7,65.3',
    '郭静,63.9,62.5,65.8,67.4,61.2,63.6',
    '何涛,61.4,63.2,59.7,60.5,62.8,60.9',
    '高雪,58.7,57.4,61.2,59.6,55.8,58.2',
    '林峰,54.3,56.8,51.4,53.7,54.9,52.6',
    '罗娜,49.8,48.2,52.6,51.3,47.5,49.1',
    '郑浩,44.6,46.3,42.8,43.5,45.7,44.1',
    '梁爽,38.2,36.5,40.8,39.4,37.6,38.9',
  ];

  function buildSampleData() {
    return SAMPLE_POOL_LINES.join('\n');
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function () { runPoolAnalysis(); });
  }

  if (sampleBtn) {
    sampleBtn.addEventListener('click', function () {
      if (poolInput) poolInput.value = buildSampleData();
      runPoolAnalysis('已填入 20 位示例候选人并完成分析');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      state.pool = [];
      state.analyzed = false;
      if (poolInput) poolInput.value = '';
      if (poolMsg) {
        poolMsg.textContent = '尚未录入数据，排名与分数段分布需录入后生成';
        poolMsg.style.color = C.muted;
      }
      renderAll();
    });
  }

  // 预置示例数据，便于演示（不会自动分析，仍需点击「开始分析」）
  if (poolInput) {
    poolInput.value = buildSampleData();
    if (poolMsg) {
      poolMsg.textContent = '已预置 20 位示例候选人数据，点击「开始分析」生成排名与分布';
      poolMsg.style.color = C.muted;
    }
  }

  window.addEventListener('resize', function () {
    chartGrowth.resize();
    chartSingle.resize();
    chartRadar.resize();
    chartDist.resize();
  });

  // =====================================================================
  // 初始化：默认算法工程师（若存在），否则第一个岗位
  // =====================================================================
  var defaultName = seenJob['算法工程师'] ? '算法工程师' : (catalog[0] ? catalog[0].name : '');
  if (defaultName) {
    if (selectEl) selectEl.value = defaultName;
    applyJob(defaultName);
  }
})();
