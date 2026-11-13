// TalentAnalysis Platform — 能力评估与学习建议
// 依赖 ECharts（已在 HTML 中引入）
(function () {
  'use strict';

  // =====================================================================
  // 公开学习资源知识库
  // 基于互联网公开数据整理：技能难度系数、预计学习时长、主流学习资源
  // =====================================================================
  var KNOWLEDGE_BASE = {
    'python': {
      difficulty: 0.8, hours: 120, level: 'easy',
      desc: '通用编程语言，AI/数据/后端首选入门语言',
      resources: [
        { name: 'Python 官方文档', type: '文档', url: 'https://docs.python.org/zh-cn/3/' },
        { name: '廖雪峰 Python 教程', type: '教程', url: 'https://www.liaoxuefeng.com/wiki/1016959663602400' },
        { name: 'Coursera - Python for Everybody', type: '课程', url: 'https://www.coursera.org/specializations/python' },
        { name: 'B站 - 黑马程序员Python', type: '视频', url: 'https://www.bilibili.com/' },
      ],
    },
    'java': {
      difficulty: 1.0, hours: 200, level: 'mid',
      desc: '企业级后端开发主流语言，生态成熟',
      resources: [
        { name: 'Oracle Java 官方教程', type: '文档', url: 'https://docs.oracle.com/javase/tutorial/' },
        { name: '菜鸟教程 Java', type: '教程', url: 'https://www.runoob.com/java/java-tutorial.html' },
        { name: '慕课网 - Java 工程师', type: '课程', url: 'https://www.imooc.com/' },
      ],
    },
    'javascript': {
      difficulty: 0.8, hours: 150, level: 'easy',
      desc: 'Web 前端核心语言，全栈开发必备',
      resources: [
        { name: 'MDN Web Docs', type: '文档', url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript' },
        { name: '现代 JavaScript 教程', type: '教程', url: 'https://zh.javascript.info/' },
        { name: 'Coursera - JavaScript Essentials', type: '课程', url: 'https://www.coursera.org/' },
      ],
    },
    'typescript': {
      difficulty: 0.9, hours: 80, level: 'easy',
      desc: 'JavaScript 超集，引入静态类型系统',
      resources: [
        { name: 'TypeScript 中文手册', type: '文档', url: 'https://www.typescriptlang.org/zh/docs/' },
        { name: '极客时间 - TypeScript 开发实战', type: '课程', url: 'https://time.geekbang.org/' },
      ],
    },
    'vue': {
      difficulty: 0.7, hours: 100, level: 'easy',
      desc: '渐进式前端框架，国内应用广泛',
      resources: [
        { name: 'Vue.js 官方文档', type: '文档', url: 'https://cn.vuejs.org/' },
        { name: 'B站 - 尚硅谷Vue3', type: '视频', url: 'https://www.bilibili.com/' },
      ],
    },
    'react': {
      difficulty: 0.9, hours: 120, level: 'mid',
      desc: '声明式 UI 库，前端主流技术栈',
      resources: [
        { name: 'React 官方文档', type: '文档', url: 'https://zh-hans.react.dev/' },
        { name: 'React 官方教程', type: '教程', url: 'https://zh-hans.react.dev/learn' },
      ],
    },
    'springboot': {
      difficulty: 0.9, hours: 150, level: 'mid',
      desc: 'Java 后端主流框架，简化企业应用开发',
      resources: [
        { name: 'Spring Boot 官方文档', type: '文档', url: 'https://spring.io/projects/spring-boot' },
        { name: 'Spring Boot 中文参考指南', type: '文档', url: 'https://www.docs4dev.com/docs/zh/spring-boot/2.7.x/reference/' },
      ],
    },
    'mysql': {
      difficulty: 0.7, hours: 100, level: 'easy',
      desc: '关系型数据库，后端开发必备',
      resources: [
        { name: 'MySQL 8.0 参考手册', type: '文档', url: 'https://dev.mysql.com/doc/refman/8.0/en/' },
        { name: '菜鸟教程 MySQL', type: '教程', url: 'https://www.runoob.com/mysql/mysql-tutorial.html' },
      ],
    },
    'redis': {
      difficulty: 0.8, hours: 80, level: 'easy',
      desc: '高性能内存数据库，缓存与消息队列',
      resources: [
        { name: 'Redis 官方文档', type: '文档', url: 'https://redis.io/docs/' },
        { name: 'Redis 设计与实现', type: '书籍', url: 'https://book.douban.com/subject/25900156/' },
      ],
    },
    'docker': {
      difficulty: 0.8, hours: 80, level: 'easy',
      desc: '容器化技术，DevOps 基础',
      resources: [
        { name: 'Docker 官方文档', type: '文档', url: 'https://docs.docker.com/' },
        { name: 'Docker — 从入门到实践', type: '教程', url: 'https://yeasy.gitbook.io/docker_practice/' },
      ],
    },
    'kubernetes': {
      difficulty: 1.3, hours: 200, level: 'hard',
      desc: '容器编排平台，云原生核心',
      resources: [
        { name: 'Kubernetes 官方文档', type: '文档', url: 'https://kubernetes.io/zh-cn/docs/home/' },
        { name: 'Kubernetes 权威指南', type: '书籍', url: 'https://book.douban.com/subject/35193534/' },
      ],
    },
    'linux': {
      difficulty: 0.9, hours: 120, level: 'mid',
      desc: '服务器操作系统，开发者必备',
      resources: [
        { name: 'Linux 教程 - 菜鸟教程', type: '教程', url: 'https://www.runoob.com/linux/linux-tutorial.html' },
        { name: '鸟哥的 Linux 私房菜', type: '书籍', url: 'https://linux.vbird.org/' },
      ],
    },
    '算法': {
      difficulty: 1.2, hours: 300, level: 'hard',
      desc: '数据结构与算法，面试与编程核心能力',
      resources: [
        { name: 'LeetCode 题库', type: '刷题', url: 'https://leetcode.cn/' },
        { name: '算法导论', type: '书籍', url: 'https://book.douban.com/subject/20432061/' },
        { name: 'B站 - 代码随想录', type: '视频', url: 'https://www.bilibili.com/' },
      ],
    },
    '机器学习': {
      difficulty: 1.4, hours: 350, level: 'hard',
      desc: 'AI 核心领域，需数学基础',
      resources: [
        { name: '吴恩达机器学习课程', type: '课程', url: 'https://www.coursera.org/learn/machine-learning' },
        { name: 'Scikit-learn 中文文档', type: '文档', url: 'https://scikit-learn.org.cn/' },
        { name: '统计学习方法（李航）', type: '书籍', url: 'https://book.douban.com/subject/33437381/' },
      ],
    },
    '深度学习': {
      difficulty: 1.5, hours: 400, level: 'hard',
      desc: '神经网络与深度学习，AI 进阶方向',
      resources: [
        { name: 'PyTorch 官方教程', type: '教程', url: 'https://pytorch.org/tutorials/' },
        { name: '动手学深度学习', type: '教程', url: 'https://zh.d2l.ai/' },
        { name: 'CS231n 计算机视觉', type: '课程', url: 'http://cs231n.stanford.edu/' },
      ],
    },
    'pytorch': {
      difficulty: 1.1, hours: 120, level: 'mid',
      desc: '主流深度学习框架',
      resources: [
        { name: 'PyTorch 官方文档', type: '文档', url: 'https://pytorch.org/docs/stable/index.html' },
        { name: 'PyTorch 中文手册', type: '教程', url: 'https://pytorch.apachecn.org/' },
      ],
    },
    'tensorflow': {
      difficulty: 1.1, hours: 120, level: 'mid',
      desc: 'Google 深度学习框架',
      resources: [
        { name: 'TensorFlow 官方教程', type: '教程', url: 'https://www.tensorflow.org/tutorials?hl=zh-cn' },
      ],
    },
    '大数据': {
      difficulty: 1.3, hours: 300, level: 'hard',
      desc: 'Hadoop/Spark/Flink 等分布式数据处理',
      resources: [
        { name: 'Spark 官方文档', type: '文档', url: 'https://spark.apache.org/docs/latest/' },
        { name: '慕课网 - 大数据工程师', type: '课程', url: 'https://www.imooc.com/' },
      ],
    },
    'go': {
      difficulty: 1.1, hours: 120, level: 'mid',
      desc: '云原生时代编程语言，高并发后端',
      resources: [
        { name: 'Go 语言圣经', type: '教程', url: 'https://gopl-zh.github.io/' },
        { name: 'Go 官方教程', type: '教程', url: 'https://go.dev/tour/welcome/1' },
      ],
    },
    'rust': {
      difficulty: 1.4, hours: 250, level: 'hard',
      desc: '系统级编程语言，内存安全',
      resources: [
        { name: 'Rust 程序设计语言', type: '教程', url: 'https://kaisery.github.io/trpl-zh-cn/' },
        { name: 'Rust 官方学习', type: '教程', url: 'https://www.rust-lang.org/zh-CN/learn' },
      ],
    },
    'c++': {
      difficulty: 1.3, hours: 250, level: 'hard',
      desc: '高性能系统/游戏开发语言',
      resources: [
        { name: 'C++ Primer', type: '书籍', url: 'https://book.douban.com/subject/25708312/' },
        { name: 'cppreference', type: '文档', url: 'https://zh.cppreference.com/' },
      ],
    },
    'git': {
      difficulty: 0.5, hours: 40, level: 'easy',
      desc: '版本控制工具，开发者必备',
      resources: [
        { name: 'Pro Git 中文版', type: '教程', url: 'https://git-scm.com/book/zh/v2' },
        { name: '菜鸟教程 Git', type: '教程', url: 'https://www.runoob.com/git/git-tutorial.html' },
      ],
    },
    'node': {
      difficulty: 0.8, hours: 100, level: 'easy',
      desc: 'JavaScript 服务端运行时',
      resources: [
        { name: 'Node.js 官方文档', type: '文档', url: 'https://nodejs.org/zh-cn/docs' },
        { name: 'Node.js 入门教程', type: '教程', url: 'https://www.nodeapp.cn/' },
      ],
    },
    'css': {
      difficulty: 0.6, hours: 80, level: 'easy',
      desc: '层叠样式表，前端页面美化',
      resources: [
        { name: 'MDN CSS 文档', type: '文档', url: 'https://developer.mozilla.org/zh-CN/docs/Web/CSS' },
        { name: 'CSS 权威指南', type: '书籍', url: 'https://book.douban.com/subject/30308377/' },
      ],
    },
    'html': {
      difficulty: 0.4, hours: 40, level: 'easy',
      desc: '超文本标记语言，Web 基础',
      resources: [
        { name: 'MDN HTML 文档', type: '文档', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML' },
      ],
    },
    'mongodb': {
      difficulty: 0.8, hours: 80, level: 'easy',
      desc: '文档型 NoSQL 数据库',
      resources: [
        { name: 'MongoDB 官方文档', type: '文档', url: 'https://www.mongodb.com/docs/' },
      ],
    },
    'nginx': {
      difficulty: 0.8, hours: 60, level: 'easy',
      desc: '高性能 Web 服务器与反向代理',
      resources: [
        { name: 'Nginx 官方文档', type: '文档', url: 'https://nginx.org/en/docs/' },
      ],
    },
  };

  var DEFAULT_DIFFICULTY = 1.0;
  var DEFAULT_HOURS = 150;
  var BASE_K = 0.15;

  // =====================================================================
  // DOM 工具
  // =====================================================================
  var skillRowsEl = document.getElementById('as-skill-rows');

  function getKB(name) {
    var key = (name || '').toLowerCase().trim();
    return KNOWLEDGE_BASE[key] || null;
  }

  function levelBadge(level) {
    if (level === 'easy') return { cls: 'badge-easy', text: '入门' };
    if (level === 'hard') return { cls: 'badge-hard', text: '进阶' };
    return { cls: 'badge-mid', text: '中等' };
  }

  // =====================================================================
  // 技能行管理
  // =====================================================================
  window.addSkillRow = function (name, current, target, rate) {
    var row = document.createElement('div');
    row.className = 'form-row';
    row.innerHTML =
      '<div class="col-name">' +
        '<input type="text" class="inp-name" placeholder="如 Python / 机器学习" value="' + (name || '') + '">' +
      '</div>' +
      '<div><input type="number" class="inp-current" min="0" max="100" value="' + (current != null ? current : 30) + '"> %</div>' +
      '<div><input type="number" class="inp-target" min="0" max="100" value="' + (target != null ? target : 90) + '"> %</div>' +
      '<div><input type="number" class="inp-rate" min="1" max="100" value="' + (rate != null ? rate : 60) + '"> %</div>' +
      '<div><button class="btn btn-danger" onclick="this.closest(\'.form-row\').remove()">删除</button></div>';
    skillRowsEl.appendChild(row);
  };

  window.loadDemoData = function () {
    clearAll();
    addSkillRow('Python', 75, 90, 70);
    addSkillRow('机器学习', 55, 85, 65);
    addSkillRow('算法', 30, 80, 60);
    addSkillRow('深度学习', 10, 75, 55);
    addSkillRow('MySQL', 60, 85, 65);
    addSkillRow('Linux', 50, 80, 60);
  };

  window.clearAll = function () {
    skillRowsEl.innerHTML = '';
    document.getElementById('as-results').style.display = 'none';
    document.getElementById('as-empty-hint').style.display = 'block';
  };

  function collectSkills() {
    var rows = skillRowsEl.querySelectorAll('.form-row');
    var skills = [];
    rows.forEach(function (r) {
      var name = r.querySelector('.inp-name').value.trim();
      if (!name) return;
      var cur = parseFloat(r.querySelector('.inp-current').value) / 100;
      var tgt = parseFloat(r.querySelector('.inp-target').value) / 100;
      var rate = parseFloat(r.querySelector('.inp-rate').value) / 100;
      if (isNaN(cur)) cur = 0.3;
      if (isNaN(tgt)) tgt = 0.9;
      if (isNaN(rate)) rate = 0.6;
      skills.push({ name: name, current: Math.min(1, Math.max(0, cur)), target: Math.min(1, Math.max(0.01, tgt)), rate: Math.min(1, Math.max(0.05, rate)) });
    });
    return skills;
  }

  // =====================================================================
  // 成长曲线计算（Nelson 指数学习曲线）
  // level(t) = target - (target - current) * exp(-k * t)
  // k = base_k * learning_rate / difficulty
  // =====================================================================
  function projectSkill(skill) {
    var kb = getKB(skill.name);
    var difficulty = kb ? kb.difficulty : DEFAULT_DIFFICULTY;
    var k = BASE_K * skill.rate / difficulty;
    var cur = skill.current;
    var tgt = skill.target;

    function levelAt(months) {
      if (cur >= tgt) return tgt;
      var v = tgt - (tgt - cur) * Math.exp(-k * months);
      return Math.min(tgt, Math.max(0, v));
    }

    var p3 = levelAt(3), p6 = levelAt(6), p12 = levelAt(12);

    // 达到 99% 目标的时间
    var monthsToTarget = null;
    if (cur < tgt && k > 0) {
      try {
        var ratio = (tgt * 0.01) / (tgt - cur);
        if (0 < ratio && ratio < 1) monthsToTarget = Math.round(-Math.log(ratio) / k * 10) / 10;
      } catch (e) {}
    }

    return {
      name: skill.name,
      current: cur, target: tgt,
      p3: p3, p6: p6, p12: p12,
      monthsToTarget: monthsToTarget,
      difficulty: difficulty,
      kb: kb,
    };
  }

  // =====================================================================
  // 优先级评分：缺口越大、难度越高，优先级越高
  // =====================================================================
  function priorityScore(p) {
    var gap = p.target - p.current;
    return gap * (0.5 + p.difficulty * 0.5);
  }

  function priorityLabel(score) {
    if (score >= 0.5) return { cls: 'dot-high', text: '高优先级' };
    if (score >= 0.25) return { cls: 'dot-mid', text: '中优先级' };
    return { cls: 'dot-low', text: '低优先级' };
  }

  // =====================================================================
  // 生成建议
  // =====================================================================
  window.generateSuggestions = function () {
    var skills = collectSkills();
    if (skills.length === 0) {
      alert('请至少添加一项技能');
      return;
    }

    var projections = skills.map(projectSkill);
    projections.sort(function (a, b) { return priorityScore(b) - priorityScore(a); });

    // 渲染结果区
    document.getElementById('as-empty-hint').style.display = 'none';
    document.getElementById('as-results').style.display = 'block';

    renderGrowthChart(projections);
    renderSummary(projections);
    renderSuggestions(projections);

    // 滚动到结果
    document.getElementById('as-results').scrollIntoView({ behavior: 'smooth' });
  };

  // =====================================================================
  // 成长曲线图表
  // =====================================================================
  var growthChart = null;
  function renderGrowthChart(projections) {
    var el = document.getElementById('as-chart-growth');
    if (growthChart) growthChart.dispose();
    growthChart = echarts.init(el, null, { renderer: 'svg' });

    var xAxis = ['当前', '3个月', '6个月', '12个月'];
    var palette = ['#6366f1', '#a855f7', '#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f87171', '#a78bfa', '#2dd4bf'];

    growthChart.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(10,14,26,0.92)', borderColor: 'rgba(255,255,255,0.08)', textStyle: { color: '#e8ecf4', fontSize: 12 }, valueFormatter: function (v) { return (v * 100).toFixed(0) + '%'; } },
      legend: { type: 'scroll', bottom: 0, textStyle: { color: '#8b95a7', fontSize: 11 }, itemWidth: 14, itemHeight: 8 },
      grid: { left: 50, right: 20, top: 20, bottom: 60 },
      xAxis: { type: 'category', data: xAxis, boundaryGap: false, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }, axisLabel: { color: '#8b95a7', fontSize: 11 } },
      yAxis: { type: 'value', min: 0, max: 1, axisLabel: { color: '#8b95a7', fontSize: 11, formatter: function (v) { return (v * 100).toFixed(0) + '%'; } }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
      series: projections.map(function (p, i) {
        return {
          name: p.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
          lineStyle: { width: 2 }, itemStyle: { color: palette[i % palette.length] },
          emphasis: { focus: 'series' },
          data: [p.current, p.p3, p.p6, p.p12],
        };
      }),
    });
  }
  window.addEventListener('resize', function () { if (growthChart) growthChart.resize(); });

  // =====================================================================
  // 概览统计
  // =====================================================================
  function renderSummary(projections) {
    var totalSkills = projections.length;
    var avgTarget = projections.reduce(function (s, p) { return s + p.target; }, 0) / totalSkills;
    var avgCurrent = projections.reduce(function (s, p) { return s + p.current; }, 0) / totalSkills;
    var totalGap = avgTarget - avgCurrent;

    document.getElementById('as-summary-stats').innerHTML =
      '<div class="stat"><div class="v">' + totalSkills + '</div><div class="l">技能总数</div></div>' +
      '<div class="stat"><div class="v">' + (avgCurrent * 100).toFixed(0) + '%</div><div class="l">平均当前水平</div></div>' +
      '<div class="stat"><div class="v">' + (totalGap * 100).toFixed(0) + '%</div><div class="l">平均缺口</div></div>';

    // 优先级列表
    var top3 = projections.slice(0, 3);
    var html = '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">建议优先攻克：</div>';
    top3.forEach(function (p) {
      var pl = priorityLabel(priorityScore(p));
      html += '<div class="priority-bar"><span class="dot ' + pl.cls + '"></span>' +
        '<span>' + p.name + '</span>' +
        '<span style="margin-left:auto;color:var(--muted);">缺口 ' + ((p.target - p.current) * 100).toFixed(0) + '%</span></div>';
    });
    document.getElementById('as-priority-list').innerHTML = html;
  }

  // =====================================================================
  // 建议详情
  // =====================================================================
  function renderSuggestions(projections) {
    var list = document.getElementById('as-suggestion-list');
    list.innerHTML = projections.map(function (p) {
      var kb = p.kb;
      var badge = levelBadge(kb ? kb.level : 'mid');
      var hours = kb ? kb.hours : DEFAULT_HOURS;
      var desc = kb ? kb.desc : '通用技能';
      var gap = (p.target - p.current) * 100;

      // 预计学习小时数 = 缺口比例 * 总学时
      var estHours = Math.round(gap / 100 * hours);

      var resourcesHtml = '';
      if (kb && kb.resources.length) {
        resourcesHtml = '<div class="sc-resources">' +
          kb.resources.map(function (r) {
            return '<a class="resource-chip" href="' + r.url + '" target="_blank" rel="noopener">' +
              '<span>' + r.name + '</span><span class="type">· ' + r.type + '</span></a>';
          }).join('') + '</div>';
      } else {
        resourcesHtml = '<div style="font-size:12px;color:var(--muted);">暂无公开资源推荐，可在 B站 / Coursera / 慕课网 搜索 "' + p.name + '"</div>';
      }

      // 学习建议文案（数据驱动）
      var hint = '';
      if (p.monthsToTarget && p.monthsToTarget <= 6) {
        hint = '短期内可达标，保持当前学习节奏即可。';
      } else if (p.monthsToTarget && p.monthsToTarget <= 18) {
        hint = '预计需 ' + p.monthsToTarget + ' 个月达标，建议制定周计划并持续投入。';
      } else if (p.monthsToTarget) {
        hint = '难度较高且缺口大，建议先打基础，再通过项目实战加速。';
      } else {
        hint = '已达标，可向更深层次或相关技能拓展。';
      }

      var pl = priorityLabel(priorityScore(p));

      return '<div class="suggestion-card">' +
        '<div class="sc-head">' +
          '<span class="sc-name">' + p.name + '</span>' +
          '<span class="sc-badge ' + badge.cls + '">' + badge.text + ' · 难度 ' + p.difficulty.toFixed(1) + '</span>' +
        '</div>' +
        '<div class="sc-meta">' +
          '<span>当前 <strong>' + (p.current * 100).toFixed(0) + '%</strong></span>' +
          '<span>目标 <strong>' + (p.target * 100).toFixed(0) + '%</strong></span>' +
          '<span>预计学时 <strong>' + estHours + 'h</strong></span>' +
          '<span>达标用时 <strong>' + (p.monthsToTarget ? p.monthsToTarget + ' 月' : '已达标') + '</strong></span>' +
        '</div>' +
        '<div class="sc-track"><div class="sc-fill" style="width:' + (p.p12 * 100) + '%;"></div></div>' +
        '<div style="font-size:12px;margin-bottom:12px;">' +
          '<span style="color:var(--muted);">12 个月后预计：</span>' +
          '<strong style="color:var(--ink);">' + (p.p12 * 100).toFixed(0) + '%</strong>' +
          '<span style="margin-left:16px;">' + desc + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--accent3);margin-bottom:12px;">💡 ' + hint + '</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">📚 公开学习资源：</div>' +
        resourcesHtml +
        '<div class="priority-bar" style="margin-top:12px;"><span class="dot ' + pl.cls + '"></span>' + pl.text + '</div>' +
      '</div>';
    }).join('');
  }

  // =====================================================================
  // 初始化：默认添加 3 行空输入
  // =====================================================================
  addSkillRow();
  addSkillRow();
  addSkillRow();

})();
