// --- 資料安全讀取 ---
let staff, patients;
try {
    staff = JSON.parse(localStorage.getItem('nis_v5_staff')) || defaultStaff;
    patients = JSON.parse(localStorage.getItem('nis_v5_patients')) || defaultPatients;
} catch (e) {
    console.error("資料讀取失敗，自動重設", e);
    staff = defaultStaff;
    patients = defaultPatients;
}

let user = null;
let selectedP = null;
let onSignCallback = null;

// --- 初始化 ---
window.onload = () => {
    console.log("系統初始化中...");
    const filter = document.getElementById('ward-filter');
    if (filter && typeof wards !== 'undefined') {
        wards.forEach(w => filter.add(new Option(w, w)));
    }
};

// --- 側邊欄開關 ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// --- 登入功能 ---
function doLogin() {
    console.log("嘗試登入...");
    const id = document.getElementById('user-id').value;
    const pw = document.getElementById('user-pw').value;
    
    // 檢查 staff 是否存在
    if (typeof staff === 'undefined') {
        alert("系統資料載入失敗，請點擊強制重設按鈕。");
        return;
    }

    const found = staff.find(s => s.id === id && s.password === pw);

    if (found) {
        user = found;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('user-tag').innerHTML = `
            <div class="font-bold text-white">${user.title} ${user.name}</div>
            <div class="text-xs text-slate-500">員編: ${user.id}</div>
        `;
        if (user.role === 'ADMIN') document.getElementById('btn-admin').classList.remove('hidden');
        navTo('patients');
    } else {
        const msg = document.getElementById('login-msg');
        msg.classList.remove('hidden');
        console.warn("登入失敗：員編或密碼不正確");
    }
}

// --- 導覽切換 ---
function navTo(view) {
    console.log("切換至視圖:", view);
    
    // 手機版自動關閉側邊欄
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('-translate-x-full')) toggleSidebar();
    }

    const container = document.getElementById('content');
    container.innerHTML = ''; // 清空內容

    // 更新導覽按鈕顏色
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'border-l-4', 'border-blue-500', 'text-blue-400');
        if (btn.getAttribute('onclick').includes(view)) {
            btn.classList.add('bg-slate-800', 'border-l-4', 'border-blue-500', 'text-blue-400');
        }
    });

    // 根據視圖執行渲染
    if (view === 'patients') renderPatients(container);
    else if (view === 'mar') renderMAR(container);
    else if (view === 'assessment') renderAssessment(container);
    else if (view === 'staff') renderStaff(container);
}

// --- 病患清單 ---
function renderPatients(container) {
    const ward = document.getElementById('ward-filter').value;
    const list = (ward === "全部區域") ? patients : patients.filter(p => p.ward === ward);
    
    let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;
    list.forEach(p => {
        const isSel = selectedP?.id === p.id;
        html += `
            <div onclick="selectP('${p.id}')" class="bg-white p-6 rounded-3xl shadow-sm border-2 cursor-pointer active:scale-95 transition ${isSel ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                <div class="flex justify-between font-bold mb-2">
                    <span class="text-xs text-slate-400">${p.ward}</span>
                    <span class="text-blue-600">${p.bed}</span>
                </div>
                <div class="text-xl font-bold">${p.name}</div>
                <div class="text-red-500 text-sm mt-2 font-bold">${p.diagnosis}</div>
            </div>`;
    });
    container.innerHTML = html + `</div>`;
}

function selectP(id) {
    selectedP = patients.find(p => p.id === id);
    document.getElementById('active-p-tag').innerText = `${selectedP.bed} ${selectedP.name}`;
    navTo('patients');
}

// --- MAR 給藥 ---
function renderMAR(container) {
    if (!selectedP) return container.innerHTML = `<div class="p-10 text-center text-gray-400">請先選取病患</div>`;
    
    container.innerHTML = `
        <div class="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div class="p-6 bg-blue-600 text-white flex justify-between">
                <h2 class="font-bold">給藥單 (MAR)</h2>
                ${user.role === 'ADMIN' ? `<button onclick="adminAdd()" class="text-xs border px-2 py-1 rounded">管理</button>` : ''}
            </div>
            <div class="p-4 space-y-3">
                ${selectedP.meds.map(m => `
                    <div class="flex justify-between items-center border-b pb-3">
                        <div><div class="font-bold text-blue-800">${m.name}</div><div class="text-xs text-gray-400">${m.dose} / ${m.freq}</div></div>
                        <button onclick="openSign(()=>alert('給藥完成'))" class="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs">簽名執行</button>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

// --- 簽章視窗 ---
function openSign(callback) {
    onSignCallback = callback;
    document.getElementById('modal-sign').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-sign').classList.add('hidden');
    document.getElementById('sig-pw').value = '';
}

function doSign() {
    const pw = document.getElementById('sig-pw').value;
    if (pw === user.password) {
        closeModal();
        if (onSignCallback) onSignCallback();
    } else {
        alert("密碼錯誤！");
    }
}

// --- 強制重設系統 ---
function forceReset() {
    if (confirm("這將會清除所有本地快取資料並重設系統，確定嗎？")) {
        localStorage.clear();
        location.reload();
    }
}

// --- 資料儲存 ---
function save() {
    localStorage.setItem('nis_v5_staff', JSON.stringify(staff));
    localStorage.setItem('nis_v5_patients', JSON.stringify(patients));
}

// --- 其他省略功能 (依此類推) ---
function renderAssessment(c) { c.innerHTML = `<div class="p-10 text-center">評估單模組加載成功</div>`; }
function renderStaff(c) { c.innerHTML = `<div class="p-10 text-center">人員管理模組加載成功</div>`; }
