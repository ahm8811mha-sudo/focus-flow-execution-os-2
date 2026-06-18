import { useEffect, useMemo, useState } from 'react';

const KEY = 'focus-flow-real-docs-v1';
const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
const statusText = { pending: 'بانتظار', running: 'قيد التنفيذ', completed: 'مكتمل', approval: 'موافقة', ready: 'جاهز', canceled: 'ملغاة' };
const docType = { plan: 'خطة تنفيذ', requirements: 'متطلبات', approvals: 'موافقات', report: 'تقرير', step: 'نتيجة خطوة' };
const safeName = (value) => String(value || 'document').replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, '-').slice(0, 70);

function Badge({ value }) {
  return <span className={`status-pill ${value}`}>{statusText[value] || value}</span>;
}
function TypeBadge({ value }) {
  return <span className="type-badge document">{docType[value] || value}</span>;
}
function Card({ children, className = '' }) {
  return <section className={`glass-card ${className}`}>{children}</section>;
}
function event(action, title, detail) {
  return { id: uid('event'), action, title, detail, at: now() };
}
function progress(mission) {
  const active = mission.steps.filter((s) => s.status !== 'canceled');
  if (!active.length) return 0;
  return Math.round((active.filter((s) => s.status === 'completed').length / active.length) * 100);
}
function makeDoc(mission, type, title, body) {
  return {
    id: uid('doc'),
    type,
    title,
    fileName: `${safeName(mission.title)}-${type}.md`,
    status: 'ready',
    createdAt: now(),
    body
  };
}
function buildDocuments(mission) {
  const stepsText = mission.steps.map((s, index) => `${index + 1}. ${s.title}\n   الحالة: ${statusText[s.status] || s.status}\n   النتيجة: ${s.result || s.note || 'بانتظار التنفيذ'}`).join('\n\n');
  return [
    makeDoc(mission, 'plan', 'خطة التنفيذ متعددة المراحل', `# خطة التنفيذ متعددة المراحل\n\nالمهمة: ${mission.title}\nالأمر: ${mission.command}\nتاريخ الإنشاء: ${mission.createdAt}\n\n## الهدف\nترتيب الطلب في ملف تنفيذ واضح بدلاً من بطاقات عشوائية.\n\n## المراحل\n${stepsText}\n\n## قاعدة التنفيذ\nلا يتم تجاوز أي موافقة أو إجراء حساس إلا بعد قرار المستخدم.`),
    makeDoc(mission, 'requirements', 'قائمة المتطلبات والبيانات الناقصة', `# قائمة المتطلبات والبيانات الناقصة\n\nالمهمة: ${mission.title}\n\n## بيانات مطلوبة\n- رقم السجل التجاري الحالي.\n- نوع الشركة المطلوبة.\n- بيانات المالك أو الشركاء.\n- النشاط التجاري.\n- العنوان الوطني.\n- بيانات التواصل.\n\n## أسئلة يجب تأكيدها\n1. هل الشركة شخص واحد أم ذات مسؤولية محدودة؟\n2. هل يوجد شركاء؟\n3. هل سيتم تغيير الاسم أو النشاط؟\n4. هل توجد عقود أو عمالة يجب نقلها؟`),
    makeDoc(mission, 'approvals', 'مصفوفة الموافقات', `# مصفوفة الموافقات\n\n${mission.approvals.map((a) => `- ${a.title}: ${a.state} — ${a.detail}`).join('\n')}\n\nلا يتم تجاوز أي بند موافقة بدون قرار صريح.`),
    makeDoc(mission, 'report', 'تقرير التنفيذ الحالي', `# تقرير التنفيذ الحالي\n\nالمهمة: ${mission.title}\nالنسبة: ${progress(mission)}%\nآخر تحديث: ${now()}\n\n## آخر الأحداث\n${mission.events.slice(-12).map((e) => `- ${e.at}: ${e.action} — ${e.title} — ${e.detail}`).join('\n')}`)
  ];
}
function createMission(command) {
  const title = command.length > 46 ? `${command.slice(0, 46)}...` : command;
  const mission = {
    id: uid('mission'),
    title: title || 'مهمة جديدة',
    command,
    createdAt: now(),
    status: 'running',
    events: [event('CREATE', 'إنشاء ملف تنفيذ', 'تم إنشاء المهمة والخطة والمستندات')],
    approvals: [{ id: uid('approval'), title: 'اعتماد بدء التنفيذ', detail: 'الموافقة قبل أي خطوة حساسة', state: 'مفتوحة' }],
    steps: [
      { id: uid('step'), title: 'تحليل الهدف', status: 'completed', note: 'تم فهم الطلب وتحويله إلى ملف تنفيذ.' },
      { id: uid('step'), title: 'بناء الخطة متعددة المراحل', status: 'completed', note: 'تم إنشاء خطة فعلية قابلة للفتح.' },
      { id: uid('step'), title: 'جمع المتطلبات والبيانات الناقصة', status: 'running', note: 'ينتج مستند متطلبات فعلي.' },
      { id: uid('step'), title: 'تجهيز المستندات والمسودات', status: 'pending', note: 'ينتج مسودات قابلة للتحميل.' },
      { id: uid('step'), title: 'مراجعة الموافقات', status: 'approval', note: 'تتوقف عند قرار المستخدم.' },
      { id: uid('step'), title: 'تقرير الإغلاق والمتابعة', status: 'pending', note: 'ينتج تقرير نهائي.' }
    ],
    docs: []
  };
  mission.docs = buildDocuments(mission);
  return mission;
}
function normalizeMission(mission) {
  if (!mission?.docs?.length) return { ...mission, docs: buildDocuments(mission) };
  return mission;
}
function downloadHref(doc) {
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(doc.body)}`;
}
async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function Top({ view, setView }) {
  const items = [['command', 'أمر'], ['workspace', 'ملف التنفيذ'], ['docs', 'المستندات'], ['plan', 'الخطة'], ['audit', 'تدقيق']];
  return <header className="topbar"><button className="brand" onClick={() => setView('workspace')}><span className="brand-orb" /><span><strong>Focus Flow</strong><small>Real Documents</small></span></button><nav className="desktop-nav">{items.map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}</nav></header>;
}
function Bottom({ view, setView }) {
  const items = [['command', '⌘', 'أمر'], ['workspace', '◎', 'ملف'], ['docs', '◫', 'مستندات'], ['plan', '◇', 'خطة'], ['audit', '≋', 'تدقيق']];
  return <nav className="mobile-nav">{items.map(([key, icon, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}><span>{icon}</span><small>{label}</small></button>)}</nav>;
}

export default function EnhancedApp() {
  const [view, setView] = useState('workspace');
  const [command, setCommand] = useState('تحويل المؤسسة إلى شركة في السعودية');
  const [missions, setMissions] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY);
      return stored ? JSON.parse(stored).map(normalizeMission) : [createMission('تحويل المؤسسة إلى شركة في السعودية')];
    } catch {
      return [createMission('تحويل المؤسسة إلى شركة في السعودية')];
    }
  });
  const [missionId, setMissionId] = useState(missions[0]?.id);
  const [docId, setDocId] = useState(null);
  const mission = useMemo(() => missions.find((m) => m.id === missionId) || missions[0], [missions, missionId]);
  const selectedDoc = useMemo(() => mission.docs.find((d) => d.id === docId) || mission.docs[0], [mission, docId]);
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(missions)), [missions]);

  function updateMission(updater) {
    setMissions((all) => all.map((m) => m.id === mission.id ? updater(m) : m));
  }
  function createNewMission() {
    const next = createMission(command);
    setMissions((all) => [next, ...all]);
    setMissionId(next.id);
    setDocId(next.docs[0]?.id);
    setView('workspace');
  }
  function refreshDocuments() {
    updateMission((m) => {
      const next = { ...m, events: [...m.events, event('GENERATE_DOCS', 'توليد المستندات', 'تم إعادة بناء المستندات من بيانات المهمة')] };
      return { ...next, docs: buildDocuments(next) };
    });
    setView('docs');
  }
  function runStep(stepId) {
    updateMission((m) => {
      const step = m.steps.find((s) => s.id === stepId) || m.steps.find((s) => s.status === 'running' || s.status === 'pending');
      if (!step) return m;
      if (step.status === 'approval') {
        return { ...m, events: [...m.events, event('BLOCKED', 'موافقة مطلوبة', step.title)] };
      }
      const steps = m.steps.map((s) => s.id === step.id ? { ...s, status: 'completed', result: `تم تنفيذ ${s.title} وإنشاء مستند نتيجة.` } : s);
      const resultDoc = makeDoc(m, 'step', `نتيجة: ${step.title}`, `# نتيجة خطوة\n\nالمهمة: ${m.title}\nالخطوة: ${step.title}\nوقت التنفيذ: ${now()}\n\nتم تنفيذ الخطوة وإنتاج هذا المستند فعليًا داخل Document Vault.`);
      const next = { ...m, steps, docs: [...m.docs, resultDoc], events: [...m.events, event('RUN_STEP', 'تنفيذ خطوة', `تم تنفيذ ${step.title} وإنشاء مستند نتيجة`)] };
      return { ...next, docs: [...buildDocuments(next), resultDoc] };
    });
    setView('docs');
  }

  return <div className="app-shell"><Top view={view} setView={setView} /><div className="app-grid"><div className="main-panel">
    {view === 'command' && <main className="view"><Card className="hero-card"><div className="hero-meta"><span className="live-dot" /> Command</div><h1>إنشاء ملف تنفيذ ومستندات فعلية</h1><p>كل Mission تنشئ خطة ومتطلبات وموافقات وتقرير قابل للفتح والتحميل.</p><div className="command-box"><textarea value={command} onChange={(e) => setCommand(e.target.value)} /><button className="primary-action" onClick={createNewMission}>إنشاء الآن</button></div></Card></main>}

    {view === 'workspace' && <main className="view"><Card className="hero-card"><div className="hero-meta"><span className="live-dot" /> Mission Workspace</div><h1>{mission.title}</h1><p>{mission.command}</p><div className="command-box"><button className="primary-action" onClick={refreshDocuments}>توليد المستندات الآن</button><button className="secondary-action" onClick={() => setView('docs')}>فتح المستندات</button></div></Card><section className="grid two-columns"><Card className="next-card"><span className="section-eyebrow">التقدم</span><h2>{progress(mission)}%</h2><div className="progress-track"><span style={{ width: `${progress(mission)}%` }} /></div></Card><Card className="next-card"><span className="section-eyebrow">المستندات</span><h2>{mission.docs.length}</h2><p>مستندات فعلية قابلة للفتح والتحميل.</p></Card></section><Card className="mission-detail"><div className="section-header"><div><span className="section-eyebrow">Document Vault</span><h2>المستندات المتوفرة</h2></div></div><div className="steps-list">{mission.docs.map((doc) => <article key={doc.id} className="step-card completed"><div className="step-index">📄</div><div className="step-content"><div className="step-topline"><TypeBadge value={doc.type} /><Badge value="ready" /></div><h4>{doc.title}</h4><p>{doc.fileName}</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}><Button onClick={() => { setDocId(doc.id); setView('docs'); }}>فتح</Button><a className="secondary-action" href={downloadHref(doc)} download={doc.fileName}>تحميل</a><Button variant="secondary" onClick={() => copyText(doc.body)}>نسخ</Button></div></div></article>)}</div></Card></main>}

    {view === 'docs' && <main className="view"><Card className="hero-card"><span className="section-eyebrow">Document Vault</span><h1>المستندات الفعلية</h1><p>اختر مستندًا واقرأ محتواه كاملًا هنا.</p></Card><section className="grid two-columns"><Card className="next-card"><div className="steps-list">{mission.docs.map((doc) => <article key={doc.id} className={`step-card ${selectedDoc?.id === doc.id ? 'running' : 'completed'}`} onClick={() => setDocId(doc.id)}><div className="step-index">📄</div><div className="step-content"><h4>{doc.title}</h4><p>{doc.fileName}</p></div></article>)}</div></Card><Card className="mission-detail"><div className="section-header"><div><span className="section-eyebrow">Reader</span><h2>{selectedDoc?.title}</h2><p style={{ color: 'rgba(235,242,255,.62)' }}>{selectedDoc?.fileName}</p></div></div>{selectedDoc && <><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}><a className="primary-action small" href={downloadHref(selectedDoc)} download={selectedDoc.fileName}>تحميل .md</a><Button variant="secondary" onClick={() => copyText(selectedDoc.body)}>نسخ</Button></div><article style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: 18, whiteSpace: 'pre-wrap', lineHeight: 1.9, color: 'rgba(235,242,255,.88)' }}>{selectedDoc.body}</article></>}</Card></section></main>}

    {view === 'plan' && <main className="view"><Card className="hero-card"><span className="section-eyebrow">Execution Plan</span><h1>الخطة متعددة المراحل</h1><p>اضغط نفذ الآن وسيتم إنشاء مستند نتيجة فعلي.</p></Card><Card className="mission-detail"><div className="steps-list">{mission.steps.map((step, index) => <article key={step.id} className={`step-card ${step.status}`}><div className="step-index">{index + 1}</div><div className="step-content"><div className="step-topline"><Badge value={step.status} /></div><h4>{step.title}</h4><p>{step.result || step.note}</p><Button onClick={() => runStep(step.id)} disabled={step.status === 'completed'}>{step.status === 'completed' ? 'تم' : 'نفذ الآن'}</Button></div></article>)}</div></Card></main>}

    {view === 'audit' && <main className="view"><Card className="hero-card"><span className="section-eyebrow">Audit</span><h1>سجل التدقيق</h1></Card><Card className="mission-detail"><div className="steps-list">{mission.events.slice().reverse().map((eventItem) => <article key={eventItem.id} className="step-card"><div className="step-index">≋</div><div className="step-content"><h4>{eventItem.action}: {eventItem.title}</h4><p>{eventItem.detail}</p><small>{eventItem.at}</small></div></article>)}</div></Card></main>}
  </div><aside className="execution-log glass-card"><span className="section-eyebrow">Execution Log</span><h3>{mission.title}</h3><p><strong>Documents</strong><span>{mission.docs.length} مستند فعلي</span></p><p><strong>Progress</strong><span>{progress(mission)}%</span></p></aside></div><Bottom view={view} setView={setView} /></div>;
}
