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

function runStep(mission, requestedStepId) {
  if (!mission || !Array.isArray(mission.steps)) {
    throw new Error('Valid mission is required');
  }

  const steps = mission.steps.map((step) => ({ ...step }));
  let activeIndex = -1;

  if (requestedStepId) {
    activeIndex = steps.findIndex((step) => step.id === requestedStepId);
  }

  if (activeIndex === -1) {
    activeIndex = steps.findIndex((step) => step.status === 'running' || step.status === 'pending');
  }

  if (activeIndex === -1) {
    return {
      ...mission,
      status: 'completed',
      blocker: 'اكتملت جميع الخطوات المتاحة داخل النسخة الحالية',
      nextAction: 'مراجعة النتائج والمخرجات',
      logs: [...(mission.logs || []), 'الآن - لا توجد خطوات إضافية قابلة للتشغيل داخل الواجهة.']
    };
  }

  const selectedStep = steps[activeIndex];

  if (selectedStep.status === 'completed') {
    return {
      ...mission,
      logs: [...(mission.logs || []), `الآن - الخطوة مكتملة مسبقًا: ${selectedStep.title}.`]
    };
  }

  if (selectedStep.type === 'approval' || selectedStep.status === 'needs_approval') {
    steps[activeIndex] = { ...selectedStep, status: 'needs_approval' };
    return {
      ...mission,
      steps,
      nextAction: selectedStep.title,
      blocker: 'هذه الخطوة تحتاج موافقتك من تبويب اعتماد أو من لوحة تقدم',
      logs: [...(mission.logs || []), `الآن - لا يمكن تجاوز خطوة موافقة: ${selectedStep.title}.`]
    };
  }

  const completedStep = selectedStep;
  steps[activeIndex] = {
    ...completedStep,
    status: 'completed',
    evidence: `${completedStep.evidence || 'تم تنفيذ الخطوة.'} تم تنفيذها الآن عبر Vercel API.`
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

  const output = {
    id: uid('output'),
    type: actionTypes[completedStep.type] || 'تحديث',
    title: `نتيجة: ${completedStep.title}`,
    status: 'جاهز',
    detail: completedStep.evidence || 'تم تنفيذ الخطوة وإضافتها إلى سجل التنفيذ.'
  };

  return {
    ...mission,
    status: nextIndex === -1 ? 'completed' : 'running',
    steps,
    nextAction,
    blocker,
    outputs: [...(mission.outputs || []), output],
    logs: [...(mission.logs || []), `الآن - تم تنفيذ خطوة الآن: ${completedStep.title}.`]
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const mission = runStep(body.mission, body.stepId);
    return res.status(200).json({ mission });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message || 'Step runner failed' });
  }
}
