import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'focus-flow-employee-agents-v1';
const DEFAULT_COMMAND = 'ربط كل موظف بأجنت فعلي يعمل حسب اختصاصه وينتج مهام ومستندات وسجل تنفيذ.';

const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
const safeName = (value) => String(value || 'file').replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, '-').slice(0, 70);

const statusLabel = {
  ready: 'جاهز',
  running: 'قيد التنفيذ',
  done: 'تم',
  approval: 'يحتاج اعتماد',
  blocked: 'متوقف'
};

const actionKindLabel = {
  analysis: 'تحليل',
  task: 'مهمة',
  document: 'مستند',
  message: 'رسالة',
  calendar: 'تقويم',
  approval: 'اعتماد',
  report: 'تقرير'
};

const employees = [
  {
    id: 'ceo',
    name: 'الرئيس التنفيذي',
    role: 'قيادة الشركة واتخاذ القرار',
    agent: 'CEO Decision Agent',
    specialty: 'يحول الأهداف إلى أولويات، يحدد المخاطر، ويطلب الاعتماد عند القرارات الحساسة.',
    keywords: ['استراتيجية', 'قرار', 'ادارة', 'إدارة', 'اعتماد', 'خطة', 'شركة'],
    kpis: ['نسبة إغلاق القرارات', 'عدد العوائق المفتوحة', 'الالتزام بالأولويات'],
    workflows: [
      ['analysis', 'تحليل الهدف وتحويله إلى أولويات تنفيذية'],
      ['approval', 'تحديد القرارات التي تحتاج اعتماد الإدارة'],
      ['report', 'إصدار ملخص تنفيذي للإجراء التالي']
    ]
  },
  {
    id: 'assistant',
    name: 'السكرتير التنفيذي',
    role: 'المراسلات والمتابعة والجدولة',
    agent: 'Executive Secretary Agent',
    specialty: 'يجهز رسائل، محاضر متابعة، مواعيد، وتنبيهات للمهام المتأخرة.',
    keywords: ['ايميل', 'إيميل', 'رسالة', 'موعد', 'اجتماع', 'متابعة', 'سكرتير'],
    kpis: ['الردود المرسلة', 'المواعيد المجدولة', 'المتابعات المغلقة'],
    workflows: [
      ['message', 'صياغة رسالة متابعة جاهزة للإرسال'],
      ['calendar', 'إنشاء تذكير متابعة بوقت واضح'],
      ['task', 'فتح قائمة متابعة حتى إغلاق الطلب']
    ]
  },
  {
    id: 'operations',
    name: 'مدير العمليات',
    role: 'تشغيل يومي وتوزيع العمل',
    agent: 'Operations Control Agent',
    specialty: 'يوزع العمل، يكشف التعطلات، يراقب الالتزام، ويصدر خطة تشغيل يومية.',
    keywords: ['تشغيل', 'عمليات', 'توزيع', 'تعطل', 'تأخير', 'سير العمل'],
    kpis: ['زمن الإنجاز', 'عدد التعطلات', 'نسبة الالتزام بالخطة'],
    workflows: [
      ['analysis', 'تفكيك الطلب إلى مسار تشغيل واضح'],
      ['task', 'توزيع المهام على المسؤولين حسب الاختصاص'],
      ['report', 'إصدار تقرير تشغيل يومي']
    ]
  },
  {
    id: 'hr',
    name: 'الموارد البشرية',
    role: 'الموظفون والعقود والحضور',
    agent: 'HR Compliance Agent',
    specialty: 'ينشئ إجراءات موظفين، قوائم onboarding، تنبيهات عقود وحضور، ومسودات خطابات.',
    keywords: ['موظف', 'موظفين', 'عقد', 'حضور', 'اجازة', 'إجازة', 'رواتب', 'موارد'],
    kpis: ['اكتمال ملفات الموظفين', 'التأخيرات', 'العقود المنتهية'],
    workflows: [
      ['document', 'تجهيز نموذج إجراء للموظف'],
      ['task', 'إنشاء checklist للملف الوظيفي'],
      ['approval', 'طلب اعتماد أي إجراء يؤثر على الراتب أو العقد']
    ]
  },
  {
    id: 'finance',
    name: 'المالية',
    role: 'الفواتير والمصروفات والتدفق النقدي',
    agent: 'Finance Guard Agent',
    specialty: 'يراجع المصروف، يجهز مطالبة أو فاتورة، ويوقف أي صرف يحتاج اعتماد.',
    keywords: ['مالي', 'مالية', 'فاتورة', 'مصروف', 'صرف', 'ميزانية', 'تحصيل'],
    kpis: ['الفواتير المفتوحة', 'المصروفات المعتمدة', 'التدفق النقدي'],
    workflows: [
      ['analysis', 'تصنيف الطلب المالي وتحديد أثره'],
      ['approval', 'إيقاف الصرف لحين الاعتماد'],
      ['report', 'إصدار ملخص مالي مختصر']
    ]
  },
  {
    id: 'sales',
    name: 'المبيعات',
    role: 'العملاء والعروض والتحصيل',
    agent: 'Sales Follow-up Agent',
    specialty: 'يبني عرض سعر، يتابع العميل، ويحول الفرصة إلى مهمة قابلة للإغلاق.',
    keywords: ['مبيعات', 'عميل', 'عرض سعر', 'تحصيل', 'صفقة', 'طلب عميل'],
    kpis: ['العروض المرسلة', 'نسبة التحويل', 'قيمة الفرص المفتوحة'],
    workflows: [
      ['document', 'تجهيز عرض سعر مبدئي'],
      ['message', 'صياغة متابعة عميل'],
      ['task', 'إنشاء مراحل إغلاق الصفقة']
    ]
  },
  {
    id: 'purchasing',
    name: 'المشتريات',
    role: 'الموردون وطلبات الشراء',
    agent: 'Purchasing Agent',
    specialty: 'يجمع عروض الموردين، يقارن السعر والمدة، ويجهز طلب شراء.',
    keywords: ['شراء', 'مشتريات', 'مورد', 'توريد', 'عروض', 'مواد'],
    kpis: ['طلبات الشراء', 'توفير التكلفة', 'التأخير من الموردين'],
    workflows: [
      ['analysis', 'تحديد الحاجة الشرائية والمواصفات'],
      ['document', 'إنشاء نموذج مقارنة موردين'],
      ['approval', 'طلب اعتماد أمر الشراء']
    ]
  },
  {
    id: 'inventory',
    name: 'المستودع والمخزون',
    role: 'الأصناف والكميات والتنبيهات',
    agent: 'Inventory Watch Agent',
    specialty: 'يراقب الحد الأدنى، يفتح طلبات إعادة الطلب، ويصدر كشف حركة الصنف.',
    keywords: ['مخزون', 'مستودع', 'كمية', 'نقص', 'صنف', 'جرد'],
    kpis: ['الأصناف الناقصة', 'دقة الجرد', 'معدل دوران المخزون'],
    workflows: [
      ['analysis', 'فحص حالة الصنف والكمية المطلوبة'],
      ['task', 'فتح مهمة إعادة طلب أو جرد'],
      ['report', 'إصدار تقرير مخزون مختصر']
    ]
  },
  {
    id: 'production',
    name: 'الإنتاج',
    role: 'خطة المصنع والتشغيل',
    agent: 'Production Planner Agent',
    specialty: 'يحول الطلبات إلى خطة إنتاج، يحدد المواد، ويراقب تسليم الدفعات.',
    keywords: ['انتاج', 'إنتاج', 'مصنع', 'تشغيل المصنع', 'دفعة', 'منتج'],
    kpis: ['الدفعات المكتملة', 'الهدر', 'الالتزام بخطة الإنتاج'],
    workflows: [
      ['analysis', 'تحويل الطلب إلى خطة إنتاج'],
      ['task', 'تحديد المواد والمسؤوليات والمواعيد'],
      ['report', 'إصدار تقرير إنتاج يومي']
    ]
  },
  {
    id: 'quality',
    name: 'الجودة',
    role: 'الفحص والمخالفات والإجراءات التصحيحية',
    agent: 'Quality Assurance Agent',
    specialty: 'يفتح NCR، يحدد سبب الخلل، وينشئ إجراء تصحيحي ووقائي.',
    keywords: ['جودة', 'فحص', 'مخالفة', 'خلل', 'تصحيح', 'سلامة'],
    kpis: ['المخالفات المفتوحة', 'زمن إغلاق NCR', 'تكرار الخلل'],
    workflows: [
      ['document', 'فتح نموذج عدم مطابقة NCR'],
      ['task', 'إنشاء إجراء تصحيحي ووقائي CAPA'],
      ['report', 'إصدار تقرير جودة مختصر']
    ]
  },
  {
    id: 'maintenance',
    name: 'الصيانة',
    role: 'الأعطال والوقاية',
    agent: 'Maintenance Response Agent',
    specialty: 'يفتح بلاغ عطل، يرتب الصيانة الوقائية، ويصعد البلاغ عند التأخير.',
    keywords: ['صيانة', 'عطل', 'تعطل', 'آلة', 'معدة', 'وقائي'],
    kpis: ['زمن الاستجابة', 'الأعطال المتكررة', 'نسبة الصيانة الوقائية'],
    workflows: [
      ['task', 'فتح تذكرة صيانة واضحة'],
      ['calendar', 'جدولة صيانة وقائية'],
      ['report', 'توثيق سبب العطل والإجراء']
    ]
  },
  {
    id: 'government',
    name: 'العلاقات الحكومية',
    role: 'السجلات والاشتراطات والمنصات الحكومية',
    agent: 'Government Affairs Agent',
    specialty: 'يجهز متطلبات السجل والرخص والمنصات الحكومية ويوقف أي إجراء يحتاج اعتماد مالك.',
    keywords: ['سجل', 'تجاري', 'وزارة', 'بلدي', 'قوى', 'مدد', 'رخصة', 'حكومي'],
    kpis: ['المعاملات المفتوحة', 'الرخص القريبة من الانتهاء', 'نسبة الإغلاق'],
    workflows: [
      ['analysis', 'تحديد المنصة الحكومية والمتطلبات'],
      ['document', 'تجهيز قائمة مستندات المعاملة'],
      ['approval', 'طلب اعتماد المالك قبل الإرسال أو الدفع']
    ]
  },
  {
    id: 'customer',
    name: 'خدمة العملاء',
    role: 'الشكاوى والردود وتجربة العميل',
    agent: 'Customer Care Agent',
    specialty: 'يفتح تذكرة، يصنف الشكوى، يصيغ ردًا، ويتابع حتى الإغلاق.',
    keywords: ['شكوى', 'عميل', 'رد', 'خدمة العملاء', 'تجربة', 'استفسار'],
    kpis: ['زمن أول رد', 'الشكاوى المغلقة', 'رضا العميل'],
    workflows: [
      ['analysis', 'تصنيف الشكوى حسب الأولوية'],
      ['message', 'صياغة رد احترافي للعميل'],
      ['task', 'إنشاء متابعة حتى الإغلاق']
    ]
  },
  {
    id: 'logistics',
    name: 'اللوجستكس والتوصيل',
    role: 'النقل والتسليم والتتبع',
    agent: 'Logistics Dispatch Agent',
    specialty: 'يرتب التسليم، يحدد الناقل، يتابع الموعد، ويصدر سجل تسليم.',
    keywords: ['توصيل', 'نقل', 'شحن', 'سطحة', 'تسليم', 'مندوب'],
    kpis: ['التسليم في الموعد', 'التأخيرات', 'تكلفة النقل'],
    workflows: [
      ['analysis', 'تحديد مسار النقل والموعد'],
      ['task', 'إسناد التسليم للناقل المناسب'],
      ['report', 'إصدار سجل تسليم ومتابعة']
    ]
  }
];

function buildBody(employee, command, actions) {
  return `# ${employee.agent}\n\nالموظف: ${employee.name}\nالدور: ${employee.role}\nالاختصاص: ${employee.specialty}\n\n## الأمر\n${command}\n\n## ما نفذه الوكيل داخل النظام\n${actions.map((action, index) => `${index + 1}. ${action.title}\n   النوع: ${actionKindLabel[action.kind] || action.kind}\n   الحالة: ${statusLabel[action.status] || action.status}\n   النتيجة: ${action.output}`).join('\n\n')}\n\n## مؤشرات المتابعة\n${employee.kpis.map((kpi) => `- ${kpi}`).join('\n')}\n\n## الحكم الواقعي\nهذا الوكيل ينفذ داخل النظام الآن: إنشاء مهام، مستندات، رسائل جاهزة، تذكيرات، وسجل تدقيق. أي إرسال خارجي أو دفع أو توقيع يبقى متوقفًا على اعتماد صريح وربط API حقيقي.`;
}

function buildActions(employee, command) {
  return employee.workflows.map(([kind, title], index) => ({
    id: uid('action'),
    kind,
    title,
    status: kind === 'approval' ? 'approval' : index === 0 ? 'done' : 'ready',
    output: kind === 'approval'
      ? `تم إيقاف الإجراء الحساس للموظف ${employee.name} لحين اعتمادك.`
      : `تم تجهيز ${title} بناءً على الأمر: ${command}`,
    createdAt: now()
  }));
}

function buildRun(employee, command, source = 'manual') {
  const actions = buildActions(employee, command);
  const run = {
    id: uid('run'),
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    agent: employee.agent,
    command,
    source,
    status: actions.some((action) => action.status === 'approval') ? 'approval' : 'running',
    createdAt: now(),
    actions,
    events: [
      { id: uid('event'), at: now(), title: 'تشغيل الوكيل', detail: `تم تشغيل ${employee.agent} وربطه بالموظف ${employee.name}.` }
    ],
    docs: []
  };
  run.docs = [
    {
      id: uid('doc'),
      title: `تقرير ${employee.name}`,
      fileName: `${safeName(employee.name)}-${safeName(employee.agent)}.md`,
      type: 'report',
      body: buildBody(employee, command, actions),
      createdAt: now()
    },
    {
      id: uid('doc'),
      title: `Checklist ${employee.name}`,
      fileName: `${safeName(employee.name)}-checklist.md`,
      type: 'task',
      body: `# Checklist - ${employee.name}\n\n${actions.map((action) => `- [${action.status === 'done' ? 'x' : ' '}] ${action.title}`).join('\n')}\n\nالأمر: ${command}`,
      createdAt: now()
    }
  ];
  return run;
}

function downloadHref(doc) {
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(doc.body)}`;
}

function matchEmployees(command, selectedEmployeeId) {
  const clean = String(command || '').toLowerCase();
  const matches = employees.filter((employee) => employee.keywords.some((keyword) => clean.includes(keyword.toLowerCase())));
  if (matches.length) return matches;
  return employees.filter((employee) => employee.id === selectedEmployeeId);
}

function Card({ children, className = '' }) {
  return <section className={`glass-card ${className}`}>{children}</section>;
}

function Button({ children, variant = 'primary', ...props }) {
  return <button className={variant === 'secondary' ? 'secondary-action' : 'primary-action'} {...props}>{children}</button>;
}

function Pill({ children, status }) {
  return <span className={`status-pill ${status || ''}`}>{children}</span>;
}

function TopNav({ view, setView }) {
  const items = [['dashboard', 'الرئيسية'], ['employees', 'الموظفون'], ['execution', 'التنفيذ'], ['docs', 'المستندات'], ['audit', 'التدقيق']];
  return <header className="topbar"><button className="brand" onClick={() => setView('dashboard')}><span className="brand-orb" /><span><strong>Focus Flow</strong><small>Employee Agents OS</small></span></button><nav className="desktop-nav">{items.map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}</nav></header>;
}

function MobileNav({ view, setView }) {
  const items = [['dashboard', '⌘', 'الرئيسية'], ['employees', '◎', 'موظفون'], ['execution', '▶', 'تنفيذ'], ['docs', '◫', 'مستندات'], ['audit', '≋', 'تدقيق']];
  return <nav className="mobile-nav">{items.map(([key, icon, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}><span>{icon}</span><small>{label}</small></button>)}</nav>;
}

function EmployeeCard({ employee, selected, onSelect, onRun }) {
  return <article className={`employee-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(employee.id)}>
    <div className="employee-top"><Pill status="ready">مرتبط</Pill><span>{employee.agent}</span></div>
    <h3>{employee.name}</h3>
    <p>{employee.role}</p>
    <small>{employee.specialty}</small>
    <div className="kpi-list">{employee.kpis.map((kpi) => <em key={kpi}>{kpi}</em>)}</div>
    <Button variant="secondary" onClick={(event) => { event.stopPropagation(); onRun(employee.id); }}>تشغيل وكيله</Button>
  </article>;
}

function RunCard({ run, selected, onSelect }) {
  const done = run.actions.filter((action) => action.status === 'done').length;
  return <button className={`run-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(run.id)}>
    <div className="employee-top"><Pill status={run.status}>{statusLabel[run.status] || run.status}</Pill><span>{done}/{run.actions.length}</span></div>
    <h3>{run.employeeName}</h3>
    <p>{run.command}</p>
    <small>{run.agent}</small>
  </button>;
}

export default function EmployeeAgentOS() {
  const [view, setView] = useState('dashboard');
  const [command, setCommand] = useState(DEFAULT_COMMAND);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ceo');
  const [runs, setRuns] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : employees.map((employee) => buildRun(employee, DEFAULT_COMMAND, 'initial-bind'));
    } catch {
      return employees.map((employee) => buildRun(employee, DEFAULT_COMMAND, 'initial-bind'));
    }
  });
  const [selectedRunId, setSelectedRunId] = useState(() => runs[0]?.id);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(runs)); }, [runs]);

  const selectedEmployee = useMemo(() => employees.find((employee) => employee.id === selectedEmployeeId) || employees[0], [selectedEmployeeId]);
  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId) || runs[0], [runs, selectedRunId]);
  const allDocs = useMemo(() => runs.flatMap((run) => run.docs.map((doc) => ({ ...doc, runId: run.id, employeeName: run.employeeName }))), [runs]);
  const selectedDoc = useMemo(() => allDocs.find((doc) => doc.id === selectedDocId) || allDocs[0], [allDocs, selectedDocId]);
  const auditEvents = useMemo(() => runs.flatMap((run) => run.events.map((event) => ({ ...event, run }))).slice().reverse(), [runs]);

  function addRuns(newRuns) {
    setRuns((current) => [...newRuns, ...current]);
    setSelectedRunId(newRuns[0]?.id);
    setSelectedDocId(newRuns[0]?.docs?.[0]?.id || null);
    setView('execution');
  }

  function runEmployee(employeeId = selectedEmployeeId) {
    const employee = employees.find((item) => item.id === employeeId) || selectedEmployee;
    addRuns([buildRun(employee, command, 'single-agent')]);
  }

  function runAuto() {
    const matched = matchEmployees(command, selectedEmployeeId);
    addRuns(matched.map((employee) => buildRun(employee, command, 'auto-dispatch')));
  }

  function runAll() {
    addRuns(employees.map((employee) => buildRun(employee, command || DEFAULT_COMMAND, 'all-agents')));
  }

  function updateSelectedRun(updater) {
    if (!selectedRun) return;
    setRuns((current) => current.map((run) => run.id === selectedRun.id ? updater(run) : run));
  }

  function executeAction(actionId) {
    updateSelectedRun((run) => {
      const employee = employees.find((item) => item.id === run.employeeId) || employees[0];
      const actions = run.actions.map((action) => {
        if (action.id !== actionId) return action;
        if (action.status === 'approval') return { ...action, output: `${action.output} لا يمكن تجاوزه بدون اعتماد.` };
        return { ...action, status: 'done', output: `${action.output}\nتم التنفيذ فعليًا داخل النظام في ${now()}.` };
      });
      const action = run.actions.find((item) => item.id === actionId);
      const resultDoc = {
        id: uid('doc'),
        title: `نتيجة: ${action?.title || 'إجراء'}`,
        fileName: `${safeName(run.employeeName)}-${safeName(action?.title)}.md`,
        type: 'step',
        body: buildBody(employee, run.command, actions),
        createdAt: now()
      };
      return {
        ...run,
        status: actions.some((item) => item.status === 'approval') ? 'approval' : 'running',
        actions,
        docs: [resultDoc, ...run.docs],
        events: [...run.events, { id: uid('event'), at: now(), title: 'تنفيذ إجراء', detail: action?.title || 'إجراء' }]
      };
    });
  }

  function approveAction(actionId) {
    updateSelectedRun((run) => {
      const employee = employees.find((item) => item.id === run.employeeId) || employees[0];
      const actions = run.actions.map((action) => action.id === actionId ? { ...action, status: 'done', output: `${action.output}\nتم الاعتماد والتنفيذ في ${now()}.` } : action);
      const approvalDoc = {
        id: uid('doc'),
        title: 'سجل اعتماد وتنفيذ',
        fileName: `${safeName(run.employeeName)}-approval.md`,
        type: 'approval',
        body: buildBody(employee, run.command, actions),
        createdAt: now()
      };
      return {
        ...run,
        status: actions.every((action) => action.status === 'done') ? 'done' : 'running',
        actions,
        docs: [approvalDoc, ...run.docs],
        events: [...run.events, { id: uid('event'), at: now(), title: 'اعتماد إجراء حساس', detail: 'تم اعتماد الإجراء وتشغيله داخل النظام.' }]
      };
    });
  }

  function resetSystem() {
    const initial = employees.map((employee) => buildRun(employee, DEFAULT_COMMAND, 'reset-bind'));
    setRuns(initial);
    setSelectedRunId(initial[0]?.id);
    setSelectedDocId(initial[0]?.docs?.[0]?.id || null);
    setCommand(DEFAULT_COMMAND);
    setView('dashboard');
  }

  const completedActions = runs.reduce((sum, run) => sum + run.actions.filter((action) => action.status === 'done').length, 0);
  const approvalActions = runs.reduce((sum, run) => sum + run.actions.filter((action) => action.status === 'approval').length, 0);

  return <div className="app-shell">
    <div className="ambient ambient-one" />
    <div className="ambient ambient-two" />
    <TopNav view={view} setView={setView} />
    <div className="app-grid">
      <main className="main-panel">
        {view === 'dashboard' && <div className="view">
          <Card className="hero-card">
            <div className="hero-meta"><span className="live-dot" /> Employee Agent Runtime</div>
            <h1>كل موظف مربوط بوكيل تنفيذ حسب اختصاصه.</h1>
            <p>هذا ليس عرض أسماء فقط. كل وكيل ينشئ إجراءات، مستندات، رسائل، تذكيرات، وسجل تدقيق. الإرسال الخارجي والدفع والتوقيع لا يتم إلا بعد اعتمادك وربط API حقيقي.</p>
            <div className="command-box">
              <textarea value={command} onChange={(event) => setCommand(event.target.value)} placeholder="اكتب أمرًا وسيتم إسناده تلقائيًا للموظف أو الوكيل المناسب." />
              <div className="button-stack">
                <Button onClick={runAuto}>توزيع تلقائي حسب الاختصاص</Button>
                <Button variant="secondary" onClick={runAll}>تشغيل كل الوكلاء</Button>
              </div>
            </div>
          </Card>
          <section className="grid metrics-grid">
            <Card className="metric-card"><span>الموظفون المرتبطون</span><strong>{employees.length}</strong></Card>
            <Card className="metric-card"><span>عمليات الوكلاء</span><strong>{runs.length}</strong></Card>
            <Card className="metric-card"><span>الإجراءات المنفذة</span><strong>{completedActions}</strong></Card>
            <Card className="metric-card"><span>تحتاج اعتماد</span><strong>{approvalActions}</strong></Card>
          </section>
        </div>}

        {view === 'employees' && <div className="view">
          <section className="page-header"><span className="section-eyebrow">Employees Map</span><h1>خريطة الموظفين والوكلاء</h1><p>اختر أي موظف وشغّل وكيله. كل بطاقة مرتبطة بمحرك إجراءات خاص بالدور.</p></section>
          <section className="employee-grid">{employees.map((employee) => <EmployeeCard key={employee.id} employee={employee} selected={employee.id === selectedEmployeeId} onSelect={setSelectedEmployeeId} onRun={runEmployee} />)}</section>
        </div>}

        {view === 'execution' && <div className="view">
          <section className="page-header"><span className="section-eyebrow">Execution Board</span><h1>لوحة تنفيذ الوكلاء</h1><p>اختر عملية، ثم نفّذ الإجراءات أو اعتمد الإجراءات الحساسة.</p></section>
          <section className="execution-layout">
            <Card className="run-list">{runs.map((run) => <RunCard key={run.id} run={run} selected={run.id === selectedRun?.id} onSelect={setSelectedRunId} />)}</Card>
            <Card className="mission-detail">
              {selectedRun ? <>
                <div className="section-header"><div><span className="section-eyebrow">{selectedRun.agent}</span><h2>{selectedRun.employeeName}</h2><p>{selectedRun.command}</p></div><Pill status={selectedRun.status}>{statusLabel[selectedRun.status] || selectedRun.status}</Pill></div>
                <div className="steps-list">{selectedRun.actions.map((action, index) => <article key={action.id} className={`step-card ${action.status}`}><div className="step-index">{index + 1}</div><div className="step-content"><div className="step-topline"><span className="type-badge">{actionKindLabel[action.kind] || action.kind}</span><Pill status={action.status}>{statusLabel[action.status] || action.status}</Pill></div><h4>{action.title}</h4><p>{action.output}</p><small>{action.createdAt}</small><div className="button-row">{action.status === 'approval' ? <Button onClick={() => approveAction(action.id)}>اعتماد وتشغيل</Button> : <Button variant="secondary" onClick={() => executeAction(action.id)} disabled={action.status === 'done'}>{action.status === 'done' ? 'تم التنفيذ' : 'نفذ الآن'}</Button>}</div></div></article>)}</div>
              </> : <p>لا توجد عملية محددة.</p>}
            </Card>
          </section>
        </div>}

        {view === 'docs' && <div className="view">
          <section className="page-header"><span className="section-eyebrow">Document Vault</span><h1>مستندات الوكلاء الفعلية</h1><p>كل تشغيل وكيل ينتج مستندات قابلة للفتح والتحميل والنسخ.</p></section>
          <section className="docs-layout">
            <Card className="doc-list">{allDocs.map((doc) => <button key={doc.id} className={selectedDoc?.id === doc.id ? 'selected' : ''} onClick={() => setSelectedDocId(doc.id)}><strong>{doc.title}</strong><span>{doc.employeeName}</span><small>{doc.fileName}</small></button>)}</Card>
            <Card className="doc-reader">{selectedDoc ? <><div className="section-header"><div><span className="section-eyebrow">{selectedDoc.employeeName}</span><h2>{selectedDoc.title}</h2><p>{selectedDoc.fileName}</p></div></div><div className="button-row"><a className="primary-action small" href={downloadHref(selectedDoc)} download={selectedDoc.fileName}>تحميل .md</a><Button variant="secondary" onClick={() => navigator.clipboard.writeText(selectedDoc.body)}>نسخ</Button></div><article>{selectedDoc.body}</article></> : <p>لا يوجد مستند.</p>}</Card>
          </section>
        </div>}

        {view === 'audit' && <div className="view">
          <section className="page-header"><span className="section-eyebrow">Audit Trail</span><h1>سجل التدقيق</h1><p>أي تشغيل أو اعتماد أو تنفيذ يظهر هنا بزمن واضح.</p></section>
          <Card className="mission-detail"><div className="steps-list">{auditEvents.map((eventItem) => <article key={eventItem.id} className="step-card"><div className="step-index">≋</div><div className="step-content"><h4>{eventItem.title}</h4><p>{eventItem.detail}</p><small>{eventItem.at} — {eventItem.run.employeeName}</small></div></article>)}</div></Card>
        </div>}
      </main>
      <aside className="execution-log glass-card">
        <span className="section-eyebrow">Selected Agent</span>
        <h3>{selectedEmployee.name}</h3>
        <p><strong>Agent</strong><span>{selectedEmployee.agent}</span></p>
        <p><strong>Role</strong><span>{selectedEmployee.role}</span></p>
        <p><strong>Scope</strong><span>{selectedEmployee.specialty}</span></p>
        <Button variant="secondary" onClick={() => runEmployee(selectedEmployee.id)}>تشغيل هذا الوكيل</Button>
        <Button variant="secondary" onClick={resetSystem}>إعادة ضبط الربط</Button>
      </aside>
    </div>
    <MobileNav view={view} setView={setView} />
  </div>;
}
