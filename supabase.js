/* ================================================================
   Supabase Config
   ================================================================ */
const SUPABASE_URL = 'https://jrnlyarpshxegtggtdnj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z9gBERtLSWsFzSh2w4hX8A_yLcPkMsJ';

/* ── Public API ── */
const sb = {
    async get(table, params = '') {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (!r.ok) throw new Error(`GET ${table} failed: ${r.status}`);
        return r.json();
    },
    async post(table, data) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify(data)
        });
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `POST failed: ${r.status}`); }
    },
    // URL รูปจาก Storage
    storageUrl(bucket, path) {
        return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    }
};

/* ── Auth ── */
const sbAuth = {
    token: null,
    async login(email, password) {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error_description || 'Login failed');
        this.token = d.access_token;
        sessionStorage.setItem('sb_token', this.token);
        return this.token;
    },
    async logout() {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${this.token}` }
        }).catch(() => {});
        this.token = null;
        sessionStorage.removeItem('sb_token');
    },
    restore() { this.token = sessionStorage.getItem('sb_token'); return !!this.token; }
};

/* ── Admin API ── */
const sbAdmin = {
    h() { return { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${sbAuth.token}`, 'Content-Type': 'application/json' }; },
    async get(table, params = '') {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers: this.h() });
        if (!r.ok) throw new Error(`GET failed: ${r.status}`);
        return r.json();
    },
    async post(table, data) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST', headers: { ...this.h(), 'Prefer': 'return=minimal' }, body: JSON.stringify(data)
        });
        if (!r.ok) throw new Error(`POST failed: ${r.status}`);
    },
    async patch(table, params, data) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
            method: 'PATCH', headers: { ...this.h(), 'Prefer': 'return=minimal' }, body: JSON.stringify(data)
        });
        if (!r.ok) throw new Error(`PATCH failed: ${r.status}`);
    },
    async delete(table, params) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
            method: 'DELETE', headers: this.h()
        });
        if (!r.ok) throw new Error(`DELETE failed: ${r.status}`);
    },
    // อัปโหลดไฟล์ขึ้น Storage
    async uploadFile(bucket, path, file) {
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${sbAuth.token}`, 'Content-Type': file.type, 'x-upsert': 'true' },
            body: file
        });
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `Upload failed: ${r.status}`); }
        return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    },
    // ลบไฟล์จาก Storage
    async deleteFile(bucket, paths) {
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${sbAuth.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefixes: paths })
        });
        if (!r.ok) throw new Error(`Delete storage failed: ${r.status}`);
    }
};

/* ── Helpers ── */
const COLORS = ['#FF8200','#3DAA6B','#C0715A','#5B7FA6','#8A6FB5','#D4845A'];
function colorFor(name) { let h = 0; for (let c of String(name)) h = (h << 5) - h + c.charCodeAt(0); return COLORS[Math.abs(h) % COLORS.length]; }
function initials(n) { return String(n).trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'; }
function timeAgo(iso) {
    const d = (Date.now() - new Date(iso)) / 1000;
    if (d < 60) return 'เมื่อกี้';
    if (d < 3600) return `${Math.floor(d / 60)} นาทีที่แล้ว`;
    if (d < 86400) return `${Math.floor(d / 3600)} ชม.ที่แล้ว`;
    return `${Math.floor(d / 86400)} วันที่แล้ว`;
}
function escHtml(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function isNewEntry(iso) { return Date.now() - new Date(iso) < 86400000; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
