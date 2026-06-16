function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const actionTypes = {
  internal: 'تنفيذ داخلي',
  browser: 'متصفح آلي',
  approval: 'موافقة',
  document: 'مستند',
  calendar: 'جدولة'
};

function fallbackMission(command) {
  const cleanCommand = String(command || '').trim();
  const title = cleanCommand.length > 42 ? `${cleanCommand.slice(0, 42).trim()}...` : cleanCommand;

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
    source: 'fallback-planner',
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
      'الآن - تم استلام الأمر عبر Vercel API.',
      'الآن - تم تحويل الأمر إلى Mission تنفيذية.',
      'الآن - تم إنشاء خطوات تنفيذية وحالات متابعة.',
      'الآن - تم إنشاء صفحة متابعة خاصة لهذا الطلب.'
    ]
  };
}

function normalizeMission(input, command, source = 'ai-planner') {
  const fallback = fallbackMission(command);
  const mission = input && typeof input === 'object' ? input : {};
  const title = String(mission.title || fallback.title || 'هدف تنفيذي جديد');

  const steps = Array.isArray(mission.steps) && mission.steps.length
    ? mission.steps.slice(0, 10).map((step, index) => ({
        id: step.id || uid('step'),
        title: String(step.title || `خطوة ${index + 1}`),
        type: ['internal', 'browser', 'approval', 'document', 'calendar'].includes(step.type) ? step.type : 'internal',
        status: ['pending', 'running', 'needs_approval', 'completed', 'failed', 'blocked'].includes(step.status) ? step.status : (index < 2 ? 'completed' : index === 2 ? 'running' : 'pending'),
        time: String(step.time || 'قريبًا'),
        evidence: String(step.evidence || step.detail || 'بانتظار التنفيذ.')
      }))
    : fallback.steps;

  const approvals = Array.isArray(mission.approvals) && mission.approvals.length
    ? mission.approvals.slice(0, 5).map((approval) => ({
        id: approval.id || uid('approval'),
        title: String(approval.title || 'موافقة مطلوبة'),
        detail: String(approval.detail || 'تحتاج مراجعتك قبل المتابعة.'),
        status: approval.status === 'approved' ? 'approved' : 'open',
        risk: String(approval.risk || 'اعتماد')
      }))
    : fallback.approvals;

  const outputs = Array.isArray(mission.outputs) && mission.outputs.length
    ? mission.outputs.slice(0, 8).map((output) => ({
        id: output.id || uid('output'),
        type: String(output.type || 'مخرج'),
        title: String(output.title || 'مخرج تنفيذي'),
        status: String(output.status || 'جاهز'),
        detail: String(output.detail || 'تم إنشاؤه ضمن خطة التنفيذ.')
      }))
    : fallback.outputs;

  return {
    ...fallback,
    ...mission,
    id: mission.id || uid('mission'),
    title,
    command: String(command || mission.command || ''),
    status: mission.status || 'running',
    priority: mission.priority || 'عالية',
    owner: mission.owner || 'AI Execution Agent',
    due: mission.due || 'يتم تحديده تلقائيًا',
    nextAction: mission.nextAction || steps.find((step) => step.status === 'running')?.title || fallback.nextAction,
    blocker: mission.blocker || (approvals.some((approval) => approval.status === 'open') ? 'ينتظر موافقتك قبل خطوة حساسة' : 'لا يوجد عائق حاليًا'),
    createdAt: mission.createdAt || 'الآن',
    source,
    steps,
    approvals,
    outputs,
    logs: Array.isArray(mission.logs) && mission.logs.length ? mission.logs : [
      'الآن - تم استلام الأمر عبر Vercel API.',
      source === 'gemini' ? 'الآن - تم توليد الخطة عبر Gemini.' : 'الآن - تم توليد الخطة عبر المخطط الاحتياطي.',
      'الآن - تم إنشاء Mission وربطها بلوحة التقدم.'
    ]
  };
}

async function planWithGemini(command) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const prompt = `You are an AI execution operating system. Convert the Arabic user command into a practical execution mission. Return JSON only with this shape: {"title":"","priority":"عالية","due":"","nextAction":"","blocker":"","steps":[{"title":"","type":"internal|browser|approval|document|calendar","status":"completed|running|pending|needs_approval","time":"","evidence":""}],"approvals":[{"title":"","detail":"","status":"open","risk":""}],"outputs":[{"type":"خطة|قائمة|مستند|تذكير|سجل","title":"","status":"جاهز","detail":""}],"logs":[""]}. User command: ${command}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 1800 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || '';
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) return null;
  return JSON.parse(jsonText);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const command = String(body.command || '').trim();

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    let aiMission = null;
    try {
      aiMission = await planWithGemini(command);
    } catch (error) {
      console.error('Gemini planner failed, using fallback:', error.message);
    }

    const mission = normalizeMission(aiMission, command, aiMission ? 'gemini' : 'fallback-planner');
    return res.status(200).json({ mission });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Mission planner failed', mission: fallbackMission('هدف تنفيذي جديد') });
  }
}
