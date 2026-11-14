// 能力测评：按岗位技能抽题测评，含题库管理（自定义题目保存在本地）
(function () {
  'use strict';

  var D = window.MARKET_DATA || {};
  var SELF_LABELS = ['完全不了解', '了解概念，未实操', '能独立完成项目', '能设计优化并指导他人'];
  var SELF_SCORES = [15, 40, 72, 92];
  var MAX_SKILLS = 6;
  var KNOWLEDGE_PER_SKILL = 5;
  var CUSTOM_KEY = 'ta_question_bank_v1';

  // 内置题库：正确答案统一放在第 1 位，抽题时打乱
  var BANK = [
    { id: 'python', label: 'Python', re: /python/i, qs: [
      { q: 'Python 中定义函数使用哪个关键字？', opts: ['def', 'func', 'function', 'lambda'] },
      { q: '下列哪个表达式会创建一个列表？', opts: ['[x for x in range(3)]', '(x for x in range(3))', '{x for x in range(3)}', 'range(3)'] },
      { q: '字典取值时key不存在、希望返回默认值，应使用？', opts: ['d.get(key, default)', 'd[key]', 'd.pop(key)', 'd.items(key)'] },
      { q: 'with 语句的主要作用是？', opts: ['自动管理资源释放', '提升运行速度', '实现多线程', '定义类'] },
      { q: '下列哪种方式可以安装 Python 第三方包？', opts: ['pip install 包名', 'npm install 包名', 'apt add 包名', 'go get 包名'] },
      { q: 'Python 中用于异常处理的关键字组合是？', opts: ['try / except', 'if / else', 'for / in', 'with / as'] },
      { q: '列表推导式 [x*2 for x in range(3)] 的结果是？', opts: ['[0, 2, 4]', '[0, 1, 2]', '[2, 4, 6]', '[1, 2, 3]'] },
      { q: 'Python 中关于可变类型的正确说法是？', opts: ['list 可变、tuple 不可变', 'list 不可变、tuple 可变', '两者都不可变', '两者都可变'] },
      { q: 'Python 中 len([1,2,3]) 的返回值是？', opts: ['3', '2', '[1,2,3]', '报错'] },
      { q: 'Python 中用于生成随机数的标准库是？', opts: ['random', 'math', 'os', 'sys'] },
    ] },
    { id: 'java', label: 'Java', re: /java\b(?!script)/i, qs: [
      { q: 'Java 源代码编译后的字节码由什么执行？', opts: ['JVM', '浏览器', '操作系统内核', '数据库'] },
      { q: 'Java 中 String 对象具有什么特性？', opts: ['不可变', '只能存数字', '自动转小写', '必须用 new 创建'] },
      { q: 'Java 中实现接口使用的关键字是？', opts: ['implements', 'extends', 'interface', 'abstract'] },
      { q: 'HashMap 在 JDK8 中的底层结构是？', opts: ['数组 + 链表/红黑树', '纯链表', 'B+ 树', '跳表'] },
      { q: 'Java 中用于继承类的关键字是？', opts: ['extends', 'implements', 'inherits', 'super'] },
      { q: 'Java 集合中保证元素唯一的是？', opts: ['Set', 'List', 'Map', 'Queue'] },
      { q: 'Java 中基本类型 int 的默认值是？', opts: ['0', 'null', '1', '-1'] },
      { q: 'Java 中用于捕获异常的关键字是？', opts: ['catch', 'except', 'rescue', 'handle'] },
      { q: 'Java 中 List 与 Set 的主要区别是？', opts: ['List 有序可重复、Set 不重复', 'List 不可重复', 'Set 有序可重复', '两者完全相同'] },
      { q: 'Java 中 static 成员属于？', opts: ['类本身而非实例', '每个实例', '局部变量', '接口'] },
    ] },
    { id: 'web', label: '前端 / JavaScript / TypeScript', re: /javascript|typescript|node|前端|web/i, qs: [
      { q: 'JavaScript 中 === 与 == 的主要区别是？', opts: ['=== 同时比较类型和值', '=== 只比较值', '== 更严格', '两者完全相同'] },
      { q: 'TypeScript 相比 JavaScript 的核心增强是？', opts: ['静态类型检查', '自带数据库', '替代 HTML', '只能服务端运行'] },
      { q: 'Promise 的状态一旦从 pending 变为 fulfilled 后？', opts: ['不可再改变', '可以回到 pending', '可以变为 rejected', '自动重置'] },
      { q: '浏览器事件循环中，微任务与宏任务的执行顺序是？', opts: ['微任务先于宏任务', '宏任务先于微任务', '随机执行', '同时执行'] },
      { q: 'CSS 中让宽度包含 padding 与 border 的属性是？', opts: ['box-sizing: border-box', 'display: flex', 'position: absolute', 'overflow: hidden'] },
      { q: '浏览器本地持久化存储应使用？', opts: ['localStorage', 'sessionStorage', 'URL 参数', '内存变量'] },
      { q: 'JavaScript 中数组去重最简洁的现代写法是？', opts: ['[...new Set(arr)]', 'arr.unique()', 'Set(arr)', 'arr.distinct()'] },
      { q: 'CSS Flex 布局中主轴对齐使用？', opts: ['justify-content', 'align-items', 'flex-wrap', 'order'] },
      { q: 'JavaScript 中 typeof null 的结果是？', opts: ['object', 'null', 'undefined', 'number'] },
      { q: 'CSS 中实现块级元素水平居中的常用方式是？', opts: ['margin: 0 auto', 'padding: auto', 'text-align: middle', 'float: center'] },
    ] },
    { id: 'vue', label: 'Vue', re: /vue/i, qs: [
      { q: 'Vue 3 组合式 API 中 ref 定义的响应式数据通过什么访问？', opts: ['.value', '.data', '.state', '直接使用变量名'] },
      { q: 'v-model 指令实现的是？', opts: ['双向数据绑定', '条件渲染', '列表循环', '事件阻止'] },
      { q: 'v-if 与 v-show 的主要区别是？', opts: ['v-show 通过 display 控制显隐', 'v-show 会销毁节点', 'v-if 不会重新渲染', '两者完全一致'] },
      { q: 'Vue 3 中组件挂载完成后触发的生命周期钩子是？', opts: ['onMounted', 'onCreated', 'onBeforeMount', 'onUpdated'] },
      { q: 'Vue 中父子组件通信常用的方式是？', opts: ['props 向下、emit 向上', '子组件直接改父组件数据', 'localStorage', '全局变量'] },
      { q: 'Vue Router 中声明式导航应使用？', opts: ['<router-link>', '<a href>', '<navigate>', '<route-view>'] },
      { q: 'Vue 中 computed 与 methods 的关键区别是？', opts: ['computed 有缓存', 'computed 不能返回值', 'methods 有缓存', '两者完全相同'] },
      { q: 'Pinia / Vuex 主要用于？', opts: ['集中式状态管理', '样式管理', '路由管理', '接口请求'] },
      { q: 'Vue 中监听 props 变化应使用？', opts: ['watch', 'computed', 'methods', 'mounted'] },
      { q: 'Vue 单文件组件通常包含哪三部分？', opts: ['template / script / style', 'html / css / js', 'view / model / controller', 'jsx / css / json'] },
    ] },
    { id: 'react', label: 'React', re: /react/i, qs: [
      { q: 'React 中用于管理函数组件状态的 Hook 是？', opts: ['useState', 'useFetch', 'useRoute', 'useStyle'] },
      { q: 'React 列表渲染时 key 的主要作用是？', opts: ['帮助 diff 识别节点', '设置样式', '绑定事件', '声明类型'] },
      { q: 'useEffect 依赖数组为空时，副作用函数会？', opts: ['仅挂载时执行一次', '每次渲染都执行', '永不执行', '卸载时执行'] },
      { q: 'React 中 props 的正确使用方式是？', opts: ['只读，不可直接修改', '可以随意赋值', '只能传字符串', '必须用 state 接收'] },
      { q: 'React 中父组件向子组件传递数据通过？', opts: ['props', 'state', 'ref', 'localStorage'] },
      { q: 'React 中减少子组件无效重渲染可使用？', opts: ['React.memo', 'useRef', 'useId', 'dangerouslySetInnerHTML'] },
      { q: 'React 中跨组件共享状态常用的方案是？', opts: ['Context 或状态管理库', '全局变量', 'localStorage', 'window 对象'] },
      { q: 'React 中受控组件的表单值由什么驱动？', opts: ['state', 'DOM 自身', 'ref', 'localStorage'] },
      { q: 'React 中 Fragment 的作用是？', opts: ['包裹多个元素但不增加 DOM 节点', '创建新组件', '管理状态', '发送请求'] },
      { q: 'React 中 useRef 适合存放？', opts: ['不触发渲染的可变引用', '响应式状态', '路由参数', '全局配置'] },
    ] },
    { id: 'go', label: 'Go', re: /golang|go\b/i, qs: [
      { q: 'Go 中启动一个协程使用哪个关键字？', opts: ['go', 'async', 'thread', 'spawn'] },
      { q: 'Go 中错误处理的常见约定是？', opts: ['函数返回 error 作为最后一个值', '统一抛异常', '使用全局错误码', '只打印日志'] },
      { q: 'Go 中多个协程之间推荐使用什么通信？', opts: ['channel', '全局变量', '共享内存加锁', '文件'] },
      { q: 'defer 语句的执行时机是？', opts: ['函数返回前', '函数开始时', '编译时', '手动调用时'] },
      { q: 'Go 中切片的零值是？', opts: ['nil', '空字符串', '0', 'false'] },
      { q: 'Go 模块依赖管理使用的文件是？', opts: ['go.mod', 'package.json', 'pom.xml', 'requirements.txt'] },
      { q: 'Go 中判断 error 是否为空通常写作？', opts: ['if err != nil', 'if err == null', 'if !err', 'if err.empty()'] },
      { q: 'Go 中定义结构体使用的关键字是？', opts: ['type 与 struct', 'class', 'object', 'interface'] },
      { q: 'Go 中 map 的零值是？', opts: ['nil', '空 map', '0', 'false'] },
      { q: 'Go 中用于格式化输出的包是？', opts: ['fmt', 'os', 'io', 'net'] },
    ] },
    { id: 'sql', label: 'SQL / 数据库', re: /sql|mysql|redis|数据库/i, qs: [
      { q: 'SQL 中对分组结果进行过滤应使用？', opts: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'] },
      { q: '数据库索引最主要的作用是？', opts: ['加速查询', '压缩数据', '加密存储', '自动备份'] },
      { q: '事务 ACID 中的 A 指的是？', opts: ['原子性', '一致性', '隔离性', '持久性'] },
      { q: 'Redis 主要被用作？', opts: ['内存缓存', '关系型数据库', '文件系统', '消息队列代理'] },
      { q: 'SQL 中仅删除数据、保留表结构的语句是？', opts: ['DELETE', 'DROP TABLE', 'ALTER TABLE', 'CREATE TABLE'] },
      { q: 'SQL 中连接两张表最常用的关键字是？', opts: ['JOIN', 'MERGE', 'LIMIT', 'DISTINCT'] },
      { q: 'SQL 中查询前 10 行常用的写法是？', opts: ['LIMIT 10', 'ROWS 10', 'TAKE 10', 'SIZE 10'] },
      { q: 'SQL 聚合函数中计算平均值的是？', opts: ['AVG', 'SUM', 'COUNT', 'MAX'] },
      { q: 'SQL 中 DISTINCT 的作用是？', opts: ['去重', '排序', '分组', '限制行数'] },
      { q: 'SQL 中 BETWEEN 用于？', opts: ['范围条件', '模糊匹配', '空值判断', '字符串拼接'] },
    ] },
    { id: 'docker', label: 'Docker', re: /docker/i, qs: [
      { q: 'Dockerfile 中指定基础镜像的指令是？', opts: ['FROM', 'BASE', 'IMAGE', 'RUN'] },
      { q: 'Docker 镜像分层的主要好处是？', opts: ['复用层、减少存储与分发体积', '提高 CPU 主频', '自动扩缩容', '自动加密镜像'] },
      { q: '镜像与容器的关系是？', opts: ['镜像是模板，容器是运行实例', '容器是模板，镜像是实例', '两者完全相同', '容器存储在镜像仓库'] },
      { q: 'docker-compose 主要用于？', opts: ['多容器编排', '编译源码', '管理数据库索引', '前端打包'] },
      { q: 'Docker 中查看运行中容器的命令是？', opts: ['docker ps', 'docker images', 'docker build', 'docker pull'] },
      { q: '容器数据持久化常用的方式是？', opts: ['挂载 volume', '写入容器层', '写入镜像', '使用环境变量'] },
      { q: 'Docker 中构建镜像的命令是？', opts: ['docker build', 'docker run', 'docker pull', 'docker push'] },
      { q: '容器端口映射使用的参数是？', opts: ['-p', '-v', '-e', '--name'] },
      { q: 'Dockerfile 中安装依赖通常使用？', opts: ['RUN', 'FROM', 'CMD', 'EXPOSE'] },
      { q: 'docker run -d 表示？', opts: ['后台运行容器', '删除容器', '查看日志', '进入容器'] },
    ] },
    { id: 'k8s', label: 'Kubernetes / 云原生', re: /kubernetes|k8s|云原生/i, qs: [
      { q: 'Kubernetes 中最小的可调度单元是？', opts: ['Pod', 'Node', 'Service', 'Namespace'] },
      { q: 'Kubernetes 中为一组 Pod 提供稳定访问入口的对象是？', opts: ['Service', 'ConfigMap', 'Secret', 'Job'] },
      { q: 'Deployment 主要用于管理？', opts: ['无状态应用的副本', '持久化存储', '网络策略', '集群证书'] },
      { q: 'ConfigMap 的作用是？', opts: ['存放配置数据', '存放镜像', '调度 Pod', '暴露端口'] },
      { q: 'Kubernetes 中查看 Pod 列表的命令是？', opts: ['kubectl get pods', 'kubectl describe node', 'docker ps', 'kubectl apply'] },
      { q: 'Secret 资源主要用于存放？', opts: ['密码与密钥等敏感信息', '公共配置', '容器镜像', '运行日志'] },
      { q: 'Kubernetes 中负责水平扩缩容的对象是？', opts: ['HPA', 'PVC', 'Ingress', 'CronJob'] },
      { q: 'Ingress 的主要作用是？', opts: ['统一入口与七层路由', '存储卷管理', '密钥管理', '节点扩容'] },
      { q: 'Kubernetes 中命名空间用于？', opts: ['逻辑隔离资源', '存储镜像', '调度节点', '加密流量'] },
      { q: 'kubectl apply 的作用是？', opts: ['声明式创建或更新资源', '删除资源', '查看日志', '进入容器'] },
    ] },
    { id: 'ai', label: 'AI / AIGC 应用', re: /^ai$|ai\/|aigc|人工智能/i, qs: [
      { q: '以下哪项属于生成式 AI 的典型应用？', opts: ['文本与图像生成', '关系型数据库', '静态网页托管', 'DNS 解析'] },
      { q: '大模型应用开发中，Prompt 的主要作用是？', opts: ['向模型描述任务与约束', '编译代码', '管理数据库', '部署容器'] },
      { q: 'AI 应用中的「幻觉」指？', opts: ['模型生成看似合理但不真实的内容', '服务器宕机', '网络延迟', '数据加密'] },
      { q: '调用大模型 API 时，token 通常表示？', opts: ['文本切分后的计费与处理单位', '用户登录凭证', '数据库主键', '网络地址'] }
    ] },
    { id: 'ml', label: '机器学习 / 深度学习', re: /机器学习|深度学习|pytorch|tensorflow|模型/i, qs: [
      { q: '模型在训练集表现好、测试集明显变差，通常称为？', opts: ['过拟合', '欠拟合', '梯度消失', '数据泄漏'] },
      { q: '深度学习中反向传播主要用于？', opts: ['计算梯度并更新参数', '加载数据集', '保存模型', '可视化网络'] },
      { q: '交叉验证的主要目的是？', opts: ['评估模型泛化能力', '加速训练', '增加数据量', '压缩模型'] },
      { q: '学习率设置过大通常会导致？', opts: ['训练震荡、难以收敛', '训练过慢', '模型欠拟合', '梯度为零'] },
      { q: '训练集、验证集、测试集的正确用途是？', opts: ['训练调参、验证选型、测试最终评估', '三者可以互相替换', '测试集用于调参', '验证集用于上线'] },
      { q: 'L1 正则化的主要效果是？', opts: ['产生稀疏权重', '增大模型复杂度', '加速推理', '增加训练数据'] },
      { q: '分类任务常用的评估指标是？', opts: ['准确率 / F1', 'MSE', 'R²', 'MAE'] },
      { q: '特征标准化的主要目的是？', opts: ['消除量纲影响', '增加特征数量', '降低模型容量', '加速数据采集'] },
      { q: '训练集损失下降但验证集损失上升，说明？', opts: ['可能过拟合', '一定欠拟合', '数据无问题', '学习率过低'] },
      { q: '混淆矩阵中 Precision 指？', opts: ['预测为正样本中真正为正的比例', '真实正样本被找出的比例', '准确率', '召回率'] },
    ] },
    { id: 'llm', label: 'NLP / 大模型 / Agent', re: /nlp|大模型|agent|rag|自然语言/i, qs: [
      { q: 'Transformer 中建模序列依赖的核心机制是？', opts: ['自注意力机制', '卷积池化', '循环门控', '哈希索引'] },
      { q: 'RAG 的核心思路是？', opts: ['检索外部知识增强生成', '只依赖模型记忆', '压缩模型体积', '替换分词器'] },
      { q: '微调（Fine-tuning）与提示工程的主要区别是？', opts: ['微调会更新模型参数', '微调不需要数据', '提示工程会更新参数', '两者等价'] },
      { q: 'Agent 相比普通对话模型的核心能力是？', opts: ['工具调用与任务规划', '更快的推理速度', '更大的上下文', '更好的中文能力'] },
      { q: '大模型的上下文窗口指？', opts: ['单次可处理的 token 数量上限', '模型参数量', '训练数据总量', '显存大小'] },
      { q: '在 Prompt 中给出示例进行引导称为？', opts: ['Few-shot 提示', '零样本提示', '模型微调', '模型量化'] },
      { q: '大模型的 temperature 参数主要控制？', opts: ['输出随机性', '最大长度', '显存占用', '词表大小'] },
      { q: '向量数据库在大模型应用中主要用于？', opts: ['语义检索', '模型训练', '前端渲染', '日志采集'] },
      { q: '大模型量化（Quantization）的主要目的是？', opts: ['降低显存占用与推理成本', '增加参数量', '提升训练数据量', '改变词表'] },
      { q: 'Embedding 的主要作用是？', opts: ['把文本映射为向量', '压缩图片', '生成 SQL', '管理容器'] },
    ] },
    { id: 'algo', label: '算法 / 数据结构', re: /算法|数据结构/i, qs: [
      { q: '有序数组上二分查找的时间复杂度是？', opts: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'] },
      { q: '哈希表平均情况下的查找复杂度是？', opts: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'] },
      { q: '下列哪种排序算法是稳定的？', opts: ['归并排序', '快速排序', '堆排序', '选择排序'] },
      { q: '栈的特点是？', opts: ['后进先出', '先进先出', '随机访问', '双端进出'] },
      { q: '快速排序的平均时间复杂度是？', opts: ['O(n log n)', 'O(n)', 'O(log n)', 'O(n²)'] },
      { q: '链表相比数组的优势是？', opts: ['插入删除更高效', '随机访问更快', '内存连续', '缓存更友好'] },
      { q: '广度优先搜索通常使用什么数据结构？', opts: ['队列', '栈', '堆', '哈希表'] },
      { q: '归并排序的空间复杂度是？', opts: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'] },
      { q: '动态规划适合解决的问题通常具有？', opts: ['最优子结构与重叠子问题', '完全随机性', '无需状态转移', '只能递归实现'] },
      { q: '堆（Heap）常用于实现？', opts: ['优先队列', '哈希表', '并查集', '图遍历'] },
    ] },
    { id: 'test', label: '测试 / 自动化', re: /测试|自动化|qa/i, qs: [
      { q: '单元测试主要验证什么？', opts: ['最小可测试单元的行为', '整体部署流程', '网络带宽', '数据库容量'] },
      { q: '边界值分析主要用于发现哪类缺陷？', opts: ['边界条件处理错误', '界面配色问题', '文档缺失', '沟通问题'] },
      { q: '回归测试的主要目的是？', opts: ['确认修改未引入新问题', '提升代码覆盖率到100%', '替代单元测试', '测试硬件性能'] },
      { q: '测试金字塔的底层通常是？', opts: ['单元测试', 'UI 测试', '手工测试', '性能测试'] },
      { q: '黑盒测试主要依据？', opts: ['需求与功能规格', '内部代码结构', '数据库索引', '服务器日志'] },
      { q: '自动化测试相比手工测试的优势是？', opts: ['可重复执行、回归效率高', '完全不需要维护', '能发现所有缺陷', '无需编写代码'] },
      { q: '接口测试通常关注？', opts: ['请求参数与响应结果', '页面配色', '机房温度', '代码注释'] },
      { q: '等价类划分属于哪类测试方法？', opts: ['黑盒测试', '白盒测试', '性能测试', '安全测试'] },
      { q: '性能测试中 QPS 指？', opts: ['每秒查询数', '每次查询耗时', '并发用户总数', '错误率'] },
      { q: '冒烟测试的主要目的是？', opts: ['快速验证核心功能是否可用', '测试全部边界值', '评估性能', '检查代码风格'] },
    ] },
    { id: 'linux', label: 'Linux / 运维', re: /linux|运维|shell/i, qs: [
      { q: 'Linux 中查看当前目录文件列表的命令是？', opts: ['ls', 'cd', 'cp', 'mv'] },
      { q: 'chmod 755 中的 7 表示什么权限组合？', opts: ['读 + 写 + 执行', '只读', '只写', '只执行'] },
      { q: '查看当前进程的命令是？', opts: ['ps', 'df', 'du', 'tar'] },
      { q: '查看磁盘使用情况的命令是？', opts: ['df -h', 'ps -ef', 'top', 'free -m'] },
      { q: 'Linux 中查看文件内容的命令是？', opts: ['cat', 'chmod', 'ps', 'df'] },
      { q: 'Linux 中按关键字过滤文本常用？', opts: ['grep', 'ls', 'top', 'tar'] },
      { q: 'Linux 中修改文件权限的命令是？', opts: ['chmod', 'chown', 'chgrp', 'umask'] },
      { q: '查看内存使用情况的命令是？', opts: ['free -m', 'df -h', 'du -sh', 'ps -ef'] },
      { q: 'Linux 中切换目录的命令是？', opts: ['cd', 'ls', 'pwd', 'mkdir'] },
      { q: 'Linux 中管道符 | 的作用是？', opts: ['把前一命令输出作为后一命令输入', '后台运行', '重定向错误', '终止进程'] },
    ] },
    { id: 'viz', label: '数据可视化 / BI', re: /数据可视化|echarts|bi|图表/i, qs: [
      { q: 'ECharts 中更新图表配置使用的方法是？', opts: ['setOption', 'render', 'update', 'draw'] },
      { q: '可视化中表达数值大小最常用的映射通道是？', opts: ['位置与长度', '字体名称', '文件格式', '代码注释'] },
      { q: '用颜色区分不同类别时，最适合的是？', opts: ['分类色板', '同一颜色的深浅', '随机颜色', '灰度渐变'] },
      { q: '仪表盘图最适合展示？', opts: ['单个指标的完成进度', '时间序列趋势', '地域分布', '多维关系'] },
      { q: '折线图最适合表达？', opts: ['随时间变化的趋势', '类别占比', '层级关系', '单一进度'] },
      { q: '使用饼图时应特别注意？', opts: ['分类不宜过多且占比合计为 100%', '必须使用 3D 效果', '颜色越多越好', '必须标注坐标轴'] },
      { q: '柱状图与条形图的主要区别是？', opts: ['方向不同：纵向与横向', '数据必须不同', '颜色数量不同', '坐标轴可省略'] },
      { q: '可视化配色应优先保证？', opts: ['可读性与对比度', '颜色数量多', '渐变复杂', '荧光色'] },
      { q: '热力图最适合展示？', opts: ['二维数据的密度或强度', '单一进度', '层级结构', '时间趋势'] },
      { q: '散点图主要用于观察？', opts: ['两个变量之间的关系', '类别占比', '流程步骤', '单一指标'] },
    ] },
    { id: 'arch', label: '系统设计 / 架构', re: /系统|架构|微服务|设计模式/i, qs: [
      { q: '微服务架构中，服务间通信常用的协议是？', opts: ['HTTP / RPC', 'FTP', 'SMTP', 'SNMP'] },
      { q: '缓存击穿通常指？', opts: ['热点 key 失效瞬间大量请求打到数据库', '缓存整体过期', '网络分区', '磁盘写满'] },
      { q: '消息队列的主要作用是？', opts: ['异步解耦与削峰填谷', '提升显卡性能', '替代数据库', '加密数据'] },
      { q: 'CAP 理论中，分布式系统无法同时满足？', opts: ['一致性、可用性、分区容错性', '安全、性能、成本', '读、写、存储', '水平、垂直、混合扩展'] },
      { q: '限流的主要目的是？', opts: ['保护系统不被突发流量压垮', '提升存储容量', '加密传输', '自动部署'] },
      { q: '接口的幂等性指？', opts: ['同一请求重复执行结果一致', '请求必须只执行一次', '接口必须无状态', '响应必须缓存'] },
      { q: '负载均衡中的轮询算法指？', opts: ['请求依次分发到各节点', '随机选择节点', '按权重固定节点', '总是发往同一节点'] },
      { q: '数据库读写分离主要解决？', opts: ['读多写少场景的读压力', '存储加密', '表结构变更', '网络延迟'] },
      { q: '微服务中服务注册与发现常用于？', opts: ['动态定位服务实例地址', '压缩日志', '加密数据库', '生成前端页面'] },
      { q: '分布式系统中的熔断机制用于？', opts: ['故障时快速失败、防止雪崩', '提升存储容量', '自动扩容', '负载均衡'] },
    ] },
    { id: 'product', label: '产品 / 运营', re: /产品|运营/i, qs: [
      { q: 'MVP 的核心含义是？', opts: ['最小可行产品', '最大价值产品', '多版本计划', '市场验证报告'] },
      { q: '需求优先级排序通常围绕哪两个维度？', opts: ['价值与成本', '颜色与字体', '服务器型号', '代码行数'] },
      { q: '衡量用户留存通常关注？', opts: ['次日 / 7 日留存率', '页面颜色数量', '服务器数量', '代码提交次数'] },
      { q: 'A/B 测试的主要目的是？', opts: ['对比不同方案的效果', '提升服务器性能', '压缩图片体积', '统一代码风格'] },
      { q: '用户故事通常采用什么句式？', opts: ['作为…我希望…以便…', '因为…所以…', '如果…否则…', '先…后…'] },
      { q: '北极星指标应具备什么特点？', opts: ['能反映产品核心价值', '数量越多越好', '只关注收入', '每月更换一次'] },
      { q: '用户画像的主要用途是？', opts: ['精准运营与个性化推荐', '压缩图片', '提升带宽', '统一代码风格'] },
      { q: '需求评审的核心目的是？', opts: ['对齐范围与可行性', '确定服务器型号', '设计配色', '编写测试用例'] },
      { q: '产品需求文档（PRD）主要描述？', opts: ['功能需求与验收标准', '服务器采购清单', '代码实现细节', '测试脚本'] },
      { q: '用户漏斗分析主要用于？', opts: ['定位转化流失环节', '统计服务器负载', '设计数据库表', '管理代码分支'] },
    ] },
    { id: 'design', label: '设计 / 交互', re: /figma|交互|ui|ux|平面设计|视觉设计|设计规范/i, qs: [
      { q: '平面设计四大原则不包括？', opts: ['随机性', '对比', '对齐', '亲密性'] },
      { q: 'Figma 中复用同一套界面元素应使用？', opts: ['Component 组件', '图层锁定', '画板导出', '原型连线'] },
      { q: '「对比」原则的主要作用是？', opts: ['突出重点、建立层级', '让页面更花哨', '减少留白', '统一所有字号'] },
      { q: '8pt 栅格系统的核心价值是？', opts: ['统一间距与尺寸节奏', '限制颜色数量', '提升图片清晰度', '减少字体数量'] },
      { q: '界面留白的主要作用是？', opts: ['建立层级、提升可读性', '浪费空间', '增加颜色数量', '减少信息量'] },
      { q: '交互设计中的「反馈」原则强调？', opts: ['操作后及时告知结果', '隐藏所有状态', '尽量减少按钮', '统一所有字体'] },
      { q: '移动端点击热区建议不小于？', opts: ['44 × 44 px', '10 × 10 px', '100 × 100 px', '无要求'] },
      { q: '色彩对比度不足会主要影响？', opts: ['可读性与无障碍访问', '加载速度', '图片体积', '服务器性能'] },
      { q: '设计规范中「一致性」强调？', opts: ['相同元素保持统一样式与交互', '每个页面风格不同', '颜色越多越好', '字体随时变化'] },
      { q: '原型图的主要用途是？', opts: ['验证流程与交互结构', '替代最终视觉稿', '部署上线', '数据库建模'] },
    ] },
    { id: 'bigdata', label: '大数据 / Spark', re: /大数据|hadoop|spark|hive/i, qs: [
      { q: 'Spark 相比 MapReduce 的核心优势之一是？', opts: ['内存计算', '只能处理小数据', '不支持分布式', '无需集群'] },
      { q: 'HDFS 默认多副本策略主要为了？', opts: ['容错与高可用', '提升显卡性能', '自动加密', '压缩日志'] },
      { q: '数据倾斜通常会导致？', opts: ['部分任务耗时异常长', '所有任务均匀加速', '存储成本归零', '自动扩容'] },
      { q: '数仓分层中 ODS 层通常存放？', opts: ['原始数据', '汇总指标', '应用报表', '临时缓存'] },
      { q: 'Kafka 主要用于？', opts: ['高吞吐消息流处理', '关系型数据存储', '前端页面渲染', '容器编排'] },
      { q: 'Kafka 分区的主要作用是？', opts: ['支持并行消费与水平扩展', '加密消息', '压缩存储', '跨主题排序'] },
      { q: 'Hive 的主要作用是？', opts: ['提供 SQL 风格的数据仓库查询', '容器编排', '前端渲染', '消息推送'] },
      { q: '数据湖相比数据仓库的特点是？', opts: ['可存储原始多结构数据', '只能存结构化数据', '不支持海量数据', '必须预定义 Schema'] },
      { q: 'MapReduce 中 Shuffle 阶段主要负责？', opts: ['按 key 分组并分发数据', '压缩镜像', '调度容器', '渲染图表'] },
      { q: '数据质量中「唯一性」指？', opts: ['同一实体不重复记录', '字段不能为空', '数值范围合理', '格式统一'] },
    ] },
    { id: 'data', label: '数据分析 / 数据处理', re: /数据分析|数据处理|数据工程|数据挖掘|数据治理|数据/i, qs: [
      { q: '描述性统计中，衡量数据离散程度的指标是？', opts: ['标准差', '均值', '中位数', '众数'] },
      { q: '处理缺失值时，较稳妥的第一步是？', opts: ['先分析缺失比例再选择策略', '直接删除整列', '全部填 0', '忽略缺失值'] },
      { q: 'SQL 中统计每个分组的行数应使用？', opts: ['COUNT(*) 配合 GROUP BY', 'SUM(*)', 'AVG(*)', 'DISTINCT *'] },
      { q: '相关系数接近 0 通常表示？', opts: ['线性相关性弱', '完全正相关', '完全负相关', '一定存在因果关系'] },
      { q: '箱线图主要用于展示？', opts: ['数据分布与异常值', '时间趋势', '地理分布', '层级关系'] },
      { q: 'A/B 实验的评估指标应？', opts: ['实验前确定并保持稳定', '实验后随意更换', '只看绝对值', '只看样本量'] },
      { q: '数据透视表主要用于？', opts: ['多维度汇总分析', '图片压缩', '接口调试', '版本管理'] },
      { q: '缺失值占比很高时优先考虑？', opts: ['评估该字段是否仍有分析价值', '直接填均值', '全部填 0', '忽略缺失'] },
      { q: 'SQL 中窗口函数常用于？', opts: ['分组内排名与累计计算', '创建索引', '备份数据库', '修改表结构'] },
      { q: '异常值检测常用的方法是？', opts: ['箱线图 / 3σ 原则', '均值填充', '字符串截断', '随机抽样'] },
    ] },
    { id: 'security', label: '安全', re: /安全|渗透|等保/i, qs: [
      { q: '防止 SQL 注入最有效的做法是？', opts: ['使用参数化查询', '前端隐藏输入框', '关闭数据库', '增加验证码'] },
      { q: 'XSS 攻击的核心是利用？', opts: ['页面注入恶意脚本', '物理入侵机房', '暴力破解密码', 'DDoS 流量'] },
      { q: '密码在数据库中应如何存储？', opts: ['加盐哈希', '明文', 'Base64 编码', '对称加密后明文可解'] },
      { q: 'HTTPS 主要保障的是？', opts: ['传输过程加密与身份认证', '数据库备份', '服务器防病毒', '代码加密'] },
      { q: '最小权限原则指？', opts: ['仅授予完成任务所需的最小权限', '给所有用户管理员权限', '关闭审计日志', '共享账号密码'] },
      { q: 'CSRF 攻击主要利用？', opts: ['用户已登录的会话凭证', '服务器磁盘故障', '弱密码爆破', 'DNS 劫持'] },
      { q: 'SQL 注入的常见入口是？', opts: ['未过滤的用户输入拼接 SQL', 'HTTPS 加密', '强密码策略', 'CDN 加速'] },
      { q: '双因素认证的核心是？', opts: ['密码之外的第二种验证因素', '两个相同密码', '两套用户名', '两台服务器'] },
      { q: '越权漏洞通常指？', opts: ['用户访问了无权访问的资源', '密码强度不足', '服务器宕机', '网络延迟'] },
      { q: '日志脱敏的主要目的是？', opts: ['避免敏感信息泄露', '提升日志写入速度', '压缩日志体积', '统一日志格式'] },
    ] },
    { id: 'network', label: '网络 / HTTP', re: /网络|tcp|http|通信/i, qs: [
      { q: 'HTTP 状态码 404 表示？', opts: ['资源未找到', '服务器内部错误', '请求成功', '永久重定向'] },
      { q: 'TCP 建立连接需要几次握手？', opts: ['3 次', '1 次', '2 次', '4 次'] },
      { q: 'DNS 的主要作用是？', opts: ['域名解析为 IP', '加密流量', '负载均衡', '压缩数据'] },
      { q: 'HTTP/2 相比 HTTP/1.1 的关键特性是？', opts: ['多路复用', '明文传输', '长连接首次引入', '不再使用 TCP'] },
      { q: 'HTTP 状态码 500 表示？', opts: ['服务器内部错误', '资源未找到', '请求成功', '权限不足'] },
      { q: '负载均衡的主要作用是？', opts: ['将请求分发到多台服务器', '加密传输数据', '压缩图片体积', '缓存 DNS 记录'] },
      { q: 'HTTP 与 HTTPS 的主要区别是？', opts: ['HTTPS 增加 TLS 加密', 'HTTPS 一定更快', 'HTTP 更安全', '两者无区别'] },
      { q: 'CDN 的主要作用是？', opts: ['就近分发内容、降低延迟', '加密数据', '数据库备份', '代码编译'] },
      { q: 'TCP 与 UDP 的主要区别是？', opts: ['TCP 可靠有序、UDP 轻量低延迟', 'UDP 更可靠', 'TCP 无连接', '两者完全相同'] },
      { q: 'NAT 的主要作用是？', opts: ['地址转换以节省公网 IP', '加密流量', '负载均衡', '域名解析'] },
    ] }
  ];

  var COMMON_CAT = { id: 'common', label: '通用 / 其他', re: /^$/, qs: [] };

  var currentJob = '';
  var currentGroups = [];
  var lastLevels = null;
  var editingId = null;

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

  function loadCustom() {
    try {
      var list = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function saveCustom(list) {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); } catch (e) { /* 忽略 */ }
  }

  function categoryOf(skill) {
    for (var i = 0; i < BANK.length; i++) {
      if (BANK[i].re.test(skill)) return BANK[i];
    }
    return null;
  }

  // 某技能可用的全部知识题（内置 + 自定义）
  function questionsForSkill(skill) {
    var cat = categoryOf(skill);
    var builtin = cat ? cat.qs.map(function (q) { return { q: q.q, opts: q.opts, correct: q.opts[0], cat: cat.id }; }) : [];
    var custom = loadCustom().filter(function (q) {
      return (cat && q.cat === cat.id) || (!cat && q.cat === 'common');
    }).map(function (q) {
      return { q: q.q, opts: q.opts, correct: q.opts[q.correct], cat: q.cat };
    });
    return builtin.concat(custom);
  }

  function bankCount() {
    var n = BANK.reduce(function (s, c) { return s + c.qs.length; }, 0);
    return n + loadCustom().length;
  }

  function buildGroups(job) {
    var seen = {};
    var skills = [];
    (job.required_skills || []).forEach(function (s) {
      var k = String(s).trim();
      if (!k || seen[k]) return;
      seen[k] = 1;
      skills.push(k);
    });

    var usedQ = {};
    return skills.slice(0, MAX_SKILLS).map(function (skill) {
      var pool = questionsForSkill(skill).filter(function (item) { return !usedQ[item.q]; });
      var picked = shuffle(pool).slice(0, KNOWLEDGE_PER_SKILL);
      picked.forEach(function (item) { usedQ[item.q] = 1; });
      var qs = picked.map(function (item) {
        var opts = shuffle(item.opts);
        return { type: 'k', q: item.q, opts: opts, correct: item.correct };
      });
      qs.push({ type: 's', q: '你目前对「' + skill + '」的掌握程度更接近？', opts: SELF_LABELS.slice() });
      return { skill: skill, qs: qs };
    });
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
    hint.textContent = '共 ' + groups.length + ' 项核心技能 · ' + totalQuestions(groups) + ' 道题（约 7 分钟完成） · 题库共 ' + bankCount() + ' 题';
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
    } catch (e) { /* 忽略 */ }

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

    document.getElementById('test-quiz').innerHTML = renderQuiz(currentGroups);
    document.getElementById('test-quiz-card').style.display = '';
    document.getElementById('test-result-card').style.display = 'none';
    updateProgress();
    document.getElementById('test-quiz-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ===== 题库管理 =====
  function catLabel(id) {
    var cat = BANK.filter(function (c) { return c.id === id; })[0];
    return cat ? cat.label : (id === 'common' ? COMMON_CAT.label : id);
  }

  function renderBank() {
    var tbody = document.getElementById('qb-body');
    var total = document.getElementById('qb-total');
    if (!tbody) return;

    var custom = loadCustom();
    if (total) total.textContent = bankCount();

    var kw = (document.getElementById('qb-search') || {}).value || '';
    kw = kw.trim().toLowerCase();

    var rows = [];
    BANK.forEach(function (cat) {
      cat.qs.forEach(function (q) {
        rows.push({ id: '', cat: cat.id, q: q.q, opts: q.opts, correct: q.opts[0], custom: false });
      });
    });
    custom.forEach(function (q) {
      rows.push({ id: q.id, cat: q.cat, q: q.q, opts: q.opts, correct: q.opts[q.correct], custom: true });
    });

    if (kw) {
      rows = rows.filter(function (r) {
        return (r.q + ' ' + catLabel(r.cat)).toLowerCase().indexOf(kw) >= 0;
      });
    }

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:22px 0;">没有匹配的题目</td></tr>';
      return;
    }

    tbody.innerHTML = rows.slice(0, 200).map(function (r) {
      return '<tr>'
        + '<td style="font-size:12px;color:var(--muted);white-space:nowrap;">' + esc(catLabel(r.cat)) + '</td>'
        + '<td style="font-size:12px;">' + esc(r.q) + '</td>'
        + '<td style="font-size:12px;color:#34d399;">' + esc(r.correct) + '</td>'
        + '<td style="font-size:12px;">' + (r.custom ? '<span style="color:#a5b4fc;">自定义</span>' : '<span style="color:var(--muted);">内置</span>') + '</td>'
        + '<td>' + (r.custom
          ? '<button class="plan-del" data-qb-edit="' + r.id + '" title="编辑" style="margin-right:6px;">✎</button><button class="plan-del" data-qb-del="' + r.id + '" title="删除">×</button>'
          : '<span style="font-size:11px;color:var(--muted);">—</span>') + '</td>'
        + '</tr>';
    }).join('');
  }

  function fillCategorySelect() {
    var sel = document.getElementById('qb-category');
    if (!sel) return;
    var opts = BANK.map(function (c) { return '<option value="' + c.id + '">' + esc(c.label) + '</option>'; });
    opts.push('<option value="common">' + esc(COMMON_CAT.label) + '</option>');
    sel.innerHTML = opts.join('');
  }

  function openForm(item) {
    editingId = item ? item.id : null;
    document.getElementById('qb-form-wrap').style.display = '';
    document.getElementById('qb-category').value = item ? item.cat : BANK[0].id;
    document.getElementById('qb-question').value = item ? item.q : '';
    for (var i = 0; i < 4; i++) document.getElementById('qb-opt' + i).value = item ? item.opts[i] : '';
    document.getElementById('qb-correct').value = item ? String(item.correct) : '0';
    document.getElementById('qb-form-title').textContent = item ? '编辑自定义题目' : '新增自定义题目';
  }

  function closeForm() {
    editingId = null;
    document.getElementById('qb-form-wrap').style.display = 'none';
  }

  function saveQuestion() {
    var cat = document.getElementById('qb-category').value;
    var q = document.getElementById('qb-question').value.trim();
    var opts = [0, 1, 2, 3].map(function (i) { return document.getElementById('qb-opt' + i).value.trim(); });
    var correct = parseInt(document.getElementById('qb-correct').value, 10) || 0;

    if (!q) { alert('请填写题目内容'); return; }
    if (opts.some(function (o) { return !o; })) { alert('请填写 4 个选项'); return; }

    var list = loadCustom();
    if (editingId) {
      var idx = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === editingId) { idx = i; break; }
      if (idx >= 0) list[idx] = { id: editingId, cat: cat, q: q, opts: opts, correct: correct, ts: Date.now() };
    } else {
      list.push({ id: 'c_' + Date.now() + '_' + Math.floor(Math.random() * 999), cat: cat, q: q, opts: opts, correct: correct, ts: Date.now() });
    }
    saveCustom(list);
    closeForm();
    renderBank();
    updateHint();
  }

  function initBankUI() {
    var addBtn = document.getElementById('qb-add');
    if (!addBtn) return;
    fillCategorySelect();

    addBtn.addEventListener('click', function () { openForm(null); });
    document.getElementById('qb-save').addEventListener('click', saveQuestion);
    document.getElementById('qb-cancel').addEventListener('click', closeForm);

    var search = document.getElementById('qb-search');
    if (search) search.addEventListener('input', renderBank);

    var tbody = document.getElementById('qb-body');
    tbody.addEventListener('click', function (e) {
      var del = e.target.getAttribute && e.target.getAttribute('data-qb-del');
      var edit = e.target.getAttribute && e.target.getAttribute('data-qb-edit');
      if (del) {
        if (!confirm('确定删除这道自定义题目？')) return;
        saveCustom(loadCustom().filter(function (q) { return q.id !== del; }));
        renderBank();
        updateHint();
        return;
      }
      if (edit) {
        var item = loadCustom().filter(function (q) { return q.id === edit; })[0];
        if (item) openForm(item);
      }
    });

    renderBank();
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

    document.getElementById('test-start').addEventListener('click', start);
    document.getElementById('test-again').addEventListener('click', start);
    document.getElementById('test-submit').addEventListener('click', submit);
    document.getElementById('test-cancel').addEventListener('click', function () {
      document.getElementById('test-quiz-card').style.display = 'none';
    });
    document.getElementById('test-quiz').addEventListener('change', updateProgress);

    initBankUI();
  }

  init();
})();
