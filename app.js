// ============================
//  Translations
// ============================
const translations = {
    th: { btn_write: '+ เขียนคำอวยพร' },
    en: { btn_write: '+ Write a Wish' }
};

let currentLang = 'th';
let settings    = {};

// ============================
//  Load Settings จาก Supabase
// ============================
async function loadSettings() {
    try {
        const rows = await sb.get('settings', '?select=setting_key,setting_value');
        rows.forEach(r => settings[r.setting_key] = r.setting_value);

        updateTexts();

        if (settings.bg_image) {
            document.body.style.backgroundImage = `url('${settings.bg_image}')`;
        }
    } catch (e) {
        console.warn('loadSettings error:', e);
    }
}

function updateTexts() {
    const lang = currentLang;
    document.getElementById('headerTitle').innerText =
        settings[`header_${lang}`] || (lang === 'th' ? '30 ปี แห่งความภาคภูมิใจ' : '30 Years of Pride');
    document.getElementById('headerSubtitle').innerText =
        settings[`subtitle_${lang}`] || (lang === 'th' ? 'คลิกที่รูปเพื่ออ่านคำอวยพร' : 'Click a photo to read wishes');
}

// ============================
//  Load Wishes (การ์ด)
// ============================
async function loadWishes() {
    try {
        const wishes = await sb.get('wishes', '?status=eq.approved&order=created_at.desc');
        renderCards(wishes);
    } catch (e) {
        console.warn('loadWishes error:', e);
    }
}

function renderCards(wishes) {
    const area = document.getElementById('wishArea');
    area.innerHTML = '';

    if (wishes.length === 0) {
        area.innerHTML = '<p style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:1.2rem;opacity:0.7">ยังไม่มีคำอวยพร</p>';
        return;
    }

    wishes.forEach(w => {
        const card = document.createElement('div');
        card.className = 'polaroid-card';
        card.style.top  = w.top_pos + '%';
        card.style.left = w.left_pos + '%';
        card.style.animationDelay = -(Math.random() * 5) + 's';
        card.style.transform = `rotate(${Math.floor(Math.random() * 10) - 5}deg)`;
        card.innerHTML = `
            <img src="${esc(w.avatar)}" alt="${esc(w.name)}"
                 onerror="this.src='https://cdn-icons-png.flaticon.com/512/4140/4140037.png'">
            <div class="name">${esc(w.name)}</div>`;
        card.onclick = () => openModal(w);
        area.appendChild(card);
    });
}

// ============================
//  Modal: อ่านคำอวยพร
// ============================
function openModal(w) {
    const img = document.getElementById('modalImg');
    img.src = w.avatar;
    img.onerror = () => img.src = 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png';
    document.getElementById('modalName').innerText = w.name;
    document.getElementById('modalDept').innerText = w.dept;
    document.getElementById('modalMsg').innerText  = w.message;
    document.getElementById('wishModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('wishModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ============================
//  Modal: เขียนคำอวยพร
// ============================
async function openSubmitModal() {
    document.getElementById('submitModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadAvatars();
    loadPredefined();
}

function closeSubmitModal() {
    document.getElementById('submitModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function loadAvatars() {
    try {
        const avatars = await sb.get('avatars', '?select=id,image_path&order=id.asc');
        const grid = document.getElementById('avatarGrid');
        grid.innerHTML = '';
        avatars.forEach(a => {
            const img = document.createElement('img');
            img.src = a.image_path;
            img.className = 'avatar-option';
            img.dataset.path = a.image_path;
            img.onclick = () => {
                document.querySelectorAll('.avatar-option').forEach(x => x.classList.remove('selected'));
                img.classList.add('selected');
            };
            grid.appendChild(img);
        });
        // เลือกอันแรกไว้ก่อน
        grid.querySelector('.avatar-option')?.click();
    } catch (e) {
        console.warn('loadAvatars error:', e);
    }
}

async function loadPredefined() {
    try {
        const rows = await sb.get('predefined_wishes', '?select=id,message_text&order=id.asc');
        const sel = document.getElementById('predefinedSelect');
        sel.innerHTML = '<option value="">— เลือกคำอวยพร —</option>';
        rows.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.message_text;
            opt.text  = r.message_text;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.warn('loadPredefined error:', e);
    }
}

function usePredefined() {
    const val = document.getElementById('predefinedSelect').value;
    if (val) document.getElementById('wishMessage').value = val;
}

async function submitWish() {
    const name    = document.getElementById('wishName').value.trim();
    const dept    = document.getElementById('wishDept').value.trim();
    const message = document.getElementById('wishMessage').value.trim();
    const avatar  = document.querySelector('.avatar-option.selected')?.dataset.path
                    || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png';
    const errEl   = document.getElementById('submitError');
    errEl.style.display = 'none';

    if (!name)    { showError('กรุณากรอกชื่อ'); return; }
    if (!dept)    { showError('กรุณากรอกแผนก'); return; }
    if (!message) { showError('กรุณากรอกคำอวยพร'); return; }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerText = 'กำลังส่ง...';

    try {
        await sb.post('wishes', {
            name, dept, message, avatar,
            top_pos:  Math.floor(Math.random() * 65) + 10,
            left_pos: Math.floor(Math.random() * 78) + 5,
            status: 'pending'
        });

        closeSubmitModal();
        alert('🎉 ส่งคำอวยพรเรียบร้อยแล้ว!\nรอการตรวจสอบจากทีมงานสักครู่นะครับ');
        resetForm();
    } catch (e) {
        showError('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = 'ส่งคำอวยพร 🎉';
    }
}

function showError(msg) {
    const el = document.getElementById('submitError');
    el.innerText = msg;
    el.style.display = 'block';
}

function resetForm() {
    ['wishName','wishDept','wishMessage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('predefinedSelect').selectedIndex = 0;
}

// ============================
//  Language Switch
// ============================
function changeLanguage(lang) {
    currentLang = lang;
    updateTexts();
    document.getElementById('btn-th').classList.toggle('active', lang === 'th');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
}

// ============================
//  Close modal on outside click
// ============================
window.onclick = e => {
    if (e.target === document.getElementById('wishModal'))   closeModal();
    if (e.target === document.getElementById('submitModal')) closeSubmitModal();
};

// ============================
//  Helper
// ============================
function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============================
//  Init
// ============================
(async () => {
    await loadSettings();
    await loadWishes();
})();
