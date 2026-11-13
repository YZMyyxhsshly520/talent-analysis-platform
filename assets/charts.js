// TalentAnalysis Platform — ECharts 图表脚本
// 所有数据来自 growth_curve.py 与 competitiveness.py 的实际运行输出
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#6366f1';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#a855f7';
  var accent3 = style.getPropertyValue('--accent3').trim() || '#22d3ee';
  var ink = style.getPropertyValue('--ink').trim() || '#e8ecf4';
  var muted = style.getPropertyValue('--muted').trim() || '#8b95a7';
  var rule = style.getPropertyValue('--rule').trim() || 'rgba(255,255,255,0.08)';
  var bg2 = style.getPropertyValue('--bg2').trim() || 'rgba(255,255,255,0.04)';
  var good = style.getPropertyValue('--good').trim() || '#22c55e';
  var warn = style.getPropertyValue('--warn').trim() || '#f59e0b';
  var bad = style.getPropertyValue('--bad').trim() || '#ef4444';

  var palette = [accent, accent2, accent3, '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f87171', '#a78bfa'];

  // =====================================================================
  // 数据（与 Python 模块输出一致）
  // =====================================================================
  var xAxis = ['当前', '3个月', '6个月', '12个月'];

  // 成长曲线数据：[name, current, 3m, 6m, 12m, months_to_target, is_gap]
  var growthData = [
    ['Python',       0.75, 0.80, 0.83, 0.87, 21.4, false],
    ['MySQL',        0.60, 0.71, 0.78, 0.85, 23.4, false],
    ['Git',          0.70, 0.75, 0.79, 0.84, 29.5, false],
    ['Linux',        0.50, 0.62, 0.70, 0.80, 32.5, false],
    ['机器学习',     0.55, 0.62, 0.68, 0.76, 48.8, false],
    ['PyTorch',      0.10, 0.32, 0.47, 0.67, 42.7, true],
    ['算法',         0.10, 0.28, 0.43, 0.62, 51.3, true],
    ['大数据',       0.10, 0.27, 0.41, 0.60, 55.6, true],
    ['深度学习',     0.10, 0.25, 0.37, 0.55, 64.1, true],
  ];

  // 竞争力五维数据
  var dimData = [
    { name: '技能', score: 82.0, percentile: 71.4, level: '中上', levelColor: warn },
    { name: '经验', score: 70.0, percentile: 52.4, level: '中等', levelColor: accent3 },
    { name: '学历', score: 75.0, percentile: 66.7, level: '中等', levelColor: accent3 },
    { name: '项目', score: 76.0, percentile: 52.4, level: '中等', levelColor: accent3 },
    { name: '软技能', score: 80.0, percentile: 76.2, level: '中上', levelColor: warn },
  ];

  // 分数段分布
  var distData = [
    { range: '90-100', count: 1 },
    { range: '80-89',  count: 5 },
    { range: '70-79',  count: 6 },
    { range: '60-69',  count: 4 },
    { range: '0-59',   count: 5 },
  ];

  // =====================================================================
  // 图1：多技能成长曲线折线图
  // =====================================================================
  var chartGrowth = echarts.init(document.getElementById('ov-chart-growth'), null, { renderer: 'svg' });
  var series = growthData.map(function (row, i) {
    return {
      name: row[0],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: row[6] ? 2.5 : 1.5, type: row[6] ? 'solid' : 'dashed' },
      itemStyle: { color: palette[i % palette.length] },
      emphasis: { focus: 'series' },
      data: [row[1], row[2], row[3], row[4]],
    };
  });

  chartGrowth.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis', appendToBody: true,
      backgroundColor: 'rgba(10,14,26,0.92)', borderColor: rule,
      textStyle: { color: ink, fontSize: 12 },
      valueFormatter: function (v) { return (v * 100).toFixed(0) + '%'; },
    },
    legend: {
      type: 'scroll', bottom: 0, textStyle: { color: muted, fontSize: 11 },
      itemWidth: 14, itemHeight: 8,
    },
    grid: { left: 50, right: 20, top: 20, bottom: 60 },
    xAxis: {
      type: 'category', data: xAxis, boundaryGap: false,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 11 },
    },
    yAxis: {
      type: 'value', min: 0, max: 1,
      axisLabel: { color: muted, fontSize: 11, formatter: function (v) { return (v * 100).toFixed(0) + '%'; } },
      splitLine: { lineStyle: { color: rule } },
    },
    series: series,
  });
  window.addEventListener('resize', function () { chartGrowth.resize(); });

  // =====================================================================
  // 图2：单技能（深度学习）成长曲线
  // =====================================================================
  var dl = growthData[8]; // 深度学习
  var chartSingle = echarts.init(document.getElementById('ov-chart-growth-single'), null, { renderer: 'svg' });
  chartSingle.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(10,14,26,0.92)', borderColor: rule, textStyle: { color: ink, fontSize: 12 }, valueFormatter: function (v) { return (v * 100).toFixed(0) + '%'; } },
    grid: { left: 45, right: 16, top: 16, bottom: 30 },
    xAxis: { type: 'category', data: xAxis, boundaryGap: false, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 1, axisLabel: { color: muted, fontSize: 11, formatter: function (v) { return (v * 100).toFixed(0) + '%'; } }, splitLine: { lineStyle: { color: rule } } },
    series: [{
      type: 'line', smooth: true, symbol: 'circle', symbolSize: 7,
      lineStyle: { width: 3, color: accent2 },
      itemStyle: { color: accent2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent2 + '55' }, { offset: 1, color: accent2 + '05' }] } },
      data: [dl[1], dl[2], dl[3], dl[4]],
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: muted, type: 'dashed', width: 1 },
        data: [{ yAxis: 0.9, label: { formatter: '目标 90%', color: muted, fontSize: 10, position: 'insideEndTop' } }],
      },
    }],
  });
  window.addEventListener('resize', function () { chartSingle.resize(); });

  // =====================================================================
  // 图3：五维竞争力雷达图
  // =====================================================================
  var chartRadar = echarts.init(document.getElementById('ov-chart-radar'), null, { renderer: 'svg' });
  chartRadar.setOption({
    animation: false,
    tooltip: { appendToBody: true, backgroundColor: 'rgba(10,14,26,0.92)', borderColor: rule, textStyle: { color: ink, fontSize: 12 } },
    legend: { bottom: 0, textStyle: { color: muted, fontSize: 11 } },
    radar: {
      indicator: dimData.map(function (d) { return { name: d.name, max: 100 }; }),
      axisName: { color: ink, fontSize: 12 },
      splitLine: { lineStyle: { color: rule } },
      splitArea: { areaStyle: { color: ['transparent', bg2] } },
      axisLine: { lineStyle: { color: rule } },
    },
    series: [{
      type: 'radar',
      data: [
        { value: dimData.map(function (d) { return d.score; }), name: '维度得分',
          areaStyle: { color: accent + '33' }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } },
        { value: dimData.map(function (d) { return d.percentile; }), name: '百分位',
          areaStyle: { color: accent2 + '22' }, lineStyle: { color: accent2, width: 2, type: 'dashed' }, itemStyle: { color: accent2 } },
      ],
    }],
  });
  window.addEventListener('resize', function () { chartRadar.resize(); });

  // =====================================================================
  // 图4：分数段分布柱状图
  // =====================================================================
  var chartDist = echarts.init(document.getElementById('ov-chart-distribution'), null, { renderer: 'svg' });
  var mineRange = '70-79'; // 本人 78.5 落在 70-79 段
  chartDist.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(10,14,26,0.92)', borderColor: rule, textStyle: { color: ink, fontSize: 12 } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: distData.map(function (d) { return d.range; }), axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 11 }, splitLine: { lineStyle: { color: rule } } },
    series: [{
      type: 'bar', barWidth: '45%',
      data: distData.map(function (d) {
        return {
          value: d.count,
          itemStyle: { color: d.range === mineRange ? accent : accent2 + '88', borderRadius: [4, 4, 0, 0] },
        };
      }),
      label: { show: true, position: 'top', color: ink, fontSize: 12, fontFamily: 'JetBrainsMono' },
    }],
  });
  window.addEventListener('resize', function () { chartDist.resize(); });

  // =====================================================================
  // 渲染成长预测明细表
  // =====================================================================
  var tbody = document.getElementById('ov-growth-table');
  if (tbody) {
    var rows = growthData.slice().sort(function (a, b) { return b[4] - a[4]; });
    tbody.innerHTML = rows.map(function (r) {
      var name = r[0];
      var isGap = r[6];
      var status, statusCls;
      if (r[4] >= 0.85) { status = '领先'; statusCls = 'tag-good'; }
      else if (r[4] >= 0.6) { status = '可达'; statusCls = 'tag-warn'; }
      else { status = '待补'; statusCls = 'tag-bad'; }
      var gapBadge = isGap ? '<span style="font-size:10px;color:' + bad + ';margin-left:4px;">缺口</span>' : '';
      return '<tr>'
        + '<td style="font-family:InstrumentSans;">' + name + gapBadge + '</td>'
        + '<td>' + r[1].toFixed(2) + '</td>'
        + '<td>' + r[2].toFixed(2) + '</td>'
        + '<td>' + r[3].toFixed(2) + '</td>'
        + '<td>' + r[4].toFixed(2) + '</td>'
        + '<td>' + r[5] + ' 月</td>'
        + '<td class="' + statusCls + '">' + status + '</td>'
        + '</tr>';
    }).join('');
  }

  // =====================================================================
  // 渲染五维竞争力进度条列表
  // =====================================================================
  var dimList = document.getElementById('ov-dim-list');
  if (dimList) {
    dimList.innerHTML = dimData.map(function (d) {
      return '<div class="dim-row">'
        + '<div class="name">' + d.name + '</div>'
        + '<div class="track"><div class="fill" style="width:' + d.percentile + '%;"></div></div>'
        + '<div class="sc">' + d.score.toFixed(1) + '</div>'
        + '<div class="lv" style="color:' + d.levelColor + ';">' + d.level + '</div>'
        + '</div>';
    }).join('');
  }
})();
