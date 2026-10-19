const form = document.getElementById('lookup-form');
const button = document.getElementById('lookup-button');
const statusEl = document.getElementById('status');
const resultCard = document.getElementById('result-card');
const nationalInput = document.getElementById('national-id');

function toAsciiDigits(value) {
  return String(value).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

nationalInput.addEventListener('input', () => {
  nationalInput.value = toAsciiDigits(nationalInput.value).replace(/\D/g, '').slice(0, 14);
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
  if (window.location.protocol === 'file:') {
    statusEl.textContent = 'واجهة الموقع مفتوحة كملف محلي. شغّل خادم الموقع أولًا باستخدام npm start، ثم افتح http://localhost:3000.';
    return;
  }

  button.disabled = true;
  button.textContent = 'جارٍ التحقق...';
  try {
    const response = await fetch('/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ name, nationalId })
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error('خادم البحث غير متاح على هذا الرابط. قد تكون الواجهة منشورة وحدها أو أن إعداد الخادم لم يكتمل. شغّل خادم Node.js المتصل بقاعدة البيانات، ثم جرّب مجددًا.');
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await response.text();
      console.error('Lookup API returned a non-JSON response:', response.status, raw.slice(0, 160));
      throw new Error('خادم البحث غير مُشغّل أو أن الموقع لم يُنشر مع الخادم. شغّل خادم Node.js وانشره، ثم جرّب مرة أخرى.');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر التحقق من البيانات.');
    document.getElementById('result-name').textContent = data.studentName;
    document.getElementById('result-code').textContent = data.studentCode;
    document.getElementById('result-username').textContent = data.username;
    document.getElementById('result-password').textContent = data.password;
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    statusEl.textContent = error instanceof TypeError
      ? 'تعذر الاتصال بخادم البحث. تأكد أن الخادم يعمل وأن الموقع منشور مع خدمة API، وليس على GitHub Pages وحده.'
      : (error.message || 'تعذر الاتصال بالخادم. حاول مرة أخرى.');
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
  ].join('\\n');
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
