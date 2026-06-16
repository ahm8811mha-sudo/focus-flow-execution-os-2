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
    outputs: [
      { id: 'o1', type: 'خطة', title: 'ملف تنفيذ تحويل المؤسسة إلى شركة', status: 'جاهز', detail: 'الخطة مقسمة إلى مراحل وخطوات قابلة للمتابعة.' },
      { id: 'o2', type: 'قائمة', title: 'قائمة البيانات الناقصة', status: 'جاهز', detail: 'تحتاج تأكيد نوع الشركة، بيانات الشركاء، وبيانات السجل الحالي.' },
      { id: 'o3', type: 'تذكير', title: 'متابعة حالة الطلب', status: 'مجدول مبدئيًا', detail: 'سيظهر في سجل التنفيذ إلى أن يتم ربط Google Calendar.' }
    ],
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
  const cleanCommand = command.trim();
  const title = cleanCommand.length > 42 ? cleanCommand.slice(0, 42).trim() + '...' : cleanCommand;
  return {
    id: uid('mission'),
    title: title || 'هدف تنفيذي جديد',
    command: cleanCommand,
    status: 'running',
    priority: 'عالية',
    owner: 'AI Execution Agent',
    due: 'يتم تحديده تلقائيًا',
    nextAction: 'جمع المتطلبات والبيانات الناقصة',
    blocker: 'لا يوجد عائق حاليًا',
    createdAt: 'الآن',
    outputs: [
      { id: uid('output'), type: 'خطة', title: 'ملف التنفيذ الرئيسي', status: 'جاهز', detail: 'تم تحويل طلبك إلى Mission وخطوات متابعة.' },
      { id: uid('output'), type: 'قائمة', title: 'البيانات المطلوبة منك', status: 'جاهز', detail: 'سيتم تحديثها كلما اكتشف الوكيل نقصًا أو قرارًا مطلوبًا.' },
      { id: uid('output'), type: 'سجل', title: 'سجل التنفيذ', status: 'نشط', detail: 'أي تطور يظهر مباشرة في سجل هذه المهمة.' }
    ],
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
      'الآن - تم إنشاء صفحة متابعة خاصة لهذا الطلب.'
    ]
  };
}

function progressOf(mission) {
  if (!mission?.steps?.length) return 0;
  const completed = mission.steps.filter((step) => step.status === 'completed').length;
  return Math.round((completed / mission.steps.length) * 100);
}

function getCurrentStep(mission) {
  if (!mission) return null;
  return mission.steps.find((step) => step.status === 'running')
    || mission.steps.find((step) => step.status === 'needs_approval')
    || mission.steps.find((step) => step.status === 'pending')
    || mission.steps[mission.steps.length - 1];
}

function openApprovalsCount(mission) {
  return mission?.approvals?.filter((item) => item.status === 'open').length || 0;
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
    ['progress', 'Progress'],
    ['missions', 'Missions'],
    ['approvals', 'Approvals'],
    ['system', 'System']
  ];

  return (
    <header className="topbar">
      <button className="brand" onClick={() => setActiveView('progress')}>
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
    ['progress', '◉', 'تقدم'],
    ['missions', '◎', 'أهداف'],
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
          اكتب طلبك هنا. بعد الإنشاء ستجده مباشرة في تبويب <strong>تقدم</strong>، وهناك تتابع كل شيء: الخطة، الملفات، الاعتمادات، سجل التنفيذ، والخطوة الحالية.
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
          <span className="section-eyebrow">أين أجد تطور طلبي؟</span>
          <h2>افتح تبويب تقدم</h2>
          <p>هذا هو المكان المركزي لمتابعة كل طلب أنشأته. ستجد النسبة، الخطوة الحالية، المخرجات، الاعتمادات، والسجل.</p>
          <button className="secondary-action" onClick={() => setActiveView('progress')}>فتح لوحة التقدم</button>
        </div>

        <div className="glass-card metrics-card">
          <span className="section-eyebrow">النظام الآن</span>
          <div className="metric-row">
            <strong>{missions.length}</strong>
            <span>Missions نشطة</span>
          </div>
          <div className="metric-row">
            <strong>{missions.reduce((sum, mission) => sum + openApprovalsCount(mission), 0)}</strong>
            <span>موافقات تنتظرك</span>
          </div>
          <div className="metric-row">
            <strong>{selectedMission ? `${progressOf(selectedMission)}%` : '0%'}</strong>
            <span>تقدم آخر طلب</span>
          </div>
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

function ProgressView({ missions, selectedId, setSelectedId, selectedMission, setActiveView, onAdvance, onApprove }) {
  const mission = selectedMission;
  const currentStep = getCurrentStep(mission);
  const progress = progressOf(mission);
  const approvals = mission?.approvals?.filter((approval) => approval.status === 'open') || [];
  const completedSteps = mission?.steps?.filter((step) => step.status === 'completed').length || 0;

  if (!mission) {
    return (
      <main className="view">
        <section className="hero-card glass-card">
          <span className="section-eyebrow">Progress Center</span>
          <h1>لا يوجد طلب بعد.</h1>
          <p>ابدأ من تبويب أمر واكتب هدفك. بعدها سيظهر هنا ملف متابعة كامل.</p>
          <button className="primary-action" onClick={() => setActiveView('command')}>إنشاء طلب جديد</button>
        </section>
      </main>
    );
  }

  return (
    <main className="view">
      <section className="hero-card glass-card">
        <div className="hero-meta"><span className="live-dot" /> مركز متابعة الطلبات</div>
        <h1>هنا تشوف كل تطور لطلبك.</h1>
        <p>هذه الصفحة هي مكان المتابعة الرئيسي. أي طلب تنشئه يتحول إلى Mission وتظهر هنا النسبة، الخطوة الحالية، الملفات، الاعتمادات، وسجل التنفيذ.</p>
        <div className="command-box">
          <select
            value={mission.id}
            onChange={(event) => setSelectedId(event.target.value)}
            style={{ minHeight: 54, borderRadius: 18, padding: '0 16px', color: 'white', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)' }}
          >
            {missions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <button className="primary-action" onClick={() => onAdvance(mission.id)}>شغّل الخطوة التالية</button>
        </div>
      </section>

      <section className="grid two-columns">
        <div className="glass-card next-card">
          <span className="section-eyebrow">الطلب الحالي</span>
          <h2>{mission.title}</h2>
          <p>{mission.command}</p>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="mission-card-bottom">
            <span>{progress}% مكتمل</span>
            <span>{completedSteps} من {mission.steps.length} خطوات</span>
          </div>
        </div>

        <div className="glass-card next-card">
          <span className="section-eyebrow">الخطوة الحالية</span>
          <h2>{currentStep?.title || 'لا توجد خطوة حالية'}</h2>
          <p>{currentStep?.evidence || mission.blocker}</p>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {currentStep && <StatusPill status={currentStep.status} />}
            {currentStep && <TypeBadge type={currentStep.type} />}
          </div>
        </div>
      </section>

      <section className="grid two-columns">
        <div className="glass-card next-card">
          <span className="section-eyebrow">المخرجات الجاهزة</span>
          <h2>كل شيء يجهزه النظام يظهر هنا</h2>
          <div className="steps-list">
            {mission.outputs?.map((output) => (
              <article key={output.id} className="step-card completed">
                <div className="step-index">✦</div>
                <div className="step-content">
                  <div className="step-topline"><TypeBadge type="document" /><span className="priority">{output.status}</span></div>
                  <h4>{output.title}</h4>
                  <p>{output.detail}</p>
                  <small>{output.type}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-card next-card">
          <span className="section-eyebrow">الموافقات المطلوبة منك</span>
          <h2>{approvals.length ? `${approvals.length} موافقة تنتظرك` : 'لا يوجد عائق حاليًا'}</h2>
          <div className="steps-list">
            {approvals.length ? approvals.map((approval) => (
              <article key={approval.id} className="step-card needs_approval">
                <div className="step-index">✓</div>
                <div className="step-content">
                  <div className="step-topline"><span className="risk-badge">{approval.risk}</span><StatusPill status="needs_approval" /></div>
                  <h4>{approval.title}</h4>
                  <p>{approval.detail}</p>
                  <button className="primary-action small" style={{ marginTop: 14 }} onClick={() => onApprove(mission.id, approval.id)}>اعتماد الآن</button>
                </div>
              </article>
            )) : (
              <article className="step-card completed">
                <div className="step-index">✓</div>
                <div className="step-content">
                  <h4>التنفيذ غير متوقف</h4>
                  <p>اضغط شغّل الخطوة التالية لمتابعة تقدم الطلب داخل النسخة الحالية.</p>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="glass-card mission-detail">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Execution Log</span>
            <h2>سجل التنفيذ لهذا الطلب</h2>
          </div>
          <button className="secondary-action" onClick={() => setActiveView('missions')}>فتح الخطة التفصيلية</button>
        </div>
        <div className="steps-list">
          {mission.logs.slice().reverse().map((log, index) => (
            <article key={`${log}-${index}`} className="step-card">
              <div className="step-index">{mission.logs.length - index}</div>
              <div className="step-content">
                <h4>{log}</h4>
                <p>{mission.title}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
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
          <p>هنا تجد الخطة التفصيلية الكاملة لكل هدف. لمتابعة التطور اليومي افتح تبويب تقدم.</p>
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
        {approvals.filter((approval) => approval.status === 'open').map((approval) => (
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
        {!approvals.some((approval) => approval.status === 'open') && (
          <article className="approval-card glass-card">
            <div>
              <span className="risk-badge">واضح</span>
              <h2>لا توجد موافقات مفتوحة</h2>
              <p>ارجع إلى تبويب تقدم وشغّل الخطوة التالية.</p>
            </div>
          </article>
        )}
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

function nextMissionState(mission) {
  const steps = [...mission.steps];
  const activeIndex = steps.findIndex((step) => step.status === 'running' || step.status === 'pending');

  if (activeIndex === -1) {
    return {
      ...mission,
      status: 'completed',
      blocker: 'اكتملت جميع الخطوات المتاحة داخل النسخة الحالية',
      nextAction: 'مراجعة النتائج والمخرجات',
      logs: [...mission.logs, 'الآن - لا توجد خطوات إضافية قابلة للتشغيل داخل الواجهة.']
    };
  }

  const completedStep = steps[activeIndex];
  steps[activeIndex] = {
    ...completedStep,
    status: 'completed',
    evidence: `${completedStep.evidence} تم تحديثها كمكتملة داخل لوحة التقدم.`
  };

  const nextIndex = steps.findIndex((step, index) => index > activeIndex && step.status === 'pending');
  let nextAction = 'مراجعة النتائج والمخرجات';
  let blocker = 'لا يوجد عائق حاليًا';

  if (nextIndex !== -1) {
    if (steps[nextIndex].type === 'approval') {
      steps[nextIndex] = { ...steps[nextIndex], status: 'needs_approval' };
      nextAction = steps[nextIndex].title;
      blocker = 'ينتظر موافقتك قبل الاستمرار';
    } else {
      steps[nextIndex] = { ...steps[nextIndex], status: 'running' };
      nextAction = steps[nextIndex].title;
    }
  }

  return {
    ...mission,
    steps,
    nextAction,
    blocker,
    outputs: [
      ...(mission.outputs || []),
      { id: uid('output'), type: actionTypes[completedStep.type] || 'تحديث', title: `نتيجة: ${completedStep.title}`, status: 'تم التحديث', detail: completedStep.evidence }
    ],
    logs: [...mission.logs, `الآن - تم تحديث خطوة: ${completedStep.title}.`]
  };
}

export default function App() {
  const [activeView, setActiveView] = useState('progress');
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

  useEffect(() => {
    if (!selectedId && missions[0]) setSelectedId(missions[0].id);
  }, [missions, selectedId]);

  const selectedMission = useMemo(() => missions.find((mission) => mission.id === selectedId) || missions[0], [missions, selectedId]);

  function createMission() {
    if (!command.trim()) return;
    const mission = buildMission(command);
    setMissions((current) => [mission, ...current]);
    setSelectedId(mission.id);
    setCommand('');
    setActiveView('progress');
  }

  function advanceMission(missionId) {
    setMissions((current) => current.map((mission) => mission.id === missionId ? nextMissionState(mission) : mission));
    setActiveView('progress');
  }

  function approve(missionId, approvalId) {
    setMissions((current) => current.map((mission) => {
      if (mission.id !== missionId) return mission;
      const steps = mission.steps.map((step) => step.status === 'needs_approval' ? { ...step, status: 'completed', evidence: 'تمت الموافقة من المستخدم.' } : step);
      const nextIndex = steps.findIndex((step) => step.status === 'pending');
      if (nextIndex !== -1) steps[nextIndex] = { ...steps[nextIndex], status: 'running' };

      return {
        ...mission,
        blocker: 'لا يوجد عائق حاليًا',
        nextAction: nextIndex !== -1 ? steps[nextIndex].title : 'مراجعة النتائج والمخرجات',
        approvals: mission.approvals.map((approval) => approval.id === approvalId ? { ...approval, status: 'approved' } : approval),
        steps,
        outputs: [
          ...(mission.outputs || []),
          { id: uid('output'), type: 'موافقة', title: 'تم اعتماد خطوة حساسة', status: 'معتمد', detail: 'تمت الموافقة من المستخدم ويمكن متابعة التنفيذ.' }
        ],
        logs: [...mission.logs, 'الآن - تم اعتماد خطوة حساسة من المستخدم.']
      };
    }));
    setActiveView('progress');
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
          {activeView === 'progress' && (
            <ProgressView
              missions={missions}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              selectedMission={selectedMission}
              setActiveView={setActiveView}
              onAdvance={advanceMission}
              onApprove={approve}
            />
          )}
          {activeView === 'missions' && (
            <MissionsView missions={missions} selectedId={selectedId} setSelectedId={setSelectedId} />
          )}
          {activeView === 'approvals' && <ApprovalsView missions={missions} onApprove={approve} />}
          {activeView === 'system' && <SystemView />}
        </div>
        <ExecutionLog missions={missions} />
      </div>

      <MobileNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
