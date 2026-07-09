/* =====================================================
   FORM HANDLER — Google Sheets Integration
   مدينة نصر للإسكان والتعمير
   ===================================================== */

// ======================================================
// ⚙️  CONFIG — ضع رابط Google Apps Script هنا
// ======================================================
const SHEETS_CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbzhyUcV6yiL9wIs_gg4ohOEzmUI9uFvNzyvPZ90h2TUVOaBUyrvfzD0GU23rU459xNEMw/exec',
    sheetName: 'Leads'
};
// ======================================================
// 📤  DJANGO SENDER — يرسل البيانات للباك أند الخاص بنا
// ======================================================
async function sendToDjangoBackend(payload) {
    try {
        const response = await fetch('/api/leads/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            console.log('✅ Data sent to Django Backend successfully');
            return true;
        } else {
            console.error('❌ Django Backend returned error:', response.statusText);
            return false;
        }
    } catch (err) {
        console.error('❌ Failed to send to Django Backend:', err);
        return false;
    }
}

// ======================================================
// 📤  CORE SENDER — يرسل البيانات لـ Google Sheets والباك أند
// ======================================================
async function sendToGoogleSheets(data) {
    const payload = {
        ...data,
        timestamp: new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }),
        page: document.title,
        url: window.location.href,
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
    };

    // إرسال البيانات للباك أند الخاص بنا (Django) بشكل متوازٍ وغير معوق
    sendToDjangoBackend(payload);

    // لو الرابط لسه مش متضافه، بس اطبعه في الكونسول
    if (SHEETS_CONFIG.scriptUrl.includes('YOUR_SCRIPT_ID')) {
        console.log('📋 Form Data (Google Sheets not configured yet):', payload);
        return true;
    }

    try {
        await fetch(SHEETS_CONFIG.scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify(payload)
        });
        console.log('✅ Data sent to Google Sheets:', payload);
        return true;
    } catch (err) {
        console.error('❌ Failed to send to Google Sheets:', err);
        return false;
    }
}

// ======================================================
// 🎯  UNIFIED SUBMIT — يستدعى من كل الفورمات
// ======================================================
async function submitForm({ name, phone, project, unit, notes, source, btnId, successId, btn, successEl }) {
    const submitBtn = btn || (btnId ? document.getElementById(btnId) : null);
    const successDiv = successEl || (successId ? document.getElementById(successId) : null);

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'جاري الإرسال...';
    }

    // إرسال البيانات بشكل متوازٍ وخلفي دون إيقاف المتصفح
    sendToGoogleSheets({ name, phone, project, unit, notes, source });

    setTimeout(() => {
        if (submitBtn) submitBtn.style.display = 'none';
        if (successDiv) {
            successDiv.style.display = 'flex';
            successDiv.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>تم استلام طلبك! جاري تحويلك...</span>`;
            if (window.getComputedStyle(successDiv).display === 'none') {
                successDiv.style.display = 'block';
            }
        }
        
        // Redirect to thank you page
        setTimeout(() => {
            window.location.href = 'thankyou.html';
        }, 800);
    }, 900);
}

// ======================================================
// 📌  POPUP — يظهر بعد 15 ثانية (مرة واحدة فقط)
// ======================================================
function initLeadPopup() {
    // لو المستخدم شاف الـ popup في نفس الجلسة، ما تعرضوش
    if (sessionStorage.getItem('popupShown')) return;

    const popup = document.getElementById('leadPopup');
    if (!popup) return;

    setTimeout(() => {
        popup.classList.add('popup-visible');
        document.body.style.overflow = 'hidden';
        sessionStorage.setItem('popupShown', '1');
    }, 15000); // 15 seconds
}

function closeLeadPopup() {
    const popup = document.getElementById('leadPopup');
    if (popup) {
        popup.classList.remove('popup-visible');
        document.body.style.overflow = '';
    }
}

window.handleLeadPopupSubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    
    const nameEl = form.querySelector('#popupName');
    const phoneEl = form.querySelector('#popupPhone');
    const projectEl = form.querySelector('#popupProject');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const project = projectEl ? (projectEl.options[projectEl.selectedIndex]?.text || projectEl.value) : 'مدينة مصر';
    const notes = project ? 'المشروع المختار من النافذة التلقائية: ' + project : '';

    const btn = form.querySelector('button[type="submit"]') || document.getElementById('popupSubmitBtn');
    const successEl = form.querySelector('.form-success') || document.getElementById('popupSuccess');

    await submitForm({
        name,
        phone,
        project,
        notes,
        source: 'Popup — 15s Auto',
        btn,
        successEl
    });

    setTimeout(closeLeadPopup, 2500);
};

// ======================================================
// 🔁  HOOK EXISTING FORMS
// ======================================================

// ---- index.html & talala.html — Calculator / Contact form ----
window.handleContactFormGS = async function(e) {
    e.preventDefault();
    const form = e.target;
    
    const nameEl = form.querySelector('#name') || form.querySelector('input[type="text"]');
    const phoneEl = form.querySelector('#phone') || form.querySelector('input[type="tel"]');
    const projectEl = form.querySelector('#project');
    const projectUnitEl = form.querySelector('#projectUnit'); // for talala.html
    const budgetEl = form.querySelector('#budget');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    
    let project = '';
    let unit = '';
    let notes = '';
    
    if (projectUnitEl) {
        project = 'تلالا';
        unit = projectUnitEl.options[projectUnitEl.selectedIndex]?.text || projectUnitEl.value;
    } else if (projectEl) {
        const projValue = projectEl.value;
        if (projValue === 'sarai') project = 'سراي';
        else if (projValue === 'butterfly') project = 'ذا باترفلاي';
        else if (projValue === 'talala') project = 'تلالا';
        else project = 'استشارة عامة';
    } else {
        project = document.title;
    }

    // Build notes: budget + unit type details
    const parts = [];
    if (budgetEl && budgetEl.value) {
        const budgetText = budgetEl.options[budgetEl.selectedIndex]?.text || budgetEl.value;
        parts.push('الميزانية: ' + budgetText);
    }
    if (unit) parts.push('نوع الوحدة: ' + unit);
    notes = parts.join(' | ');

    const btn = form.querySelector('button[type="submit"]') || document.getElementById('formSubmit');
    const successEl = form.querySelector('.form-success') || document.getElementById('formSuccess');

    await submitForm({
        name,
        phone,
        project,
        unit,
        notes,
        source: 'Contact Form — ' + document.title,
        btn,
        successEl
    });
};

// ---- sarai.html — Esse contact form ----
window.handleEsseFormGS = async function(e) {
    e.preventDefault();
    const form = e.target;
    
    const nameEl = form.querySelector('#esseName');
    const phoneEl = form.querySelector('#essePhone');
    const unitEl = form.querySelector('#esseUnit');
    const notesEl = form.querySelector('#esseNotes');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const unit = unitEl ? unitEl.options[unitEl.selectedIndex]?.text || unitEl.value : '';
    
    // Build notes: unit type + customer written notes
    const parts = [];
    if (unit) parts.push('نوع الوحدة: ' + unit);
    if (notesEl && notesEl.value.trim()) parts.push('ملاحظات العميل: ' + notesEl.value.trim());
    const notes = parts.join(' | ');

    const btn = form.querySelector('button[type="submit"]') || document.getElementById('esseSubmitBtn');
    const successEl = form.querySelector('.esse-form-success') || document.getElementById('esseFormSuccess');

    await submitForm({
        name,
        phone,
        unit,
        notes,
        source: 'Esse Sarai — Contact Form',
        project: 'سراي — إيس',
        btn,
        successEl
    });
};

// ---- butterfly.html — Contact form ----
window.handleBfFormGS = async function(e) {
    e.preventDefault();
    const form = e.target;
    
    const nameEl = form.querySelector('#bfName');
    const phoneEl = form.querySelector('#bfPhone');
    const unitEl = form.querySelector('#bfUnit');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const unit = unitEl ? unitEl.options[unitEl.selectedIndex]?.text || unitEl.value : '';
    const notes = unit ? 'نوع الوحدة المختار: ' + unit : '';

    const btn = form.querySelector('button[type="submit"]') || document.getElementById('bfSubmitBtn');
    const successEl = form.querySelector('.bf-form-success') || document.getElementById('bfFormSuccess');

    await submitForm({
        name,
        phone,
        unit,
        notes,
        source: 'Butterfly — Contact Form',
        project: 'ذا باترفلاي',
        btn,
        successEl
    });
};

// ---- butterfly.html — Modal form ----
window.handleBfModalGS = async function(e) {
    e.preventDefault();
    const form = e.target;
    
    const nameEl = form.querySelector('#bfModalName');
    const phoneEl = form.querySelector('#bfModalPhone');
    const unitEl = form.querySelector('#bfModalUnit');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const unit = unitEl ? unitEl.options[unitEl.selectedIndex]?.text || unitEl.value : '';
    const notes = unit ? 'نوع الوحدة المختار من المودال: ' + unit : '';

    const btn = form.querySelector('button[type="submit"]') || document.getElementById('bfModalSubmit');
    const successEl = form.querySelector('.form-success') || document.getElementById('bfModalSuccess');

    await submitForm({
        name,
        phone,
        unit,
        notes,
        source: 'Butterfly — Modal Booking',
        project: 'ذا باترفلاي',
        btn,
        successEl
    });
};

// ---- Global modal (index.html, talala.html) ----
window.handleModalSubmitGS = async function(e) {
    e.preventDefault();
    const form = e.target;
    
    const nameEl = form.querySelector('#modalName');
    const phoneEl = form.querySelector('#modalPhone');
    const unitTypeEl = form.querySelector('#modalUnitType');
    const sourceEl = form.querySelector('#modalSource');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const unit = unitTypeEl ? unitTypeEl.options[unitTypeEl.selectedIndex]?.text || unitTypeEl.value : '';
    const source = sourceEl ? sourceEl.value : ('Modal — ' + document.title);
    const notes = unit ? 'نوع الوحدة المفضلة من المودال: ' + unit : '';
    
    let project = '';
    if (source.toLowerCase().includes('talala')) {
        project = 'تلالا';
    } else if (source.toLowerCase().includes('butterfly')) {
        project = 'ذا باترفلاي';
    } else if (source.toLowerCase().includes('sarai')) {
        project = 'سراي';
    } else {
        project = 'استشارة عامة';
    }

    const btn = form.querySelector('button[type="submit"]') || document.getElementById('modalSubmitBtn');
    const successEl = form.querySelector('.form-success') || document.getElementById('modalSuccess');

    await submitForm({
        name,
        phone,
        project,
        unit,
        notes,
        source,
        btn,
        successEl
    });
};

// ---- sarai.html — Booking form ----
window.handleBookingFormGS = async function(e) {
    e.preventDefault();
    const form = e.target;
    
    const nameEl = form.querySelector('#modalName');
    const phoneEl = form.querySelector('#modalPhone');
    const unitEl = form.querySelector('#modalInterest');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const unit = unitEl ? unitEl.options[unitEl.selectedIndex]?.text || unitEl.value : '';
    const notes = unit ? 'نوع الوحدة المطلوبة: ' + unit : '';

    const btn = form.querySelector('button[type="submit"]') || document.getElementById('bookingSubmit');
    const successEl = form.querySelector('.form-success') || document.getElementById('bookingSuccess');

    await submitForm({
        name,
        phone,
        unit,
        notes,
        source: 'Sarai — Booking Form',
        project: 'سراي',
        btn,
        successEl
    });
};

// ======================================================
// 🚀  INIT
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    // ربط كل الفورمات
    document.getElementById('contactForm')?.setAttribute('onsubmit', 'handleContactFormGS(event)');
    document.getElementById('modalForm')?.setAttribute('onsubmit', 'handleModalSubmitGS(event)');
    document.getElementById('leadPopupForm')?.setAttribute('onsubmit', 'handleLeadPopupSubmit(event)');
    document.getElementById('bfContactForm')?.setAttribute('onsubmit', 'handleBfFormGS(event)');
    document.getElementById('bfModalForm')?.setAttribute('onsubmit', 'handleBfModalGS(event)');
    document.getElementById('esseContactForm')?.setAttribute('onsubmit', 'handleEsseFormGS(event)');
    document.getElementById('bookingForm')?.setAttribute('onsubmit', 'handleBookingFormGS(event)');

    // الـ popup
    initLeadPopup();
});
