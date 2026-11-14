// 学习计划 · 行动看板：把缺口技能变成可执行清单（localStorage 持久化）
(function () {
  'use strict';

  var KEY = 'ta_learning_plan_v1';
  var STATUS = [
    { v: 'todo', label: '未开始' },
    { v: 'doing', label: '进行中' },
    { v: 'done', label: '已完成' }
  ];

  var RESOURCE_RULES = [
    [/python/i, 'Python 官方文档 + 廖雪峰教程'],
    [/java\b(?!script)/i, 'Java 官方文档 + 黑马程序员实战'],
    [/javascript|typescript|react|vue|node/i, 'MDN + 官方文档 + B站实战课程'],
    [/kubernetes|k8s|云原生/i, 'K8s 官方文档 + 极客时间专栏'],
    [/docker/i, 'Docker 官方文档 + 实战练习'],
    [/linux|运维|shell/i, '鸟哥的 Linux 私房菜 + 官方文档'],
    [/sql|数据库|mysql|redis/i, 'SQL 必知必会 + LeetCode 数据库题库'],
    [/机器学习|深度学习|pytorch|tensorflow/i, '吴恩达课程 +《动手学深度学习》'],
    [/自然语言|nlp|大模型|agent|rag/i, 'HuggingFace 课程 + 大模型实战项目'],
    [/算法|数据结构/i, '《剑指 Offer》+ LeetCode 热题 100'],
    [/测试|自动化/i, '测试开发实战 + 官方文档'],
    [/设计|figma|交互/i, 'Figma 官方教程 + 设计规范'],
    [/数据可视化|echarts|bi/i, 'ECharts 官方示例 + 数据可视化实战']
  ];

  var PREREQ_RULES = [
    [/深度学习/i, '机器学习'],
    [/机器学习/i, 'Python + 线性代数'],
    [/自然语言|nlp/i, 'Python + 机器学习'],
    [/大模型|agent|rag/i, 'Python + 大模型基础'],
    [/kubernetes|k8s|云原生/i, 'Docker'],
    [/docker/i, 'Linux'],
    [/react|vue/i, 'JavaScript'],
    [/typescript/i, 'JavaScript'],
    [/spring|微服务/i, 'Java'],
    [/算法|数据结构/i, '编程语言基础'],
    [/数据可视化|echarts|bi/i, 'JavaScript + SQL'],
    [/测试|自动化/i, '编程语言基础']
  ];

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || '{}');
      return d && typeof d === 'object' ? d : {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 忽略存储失败 */ }
  }

  function keyOf(name) { return String(name || '').trim().toLowerCase(); }

  function matchRule(rules, name, fallback) {
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][0].test(name)) return rules[i][1];
    }
    return fallback;
  }

  function toast(msg) {
    var el = document.querySelector('.plan-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'plan-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function addSkills(items) {
    var data = load();
    var added = 0;
    (items || []).forEach(function (it) {
      var k = keyOf(it.name);
      if (!k) return;
      if (!data[k]) {
        data[k] = { name: String(it.name).trim(), months: it.months != null ? it.months : null, status: 'todo', added: Date.now() };
        added += 1;
      } else if (it.months != null) {
        data[k].months = it.months;
      }
    });
    save(data);
    render();
    return added;
  }

  function addFromProfile() {
    var rows = window.getMySkillProfile ? window.getMySkillProfile() : [];
    if (!rows.length) {
      toast('请先在「数据总览」选择目标岗位');
      return 0;
    }
    var gaps = rows.filter(function (r) { return r.target - r.current >= 0.15; });
    if (!gaps.length) {
      gaps = rows.slice().sort(function (a, b) { return (b.target - b.current) - (a.target - a.current); }).slice(0, 3);
    }
    var added = addSkills(gaps.map(function (r) { return { name: r.name, months: r.months }; }));
    toast(added > 0 ? '已加入 ' + added + ' 项到学习计划，可在「能力评估」查看' : '这些技能已在学习计划中');
    return added;
  }

  function setStatus(k, status) {
    var data = load();
    if (data[k]) {
      data[k].status = status;
      save(data);
      render();
    }
  }

  function remove(k) {
    var data = load();
    delete data[k];
    save(data);
    render();
  }

  function render() {
    var tbody = document.getElementById('plan-body');
    var summary = document.getElementById('plan-summary');
    if (!tbody) return;

    var data = load();
    var items = Object.keys(data).map(function (k) { return data[k]; });
    var order = { doing: 0, todo: 1, done: 2 };
    items.sort(function (a, b) {
      var d = (order[a.status] || 1) - (order[b.status] || 1);
      if (d !== 0) return d;
      return (b.months || 0) - (a.months || 0);
    });

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:26px 0;">'
        + '暂无学习计划。点击右上角「加入当前缺口技能」，或到「数据总览 → 重点技能」点击「加入学习计划」。</td></tr>';
      if (summary) summary.textContent = '共 0 项 · 已完成 0 项';
      return;
    }

    var done = items.filter(function (x) { return x.status === 'done'; }).length;
    var maxMonths = items.reduce(function (m, x) { return Math.max(m, x.months || 0); }, 0);
    if (summary) {
      summary.textContent = '共 ' + items.length + ' 项 · 已完成 ' + done + ' 项 · 单项最长 ' + maxMonths + ' 个月（各项可并行推进）';
    }

    tbody.innerHTML = items.map(function (x) {
      var k = keyOf(x.name);
      var status = x.status || 'todo';
      var opts = STATUS.map(function (s) {
        return '<option value="' + s.v + '"' + (s.v === status ? ' selected' : '') + '>' + s.label + '</option>';
      }).join('');
      var months = x.months != null ? x.months + ' 个月' : '—';
      return '<tr>'
        + '<td style="font-family:InstrumentSans;font-weight:600;">' + x.name + '</td>'
        + '<td>' + months + '</td>'
        + '<td style="color:var(--muted);">' + matchRule(PREREQ_RULES, x.name, '无') + '</td>'
        + '<td style="font-size:12px;color:var(--muted);">' + matchRule(RESOURCE_RULES, x.name, '官方文档 + B站/慕课网实战课程') + '</td>'
        + '<td><select class="plan-status" data-key="' + k + '">' + opts + '</select></td>'
        + '<td><button class="plan-del" data-del="' + k + '" title="移除">×</button></td>'
        + '</tr>';
    }).join('');
  }

  function bind() {
    var tbody = document.getElementById('plan-body');
    if (tbody) {
      tbody.addEventListener('change', function (e) {
        var sel = e.target;
        if (sel && sel.classList.contains('plan-status')) {
          setStatus(sel.getAttribute('data-key'), sel.value);
        }
      });
      tbody.addEventListener('click', function (e) {
        var btn = e.target;
        if (btn && btn.getAttribute && btn.getAttribute('data-del')) {
          remove(btn.getAttribute('data-del'));
        }
      });
    }

    var addBtn = document.getElementById('plan-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var n = addFromProfile();
        addBtn.textContent = n > 0 ? '已加入 ✓' : '已在计划中';
        setTimeout(function () { addBtn.textContent = '加入当前缺口技能'; }, 1800);
      });
    }

    var ovBtn = document.getElementById('ov-plan-add');
    if (ovBtn) {
      ovBtn.addEventListener('click', function () {
        var n = addFromProfile();
        ovBtn.textContent = n > 0 ? '已加入 ✓' : '已在计划中';
        setTimeout(function () { ovBtn.textContent = '加入学习计划'; }, 1800);
      });
    }
  }

  window.LearningPlan = {
    addSkills: addSkills,
    addFromProfile: addFromProfile,
    render: render,
    load: load
  };

  bind();
  render();
})();
