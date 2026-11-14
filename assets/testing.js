// 能力测评：按目标岗位抽取核心技能，通过知识题 + 自评题评估当前掌握度
(function () {
  'use strict';

  var D = window.MARKET_DATA || {};
  var SELF_LABELS = ['完全不了解', '了解概念，未实操', '能独立完成项目', '能设计优化并指导他人'];
  var SELF_SCORES = [15, 40, 72, 92];
  var MAX_SKILLS = 6;

  // 技能题库：每个分类 2 道知识题，正确答案固定放在第 1 位，渲染时打乱
  var BANK = [
    { re: /python/i, qs: [
      { q: 'Python 中定义函数使用哪个关键字？', opts: ['def', 'func', 'function', 'lambda'] },
      { q: '下列哪个表达式会创建一个列表？', opts: ['[x for x in range(3)]', '(x for x in range(3))', '{x for x in range(3)}', 'range(3)'] }
    ] },
    { re: /java\b(?!script)/i, qs: [
      { q: 'Java 源代码编译后的字节码由什么执行？', opts: ['JVM', '浏览器', '操作系统内核', '数据库'] },
      { q: 'Java 中 String 对象具有什么特性？', opts: ['不可变', '只能存数字', '自动转小写', '必须用 new 创建'] }
    ] },
    { re: /javascript|typescript|node|前端|web/i, qs: [
      { q: 'JavaScript 中 === 与 == 的主要区别是？', opts: ['=== 同时比较类型和值', '=== 只比较值', '== 会转换类型且更严格', '两者完全相同'] },
      { q: 'TypeScript 相比 JavaScript 的核心增强是？', opts: ['静态类型检查', '自带数据库', '可以替代 HTML', '只能在服务端运行'] }
    ] },
    { re: /vue/i, qs: [
      { q: 'Vue 3 组合式 API 中 ref 定义的响应式数据通过什么访问？', opts: ['.value', '.data', '.state', '直接使用变量名'] },
      { q: 'v-model 指令实现的是？', opts: ['双向数据绑定', '条件渲染', '列表循环', '事件阻止'] }
    ] },
    { re: /react/i, qs: [
      { q: 'React 中用于管理函数组件状态的 Hook 是？', opts: ['useState', 'useFetch', 'useRoute', 'useStyle'] },
      { q: 'React 列表渲染时 key 的主要作用是？', opts: ['帮助 diff 识别节点', '设置样式', '绑定事件', '声明类型'] }
    ] },
    { re: /golang|go\b/i, qs: [
      { q: 'Go 中启动一个协程使用哪个关键字？', opts: ['go', 'async', 'thread', 'spawn'] },
      { q: 'Go 中错误处理的常见约定是？', opts: ['函数返回 error 作为最后一个值', '统一抛异常', '使用全局错误码', '只打印日志'] }
    ] },
    { re: /sql|mysql|redis|数据库/i, qs: [
      { q: 'SQL 中对分组结果进行过滤应使用？', opts: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'] },
      { q: '数据库索引最主要的作用是？', opts: ['加速查询', '压缩数据', '加密存储', '自动备份'] }
    ] },
    { re: /docker/i, qs: [
      { q: 'Dockerfile 中指定基础镜像的指令是？', opts: ['FROM', 'BASE', 'IMAGE', 'RUN'] },
      { q: 'Docker 镜像分层的主要好处是？', opts: ['复用层、减少存储与分发体积', '提高 CPU 主频', '自动扩缩容', '自动加密镜像'] }
    ] },
    { re: /kubernetes|k8s|云原生/i, qs: [
      { q: 'Kubernetes 中最小的可调度单元是？', opts: ['Pod', 'Node', 'Service', 'Namespace'] },
      { q: 'Kubernetes 中为一组 Pod 提供稳定访问入口的对象是？', opts: ['Service', 'ConfigMap', 'Secret', 'Job'] }
    ] },
    { re: /机器学习|深度学习|pytorch|tensorflow|模型/i, qs: [
      { q: '模型在训练集表现好、测试集明显变差，通常称为？', opts: ['过拟合', '欠拟合', '梯度消失', '数据泄漏'] },
      { q: '深度学习中反向传播主要用于？', opts: ['计算梯度并更新参数', '加载数据集', '保存模型', '可视化网络'] }
    ] },
    { re: /nlp|大模型|agent|rag|自然语言/i, qs: [
      { q: 'Transformer 中建模序列依赖的核心机制是？', opts: ['自注意力机制', '卷积池化', '循环门控', '哈希索引'] },
      { q: 'RAG 的核心思路是？', opts: ['检索外部知识增强生成', '只依赖模型记忆', '压缩模型体积', '替换分词器'] }
    ] },
    { re: /算法|数据结构/i, qs: [
      { q: '有序数组上二分查找的时间复杂度是？', opts: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'] },
      { q: '哈希表平均情况下的查找复杂度是？', opts: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'] }
    ] },
    { re: /测试|自动化|qa/i, qs: [
      { q: '单元测试主要验证什么？', opts: ['最小可测试单元的行为', '整体部署流程', '网络带宽', '数据库容量'] },
      { q: '边界值分析主要用于发现哪类缺陷？', opts: ['边界条件处理错误', '界面配色问题', '文档缺失', '沟通问题'] }
    ] },
    { re: /linux|运维|shell/i, qs: [
      { q: 'Linux 中查看当前目录文件列表的命令是？', opts: ['ls', 'cd', 'cp', 'mv'] },
      { q: 'chmod 755 中的 7 表示什么权限组合？', opts: ['读 + 写 + 执行', '只读', '只写', '只执行'] }
    ] },
    { re: /数据可视化|echarts|bi|图表/i, qs: [
      { q: 'ECharts 中更新图表配置使用的方法是？', opts: ['setOption', 'render', 'update', 'draw'] },
      { q: '可视化中表达数值大小最常用的映射通道是？', opts: ['位置与长度', '字体名称', '文件格式', '代码注释'] }
    ] },
    { re: /产品|运营/i, qs: [
      { q: 'MVP 的核心含义是？', opts: ['最小可行产品', '最大价值产品', '多版本计划', '市场验证报告'] },
      { q: '需求优先级排序通常围绕哪两个维度？', opts: ['价值与成本', '颜色与字体', '服务器型号', '代码行数'] }
    ] },
    { re: /设计|figma|交互|ui|ux/i, qs: [
      { q: '平面设计四大原则不包括？', opts: ['随机性', '对比', '对齐', '亲密性'] },
      { q: 'Figma 中复用同一套界面元素应使用？', opts: ['Component 组件', '图层锁定', '画板导出', '原型连线'] }
    ] },
    { re: /大数据|hadoop|spark|hive/i, qs: [
      { q: 'Spark 相比 MapReduce 的核心优势之一是？', opts: ['内存计算', '只能处理小数据', '不支持分布式', '无需集群'] },
      { q: 'HDFS 默认多副本策略主要为了？', opts: ['容错与高可用', '提升显卡性能', '自动加密', '压缩日志'] }
    ] },
    { re: /安全|渗透|等保/i, qs: [
      { q: '防止 SQL 注入最有效的做法是？', opts: ['使用参数化查询', '前端隐藏输入框', '关闭数据库', '增加验证码'] },
      { q: 'XSS 攻击的核心是利用？', opts: ['页面注入恶意脚本', '物理入侵机房', '暴力破解密码', 'DDoS 流量'] }
    ] },
    { re: /网络|tcp|http|通信/i, qs: [
      { q: 'HTTP 状态码 404 表示？', opts: ['资源未找到', '服务器内部错误', '请求成功', '永久重定向'] },
      { q: 'TCP 建立连接需要几次握手？', opts: ['3 次', '1 次', '2 次', '4 次'] }
    ] }
  ];

  var currentJob = '';
  var currentGroups = [];
  var lastLevels = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function bankFor(skill) {
    for (var i = 0; i < BANK.length; i++) {
      if (BANK[i].re.test(skill)) return BANK[i].qs;
    }
    return [];
  }

  function collectJobs() {
    var groups = [];
    var jobs = (D.jobs || []).filter(function (j) { return j.name && j.required_skills && j.required_skills.length; });
    if (jobs.length) groups.push({ label: '在招岗位', items: jobs });
    var newJobs = (D.new_jobs || []).filter(function (j) { return j.name && j.required_skills && j.required_skills.length; });
    if (newJobs.length) groups.push({ label: '新兴岗位', items: newJobs });
    var preJobs = (D.pre_jobs || []).filter(function (p) { return p.pre_job && p.new_skills && p.new_skills.length; })
      .map(function (p) { return { name: p.pre_job, required_skills: p.new_skills }; });
    if (preJobs.length) groups.push({ label: '前瞻岗位', items: preJobs });
    return groups;
  }

  function jobByName(name) {
    var all = [];
    collectJobs().forEach(function (g) { all = all.concat(g.items); });
    return all.filter(function (j) { return j.name === name; })[0];
  }

  function skillsOf(job) {
    var seen = {};
    var list = [];
    (job.required_skills || []).forEach(function (s) {
      var k = String(s).trim();
      if (!k || seen[k]) return;
      seen[k] = 1;
      list.push(k);
    });
    return list.slice(0, MAX_SKILLS);
  }

  function buildGroups(job) {
    return skillsOf(job).map(function (skill) {
      var qs = bankFor(skill).slice(0, 2).map(function (item) {
        var opts = shuffle(item.opts);
        return { type: 'k', q: item.q, opts: opts, correct: item.opts[0] };
      });
      qs.push({ type: 's', q: '你目前对「' + skill + '」的掌握程度更接近？', opts: SELF_LABELS.slice() });
      return { skill: skill, qs: qs };
    });
  }

  function totalQuestions(groups) {
    return groups.reduce(function (s, g) { return s + g.qs.length; }, 0);
  }

  function renderQuiz(groups) {
    return groups.map(function (g, gi) {
      var qHtml = g.qs.map(function (q, qi) {
        var name = 'tq_' + gi + '_' + qi;
        var opts = q.opts.map(function (o, oi) {
          return '<label class="test-opt"><input type="radio" name="' + name + '" value="' + oi + '"><span>' + esc(o) + '</span></label>';
        }).join('');
        return '<div class="test-q"><h4>' + esc(q.q) + '</h4>' + opts + '</div>';
      }).join('');
      return '<div class="test-group-title"><b>' + esc(g.skill) + '</b><span>' + g.qs.length + ' 题</span></div>' + qHtml;
    }).join('');
  }

  function updateProgress() {
    var quiz = document.getElementById('test-quiz');
    if (!quiz) return;
    var total = totalQuestions(currentGroups);
    var answered = 0;
    currentGroups.forEach(function (g, gi) {
      g.qs.forEach(function (q, qi) {
        if (quiz.querySelector('input[name="tq_' + gi + '_' + qi + '"]:checked')) answered += 1;
      });
    });
    var p = document.getElementById('test-progress');
    if (p) p.textContent = '已作答 ' + answered + ' / ' + total;
  }

  function updateHint() {
    var sel = document.getElementById('test-job-select');
    var hint = document.getElementById('test-hint');
    if (!sel || !hint) return;
    var job = jobByName(sel.value);
    if (!job) { hint.textContent = '该岗位暂无技能明细，请选择其他岗位'; return; }
    var groups = buildGroups(job);
    hint.textContent = '共 ' + groups.length + ' 项核心技能 · ' + totalQuestions(groups) + ' 道题（约 3 分钟完成）';
  }

  function levelOf(v) {
    if (v >= 85) return ['精通', '#34d399'];
    if (v >= 65) return ['熟练', '#22d3ee'];
    if (v >= 45) return ['基础', '#fbbf24'];
    return ['待提升', '#f87171'];
  }

  function gradeText(v) {
    if (v >= 85) return '可独立承担该技能的高难度任务，并指导他人';
    if (v >= 65) return '能独立完成常规项目任务，建议继续积累复杂场景经验';
    if (v >= 45) return '具备基础认知，需要在真实项目中加强练习';
    return '基础薄弱，建议优先加入学习计划系统补齐';
  }

  function renderResult(job, results) {
    var overall = Math.round(results.reduce(function (s, r) { return s + r.mastery; }, 0) / results.length);
    var lv = levelOf(overall);
    var levels = {};
    results.forEach(function (r) { levels[r.skill] = r.mastery; });

    var rows = results.map(function (r) {
      var l = levelOf(r.mastery);
      return '<tr>'
        + '<td style="font-weight:600;font-family:InstrumentSans;">' + esc(r.skill) + '</td>'
        + '<td><div style="display:flex;align-items:center;gap:10px;">'
        + '<div class="jd-bar" style="min-width:120px;"><span style="width:' + r.mastery + '%;background:' + l[1] + ';"></span></div>'
        + '<b style="font-family:JetBrainsMono;font-size:13px;">' + r.mastery + '%</b></div></td>'
        + '<td><span style="color:' + l[1] + ';">' + l[0] + '</span></td>'
        + '<td style="font-size:12px;color:var(--muted);">' + gradeText(r.mastery) + '</td>'
        + '</tr>';
    }).join('');

    return '<div class="metrics" style="margin:0 0 18px;grid-template-columns:repeat(3,1fr);">'
      + '<div class="metric"><div class="label">综合掌握度</div><div class="value" style="color:' + lv[1] + ';">' + overall + '<span style="font-size:16px;color:var(--muted);"> / 100</span></div><div class="sub">' + lv[0] + '</div></div>'
      + '<div class="metric"><div class="label">已测技能</div><div class="value">' + results.length + '</div><div class="sub">' + esc(job) + '</div></div>'
      + '<div class="metric"><div class="label">达标技能</div><div class="value">' + results.filter(function (r) { return r.mastery >= 65; }).length + '</div><div class="sub">掌握度 ≥ 65%</div></div>'
      + '</div>'
      + '<div class="table-wrap"><table><thead><tr><th>技能</th><th>当前掌握度</th><th>等级</th><th>评估结论</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;align-items:center;">'
      + '<button class="btn btn-primary" id="test-apply">应用为我的当前掌握度</button>'
      + '<span id="test-apply-note" style="font-size:12px;color:var(--muted);"></span>'
      + '</div>';
  }

  function submit() {
    var quiz = document.getElementById('test-quiz');
    if (!quiz) return;

    var missing = 0;
    var results = [];
    currentGroups.forEach(function (g, gi) {
      var kTotal = 0;
      var kCorrect = 0;
      var selfScore = 50;
      g.qs.forEach(function (q, qi) {
        var checked = quiz.querySelector('input[name="tq_' + gi + '_' + qi + '"]:checked');
        if (!checked) { missing += 1; return; }
        var idx = parseInt(checked.value, 10);
        var picked = q.opts[idx];
        if (q.type === 'k') {
          kTotal += 1;
          if (picked === q.correct) kCorrect += 1;
        } else {
          selfScore = SELF_SCORES[idx] != null ? SELF_SCORES[idx] : 50;
        }
      });
      if (missing) return;
      var mastery = kTotal ? Math.round((kCorrect / kTotal) * 100 * 0.6 + selfScore * 0.4) : selfScore;
      results.push({ skill: g.skill, mastery: mastery });
    });

    if (missing) {
      alert('还有 ' + missing + ' 道题未作答，请完成后再提交');
      return;
    }

    results.sort(function (a, b) { return b.mastery - a.mastery; });
    lastLevels = {};
    results.forEach(function (r) { lastLevels[r.skill] = r.mastery; });

    var card = document.getElementById('test-result-card');
    var box = document.getElementById('test-result');
    box.innerHTML = renderResult(currentJob, results);
    card.style.display = '';
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      localStorage.setItem('ta_skill_test_v1', JSON.stringify({ job: currentJob, at: Date.now(), levels: lastLevels }));
    } catch (e) { /* 忽略存储异常 */ }

    var applyBtn = document.getElementById('test-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        if (!window.applyTestedLevels) return;
        var res = window.applyTestedLevels(currentJob, lastLevels);
        var note = document.getElementById('test-apply-note');
        if (res.applied > 0) {
          if (note) note.textContent = '已写入 ' + res.applied + ' 项技能的当前掌握度，正在跳转数据总览…';
          var navBtn = document.querySelector('.tab-btn[data-view="overview"]');
          if (navBtn) setTimeout(function () { navBtn.click(); }, 700);
        } else if (note) {
          note.textContent = '该岗位与当前目标岗位不一致，请先在数据总览选择相同岗位';
        }
      });
    }
  }

  function start() {
    var sel = document.getElementById('test-job-select');
    if (!sel) return;
    var job = jobByName(sel.value);
    if (!job) return;
    currentJob = job.name;
    currentGroups = buildGroups(job);

    var card = document.getElementById('test-quiz-card');
    var quiz = document.getElementById('test-quiz');
    var resultCard = document.getElementById('test-result-card');
    quiz.innerHTML = renderQuiz(currentGroups);
    card.style.display = '';
    resultCard.style.display = 'none';
    updateProgress();
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function init() {
    var sel = document.getElementById('test-job-select');
    if (!sel) return;

    var groups = collectJobs();
    sel.innerHTML = groups.map(function (g) {
      return '<optgroup label="' + g.label + '">' + g.items.map(function (j) {
        return '<option value="' + esc(j.name) + '">' + esc(j.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');

    var prefer = '算法工程师';
    if (groups.some(function (g) { return g.items.some(function (j) { return j.name === prefer; }); })) {
      sel.value = prefer;
    }
    updateHint();

    sel.addEventListener('change', function () {
      updateHint();
      var qc = document.getElementById('test-quiz-card');
      if (qc) qc.style.display = 'none';
    });

    var startBtn = document.getElementById('test-start');
    if (startBtn) startBtn.addEventListener('click', start);
    var againBtn = document.getElementById('test-again');
    if (againBtn) againBtn.addEventListener('click', start);

    var submitBtn = document.getElementById('test-submit');
    if (submitBtn) submitBtn.addEventListener('click', submit);
    var cancelBtn = document.getElementById('test-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        document.getElementById('test-quiz-card').style.display = 'none';
      });
    }

    var quiz = document.getElementById('test-quiz');
    if (quiz) quiz.addEventListener('change', updateProgress);
  }

  init();
})();
