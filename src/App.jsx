import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'focus-flow-execution-os-v2';

const statusLabels = {
  pending: 'بانتظار البدء',
  running: 'قيد التنفيذ',
  needs_approval: 'يحتاج موافقتك',
  completed: 'مكتمل',
  failed: 'فشل',
  blocked: 'متوقف'
};

const actionTypes = {
  internal: 'تنفيذ داخلي',
  browser: 'متصفح آلي',
  approval: 'موافقة',
  document: 'مستند',
  calendar: 'جدولة'
};

const seedMissions = [
  {
    id: 'mission-company-conversion',
    title: 'تحويل المؤسسة إلى شركة',
    command: 'أبغى أحول مؤسستي إلى شركة في السعودية بخطوات واضحة ومضمونة.',
    status: 'running',
    priority: 'عالية',
    owner: 'AI Executive Agent',
    due: 'خلال 14 يوم',
    nextAction: 'تأكيد نوع الشركة والبيانات المطلوبة',
    blocker: 'ينتظر موافقتك على نوع الكيان',
    createdAt: 'اليوم 09:00',
    steps: [
      { id: 's1', title: 'تحليل الطلب وتحديد المسار النظامي', type: 'internal', status: 'completed', time: 'اليوم 09:00', evidence: 'تم تحديد المسار: تحويل مؤسسة إلى شركة.' },
      { id: 's2', title: 'استخراج المتطلبات والمستندات المطلوبة', type: 'browser', status: 'completed', time: 'اليوم 09:15', evidence: 'تم تجهيز قائمة بيانات أولية.' },
      { id: 's3', title: 'تأكيد نوع الشركة المناسب', type: 'approval', status: 'needs_approval', time: 'اليوم 10:00', evidence: 'يحتاج اختيار: ذات مسؤولية محدودة أو شركة شخص واحد.' },
      { id: 's4', title: 'تجهيز مسودة عقد التأسيس', type: 'document', status: 'pending', time: 'غدًا 09:30', evidence: 'سيتم توليد مسودة قابلة للمراجعة.' },
      { id: 's5', title: 'فتح منصة الخدمة وتجهيز نموذج الطلب', type: 'browser', status: 'pending', time: 'غدًا 11:00', evidence: 'يتوقف عند تسجيل الدخول أو OTP.' },
      { id: 's6', title: 'متابعة حالة الطلب حتى الإغلاق', type: 'calendar', status: 'pending', time: 'بعد 3 أيام', evidence: 'سيتم إنشاء تذكير متابعة تلقائي.' }
    ],
    approvals: [
      { id: 'a1', title: 'اعتماد نوع الشركة', detail: 'اختر نوع الكيان قبل تجهيز عقد التأسيس.', status: 'open', risk: 'قرار نظامي' }
    ],
    logs: [
      '09:00 - تم إنشاء Mission من طلب المستخدم.',
      '09:04 - تم تحويل الهدف إلى 6 خطوات تنفيذية.',
      '09:15 - Browser Agent جهز قائمة المتطلبات.',
      '09:22 - توقف التنفيذ عند قرار يحتاج موافقة المستخدم.'
    ]
  }
];

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildMission(command) {
  const title = command.length > 42 ? command.slice(0, 42).trim() + '...' : command.trim();
  return {
    id: uid('mission'),
    title: title || 'هدف تنفيذي جديد',
    command,
    status: 'running',
    priority: 'عالية',
    owner: 'AI Execution Agent',
    due: 'يتم تحديده تلقائيًا',
    nextAction: 'مراجعة خطة التنفيذ واعتماد نقطة البداية',
    blocker: 'ينتظر اعتمادك للبدء في الخطوات الحساسة',
    createdAt: 'الآن',
    steps: [
      { id: uid('step'), title: 'فهم الهدف وتحويله إلى Mission', type: 'internal', status: 'completed', time: 'الآن', evidence: 'تم تحليل الطلب واستخراج النتيجة المطلوبة.' },
      { id: uid('step'), title: 'بناء خطة تنفيذ مضمونة متعددة المراحل', type: 'internal', status: 'completed', time: 'الآن', evidence: 'تم إنشاء خطة أولية قابلة للتعديل.' },
      { id: uid('step'), title: 'جمع المتطلبات والبيانات الناقصة', type: 'browser', status: 'running', time: 'بعد قليل', evidence: 'Browser Agent جاهز للبحث والتحقق.' },
      { id: uid('step'), title: 'تجهيز المستندات أو الرسائل المطلوبة', type: 'document', status: 'pending', time: 'اليوم', evidence: 'سيتم إنشاء مسودات قابلة للمراجعة.' },
      { id: uid('step'), title: 'طلب موافقتك عند نقطة قانونية أو مالية', type: 'approval', status: 'needs_approval', time: 'عند الحاجة', evidence: 'النظام لا يرسل أو يدفع أو يوقّع بدون إذنك.' },
      { id: uid('step'), title: 'متابعة التنفيذ حتى الإغلاق', type: 'calendar', status: 'pending', time: 'مجدولة', evidence: 'سيتم إنشاء تذكيرات وسجل متابعة.' }
    ],
    approvals: [
      { id: uid('approval'), title: 'اعتماد بدء التنفيذ', detail: 'راجع الخطة الأولية ثم اسمح للنظام بالبدء في الخطوات التالية.', status: 'open', risk: 'موافقة تشغيل' }
    ],
    logs: [
      'الآن - تم استلام الأمر.',
      'الآن - تم تحويل الأمر إلى Mission تنفيذية.',
      'الآن - تم إنشاء خطوات تنفيذية وحالات متابعة.',
      'الآن - تم إنشاء بند موافقة قبل أي إجراء حساس.'
    ]
  };
}

function progressOf(mission) {
  if (!mission.steps.length) return 0;
  const completed = mission.steps.filter((step) => step.status === 'completed').length;
  return Math.round((completed / mission.steps.length) * 100);
}

function StatusPill({ status }) {
  return <span className={`status-pill ${status}`}>{statusLabels[status] || status}</span>;
}

function TypeBadge({ type }) {
  return <span className={`type-badge ${type}`}>{actionTypes[type] || type}</span>;
}

function TopBar({ activeView, setActiveView }) {
  const items = [
    ['command', 'Command'],
    ['missions', 'Missions'],
    ['agent', 'Browser Agent'],
    ['approvals', 'Approvals'],
    ['system', 'System']
  ];

  return (
    <header className="topbar">
      <button className="brand" onClick={() => setActiveView('command')}>
        <span className="brand-orb" />
        <span>
          <strong>Focus Flow</strong>
          <small>Execution OS</small>
        </span>
      </button>
      <nav className="desktop-nav">
        {items.map(([id, label]) => (
          <button key={id} className={activeView === id ? 'active' : ''} onClick={() => setActiveView(id)}>
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function MobileNav({ activeView, setActiveView }) {
  const items = [
    ['command', '⌘', 'أمر'],
    ['missions', '◎', 'أهداف'],
    ['agent', '◈', 'وكيل'],
    ['approvals', '✓', 'اعتماد'],
    ['system', '⚙', 'نظام']
  ];

  return (
    <nav className="mobile-nav">
      {items.map(([id, icon, label]) => (
        <button key={id} className={activeView === id ? 'active' : ''} onClick={() => setActiveView(id)}>
          <span>{icon}</span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}

function CommandCenter({ command, setCommand, onCreate, missions, selectedMission, setActiveView }) {
  return (
    <main className="view command-view">
      <section className="hero-card glass-card">
        <div className="hero-meta">
          <span className="live-dot" /> AI Execution Command Center
        </div>
        <h1>اطلب الهدف، والنظام يدير التنفيذ.</h1>
        <p>
          Focus Flow لم يعد تطبيق مهام. هو نظام يحول أوامرك الكبيرة إلى Missions وخطوات تنفيذية وموافقات وسجل متابعة حتى الإغلاق.
        </p>
        <div className="command-box">
          <textarea
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="مثال: أبغى أنشئ شركة وأحتاج النظام يحلل المتطلبات، يجهز الخطوات، يجدول الإجراءات، ويتابع معي حتى الانتهاء."
          />
          <button className="primary-action" onClick={onCreate}>حوّل الطلب إلى Mission</button>
        </div>
      </section>

      <section className="grid two-columns">
        <div className="glass-card next-card">
          <span className="section-eyebrow">الإجراء التالي</span>
          <h2>{selectedMission?.nextAction || 'لا يوجد إجراء نشط'}</h2>
          <p>{selectedMission?.blocker || 'ابدأ بكتابة أمر تنفيذي جديد.'}</p>
          <button className="secondary-action" onClick={() => setActiveView('missions')}>فتح ملف التنفيذ</button>
        </div>

        <div className="glass-card metrics-card">
          <span className="section-eyebrow">النظام الآن</span>
          <div className="metric-row">
            <strong>{missions.length}</strong>
            <span>Missions نشطة</span>
          </div>
          <div className="metric-row">
            <strong>{missions.reduce((sum, mission) => sum + mission.approvals.filter((item) => item.status === 'open').length, 0)}</strong>
            <span>موافقات تنتظرك</span>
          </div>
          <div className="metric-row">
            <strong>Supervised</strong>
            <span>Browser Automation</span>
          </div>
        </div>
      </section>

      <section className="glass-card mission-strip">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Missions</span>
            <h2>الأهداف التنفيذية النشطة</h2>
          </div>
          <button className="ghost-action" onClick={() => setActiveView('missions')}>عرض الكل</button>
        </div>
        <div className="mission-list compact">
          {missions.slice(0, 3).map((mission) => <MissionCard key={mission.id} mission={mission} compact />)}
        </div>
      </section>
    </main>
  );
}

function MissionCard({ mission, onSelect, compact = false }) {
  const progress = progressOf(mission);
  return (
    <button className={`mission-card ${compact ? 'compact' : ''}`} onClick={() => onSelect?.(mission.id)}>
      <div className="mission-card-top">
        <StatusPill status={mission.status} />
        <span className="priority">{mission.priority}</span>
      </div>
      <h3>{mission.title}</h3>
      <p>{mission.command}</p>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="mission-card-bottom">
        <span>{progress}% مكتمل</span>
        <span>{mission.due}</span>
      </div>
    </button>
  );
}

function MissionsView({ missions, selectedId, setSelectedId }) {
  const selectedMission = missions.find((mission) => mission.id === selectedId) || missions[0];
  return (
    <main className="view missions-view">
      <section className="section-header page-header">
        <div>
          <span className="section-eyebrow">Mission Control</span>
          <h1>Missions وليست مشاريع عادية</h1>
          <p>كل أمر يتحول إلى ملف تنفيذي حي له خطة، حالات، موافقات، Browser Agent، وسجل تنفيذ.</p>
        </div>
      </section>

      <div className="missions-layout">
        <aside className="mission-list glass-card">
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} onSelect={setSelectedId} />
          ))}
        </aside>
        {selectedMission && <MissionDetail mission={selectedMission} />}
      </div>
    </main>
  );
}

function MissionDetail({ mission }) {
  const progress = progressOf(mission);
  return (
    <section className="mission-detail glass-card">
      <div className="mission-hero">
        <div>
          <span className="section-eyebrow">Active Mission</span>
          <h2>{mission.title}</h2>
          <p>{mission.command}</p>
        </div>
        <div className="progress-orb">
          <strong>{progress}%</strong>
          <span>progress</span>
        </div>
      </div>

      <div className="mission-summary-grid">
        <div><small>الحالة</small><StatusPill status={mission.status} /></div>
        <div><small>المسؤول</small><strong>{mission.owner}</strong></div>
        <div><small>الإجراء التالي</small><strong>{mission.nextAction}</strong></div>
        <div><small>العائق</small><strong>{mission.blocker}</strong></div>
      </div>

      <ExecutionPlan mission={mission} />
    </section>
  );
}

function ExecutionPlan({ mission }) {
  return (
    <div className="execution-plan">
      <div className="section-header slim">
        <div>
          <span className="section-eyebrow">Execution Plan</span>
          <h3>الخطة التنفيذية</h3>
        </div>
      </div>
      <div className="steps-list">
        {mission.steps.map((step, index) => (
          <article key={step.id} className={`step-card ${step.status}`}>
            <div className="step-index">{index + 1}</div>
            <div className="step-content">
              <div className="step-topline">
                <TypeBadge type={step.type} />
                <StatusPill status={step.status} />
              </div>
              <h4>{step.title}</h4>
              <p>{step.evidence}</p>
              <small>{step.time}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function BrowserAgentView({ missions }) {
  const browserSteps = missions.flatMap((mission) => mission.steps.filter((step) => step.type === 'browser').map((step) => ({ ...step, missionTitle: mission.title })));
  return (
    <main className="view agent-view">
      <section className="browser-hero glass-card">
        <div>
          <span className="section-eyebrow">Supervised Browser Automation</span>
          <h1>Browser Agent ينفذ، ويتوقف عند الحسّاس.</h1>
          <p>الوكيل يستطيع فتح المواقع، استخراج المتطلبات، تجهيز النماذج، وتوثيق النتائج. يتوقف عند تسجيل الدخول، OTP، الدفع، التوقيع، أو الإرسال النهائي.</p>
        </div>
        <div className="agent-status-console">
          <span className="console-dot" />
          <strong>Ready</strong>
          <small>Human approval required for sensitive actions</small>
        </div>
      </section>

      <section className="grid two-columns">
        <div className="glass-card">
          <span className="section-eyebrow">Capabilities</span>
          <div className="capability-list">
            <span>فتح المواقع الرسمية</span>
            <span>قراءة المتطلبات</span>
            <span>تعبئة النماذج المبدئية</span>
            <span>التقاط Evidence</span>
            <span>تحديث حالة Mission</span>
            <span>التوقف عند المخاطر</span>
          </div>
        </div>
        <div className="glass-card warning-card">
          <span className="section-eyebrow">Safety Gates</span>
          <h2>لا دفع، لا توقيع، لا إرسال نهائي بدون إذنك.</h2>
          <p>هذه هي الصيغة الصحيحة: تنفيذ آلي بإشرافك وليس وكيل حر يضغط كل شيء.</p>
        </div>
      </section>

      <section className="glass-card">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Browser Queue</span>
            <h2>خطوات المتصفح الآلي</h2>
          </div>
        </div>
        <div className="steps-list">
          {browserSteps.map((step) => (
            <article key={step.id} className={`step-card ${step.status}`}>
              <div className="step-index">◈</div>
              <div className="step-content">
                <div className="step-topline"><strong>{step.missionTitle}</strong><StatusPill status={step.status} /></div>
                <h4>{step.title}</h4>
                <p>{step.evidence}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ApprovalsView({ missions, onApprove }) {
  const approvals = missions.flatMap((mission) => mission.approvals.map((approval) => ({ ...approval, missionId: mission.id, missionTitle: mission.title })));
  return (
    <main className="view approvals-view">
      <section className="page-header section-header">
        <div>
          <span className="section-eyebrow">Approval Queue</span>
          <h1>النظام لا يزعجك إلا عند القرار.</h1>
          <p>أي خطوة قانونية، مالية، تسجيل دخول، أو إرسال نهائي تظهر هنا قبل أن يكمل الوكيل التنفيذ.</p>
        </div>
      </section>

      <section className="approval-list">
        {approvals.map((approval) => (
          <article key={approval.id} className="approval-card glass-card">
            <div>
              <span className="risk-badge">{approval.risk}</span>
              <h2>{approval.title}</h2>
              <p>{approval.detail}</p>
              <small>{approval.missionTitle}</small>
            </div>
            <button className="primary-action small" onClick={() => onApprove(approval.missionId, approval.id)}>
              اعتماد
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

function SystemView() {
  const integrations = [
    ['AI Planner', 'يحوّل الأوامر إلى Missions وخطط تنفيذية', 'Ready'],
    ['Browser Worker', 'Playwright / cloud browser لاحقًا للتنفيذ الحقيقي', 'Planned'],
    ['Google Calendar', 'جدولة المواعيد والمتابعات', 'Planned'],
    ['Gmail', 'تجهيز رسائل ومتابعات بريدية', 'Planned'],
    ['Supabase', 'قاعدة بيانات ومزامنة بين الأجهزة', 'Planned'],
    ['Evidence Vault', 'حفظ لقطات وإثباتات التنفيذ', 'Ready UI']
  ];

  return (
    <main className="view system-view">
      <section className="page-header section-header">
        <div>
          <span className="section-eyebrow">System Architecture</span>
          <h1>الهيكل الجديد واضح: Command → Mission → Execution.</h1>
          <p>هذه النسخة تضع الواجهة والمنتج في الاتجاه الصحيح، وتجهز مكان التكاملات الحقيقية لاحقًا.</p>
        </div>
      </section>

      <section className="system-grid">
        {integrations.map(([name, description, state]) => (
          <article key={name} className="glass-card integration-card">
            <div className="integration-icon">✦</div>
            <h2>{name}</h2>
            <p>{description}</p>
            <span>{state}</span>
          </article>
        ))}
      </section>
    </main>
  );
}

function ExecutionLog({ missions }) {
  const logs = missions.flatMap((mission) => mission.logs.map((log) => ({ mission: mission.title, log })));
  return (
    <aside className="execution-log glass-card">
      <span className="section-eyebrow">Execution Log</span>
      <h3>سجل التنفيذ</h3>
      <div>
        {logs.slice(-8).reverse().map((item, index) => (
          <p key={`${item.mission}-${index}`}><strong>{item.mission}</strong><span>{item.log}</span></p>
        ))}
      </div>
    </aside>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('command');
  const [command, setCommand] = useState('');
  const [missions, setMissions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : seedMissions;
    } catch {
      return seedMissions;
    }
  });
  const [selectedId, setSelectedId] = useState(() => seedMissions[0]?.id);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  }, [missions]);

  const selectedMission = useMemo(() => missions.find((mission) => mission.id === selectedId) || missions[0], [missions, selectedId]);

  function createMission() {
    if (!command.trim()) return;
    const mission = buildMission(command);
    setMissions((current) => [mission, ...current]);
    setSelectedId(mission.id);
    setCommand('');
    setActiveView('missions');
  }

  function approve(missionId, approvalId) {
    setMissions((current) => current.map((mission) => {
      if (mission.id !== missionId) return mission;
      return {
        ...mission,
        blocker: 'لا يوجد عائق حاليًا',
        nextAction: 'تشغيل الخطوة التالية في خطة التنفيذ',
        approvals: mission.approvals.map((approval) => approval.id === approvalId ? { ...approval, status: 'approved' } : approval),
        steps: mission.steps.map((step) => step.status === 'needs_approval' ? { ...step, status: 'completed', evidence: 'تمت الموافقة من المستخدم.' } : step),
        logs: [...mission.logs, 'الآن - تم اعتماد خطوة حساسة من المستخدم.']
      };
    }));
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <TopBar activeView={activeView} setActiveView={setActiveView} />

      <div className="app-grid">
        <div className="main-panel">
          {activeView === 'command' && (
            <CommandCenter
              command={command}
              setCommand={setCommand}
              onCreate={createMission}
              missions={missions}
              selectedMission={selectedMission}
              setActiveView={setActiveView}
            />
          )}
          {activeView === 'missions' && (
            <MissionsView missions={missions} selectedId={selectedId} setSelectedId={setSelectedId} />
          )}
          {activeView === 'agent' && <BrowserAgentView missions={missions} />}
          {activeView === 'approvals' && <ApprovalsView missions={missions} onApprove={approve} />}
          {activeView === 'system' && <SystemView />}
        </div>
        <ExecutionLog missions={missions} />
      </div>

      <MobileNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
