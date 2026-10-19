// تنبيه: هذه عينة توضيحية فقط. لا تضع بيانات الطلاب الحقيقية في مستودع GitHub عام.
const students = [
  {name:"ابراهيم محمود محمد حسن", code:"475831970", username:"475831970", password:"E!9yAwM6"},
  {name:"احمد ابراهيم مخلوف محمد", code:"475837726", username:"475837726", password:"224B_taM"},
  {name:"احمد بدوى عبدالعظيم عبدالعليم", code:"475824903", username:"475824903", password:"DCr!QH94"},
  {name:"احمد حاتم محمود عبدالعظيم", code:"475507660", username:"475507660", password:"pgbD?V4f"},
  {name:"احمد خالد حمزه احمد", code:"475879038", username:"475879038", password:"XK6?NEWp"}
];

// توحيد الهمزات، الألف المقصورة والياء، والتطويل والمسافات.
function normalizeArabic(value) {
  return value.normalize("NFKC")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـٰ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim().replace(/\s+/g, " ")
    .toLowerCase();
}

const form = document.querySelector("#searchForm");
const input = document.querySelector("#studentName");
const result = document.querySelector("#result");
const message = document.querySelector("#message");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = normalizeArabic(input.value);
  result.hidden = true;
  message.textContent = "";

  if (query.split(" ").filter(Boolean).length < 3) {
    message.textContent = "من فضلك اكتب الاسم الثلاثي أو الاسم كاملًا.";
    return;
  }

  const matches = students.filter(s => normalizeArabic(s.name) === query);
  if (matches.length === 0) {
    message.textContent = "لم نعثر على الاسم. راجع ترتيب الأسماء أو تواصل مع مسؤول المدرسة.";
    return;
  }
  if (matches.length > 1) {
    message.textContent = "يوجد أكثر من طالب بالاسم نفسه. يلزم التحقق من الهوية مع مسؤول المدرسة.";
    return;
  }

  const s = matches[0];
  document.querySelector("#outName").textContent = s.name;
  document.querySelector("#outCode").textContent = s.code;
  document.querySelector("#outUsername").textContent = s.username;
  document.querySelector("#outPassword").textContent = s.password;
  result.hidden = false;
});

document.querySelector("#copyBtn").addEventListener("click", async () => {
  const text = `اسم الطالب: ${document.querySelector("#outName").textContent}\nالكود: ${document.querySelector("#outCode").textContent}\nاسم المستخدم: ${document.querySelector("#outUsername").textContent}\nكلمة المرور: ${document.querySelector("#outPassword").textContent}`;
  try {
    await navigator.clipboard.writeText(text);
    message.style.color = "#14723c";
    message.textContent = "تم نسخ البيانات.";
  } catch {
    message.style.color = "#a12727";
    message.textContent = "تعذر النسخ تلقائيًا؛ يمكنك تحديد البيانات ونسخها يدويًا.";
  }
});
