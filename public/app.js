const form = document.getElementById('lookup-form');
const button = document.getElementById('lookup-button');
const statusEl = document.getElementById('status');
const resultCard = document.getElementById('result-card');
const nationalInput = document.getElementById('national-id');

function toAsciiDigits(value) {
  return String(value).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
function normalizeNameForInput(value) {
  return String(value).normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/[ؤ]/g, 'و').replace(/[ئ]/g, 'ي').replace(/[ء]/g, '')
    .replace(/[\s\u00A0]+/g, '').toLowerCase();
}

nationalInput.addEventListener('input', () => {
  const start = nationalInput.selectionStart;
  nationalInput.value = toAsciiDigits(nationalInput.value).replace(/\D/g, '').slice(0, 14);
  try { nationalInput.setSelectionRange(start, start); } catch {}
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resultCard.hidden = true;
  statusEl.textContent = '';
  const name = document.getElementById('student-name').value.trim();
  const nationalId = toAsciiDigits(nationalInput.value).replace(/\s/g, '');
  if (!name || !/^\d{14}$/.test(nationalId)) {
    statusEl.textContent = 'أدخل الاسم الكامل والرقم القومي المكوّن من 14 رقمًا.';
    return;
  }
  button.disabled = true;
  button.textContent = 'جارٍ التحقق...';
  try {
    const response = await fetch('/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ name, nationalId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر التحقق من البيانات.');
    document.getElementById('result-name').textContent = data.studentName;
    document.getElementById('result-code').textContent = data.studentCode;
    document.getElementById('result-username').textContent = data.username;
    document.getElementById('result-password').textContent = data.password;
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    statusEl.textContent = error.message || 'تعذر الاتصال بالخادم. حاول مرة أخرى.';
  } finally {
    button.disabled = false;
    button.textContent = 'عرض بيانات الدخول';
  }
});

document.getElementById('copy-button').addEventListener('click', async () => {
  const text = [
    'بطاقة بيانات الدخول',
    'اسم الطالب: ' + document.getElementById('result-name').textContent,
    'كود الطالب: ' + document.getElementById('result-code').textContent,
    'اسم المستخدم: ' + document.getElementById('result-username').textContent,
    'كلمة المرور: ' + document.getElementById('result-password').textContent
  ].join('\n');
  const copyButton = document.getElementById('copy-button');
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = 'تم النسخ';
    setTimeout(() => copyButton.textContent = 'نسخ بيانات الدخول', 1800);
  } catch {
    statusEl.textContent = 'تعذر النسخ تلقائيًا. يمكنك تحديد البيانات ونسخها يدويًا.';
  }
});

document.getElementById('print-button').addEventListener('click', () => window.print());
