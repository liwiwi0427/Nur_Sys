// --- 基礎變數與資料載入 ---
let staff = JSON.parse(localStorage.getItem('nis_v4_staff')) || defaultStaff;
let patients = JSON.parse(localStorage.getItem('nis_v4_patients')) || defaultPatients;
let user = null;
let selectedP = null;
let currentView = 'patients';
let onSignCallback = null;

// --- 初始化 ---
window.onload = () => {
    const filter = document.getElementById('ward-filter');
    wards.forEach(w => filter.add(new Option(w, w)));
    setInterval(() => {
        const clock = document.getElementById('live-clock');
        if(clock) clock.innerText = new Date().toLocaleTimeString();
    }, 1000);
};

// --- 手機側邊欄開關 ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.remove('sidebar-closed');
        sidebar.classList.add('sidebar-open');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('sidebar-closed');
        sidebar.classList.remove('sidebar-open');
        overlay.classList.add('hidden');
    }
}

// --- 登入邏輯 ---
function doLogin() {
    const id = document.getElementById('user-id').value;
    const pw = document.getElementById('user-pw').value;
    const found = staff.find(s => s.id === id && s.password === pw);

    if (found) {
        user = found;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('user-tag').innerHTML = `
            <div class="text-blue-400 font-bold mb-1">${user.title}</div>
            <div class="text-base font-bold text-white">${user.name}</div>
            <div class="text-slate-500 text-xs italic">員編: ${user.id}</div>
        `;
        document.getElementById('sig-user').innerText = `簽署人：${user.title} ${user.name}`;
        if (user.role === 'ADMIN') document.getElementById('btn-admin').classList.remove('hidden');
        navTo('patients');
    } else {
        const msg = document.getElementById('login-msg');
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 3000);
    }
}

// --- 路由導航 ---
function navTo(view) {
    // 如果在手機版，切換功能後自動關閉側邊欄
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('sidebar-open')) toggleSidebar();
    }

    currentView = view;
    const container = document.getElementById('content');
    container.innerHTML = '';
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('nav-active');
        if(b.innerText.includes(view === 'staff' ? '人員管理' : view === 'patients' ? '病患管理' : view)) b.classList.add('nav-active');
    });

    if (view === 'patients') renderPatients(container);
    else if (view === 'mar') renderMAR(container);
    else if (view === 'assessment') renderAssessment(container);
    else if (view === 'staff') renderStaff(container);
    else if (view === 'settings') renderSettings(container);
}

// --- 病患管理 (手機適配卡片) ---
function renderPatients(container) {
    const ward = document.getElementById('ward-filter').value;
    const list = ward === "全部區域" ? patients : patients.filter(p => p.ward === ward);
    
    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">`;
    list.forEach(p => {
        const isSel = selectedP?.id === p.id;
        html += `
            <div onclick="selectP('${p.id}')" class="bg-white p-5 rounded-3xl shadow-sm border-2 cursor-pointer transition active:scale-95 ${isSel ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                <div class="flex justify-between mb-3"><span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">${p.ward}</span><span class="text-blue-600 font-black">${p.bed}</span></div>
                <div class="text-lg font-bold text-slate-800">${p.name} <span class="text-xs font-normal text-slate-400">${p.age}歲</span></div>
                <div class="mt-3 text-red-500 text-xs font-bold bg-red-50 p-2 rounded-xl">${p.diagnosis}</div>
            </div>`;
    });
    container.innerHTML = html + `</div>`;
}

function selectP(id) {
    selectedP = patients.find(p => p.id === id);
    const tag = document.getElementById('active-p-tag');
    tag.innerText = `${selectedP.bed} ${selectedP.name}`;
    tag.classList.remove('hidden');
    navTo('patients');
}

// --- MAR (手機適配表格) ---
function renderMAR(container) {
    if (!selectedP) return container.innerHTML = `<div class="text-center p-20 text-slate-400">請先選擇病患</div>`;
    
    container.innerHTML = `
        <div class="bg-white rounded-3xl shadow-sm overflow-hidden border">
            <div class="p-5 lg:p-8 bg-blue-600 text-white flex justify-between items-center">
                <h2 class="text-lg lg:text-xl font-bold">給藥單 (MAR)</h2>
                ${user.role === 'ADMIN' ? `<button onclick="adminAddMed()" class="text-xs bg-white text-blue-600 px-3 py-1 rounded-lg font-bold shadow-lg">管理藥單</button>` : ''}
            </div>
            <div class="table-responsive">
                <table class="w-full min-w-[500px]">
                    <tr class="bg-slate-50 border-b text-[10px] text-slate-500 uppercase tracking-widest"><th class="p-4 text-left">藥品</th><th class="p-4 text-left">用法</th><th class="p-4 text-right">操作</th></tr>
                    ${selectedP.meds.map(m => `
                        <tr class="border-b">
                            <td class="p-4"><div class="font-bold text-blue-700">${m.name}</div></td>
                            <td class="p-4 text-sm">${m.dose} / ${m.freq}</td>
                            <td class="p-4 text-right"><button onclick="openSign(() => alert('已完成給藥'))" class="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">執行</button></td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </div>`;
}

fu
