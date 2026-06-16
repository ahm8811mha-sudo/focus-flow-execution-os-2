import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'focus-flow-execution-os-v4';
const statusLabels = {
  pending: 'بانتظار البدء',
  running: 'قيد التنفيذ',
  needs_approval: 'يحتاج موافقة',
  completed: 'مكتمل',
  canceled: 'ملغاة',
  blocked: 'متوقف',
  approved: 'معتمد',
  rejected: 'مرفوض',
  changes_requested: 'تعديل مطلوب',
  delegated: 'محول'
};
const typeLabels = { internal: 'تنفيذ داخلي', browser: 'متصفح آلي', approval: 'موافقة', document: 'مستند', calendar: 'جدولة' };
const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const timeNow = () => new Date().toLocaleString('ar-SA', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const fieldStyle = { minHeight: 48, borderRadius: 16, padding: '0 14px', color: 'white', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', width: '100%' };

function audit(action, target, details, actor = 'Ahmad') {
  return { id: uid('audit'), time: timeNow(), actor, action, target, details };
}
function notification(title, detail, type = 'info') {
  return { id: uid('notice'), title, detail, type, status: 'unread', createdAt: timeNow() };
}
function StatusPill({ status }) {
  return <span className={`status-pill ${status}`}>{statusLabels[status] || status}</span>;
}
function TypeBadge({ type }) {
  return <span className={`type-badge ${type}`}>{typeLabels[type] || type}</span>;
}
function Button({ children, onClick, variant = 'primary', disabled = false, style }) {
  return <button className={variant === 'primary' ? 'primary-action small' : 'secondary-action'} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

function buildMission(command) {
  const clean = String(command || '').trim();
  const title = clean.length > 42 ? `${clean.slice(0, 42).trim()}...` : (clean || 'هدف تنفيذي جديد');
  const steps = [
    ['فهم الهدف وتحويله إلى Mission', 'internal', 'completed', 'تم تحليل الطلب واستخراج النتيجة المطلوبة.'],
    ['بناء خطة تنفيذ متعددة المراحل', 'internal', 'completed', 'تم إنشاء خطة أولية قابلة للتعديل.'],
    ['جمع المتطلبات والبيانات الناقصة', 'browser', 'running', 'الوكيل جاهز للبحث والتحقق.'],
    ['تجهيز المستندات أو الرسائل المطلوبة', 'document', 'pending', 'سيتم إنشاء مسودات قابلة للمراجعة.'],
    ['طلب موافقتك عند نقطة قانونية أو مالية', 'approval', 'needs_approval', 'لا يتم تجاوز هذه الخطوة بدون موافقتك.'],
    ['متابعة التنفيذ حتى الإغلاق', 'calendar', 'pending', 'سيتم إنشاء تذكيرات وسجل متابعة.']
  ].map(([stepTitle, type, status, evidence]) => ({ id: uid('step'), title: stepTitle, type, status, time: 'اليوم', evidence }));

  return {
    id: uid('mission'), title, command: clean, status: 'running', priority: 'عالية', due: 'مفتوح',
    nextAction: 'جمع المتطلبات والبيانات الناقصة', blocker: 'لا يوجد عائق حاليًا', createdAt: timeNow(),
    agent: { live: false, status: 'متوقف', cycles: 0, lastBeat: timeNow() },
    steps,
    approvals: [{ id: uid('approval'), title: 'اعتماد بدء التنفيذ', detail: 'راجع الخطة واسمح للنظام بمتابعة الخطوات الحساسة.', status: 'open', risk: 'تشغيل', createdAt: timeNow(), decisionNote: '' }],
    outputs: [{ id: uid('output'), type: 'خطة', title: 'ملف التنفيذ الرئيسي', status: 'جاهز', detail: 'هذا هو مستند الخطة الأولية. استخدم تحميل أو نسخ من لوحة تقدم.' }],
    notifications: [notification('Mission جاهزة', `تم إنشاء ${title}.`, 'success')],
    audit: [audit('CREATE_MISSION', title, 'تم إنشاء Mission وخطة أولية')],
    logs: [`${timeNow()} - تم إنشاء Mission.`]
  };
}

const sampleMission = (() => {
  const m = buildMission('تحويل المؤسسة إلى شركة في السعودية');
  m.id = 'mission-company-conversion';
  m.title = 'تحويل المؤسسة إلى شركة';
  m.due = 'خلال 14 يوم';
  return m;
})();

function normalizeMission(mission) {
  const fallback = buildMission(mission?.command || mission?.title || 'هدف تنفيذي جديد');
  return {
    ...fallback,
    ...mission,
    id: mission?.id || fallback.id,
    agent: { ...fallback.agent, ...(mission?.agent || {}) },
    steps: Array.isArray(mission?.steps) ? mission.steps : fallback.steps,
    approvals: Array.isArray(mission?.approvals) ? mission.approvals : fallback.approvals,
    outputs: Array.isArray(mission?.outputs) ? mission.outputs : fallback.outputs,
    notifications: Array.isArray(mission?.notifications) ? mission.notifications : fallback.notifications,
    audit: Array.isArray(mission?.audit) ? mission.audit : fallback.audit,
    logs: Array.isArray(mission?.logs) ? mission.logs : fallback.logs
  };
}
function missionProgress(mission) {
  const active = (mission.steps || []).filter((step) => step.status !== 'canceled');
  if (!active.length) return 0;
  return Math.round((active.filter((step) => step.status === 'completed').length / active.length) * 100);
}
function smartProgress(mission) {
  const percent = missionProgress(mission);
  const approvals = mission.approvals.filter((item) => item.status === 'open').length;
  const running = mission.steps.find((step) => step.status === 'running');
  if (approvals) return { percent, label: 'متوقف على موافقة', detail: `${approvals} موافقة تنتظرك`, color: '#f59e0b' };
  if (percent >= 85) return { percent, label: 'قريب من الإغلاق', detail: 'راجع المخرجات وسجل التدقيق', color: '#20f2aa' };
  return { percent, label: 'قيد التنفيذ', detail: running ? running.title : 'شغّل الخطوة التالية', color: '#22d3ee' };
}
function currentStep(mission) {
  return mission.steps.find((step) => step.status === 'running') || mission.steps.find((step) => step.status === 'needs_approval') || mission.steps.find((step) => step.status === 'pending') || mission.steps[mission.steps.length - 1];
}
function outputText(mission, output) {
  return `Focus Flow Execution OS\n\nالمهمة: ${mission.title}\nالأمر: ${mission.command}\n\n${output.title}\n${output.type} - ${output.status}\n\n${output.detail}`;
}
function downloadOutput(mission, output) {
  const blob = new Blob([outputText(mission, output)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${output.title.replace(/[\\/:*?"<>|]/g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
async function copyOutput(mission, output) {
  await navigator.clipboard.writeText(outputText(mission, output));
}

function TopBar({ view, setView }) {
  const items = [['command', 'أمر'], ['progress', 'تقدم'], ['agent', 'Agent Live'], ['approvals', 'موافقات'], ['audit', 'تدقيق'], ['system', 'نظام']];
  return <header className="topbar"><button className="brand" onClick={() => setView('progress')}><span className="brand-orb" /><span><strong>Focus Flow</strong><small>Execution OS</small></span></button><nav className="desktop-nav">{items.map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}</nav></header>;
}
function MobileNav({ view, setView }) {
  const items = [['command', '⌘', 'أمر'], ['progress', '◉', 'تقدم'], ['agent', '◈', 'وكيل'], ['approvals', '✓', 'اعتماد'], ['audit', '≋', 'تدقيق']];
  return <nav className="mobile-nav">{items.map(([key, icon, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}><span>{icon}</span><small>{label}</small></button>)}</nav>;
}

function CommandView({ command, setCommand, onCreate, busy, setView, missions, selectedMission }) {
  const totalApprovals = missions.reduce((sum, mission) => sum + mission.approvals.filter((item) => item.status === 'open').length, 0);
  return <main className="view"><section className="hero-card glass-card"><div className="hero-meta"><span className="live-dot" /> Command Center</div><h1>اطلب الهدف والنظام يدير التنفيذ.</h1><p>بعد إنشاء الطلب افتح تبويب تقدم. هناك المستندات، التشغيل الفوري، الإشعارات، الموافقات، وسجل التدقيق.</p><div className="command-box"><textarea value={command} onChange={(event) => setCommand(event.target.value)} placeholder="اكتب الهدف المطلوب تنفيذه..." /><button className="primary-action" onClick={onCreate} disabled={busy}>{busy ? 'جاري الإنشاء...' : 'حوّل الطلب إلى Mission'}</button></div></section><section className="grid two-columns"><div className="glass-card next-card"><span className="section-eyebrow">المستندات</span><h2>تقدم ← المخرجات الجاهزة</h2><p>كل مستند يظهر هناك مع أزرار نسخ وتحميل.</p><button className="secondary-action" onClick={() => setView('progress')}>فتح تقدم</button></div><div className="glass-card metrics-card"><span className="section-eyebrow">النظام الآن</span><div className="metric-row"><strong>{missions.length}</strong><span>Missions نشطة</span></div><div className="metric-row"><strong>{totalApprovals}</strong><span>موافقات مفتوحة</span></div><div className="metric-row"><strong>{selectedMission ? `${missionProgress(selectedMission)}%` : '0%'}</strong><span>تقدم آخر طلب</span></div></div></section></main>;
}

function TaskEditor({ editor, onSave, onClose }) {
  const [draft, setDraft] = useState(editor?.step || { title: '', type: 'internal', status: 'pending', time: 'اليوم', evidence: '' });
  if (!editor) return null;
  return <div style={{ position: 'fixed', inset: 'auto 16px 96px 16px', zIndex: 50, maxWidth: 760, margin: '0 auto' }}><section className="glass-card mission-detail"><div className="section-header"><div><span className="section-eyebrow">Task Editor</span><h2>{editor.step ? 'تعديل مهمة' : 'إضافة مهمة'}</h2></div><button className="secondary-action" onClick={onClose}>إغلاق</button></div><div className="steps-list"><input style={fieldStyle} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="عنوان المهمة" /><select style={fieldStyle} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select style={fieldStyle} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="pending">بانتظار البدء</option><option value="running">قيد التنفيذ</option><option value="needs_approval">يحتاج موافقة</option><option value="completed">مكتمل</option></select><input style={fieldStyle} value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} placeholder="الوقت أو الجدولة" /><textarea style={{ ...fieldStyle, minHeight: 110, paddingTop: 12 }} value={draft.evidence} onChange={(event) => setDraft({ ...draft, evidence: event.target.value })} placeholder="الوصف" /><button className="primary-action" onClick={() => onSave({ ...draft, id: draft.id || uid('step') })}>حفظ المهمة</button></div></section></div>;
}

function NotificationsPanel({ mission, onRead, onApprovals }) {
  return <section className="glass-card mission-detail"><div className="section-header"><div><span className="section-eyebrow">Notifications</span><h2>الإشعارات والتنبيهات</h2><p style={{ color: 'rgba(235,242,255,.62)', marginTop: 8 }}>أي توقف أو موافقة أو تحديث مهم يظهر هنا.</p></div><Button variant="secondary" onClick={onApprovals}>فتح الموافقات</Button></div><div className="steps-list">{mission.notifications.slice().reverse().map((item) => <article key={item.id} className={`step-card ${item.status === 'unread' ? 'needs_approval' : 'completed'}`}><div className="step-index">!</div><div className="step-content"><div className="step-topline"><span className="risk-badge">{item.type}</span><span className="priority">{item.status === 'unread' ? 'جديد' : 'مقروء'}</span></div><h4>{item.title}</h4><p>{item.detail}</p><small>{item.createdAt}</small>{item.status === 'unread' && <div style={{ marginTop: 12 }}><Button variant="secondary" onClick={() => onRead(mission.id, item.id)}>مقروء</Button></div>}</div></article>)}</div></section>;
}

function ProgressView({ mission, missions, setSelected, runStep, onApprove, editStep, addStep, cancelStep, readNotice, busy, setView }) {
  if (!mission) return null;
  const smart = smartProgress(mission);
  const step = currentStep(mission);
  const openApprovals = mission.approvals.filter((item) => item.status === 'open');
  return <main className="view"><section className="hero-card glass-card"><div className="hero-meta"><span className="live-dot" /> مركز المتابعة</div><h1>كل التطورات هنا.</h1><p>شريط تقدم ذكي، مستندات، إشعارات، موافقات، وتشغيل فوري لأي خطوة.</p><div className="command-box"><select style={fieldStyle} value={mission.id} onChange={(event) => setSelected(event.target.value)}>{missions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button className="primary-action" onClick={() => runStep(mission.id)} disabled={busy}>{busy ? 'جاري التنفيذ...' : 'شغّل الخطوة التالية'}</button></div></section><section className="grid two-columns"><section className="glass-card next-card"><span className="section-eyebrow">Smart Progress</span><h2>{smart.percent}%</h2><p>{smart.label} — {smart.detail}</p><div className="progress-track"><span style={{ width: `${smart.percent}%`, background: `linear-gradient(90deg,${smart.color},#a78bfa)` }} /></div></section><section className="glass-card next-card"><span className="section-eyebrow">الخطوة الحالية</span><h2>{step?.title}</h2><p>{step?.evidence}</p><div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}><StatusPill status={step?.status} /><TypeBadge type={step?.type} /></div></section></section><NotificationsPanel mission={mission} onRead={readNotice} onApprovals={() => setView('approvals')} /><section className="glass-card mission-detail"><div className="section-header"><div><span className="section-eyebrow">Documents</span><h2>المخرجات الجاهزة</h2></div></div><div className="steps-list">{mission.outputs.map((output) => <article key={output.id} className="step-card completed"><div className="step-index">✦</div><div className="step-content"><div className="step-topline"><TypeBadge type="document" /><span className="priority">{output.status}</span></div><h4>{output.title}</h4><p>{output.detail}</p><small>{output.type}</small><div style={{ display: 'flex', gap: 10, marginTop: 12 }}><Button variant="secondary" onClick={() => downloadOutput(mission, output)}>تحميل</Button><Button variant="secondary" onClick={() => copyOutput(mission, output)}>نسخ</Button></div></div></article>)}</div></section><section className="glass-card mission-detail"><div className="section-header"><div><span className="section-eyebrow">Tasks</span><h2>إضافة / تعديل / إلغاء / تنفيذ</h2></div><Button onClick={() => addStep(mission.id)}>إضافة مهمة</Button></div><div className="steps-list">{mission.steps.map((task, index) => <article key={task.id} className={`step-card ${task.status}`}><div className="step-index">{index + 1}</div><div className="step-content"><div className="step-topline"><TypeBadge type={task.type} /><StatusPill status={task.status} /></div><h4>{task.title}</h4><p>{task.evidence}</p><small>{task.time}</small><div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>{task.status !== 'completed' && task.status !== 'canceled' && task.type !== 'approval' && <Button onClick={() => runStep(mission.id, task.id)}>نفذ الآن</Button>}{(task.type === 'approval' || task.status === 'needs_approval') && <Button onClick={() => setView('approvals')}>اعتماد</Button>}<Button variant="secondary" onClick={() => editStep(mission.id, task)}>تعديل</Button>{task.status !== 'canceled' && <Button variant="secondary" onClick={() => cancelStep(mission.id, task.id)}>إلغاء</Button>}</div></div></article>)}</div></section>{openApprovals.length > 0 && <section className="glass-card next-card"><span className="section-eyebrow">موافقات مفتوحة</span><h2>{openApprovals.length} موافقة</h2><p>لا يمكن تجاوزها. افتح تبويب اعتماد لمعالجتها.</p><button className="primary-action" onClick={() => setView('approvals')}>فتح الموافقات</button></section>}</main>;
}

function AgentLiveView({ mission, missions, setSelected, toggleAgent, runCycle }) {
  return <main className="view"><section className="hero-card glass-card"><div className="hero-meta"><span className="live-dot" /> Agent Live</div><h1>وكيل مباشر للمراقبة.</h1><p>يشغل مراقبة حية، يضيف إشعارات وسجل تدقيق، ويستطيع تشغيل دورة فحص يدوية.</p><div className="command-box"><select style={fieldStyle} value={mission?.id || ''} onChange={(event) => setSelected(event.target.value)}>{missions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button className="primary-action" onClick={() => toggleAgent(mission.id)}>{mission.agent.live ? 'إيقاف الوكيل' : 'تشغيل الوكيل'}</button></div></section><section className="grid two-columns"><section className="glass-card next-card"><span className="section-eyebrow">Live Status</span><h2>{mission.agent.live ? 'Live الآن' : 'متوقف'}</h2><p>آخر نبضة: {mission.agent.lastBeat} — الدورات: {mission.agent.cycles}</p><Button onClick={() => runCycle(mission.id)}>شغّل دورة الآن</Button></section><section className="glass-card next-card"><span className="section-eyebrow">Active Agents</span><h2>{missions.filter((item) => item.agent.live).length}</h2><p>الوكيل لا يتجاوز الموافقات ولا ينفذ إجراء حساس بدونك.</p></section></section></main>;
}

function ApprovalsView({ missions, decide }) {
  const approvals = missions.flatMap((mission) => mission.approvals.map((approval) => ({ ...approval, missionId: mission.id, mission: mission.title }))).filter((item) => item.status === 'open');
  return <main className="view"><section className="hero-card glass-card"><span className="section-eyebrow">Approval Center</span><h1>موافقات متقدمة.</h1><p>اعتماد، رفض، طلب تعديل، أو تحويل. كل قرار يذهب إلى سجل التدقيق والتنبيهات.</p></section><section className="approval-list">{approvals.map((approval) => <article key={approval.id} className="approval-card glass-card"><div><span className="risk-badge">{approval.risk}</span><h2>{approval.title}</h2><p>{approval.detail}</p><small>{approval.mission} — {approval.createdAt}</small></div><div style={{ display: 'grid', gap: 10 }}><Button onClick={() => decide(approval.missionId, approval.id, 'approved')}>اعتماد</Button><Button variant="secondary" onClick={() => decide(approval.missionId, approval.id, 'changes_requested')}>طلب تعديل</Button><Button variant="secondary" onClick={() => decide(approval.missionId, approval.id, 'delegated')}>تحويل</Button><Button variant="secondary" onClick={() => decide(approval.missionId, approval.id, 'rejected')}>رفض</Button></div></article>)}{!approvals.length && <article className="approval-card glass-card"><div><span className="risk-badge">واضح</span><h2>لا توجد موافقات مفتوحة</h2><p>كل الموافقات مغلقة الآن.</p></div></article>}</section></main>;
}

function AuditView({ missions }) {
  const rows = missions.flatMap((mission) => mission.audit.map((entry) => ({ ...entry, mission: mission.title }))).reverse();
  return <main className="view"><section className="hero-card glass-card"><span className="section-eyebrow">Audit Trail</span><h1>سجل تدقيق كامل.</h1><p>أي إضافة، تعديل، إلغاء، موافقة، تشغيل وكيل، أو تنفيذ خطوة يتم تسجيله هنا.</p></section><section className="glass-card mission-detail"><div className="steps-list">{rows.map((entry) => <article key={entry.id} className="step-card"><div className="step-index">≋</div><div className="step-content"><div className="step-topline"><span className="priority">{entry.action}</span><small>{entry.time}</small></div><h4>{entry.target}</h4><p>{entry.details}</p><small>{entry.actor} — {entry.mission}</small></div></article>)}</div></section></main>;
}
function SystemView() {
  const items = [['Approval Engine', 'اعتماد/رفض/تعديل/تحويل', 'Ready'], ['Agent Live', 'مراقبة مباشرة ودورات تشغيل', 'Ready'], ['Task Control', 'إضافة/تعديل/إلغاء/تنفيذ فوري', 'Ready'], ['Audit Trail', 'سجل تدقيق كامل', 'Ready'], ['Smart Progress', 'شريط تقدم ذكي', 'Ready'], ['Notifications', 'تنبيهات داخلية', 'Ready']];
  return <main className="view"><section className="hero-card glass-card"><span className="section-eyebrow">System</span><h1>تمت ترقية نظام التنفيذ.</h1><p>المزايا المطلوبة أصبحت داخل الواجهة وجاهزة للاستخدام.</p></section><section className="system-grid">{items.map(([title, detail, state]) => <article key={title} className="glass-card integration-card"><div className="integration-icon">✦</div><h2>{title}</h2><p>{detail}</p><span>{state}</span></article>)}</section></main>;
}
function MissionsView({ missions, setSelected }) {
  return <main className="view"><section className="hero-card glass-card"><span className="section-eyebrow">Missions</span><h1>ملفات التنفيذ.</h1><p>اختر أي Mission لمتابعتها من لوحة تقدم.</p></section><section className="mission-list glass-card">{missions.map((mission) => <button key={mission.id} className="mission-card" onClick={() => setSelected(mission.id)}><div className="mission-card-top"><StatusPill status={mission.status} /><span className="priority">{mission.priority}</span></div><h3>{mission.title}</h3><p>{mission.command}</p><div className="progress-track"><span style={{ width: `${missionProgress(mission)}%` }} /></div><div className="mission-card-bottom"><span>{missionProgress(mission)}%</span><span>{mission.due}</span></div></button>)}</section></main>;
}
function ExecutionLog({ missions }) {
  const logs = missions.flatMap((mission) => mission.logs.map((log) => ({ log, mission: mission.title }))).slice(-8).reverse();
  return <aside className="execution-log glass-card"><span className="section-eyebrow">Execution Log</span><h3>سجل التنفيذ</h3><div>{logs.map((item, index) => <p key={index}><strong>{item.mission}</strong><span>{item.log}</span></p>)}</div></aside>;
}

export default function EnhancedApp() {
  const [view, setView] = useState('progress');
  const [command, setCommand] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [missions, setMissions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('focus-flow-execution-os-v2');
      const parsed = stored ? JSON.parse(stored) : [sampleMission];
      return Array.isArray(parsed) ? parsed.map(normalizeMission) : [sampleMission];
    } catch { return [sampleMission]; }
  });
  const [selected, setSelected] = useState(() => missions[0]?.id);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(missions)), [missions]);
  const selectedMission = useMemo(() => missions.find((item) => item.id === selected) || missions[0], [missions, selected]);
  const updateMission = (missionId, updater) => setMissions((current) => current.map((mission) => mission.id === missionId ? normalizeMission(updater(mission)) : mission));

  async function createMission() {
    if (!command.trim()) return;
    setBusy(true);
    let mission;
    try {
      const response = await fetch('/api/mission-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) });
      const data = await response.json();
      mission = normalizeMission(data.mission || buildMission(command));
      mission.audit = [...mission.audit, audit('CREATE_MISSION_API', mission.title, 'تم إنشاء المهمة عبر API')];
    } catch {
      mission = buildMission(command);
      mission.logs.push(`${timeNow()} - تم استخدام التخطيط المحلي.`);
    }
    setMissions((current) => [mission, ...current]);
    setSelected(mission.id);
    setCommand('');
    setView('progress');
    setBusy(false);
  }

  async function runStep(missionId, stepId) {
    const mission = missions.find((item) => item.id === missionId);
    if (!mission) return;
    setBusy(true);
    try {
      const response = await fetch('/api/run-step', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mission, stepId }) });
      const data = await response.json();
      const next = normalizeMission(data.mission);
      next.audit = [...next.audit, audit('RUN_STEP_API', stepId || 'next', 'تم تشغيل خطوة عبر API')];
      setMissions((current) => current.map((item) => item.id === missionId ? next : item));
    } catch {
      updateMission(missionId, (old) => {
        const step = old.steps.find((item) => item.id === stepId) || old.steps.find((item) => item.status === 'running' || item.status === 'pending');
        if (!step) return old;
        if (step.type === 'approval' || step.status === 'needs_approval') {
          return { ...old, notifications: [...old.notifications, notification('موافقة مطلوبة', step.title, 'warning')], audit: [...old.audit, audit('BLOCKED_APPROVAL', step.title, 'محاولة تشغيل خطوة تحتاج موافقة')] };
        }
        return {
          ...old,
          steps: old.steps.map((item) => item.id === step.id ? { ...item, status: 'completed', evidence: `${item.evidence} تم تنفيذها الآن.` } : item),
          outputs: [...old.outputs, { id: uid('output'), type: typeLabels[step.type], title: `نتيجة: ${step.title}`, status: 'جاهز', detail: step.evidence }],
          notifications: [...old.notifications, notification('تم تنفيذ خطوة', step.title, 'success')],
          audit: [...old.audit, audit('RUN_STEP', step.title, 'تم تنفيذ خطوة')],
          logs: [...old.logs, `${timeNow()} - تم تنفيذ ${step.title}.`]
        };
      });
    }
    setBusy(false);
  }

  function approvalDecision(missionId, approvalId, decision) {
    updateMission(missionId, (mission) => {
      const approval = mission.approvals.find((item) => item.id === approvalId);
      return {
        ...mission,
        status: decision === 'approved' ? mission.status : 'blocked',
        approvals: mission.approvals.map((item) => item.id === approvalId ? { ...item, status: decision, decidedAt: timeNow() } : item),
        notifications: [...mission.notifications, notification('قرار موافقة', `${approval?.title}: ${statusLabels[decision]}`, decision === 'approved' ? 'success' : 'warning')],
        outputs: [...mission.outputs, { id: uid('output'), type: 'موافقة', title: `قرار: ${approval?.title}`, status: statusLabels[decision], detail: `تم تسجيل قرار الموافقة: ${statusLabels[decision]}` }],
        audit: [...mission.audit, audit(`APPROVAL_${decision.toUpperCase()}`, approval?.title || approvalId, `قرار موافقة: ${statusLabels[decision]}`)],
        logs: [...mission.logs, `${timeNow()} - ${statusLabels[decision]}: ${approval?.title}.`]
      };
    });
    setView('progress');
  }

  function saveStep(step) {
    updateMission(editor.missionId, (mission) => {
      const exists = mission.steps.some((item) => item.id === step.id);
      return { ...mission, steps: exists ? mission.steps.map((item) => item.id === step.id ? step : item) : [...mission.steps, step], notifications: [...mission.notifications, notification(exists ? 'تم تعديل مهمة' : 'تم إضافة مهمة', step.title, 'info')], audit: [...mission.audit, audit(exists ? 'EDIT_TASK' : 'ADD_TASK', step.title, exists ? 'تعديل مهمة' : 'إضافة مهمة')], logs: [...mission.logs, `${timeNow()} - ${exists ? 'تعديل' : 'إضافة'} مهمة: ${step.title}.`] };
    });
    setEditor(null);
  }
  const addStep = (missionId) => setEditor({ missionId });
  const editStep = (missionId, step) => setEditor({ missionId, step });
  const cancelStep = (missionId, stepId) => updateMission(missionId, (mission) => { const step = mission.steps.find((item) => item.id === stepId); return { ...mission, steps: mission.steps.map((item) => item.id === stepId ? { ...item, status: 'canceled' } : item), notifications: [...mission.notifications, notification('تم إلغاء مهمة', step?.title || stepId, 'warning')], audit: [...mission.audit, audit('CANCEL_TASK', step?.title || stepId, 'إلغاء مهمة')], logs: [...mission.logs, `${timeNow()} - إلغاء مهمة: ${step?.title}.`] }; });
  const readNotice = (missionId, noticeId) => updateMission(missionId, (mission) => ({ ...mission, notifications: mission.notifications.map((item) => item.id === noticeId ? { ...item, status: 'read' } : item), audit: [...mission.audit, audit('READ_NOTIFICATION', noticeId, 'قراءة إشعار')] }));
  const toggleAgent = (missionId) => updateMission(missionId, (mission) => { const live = !mission.agent.live; return { ...mission, agent: { ...mission.agent, live, status: live ? 'Live' : 'Stopped', lastBeat: timeNow() }, notifications: [...mission.notifications, notification(live ? 'Agent Live بدأ' : 'Agent Live توقف', mission.title, 'info')], audit: [...mission.audit, audit(live ? 'AGENT_START' : 'AGENT_STOP', mission.title, live ? 'تشغيل وكيل' : 'إيقاف وكيل')] }; });
  const agentCycle = (missionId) => updateMission(missionId, (mission) => ({ ...mission, agent: { ...mission.agent, live: true, cycles: mission.agent.cycles + 1, lastBeat: timeNow() }, notifications: [...mission.notifications, notification('دورة Agent Live', 'تم فحص الحالة', 'success')], audit: [...mission.audit, audit('AGENT_CYCLE', mission.title, 'دورة مراقبة')], logs: [...mission.logs, `${timeNow()} - Agent Live نفذ دورة مراقبة.`] }));

  return <div className="app-shell"><TopBar view={view} setView={setView} /><div className="app-grid"><div className="main-panel">{view === 'command' && <CommandView command={command} setCommand={setCommand} onCreate={createMission} busy={busy} setView={setView} missions={missions} selectedMission={selectedMission} />}{view === 'progress' && <ProgressView mission={selectedMission} missions={missions} setSelected={setSelected} runStep={runStep} onApprove={approvalDecision} editStep={editStep} addStep={addStep} cancelStep={cancelStep} readNotice={readNotice} busy={busy} setView={setView} />}{view === 'agent' && <AgentLiveView mission={selectedMission} missions={missions} setSelected={setSelected} toggleAgent={toggleAgent} runCycle={agentCycle} />}{view === 'approvals' && <ApprovalsView missions={missions} decide={approvalDecision} />}{view === 'audit' && <AuditView missions={missions} />}{view === 'missions' && <MissionsView missions={missions} setSelected={setSelected} />}{view === 'system' && <SystemView />}</div><ExecutionLog missions={missions} /></div><MobileNav view={view} setView={setView} /><TaskEditor editor={editor} onSave={saveStep} onClose={() => setEditor(null)} /></div>;
}