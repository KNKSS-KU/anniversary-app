// ============================
//  Supabase Configuration
//  แก้ค่า 2 บรรทัดนี้เท่านั้น
// ============================
const SUPABASE_URL = 'https://jrnlyarpshxegtggtdnj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z9gBERtLSWsFzSh2w4hX8A_yLcPkMsJ';

// ============================
//  Supabase REST API Helper
// ============================
const sb = {
    // GET request
    async get(table, params = '') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
        return res.json();
    },

    // POST request
    async post(table, data) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `POST ${table} failed: ${res.status}`);
        }
        return true;
    }
};
