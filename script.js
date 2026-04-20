/* ============================================================
   script.js — Шаблоны МЭС v2.1
   ============================================================ */

/* ===================================================
   ТЕМА: тёмная/светлая
   =================================================== */

function initTheme() {
  const html  = document.documentElement;
  const btn   = document.getElementById('themeToggleBtn');
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');

  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'dark';
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      icon.className    = 'fas fa-moon';
      label.textContent = 'Светлая';
    } else {
      icon.className    = 'fas fa-sun';
      label.textContent = 'Тёмная';
    }
  }
}

/* ===================================================
   УТИЛИТЫ
   =================================================== */

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .25s ease forwards';
    setTimeout(() => toast.remove(), 260);
  }, 2800);
}

function copyToClipboard(text, successMsg = 'Текст скопирован!') {
  return navigator.clipboard.writeText(text)
    .then(() => showToast(successMsg))
    .catch(() => showToast('Ошибка копирования', 'error'));
}

/* Форматирует поле ввода даты в формат ДД.ММ.ГГГГ (только цифры + точки) */
function formatDate(input) {
  let digits = input.value.replace(/[^\d]/g, '');
  if (digits.length > 8) digits = digits.slice(0, 8);
  let formatted = '';
  if (digits.length > 4)      formatted = digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4);
  else if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2);
  else                        formatted = digits;
  input.value = formatted;
}

/* Разрешает в поле дат только цифры + управляющие клавиши + Ctrl/Cmd-комбинации */
function dateInputFilter(input, event) {
  const nav = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
  if (event.ctrlKey || event.metaKey) return true;
  if (!/^\d$/.test(event.key) && !nav.includes(event.key)) {
    event.preventDefault();
    return false;
  }
  return true;
}

/* Конвертирует YYYY-MM-DD → ДД.ММ.ГГГГ */
function toDisplayDate(ds) {
  if (!ds) return '';
  if (ds.includes('.')) return ds;
  const [y, m, d] = ds.split('-');
  return `${d}.${m}.${y}`;
}

/* Возвращает текущую дату-время «ДД.ММ.ГГГГ в ЧЧ:ММ» */
function getCurrentDateTime() {
  const n   = new Date();
  const p   = (v) => String(v).padStart(2, '0');
  return `${p(n.getDate())}.${p(n.getMonth()+1)}.${n.getFullYear()} в ${p(n.getHours())}:${p(n.getMinutes())}`;
}

function setVisible(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

function clearFields(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = (el.tagName === 'SELECT') ? '' : '';
  });
}

function clearNrItog() {
  document.querySelectorAll('.nrItog').forEach((el) => (el.value = ''));
}

/* ===================================================
   АККОРДЕОН (один открытый — остальные закрываются)
   =================================================== */

function initAccordion() {
  document.querySelectorAll('.accordion-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.accordion-section');
      const wasOpen = section.classList.contains('open');
      document.querySelectorAll('.accordion-section.open').forEach((s) => s.classList.remove('open'));
      if (!wasOpen) section.classList.add('open');
    });
  });
}

/* ===================================================
   КОРРЕКТИРОВКИ — фильтры ввода
   =================================================== */

function initCorrectionInputs() {
  /* Поля дат: formatDate при вводе, dateInputFilter при keydown, paste → форматировать */
  ['sDate','cDate','f1Date','t1Date','nrDate2'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown',  (e) => dateInputFilter(el, e));
    el.addEventListener('paste', (e) => {
      e.preventDefault();
      const raw = (e.clipboardData || window.clipboardData).getData('text');
      el.value  = raw;
      formatDate(el);
    });
  });

  /* Поля показаний: только цифры, не более 6 символов */
  ['sT0','sT1','sT2','sT3','cT0','cT1','cT2','cT3',
   'f1T0','f1T1','f1T2','f1T3','t1T0','t1T1','t1T2','t1T3','nrT1','nrT2','nrT3']
  .forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      const nav = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
      if (e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key) && !nav.includes(e.key)) e.preventDefault();
    });
    el.addEventListener('input', () => {
      el.value = el.value.replace(/\D/g, '').slice(0, 6);
    });
    el.addEventListener('paste', (e) => {
      e.preventDefault();
      const raw = (e.clipboardData || window.clipboardData).getData('text');
      el.value  = raw.replace(/\D/g, '').slice(0, 6);
    });
  });
}

/* ===================================================
   БЛОК 1: Не согласен с показаниями Сети
   =================================================== */

function initCopy1() {
  document.getElementById('btnCopy1').addEventListener('click', () => {
    const g  = (id) => document.getElementById(id).value;
    const tx = `Не согласен с показаниями "Сети", Сетевой участок Россети МР; Дата сети ${g('sDate')}; То ${g('sT0')} ; Т1 ${g('sT1')} ; Т2 ${g('sT2')} ; Т3 ${g('sT3')} ; Дата кл ${g('cDate')}; То ${g('cT0')} ; Т1 ${g('cT1')} ; Т2 ${g('cT2')} ; Т3 ${g('cT3')} ;`;
    copyToClipboard(tx).then(() =>
      clearFields(['sDate','sT0','sT1','sT2','sT3','cDate','cT0','cT1','cT2','cT3'])
    );
  });
}

/* ===================================================
   БЛОК 2: Ошибочные показания с удалением
   =================================================== */

function initCopy3() {
  document.getElementById('btnCopy3').addEventListener('click', () => {
    const g = (id) => document.getElementById(id).value;
    const [f1T0,f1T1,f1T2,f1T3] = ['f1T0','f1T1','f1T2','f1T3'].map(g);
    const [t1T0,t1T1,t1T2,t1T3] = ['t1T0','t1T1','t1T2','t1T3'].map(g);
    const f1Date = g('f1Date'), t1Date = g('t1Date');
    let tx;
    if (!f1T3 && !f1T0) tx = `${f1Date} клиент ошибочно передал показания Т1-${f1T1}, Т2-${f1T2}, данные показания необходимо удалить. Корректные показания на ${t1Date}, Т1-${t1T1}, Т2-${t1T2}.`;
    else if (!f1T0)     tx = `${f1Date} клиент ошибочно передал показания Т1-${f1T1}, Т2-${f1T2}, Т3-${f1T3}, данные показания необходимо удалить. Корректные показания на ${t1Date}, Т1-${t1T1}, Т2-${t1T2}, Т3-${t1T3}.`;
    else                tx = `${f1Date} клиент ошибочно передал показания То-${f1T0}, данные показания необходимо удалить. Корректные показания на ${t1Date}, То-${t1T0}.`;
    copyToClipboard(tx).then(() =>
      clearFields(['f1Date','f1T0','f1T1','f1T2','f1T3','t1Date','t1T0','t1T1','t1T2','t1T3'])
    );
  });
}

/* ===================================================
   БЛОК 3: Автокорректировка
   =================================================== */

function initNr() {
  document.getElementById('btnNr').addEventListener('click', () => {
    const g = (id) => document.getElementById(id).value;
    const [nrT1,nrT2,nrT3,nrDate2] = ['nrT1','nrT2','nrT3','nrDate2'].map(g);
    let prefix;
    if (!nrT2)      prefix = `Текущие показания клиента ${nrDate2} То ${nrT1} ; Необходимо провести автоматическую корректировку показаний на даты: `;
    else if (!nrT3) prefix = `Текущие показания клиента ${nrDate2} Т1 ${nrT1} ; Т2 ${nrT2} ; Необходимо провести автоматическую корректировку показаний на даты: `;
    else            prefix = `Текущие показания клиента ${nrDate2} Т1 ${nrT1} ; Т2 ${nrT2} ; Т3 ${nrT3} ; Необходимо провести автоматическую корректировку показаний на даты: `;
    const dates = [...document.querySelectorAll('.nrItog')].map((e) => e.value.trim()).filter(Boolean).join(', ');
    copyToClipboard(prefix + dates).then(() => {
      clearFields(['nrDate2','nrT1','nrT2','nrT3']);
      clearNrItog();
    });
  });
}

/* ===================================================
   ЖАЛОБА НА ПД (таблица с кнопками копирования)
   =================================================== */

function initPdTable() {
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const d      = new Date();
  const prev   = months[d.getMonth() === 0 ? 11 : d.getMonth() - 1];
  const rows   = [
    `Клиент не получил квитанцию за ${prev} (месяц). В ЛС адрес клиента указан верно (сотрудник должен сверить адрес доставки ПД);`,
    `Клиент не получил квитанцию за ${prev} (месяц). В ЛС адрес клиента указан верно. Со слов клиента квитанции за ${prev} (месяц) не получил весь дом.`,
    `Клиент не получил квитанцию за ${prev} (месяц). Альтернативный адрес сверен.`,
    `Клиент не получил квитанцию за ${prev} (месяц). В ЛС адрес клиента указан верно. Квитанции разбросаны по всей улице (дому).`,
  ];
  const table = document.getElementById('pdTable');
  if (!table) return;
  table.innerHTML = rows.map((row) => `
    <tr>
      <td>${row}</td>
      <td style="width:110px;text-align:right">
        <button class="pd-copy-btn" data-text="${encodeURIComponent(row)}">
          <i class="fas fa-copy"></i> Копировать
        </button>
      </td>
    </tr>`).join('');
  table.addEventListener('click', (e) => {
    const btn = e.target.closest('.pd-copy-btn');
    if (!btn) return;
    navigator.clipboard.writeText(decodeURIComponent(btn.dataset.text)).then(() => {
      showToast('Скопировано!');
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1200);
    });
  });
}

/* ===================================================
   РЕКВИЗИТЫ
   =================================================== */

function initRekviz() {
  document.getElementById('btnRekviz1').addEventListener('click', () => {
    const g = (id) => document.getElementById(id).value;
    const [phone, mail, ls, date] = ['phone_1','mail_1','ls_1','date_1'].map(g);
    let tx;
    if (!phone) tx = `Клиенту поступают E-mail на E-mail ${mail} о задолженности по ЛС ${ls}. Клиент не имеет отношение к ЛС ${ls}. Дата информирования ${date}. E-mail информирование.`;
    else if (!mail) tx = `Клиенту поступают звонки/смс на телефон ${phone} о задолженности по ЛС ${ls}. Клиент не имеет отношение к ЛС ${ls}. Дата информирования ${date}. Автообзвон/Росдолг, ручной обзвон/смс-оповещение.`;
    else tx = `Клиенту поступают звонки/смс/ E-mail на телефон ${phone} /на E-mail ${mail} о задолженности по ЛС ${ls}. Клиент не имеет отношение к ЛС ${ls}. Дата информирования ${date}. Автообзвон/ E-mail информирование/Росдолг, ручной обзвон/смс-оповещение.`;
    copyToClipboard(tx).then(() => clearFields(['phone_1','mail_1','ls_1','date_1']));
  });
}

/* ===================================================
   ЖАЛОБА НА ОТКЛЮЧЕНИЕ ЭЭ
   =================================================== */

let selectedComplaintType    = '';
let selectedConfirmationType = '';
let selectedErrObj           = ''; // МКД | ИЖД

function initComplaint() {
  /* --- Переключатели верхнего уровня (Ошибочное / Нарушен срок) --- */
  document.querySelectorAll('[data-type]').forEach((b) =>
    b.addEventListener('click', () => selectComplaintType(b.dataset.type, b)));

  /* --- Переключатели МКД / ИЖД внутри «Ошибочного» --- */
  document.querySelectorAll('[data-err-obj]').forEach((b) =>
    b.addEventListener('click', () => selectErrObj(b.dataset.errObj, b)));

  /* --- Кнопка копирования ИЖД --- */
  document.getElementById('btnCopyIjd').addEventListener('click', copyIjd);

  /* --- Ветка «Нарушен срок» --- */
  document.querySelectorAll('[data-confirm]').forEach((b) =>
    b.addEventListener('click', () => selectConfirmationType(b.dataset.confirm, b)));

  document.getElementById('complaintDate').addEventListener('change', function() {
    if (document.getElementById('paymentDate')) {
      document.getElementById('paymentDate').value = this.value;
    }
  });

  document.getElementById('btnCopyComplaint').addEventListener('click', copyComplaint);
}

/* Переключение верхнего типа жалобы */
function selectComplaintType(type, btn) {
  selectedComplaintType    = type;
  selectedConfirmationType = '';
  selectedErrObj           = '';

  /* Сбросить все toggle-кнопки */
  document.querySelectorAll('[data-type]').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('[data-err-obj]').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');

  const isErr = (type === 'Ошибочное отключение');
  setVisible('errBranchWrap',   isErr);
  setVisible('delayBranchWrap', !isErr);

  /* Скрываем под-блоки ошибочного при смене типа */
  setVisible('errMkdBlock', false);
  setVisible('errIjdBlock', false);

  /* Для ветки «Нарушен срок» показываем поля */
  if (!isErr) {
    setVisible('confirmationTypeGroup', true);
    setVisible('complaintDateGroup', true);
    setVisible('mailConfirmGroup', false);
  }
}

/* Переключение МКД / ИЖД */
function selectErrObj(obj, btn) {
  selectedErrObj = obj;
  document.querySelectorAll('[data-err-obj]').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');

  setVisible('errMkdBlock', obj === 'МКД');
  setVisible('errIjdBlock', obj === 'ИЖД');

  /* Сброс полей ИЖД при переключении */
  if (obj !== 'ИЖД') {
    clearFields(['ijdPhone','ijdDate','ijdHouse']);
    const cb = document.getElementById('ijdInRegistry');
    if (cb) cb.checked = false;
    clearErrIjdValidation();
  }
}

/* Валидация и копирование ИЖД */
function copyIjd() {
  const phoneEl = document.getElementById('ijdPhone');
  const dateEl  = document.getElementById('ijdDate');
  const phone   = phoneEl.value.trim();
  const date    = toDisplayDate(dateEl.value);

  let hasError = false;

  /* Подсветка обязательных полей */
  if (!phone) { phoneEl.classList.add('input-error'); hasError = true; }
  else         phoneEl.classList.remove('input-error');

  if (!date)  { dateEl.classList.add('input-error');  hasError = true; }
  else         dateEl.classList.remove('input-error');

  if (hasError) { showToast('Заполните обязательные поля', 'error'); return; }

  const house    = document.getElementById('ijdHouse').value.trim();
  const inReg    = document.getElementById('ijdInRegistry').checked;

  let tx = `Просьба проверить клиента и направить бригаду на факт ошибочного отключения. Номер клиента: ${phone}. Проверены реестры, статус контроля ЛС — отключения быть не должно. Со слов клиента, ${date} было отключение ЭЭ.`;
  if (house) tx += ` Предполагаемый номер дома отключенца: ${house}.`;
  if (inReg) tx += ' Адрес есть в реестре на отключение.';

  copyToClipboard(tx, 'Скопировано!').then(() => {
    clearFields(['ijdPhone','ijdDate','ijdHouse']);
    document.getElementById('ijdInRegistry').checked = false;
    clearErrIjdValidation();
  });
}

function clearErrIjdValidation() {
  ['ijdPhone','ijdDate'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-error');
  });
}

/* Переключение типа подтверждения (ветка «Нарушен срок») */
function selectConfirmationType(type, btn) {
  selectedConfirmationType = type;
  document.querySelectorAll('[data-confirm]').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  const byMail = type === 'Подтвердил через почту';
  setVisible('mailConfirmGroup', byMail);
}

/* Копирование «Нарушен срок» */
function copyComplaint() {
  const phone = document.getElementById('complaintPhone').value.trim();
  if (!phone) { showToast('Укажите телефон для связи', 'error'); return; }
  let tx = '';
  if (selectedComplaintType === 'Нарушен срок возобновления') {
    const cd = toDisplayDate(document.getElementById('complaintDate').value);
    if (!cd) { showToast('Укажите дату оплаты', 'error'); return; }
    if (selectedConfirmationType === 'Подтверждено в КО') {
      tx = `Не выполнена оплаченная заявка на включение э/э №ХХХХ, оплаченная ${cd}. Подтверждение оплаты было в КО, тел. для связи ${phone}`;
    } else if (selectedConfirmationType === 'Подтвердил через почту') {
      const pfzdrb = document.getElementById('pfzdrbInput').value.trim();
      const pd     = toDisplayDate(document.getElementById('paymentDate').value);
      if (!pfzdrb) { showToast('Укажите номер заявки (#pfzdrb)', 'error'); return; }
      tx = `Не выполнена оплаченная заявка на включение э/э №${pfzdrb}, оплаченная ${cd}. Чек направлен ${pd} с эл. почты кцук, тел. для связи ${phone}`;
    } else { showToast('Выберите тип подтверждения', 'error'); return; }
  } else { showToast('Выберите тип жалобы', 'error'); return; }

  copyToClipboard(tx, 'Текст жалобы скопирован!').then(() => {
    clearFields(['complaintPhone','pfzdrbInput','complaintDate','paymentDate']);
    selectedComplaintType = selectedConfirmationType = '';
    document.querySelectorAll('[data-type],[data-confirm]').forEach((b) => b.classList.remove('active'));
    ['confirmationTypeGroup','mailConfirmGroup','complaintDateGroup']
      .forEach((id) => setVisible(id, false));
  });
}

/* ===================================================
   ЖАЛОБА НА СРОКИ ДОГОВОРА
   =================================================== */

let selectedContractType = '';

function initContract() {
  document.querySelectorAll('[data-contract]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedContractType = btn.dataset.contract;
      document.querySelectorAll('[data-contract]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      setVisible('requestNumberGroup', selectedContractType === 'Подача в ЛКК');
      setVisible('officeAddressGroup', selectedContractType === 'Подача в КО');
    });
  });
  const ago = new Date();
  ago.setMonth(ago.getMonth() - 1);
  document.getElementById('contractDate').value = ago.toISOString().split('T')[0];
  document.getElementById('btnCopyContract').addEventListener('click', copyContractComplaint);
}

function copyContractComplaint() {
  const date   = toDisplayDate(document.getElementById('contractDate').value);
  const client = document.getElementById('clientNumber').value.trim();
  if (!client) { showToast('Укажите номер клиента', 'error'); return; }
  let tx = '';
  if (selectedContractType === 'Подача в ЛКК') {
    const req = document.getElementById('requestNumber').value.trim();
    if (!req) { showToast('Укажите номер заявки', 'error'); return; }
    tx = `${date} через ЛКК оформлена услуга Оформление заявки на заключение договора с физ. лицом № ${req}. 30 дней истекли, договор не заключен, ЛС не присвоен. Просьба посодействовать в решении вопроса, дать обратную связь клиенту, присвоить ЛС. Номер клиента: ${client}`;
  } else if (selectedContractType === 'Подача в КО') {
    const addr = document.getElementById('officeAddress').value.trim();
    if (!addr) { showToast('Укажите адрес/название КО', 'error'); return; }
    tx = `${date} в КО ${addr} клиент подавал заявку на заключение договора. 30 дней истекли, договор не заключен, ЛС не присвоен. Просьба посодействовать в решении вопроса, дать обратную связь клиенту, присвоить ЛС. Номер клиента: ${client}`;
  } else { showToast('Выберите тип подачи', 'error'); return; }

  copyToClipboard(tx, 'Текст жалобы скопирован!').then(() => {
    clearFields(['contractDate','requestNumber','clientNumber','officeAddress']);
    selectedContractType = '';
    document.querySelectorAll('[data-contract]').forEach((b) => b.classList.remove('active'));
    setVisible('requestNumberGroup', false);
    setVisible('officeAddressGroup', false);
  });
}

/* ===================================================
   ОПЛАТА ПО БК — транслитерация
   =================================================== */

const TRANSLIT_MAP = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh',
  'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
  'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
  'ч':'ch','ш':'sh','щ':'sh','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
};

function initBK() {
  document.getElementById('bkName').addEventListener('input', transliterateBKName);
  document.getElementById('btnCopyBKName').addEventListener('click', () => {
    const name = document.getElementById('bkLatinName').textContent;
    if (name) {
      copyToClipboard(name, 'ФИО скопировано!').then(() => {
        clearFields(['bkName']);
        setVisible('bkLatinGroup', false);
      });
    }
  });
}

function transliterateBKName() {
  const src = document.getElementById('bkName').value.trim();
  if (!src) { setVisible('bkLatinGroup', false); return; }
  const result = src.split(/\s+/).map((word) => {
    let out = '';
    for (let i = 0; i < word.length; i++) {
      const c = word[i].toLowerCase();
      if (c === 'ь') continue;
      const t = TRANSLIT_MAP[c] ?? c;
      out += i === 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    }
    return out;
  }).join(' ').replace(/(\w+)iy\b/gi, '$1y').replace(/(\w+)yy\b/gi, '$1y');
  document.getElementById('bkLatinName').textContent = result;
  setVisible('bkLatinGroup', true);
}

/* ===================================================
   ПИСЬМО НА РГ О СТАТУСЕ КОНСУЛЬТАЦИИ
   =================================================== */

function validateLS(ls) {
  // 8 цифр подряд
  if (/^\d{8}$/.test(ls)) return true;
  // 10 цифр подряд
  if (/^\d{10}$/.test(ls)) return true;
  // Формат XXXXX-XXX-XX (12 символов, 10 цифр + 2 тире)
  if (/^\d{5}-\d{3}-\d{2}$/.test(ls)) return true;
  return false;
}

function initConsultation() {
  const range     = document.getElementById('monthsRange');
  const rangeVal  = document.getElementById('monthsValue');
  const operator  = document.getElementById('operatorInput');
  const lsInput   = document.getElementById('lsInput');

  /* Загрузка ФИО из localStorage */
  const saved = localStorage.getItem('consultationOperatorName');
  if (saved) operator.value = saved;
  operator.addEventListener('input', () =>
    localStorage.setItem('consultationOperatorName', operator.value));

  /* Показываем слайдер коррекции если выбрана соответствующая причина */
  const correctionCb = document.getElementById('reasonCbCorrection');
  if (correctionCb) {
    correctionCb.addEventListener('change', () =>
      setVisible('correctionPeriodGroup', correctionCb.checked));
  }

  range.addEventListener('input', () => (rangeVal.textContent = range.value));

  /* Фильтр поля ЛС: только цифры и дефис */
  lsInput.addEventListener('keydown', (e) => {
    const nav = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
    if (e.ctrlKey || e.metaKey) return;
    if (!/[\d-]/.test(e.key) && !nav.includes(e.key)) e.preventDefault();
  });
  lsInput.addEventListener('input',  () => { lsInput.value = lsInput.value.replace(/[^\d-]/g, '').slice(0, 12); });
  lsInput.addEventListener('paste',  (e) => {
    e.preventDefault();
    const raw = (e.clipboardData || window.clipboardData).getData('text');
    lsInput.value = raw.replace(/[^\d-]/g, '').slice(0, 12);
  });

  document.getElementById('btnCopyConsultation').addEventListener('click', copyConsultation);
  document.getElementById('btnResetConsultation').addEventListener('click', resetConsultationForm);
}

function copyConsultation() {
  const checkedBoxes = [...document.querySelectorAll('.reason-cb:checked')];
  const ls           = document.getElementById('lsInput').value.trim();
  const operator     = document.getElementById('operatorInput').value.trim();
  const months       = document.getElementById('monthsRange').value;

  if (checkedBoxes.length === 0) { showToast('Выберите хотя бы одну причину', 'error'); return; }
  if (!ls)                        { showToast('Введите ЛС', 'error'); return; }
  if (!validateLS(ls))            { showToast('ЛС: 8 цифр, 10 цифр или формат 12345-678-90', 'error'); return; }
  if (!operator)                  { showToast('Введите ФИО оператора', 'error'); return; }

  const reasons = checkedBoxes.map(cb => cb.value).join(', ');
  let tx = `Выхожу на статус консультации по причине ${reasons} в ${getCurrentDateTime()}\nЛС: ${ls}`;

  const correctionCb = document.getElementById('reasonCbCorrection');
  if (correctionCb && correctionCb.checked) {
    tx += `\nПериод корректировки: ${months} месяцев`;
  }
  tx += `\nОператор: ${operator}`;

  copyToClipboard(tx, 'Текст скопирован!').then(() => {
    document.querySelectorAll('.reason-cb').forEach(cb => cb.checked = false);
    document.getElementById('lsInput').value = '';
    document.getElementById('monthsRange').value = '1';
    document.getElementById('monthsValue').textContent = '1';
    setVisible('correctionPeriodGroup', false);
  });
}

function resetConsultationForm() {
  document.querySelectorAll('.reason-cb').forEach(cb => cb.checked = false);
  document.getElementById('lsInput').value         = '';
  document.getElementById('monthsRange').value     = '1';
  document.getElementById('monthsValue').textContent = '1';
  setVisible('correctionPeriodGroup', false);
}

/* ===================================================
   EMAIL-ШАБЛОНЫ
   =================================================== */

const EMAIL_TEMPLATES = {
  MKD: `Уважаемый клиент!\nЗаявка на возобновление подачи электроэнергии по адресу: … (укажи адрес клиента) сформирована!\nДля возобновлению подачи электроэнергии, Вам необходимо произвести оплату расходов по введению ограничения/приостановлению и возобновлению подачи электроэнергии пройдя по ссылке: https://www.mosenergosbyt.ru/individuals/kak-oplatit-schyet/payments-extra9.php\nДалее нажать на логотип банка «ВБРР», в поле «Номер счета» вписать номер счета из квитанции за оказание услуги № С – 843-********-- , указать сумму оплаты и адрес электронной почты.\nВНИМАНИЕ!\nОплата производится строго на номер счета указанный в приложенной квитанции № С – 843-********--\nОплата произведенная по ЛС электроэнергии не учитывается в счет оплаты услуги по введению ограничения/приостановлению и возобновлению подачи электроэнергии.\nДля подтверждения оплаты счета Вам необходимо направить на электронный адрес vkl-MKD@mosenergosbyt.ru следующую информацию:\n1.Поступивший от банка ВБРР (VBRR) с электронного адреса: echeck@1-ofd.ru чек об оплате счета, на указанную Вами при оплате электронную почту.\nВ котором содержится расшифровка платежа и номер оплаченного счета (информация от банка о статусе платежа не является электронным чеком).\n2. Адрес, по которому оформлена заявка.\n\nОбращаем Ваше внимание! АО «Мосэнергосбыт» не имеет возможности получать обращения с зарубежных почтовых серверов/сервисов, таких как: Gmail.com, Outlook.com, iCloud.com, Yahoo.com и т.п.\nПри отправке квитанции на такие электронные адреса доставка также не будет осуществлена.\nПочтовый ящик vkl-MKD@mosenergosbyt.ru предназначен только для получения АО «Мосэнергосбыт» информации от потребителя-должника об осуществлении оплаты по компенсации расходов по отключению/возобновлению подачи электроснабжения бытовым потребителям, после погашения задолженности.`,
  IGD_asumb: `Уважаемый клиент!\nЗаявка на возобновление подачи электроэнергии по адресу: … (укажи адрес клиента) сформирована!\nДля возобновлению подачи электроэнергии, Вам необходимо произвести оплату расходов по введению ограничения/приостановлению и возобновлению подачи электроэнергии пройдя по ссылке: https://www.mosenergosbyt.ru/individuals/kak-oplatit-schyet/payments-extra9.php\nДалее нажать на логотип банка «ВБРР», в поле «Номер счета» вписать номер счета из квитанции за оказание услуги № С – 843-********-- , указать сумму оплаты и адрес электронной почты.\nВНИМАНИЕ!\nОплата производится строго на номер счета указанный в приложенной квитанции № С – 843-********--\nОплата произведенная по ЛС электроэнергии не учитывается в счет оплаты услуги по введению ограничения/приостановлению и возобновлению подачи электроэнергии.\nДля подтверждения оплаты счета Вам необходимо направить на электронный адрес vkl-IGD@mosenergosbyt.ru следующую информацию:\n1.Поступивший от банка ВБРР (VBRR) с электронного адреса: echeck@1-ofd.ru чек об оплате счета, на указанную Вами при оплате электронную почту.\nВ котором содержится расшифровка платежа и номер оплаченного счета (информация от банка о статусе платежа не является электронным чеком).\n2. Адрес, по которому оформлена заявка.\n\nОбращаем Ваше внимание! АО «Мосэнергосбыт» не имеет возможности получать обращения с зарубежных почтовых серверов/сервисов, таких как: Gmail.com, Outlook.com, iCloud.com, Yahoo.com и т.п.\nПри отправке квитанции на такие электронные адреса доставка также не будет осуществлена.\nПочтовый ящик vkl-IGD@mosenergosbyt.ru предназначен только для получения АО «Мосэнергосбыт» информации от потребителя-должника об осуществлении оплаты по компенсации расходов по отключению/возобновлению подачи электроснабжения бытовым потребителям, после погашения задолженности.`,
  IGD: `Уважаемый клиент!\nЗаявка на возобновление подачи электроэнергии по адресу: … (укажи адрес клиента) сформирована!\nДля возобновлению подачи электроэнергии, Вам необходимо произвести оплату расходов по введению ограничения/приостановлению и возобновлению подачи электроэнергии пройдя по ссылке: https://www.mosenergosbyt.ru/individuals/kak-oplatit-schyet/payments-extra9.php\nДалее нажать на логотип банка «ВБРР», в поле «Номер счета» вписать номер счета из квитанции за оказание услуги № С – 842-*********-*- , указать сумму оплаты и адрес электронной почты.\nВНИМАНИЕ!\nОплата производится строго на номер счета указанный в приложенной квитанции № С – 842-*********-*-\nОплата произведенная по ЛС электроэнергии не учитывается в счет оплаты услуги по введению ограничения/приостановлению и возобновлению подачи электроэнергии.\nДля подтверждения оплаты счета Вам необходимо направить на электронный адрес vkl-IGD@mosenergosbyt.ru следующую информацию:\n1.Поступивший от банка ВБРР (VBRR) с электронного адреса: echeck@1-ofd.ru чек об оплате счета, на указанную Вами при оплате электронную почту.\nВ котором содержится расшифровка платежа и номер оплаченного счета (информация от банка о статусе платежа не является электронным чеком).\n2. Адрес, по которому оформлена заявка.\n\nОбращаем Ваше внимание! АО «Мосэнергосбыт» не имеет возможности получать обращения с зарубежных почтовых серверов/сервисов, таких как: Gmail.com, Outlook.com, iCloud.com, Yahoo.com и т.п.\nПри отправке квитанции на такие электронные адреса доставка также не будет осуществлена.\nПочтовый ящик vkl-IGD@mosenergosbyt.ru предназначен только для получения АО «Мосэнергосбыт» информации от потребителя-должника об осуществлении оплаты по компенсации расходов по отключению/возобновлению подачи электроснабжения бытовым потребителям, после погашения задолженности.`,
  PD:  `Добрый день!\nУважаемый клиент, во вложении квитанция по ЛС ххххх.\nБлагодарим за обращение в АО «Мосэнергосбыт».`,
  Akt: `Добрый день!\nУважаемый клиент, акт сверки по ЛС ххх за период с ХХ по ХХ во вложении.\nБлагодарим за обращение в АО «Мосэнергосбыт»`,
};
const EMAIL_TOPICS = [
  'Восстановление электроэнергии',
  'Квитанция АО Мосэнергосбыт',
  'Акт сверки АО Мосэнергосбыт',
];

function initEmailPanel() {
  document.querySelectorAll('.email-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.mail;
      if (EMAIL_TEMPLATES[key]) copyToClipboard(EMAIL_TEMPLATES[key], 'Текст письма скопирован!');
    });
  });
}

/* ===================================================
   ФУТЕР
   =================================================== */

function initFooter() {
  document.getElementById('btnShare').addEventListener('click', () => {
    const tx = 'Привет!\nЗацени этот инструмент — просто бомба для работы с шаблонами на МЭС! 🔥 https://triplecalc.github.io/AdjustmentV2/';
    navigator.clipboard.writeText(tx).then(() => {
      if (typeof ym !== 'undefined') ym(103923903, 'reachGoal', 'share_invitation');
      showToast('Приглашение скопировано!');
    }).catch(() => showToast('Ошибка копирования', 'error'));
  });
}

/* ===================================================
   МОБИЛЬНАЯ БЛОКИРОВКА
   =================================================== */

function checkMobile() {
  const mob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  if (mob) {
    document.querySelector('.mobile-block').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
  }
}



/* ===================================================
   НЕКОРРЕКТНЫЕ ПЕРЕВОДЫ
   =================================================== */

const TRANSFERS_STORAGE_KEY = 'transfers_data_v1';

function getCurrentTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

function getCurrentDate() {
  const n = new Date();
  return `${String(n.getDate()).padStart(2,'0')}.${String(n.getMonth()+1).padStart(2,'0')}.${n.getFullYear()}`;
}

function getTransferRecords() {
  try {
    return JSON.parse(localStorage.getItem(TRANSFERS_STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveTransferRecord(record) {
  const records = getTransferRecords();
  records.push(record);
  localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(records));
}

function clearTransferRecords() {
  localStorage.removeItem(TRANSFERS_STORAGE_KEY);
}

let selectedTransferDest = '';

function initTransfers() {
  /* Переключатели куда перевели */
  document.querySelectorAll('[data-dest]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTransferDest = btn.dataset.dest;
      document.querySelectorAll('[data-dest]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* Маска даты */
  const trDate = document.getElementById('trDate');
  trDate.addEventListener('input', () => { formatDate(trDate); });
  trDate.addEventListener('keydown', (e) => dateInputFilter(trDate, e));

  /* Маска времени */
  const trTime = document.getElementById('trTime');
  trTime.addEventListener('input', () => {
    let v = trTime.value.replace(/\D/g, '').slice(0,4);
    if (v.length > 2) v = v.slice(0,2) + ':' + v.slice(2);
    trTime.value = v;
  });

  document.getElementById('btnCopyTransfer').addEventListener('click', copyTransfer);
  document.getElementById('btnAddTransfer').addEventListener('click', addTransferRecord);
  document.getElementById('btnExportTransfer').addEventListener('click', exportTransferXLSX);
  document.getElementById('btnClearTransferData').addEventListener('click', () => {
    clearTransferRecords();
    updateTransferCounter();
    showToast('Данные очищены');
  });

  /* Показываем счётчик при загрузке если есть записи */
  updateTransferCounter();
}

/* Обновляет счётчик записей в журнале */
function updateTransferCounter() {
  const count   = getTransferRecords().length;
  const counter = document.getElementById('transferCounter');
  const badge   = document.getElementById('transferCount');
  badge.textContent = count;
  counter.style.display = count > 0 ? 'flex' : 'none';
}

/* Собирает и валидирует поля формы, возвращает объект или null */
function collectTransferData() {
  const name     = document.getElementById('trName').value.trim();
  const question = document.getElementById('trQuestion').value.trim();
  const phone    = document.getElementById('trPhone').value.trim();
  const ls       = document.getElementById('trLs').value.trim();
  const timeRaw  = document.getElementById('trTime').value.trim();
  const dateRaw  = document.getElementById('trDate').value.trim();
  const time     = timeRaw || getCurrentTime();
  const date     = dateRaw || getCurrentDate();

  if (!name)                 { showToast('Введите ФИО оператора', 'error'); return null; }
  if (!selectedTransferDest) { showToast('Выберите, куда перевели', 'error'); return null; }
  if (!question)             { showToast('Введите вопрос клиента', 'error'); return null; }
  if (!phone)                { showToast('Введите телефон клиента', 'error'); return null; }

  return { name, question, phone, ls, time, date };
}

/* Очищает поля формы после записи (кроме ФИО) */
function clearTransferFields() {
  document.getElementById('trDate').value     = '';
  document.getElementById('trTime').value     = '';
  document.getElementById('trQuestion').value = '';
  document.getElementById('trPhone').value    = '';
  document.getElementById('trLs').value       = '';
  selectedTransferDest = '';
  document.querySelectorAll('[data-dest]').forEach(b => b.classList.remove('active'));
}

/* Кнопка «Скопировать» — копирует в буфер И вносит в журнал */
function copyTransfer() {
  const data = collectTransferData();
  if (!data) return;

  const { name, question, phone, ls, time, date } = data;

  let tx = `Некорректный перевод на линию ${selectedTransferDest} по вопросу: ${question}\nВремя: ${time}\nТелефон: ${phone}\nОператор: ${name}`;
  if (ls) tx += `\nЛС клиента: ${ls}`;

  const questionCell = ls
    ? `${selectedTransferDest}, ${question}, ЛС: ${ls}`
    : `${selectedTransferDest}, ${question}`;

  saveTransferRecord({
    date,
    time,
    name,
    dest:     selectedTransferDest,
    question: questionCell,
    phone,
  });

  copyToClipboard(tx, 'Скопировано и внесено в журнал!').then(() => {
    clearTransferFields();
    updateTransferCounter();
  });
}

/* Кнопка «Внести запись» — только в журнал, без копирования */
function addTransferRecord() {
  const data = collectTransferData();
  if (!data) return;

  const { name, question, phone, ls, time, date } = data;

  /* Формат для отчёта: куда перевели, вопрос[, ЛС: xxx] */
  const questionCell = ls
    ? `${selectedTransferDest}, ${question}, ЛС: ${ls}`
    : `${selectedTransferDest}, ${question}`;

  saveTransferRecord({
    date,
    time,
    name,
    dest:     selectedTransferDest,
    question: questionCell,
    phone,
  });

  clearTransferFields();
  updateTransferCounter();
  showToast('Запись внесена в журнал');
}

function exportTransferXLSX() {
  const records = getTransferRecords();
  if (records.length === 0) {
    showToast('Нет данных для выгрузки', 'error');
    return;
  }

  /* Подключаем SheetJS через CDN динамически, если ещё не загружен */
  function buildAndDownload() {
    const XLSX = window.XLSX;
    const headers = ['Дата', 'Время', 'Префикс оп МЭС2', 'ФИО оп МЭС2', 'Вопрос клиента', 'Телефон клиента'];
    const rows = records.map(r => [r.date, r.time, '', r.name, r.question, r.phone]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    /* Ширина колонок */
    ws['!cols'] = [
      {wch:12}, {wch:8}, {wch:18}, {wch:25}, {wch:50}, {wch:18}
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Переводы');

    const dateStr = getCurrentDate().replace(/\./g, '-');
    XLSX.writeFile(wb, `Переводы_на_МЭС2_${dateStr}.xlsx`);

    clearTransferRecords();
    updateTransferCounter();
    showToast('Файл выгружен, данные очищены');
  }

  if (window.XLSX) {
    buildAndDownload();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = buildAndDownload;
    s.onerror = () => showToast('Ошибка загрузки библиотеки Excel', 'error');
    document.head.appendChild(s);
  }
}

/* ===================================================
   АВТОРИЗАЦИЯ И БЛОКИРОВКА
   =================================================== */

const AUTH_KEY    = 'mes_auth_v1';
const AUTH_LOGIN  = 'Operator';
const AUTH_PASS   = 'Operator123';

function initAuth() {
  const isAuthed = localStorage.getItem(AUTH_KEY) === 'true';

  if (!isAuthed) {
    showLoginScreen();
  } else {
    showMainContent();
  }

  /* Кнопка входа */
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('loginUsername').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });

  /* Кнопка замка */
  document.getElementById('lockBtn').addEventListener('click', doLock);

  /* Кнопка разблокировки */
  document.getElementById('unlockBtn').addEventListener('click', doUnlock);
  document.getElementById('lockPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doUnlock();
  });
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'block';
  document.getElementById('lock-screen').style.display  = 'none';
  document.getElementById('main-content').style.display = 'none';
  /* Фокус на поле логина */
  setTimeout(() => {
    const u = document.getElementById('loginUsername');
    if (u) u.focus();
  }, 80);
}

function showLockScreen() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('lock-screen').style.display  = 'block';
  document.getElementById('main-content').style.display = 'none';
  setTimeout(() => {
    const p = document.getElementById('lockPassword');
    if (p) { p.value = ''; p.focus(); }
  }, 80);
}

function showMainContent() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('lock-screen').style.display  = 'none';
  document.getElementById('main-content').style.display = 'block';
}

function doLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  if (u === AUTH_LOGIN && p === AUTH_PASS) {
    localStorage.setItem(AUTH_KEY, 'true');
    err.style.display = 'none';
    showMainContent();
  } else {
    err.style.display = 'block';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
  }
}

function doLock() {
  showLockScreen();
}

function doUnlock() {
  const p   = document.getElementById('lockPassword').value;
  const err = document.getElementById('lockError');
  if (p === AUTH_PASS) {
    err.style.display = 'none';
    showMainContent();
  } else {
    err.style.display = 'block';
    document.getElementById('lockPassword').value = '';
    document.getElementById('lockPassword').focus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  checkMobile();
  initTheme();
  initAccordion();
  initPdTable();
  initCorrectionInputs();
  initCopy1();
  initCopy3();
  initNr();
  initRekviz();
  initComplaint();
  initContract();
  initBK();
  initConsultation();
  initEmailPanel();
  initFooter();
  initTransfers();

  const today = new Date().toISOString().split('T')[0];
  const cd = document.getElementById('complaintDate');
  const pd = document.getElementById('paymentDate');
  if (cd) cd.value = today;
  if (pd) pd.value = today;
});

