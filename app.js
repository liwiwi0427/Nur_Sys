// --- 全域變數 ---
let staff = JSON.parse(localStorage.getItem('nis_v3_staff')) || defaultStaff;
let patients = JSON.parse(localStorage.getItem('nis_v3_patients')) || defaultPatients;
let user = null;
let selectedP = null;
let currentView = 'patients';
let onSignCallback = null;

// --- 初始化 ---
window.onload = () => {
    const filter = document.getElementById('ward-filter');
    wards.forEach(w => filter.add(new Option(w, w)));
    setInterval(() => document.getElementById('live-clock').innerText = new Date().toLocaleString(), 1000);
};

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
            <div class="text-blue-400 text-xs font-bold mb-1">${user.title}</div>
            <div class="text-lg font-bold text-white">${user.name}</div>
            <div class="text-slate-500 text-xs mt-1 italic">ID: ${user.id}</div>
        `;
        document.getElementById('sig-user').innerText = `簽署人：${user.title} ${user.name} (${user.id})`;
        if (user.role === 'ADMIN') document.getElementById('btn-admin').classList.remove('hidden');
        navTo('patients');
    } else {
        document.getElementById('login-msg').classList.remove('hidden');
    }
}

// --- 路由系統 ---
function navTo(view) {
    currentView = view;
    const container = document.getElementById('content');
    container.innerHTML = '';
    
    // UI 按鈕狀態
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('nav-active');
        if(b.innerHTML.includes(view === 'staff' ? '系統人員' : view === 'patients' ? '病患管理' : view)) b.classList.add('nav-active');
    });

    if (view === 'patients') renderPatients(container);
    else if (view === 'mar') renderMAR(container);
    else if (view === 'assessment') renderAssessment(container);
    else if (view === 'staff') renderStaff(container);
    else if (view === 'settings') renderSettings(container);
}

// --- 病患管理 ---
function renderPatients(container) {
    const ward = document.getElementById('ward-filter').value;
    const list = ward === "全部區域" ? patients : patients.filter(p => p.ward === ward);
    
    let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
    list.forEach(p => {
        const isSel = selectedP?.id === p.id;
        html += `
            <div onclick="selectP('${p.id}')" class="card-hover bg-white p-6 rounded-3xl shadow-sm border-2 cursor-pointer ${isSel ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                <div class="flex justify-between mb-4"><span class="text-xs font-black text-slate-400 uppercase">${p.ward}</span><span class="text-blue-600 font-black">${p.bed}</span></div>
                <div class="text-2xl font-bold text-slate-800">${p.name} <span class="text-sm font-normal text-slate-400">${p.age}歲</span></div>
                <div class="mt-4 text-red-500 text-sm font-bold bg-red-50 p-2 rounded-lg"><i class="fa fa-notes-medical mr-2"></i>${p.diagnosis}</div>
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

// --- 給藥系統 (MAR) ---
function renderMAR(container) {
    if (!selectedP) return container.innerHTML = `<div class="text-center p-20 text-slate-400">請先在病患管理中選擇病患</div>`;
    
    container.innerHTML = `
        <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
            <div class="p-8 bg-blue-600 text-white flex justify-between items-center">
                <h2 class="text-2xl font-bold">給藥執行清單 (MAR)</h2>
                ${user.role === 'ADMIN' ? `<button onclick="adminAddMed()" class="bg-white text-blue-600 px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition">管理員：新增藥單項目</button>` : ''}
            </div>
            <table class="w-full border-collapse">
                <tr class="bg-slate-50 border-b text-slate-500 uppercase text-sm tracking-widest"><th class="p-6 text-left">藥品資訊</th><th class="p-6 text-left">劑量/途徑</th><th class="p-6 text-left">頻率</th><th class="p-6 text-right">執行簽署</th></tr>
                ${selectedP.meds.map(m => `
                    <tr class="border-b hover:bg-slate-50 transition">
                        <td class="p-6"><div class="font-bold text-blue-700 text-lg">${m.name}</div><div class="text-xs text-slate-400">ID: ${m.id}</div></td>
                        <td class="p-6 font-medium">${m.dose} / ${m.route}</td>
                        <td class="p-6 font-medium text-slate-500">${m.freq}</td>
                        <td class="p-6 text-right"><button onclick="openSign(() => alert('給藥成功：${m.name}'))" class="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition">簽名執行</button></td>
                    </tr>
                `).join('')}
            </table>
        </div>`;
}

function adminAddMed() {
    const name = prompt("輸入藥名:");
    if (!name) return;
    const dose = prompt("劑量途徑 (如: 100mg PO):");
    const freq = prompt("頻率 (如: QD):");
    selectedP.meds.push({ id: Date.now(), name, dose, freq, route: '' });
    save(); navTo('mar');
}

// --- 護理評估 (詳細版) ---
function renderAssessment(container) {
    if (!selectedP) return container.innerHTML = `<div class="text-center p-20 text-slate-400">請先在病患管理中選擇病患</div>`;
    
    container.innerHTML = `
        <div class="max-w-4xl mx-auto bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 space-y-8">
            <h2 class="text-3xl font-bold text-slate-800 border-b pb-4">綜合護理評估表</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><label class="block font-bold mb-2">意識狀態 (GCS)</label><select class="w-full p-4 border rounded-2xl bg-slate-50 outline-none"><option>E4V5M6 (清醒)</option><option>E3V4M5 (嗜睡)</option><option>E1V1M1 (昏迷)</option></select></div>
                <div><label class="block font-bold mb-2">疼痛分數 (0-10)</label><input type="range" min="0" max="10" class="w-full mt-4" oninput="this.nextElementSibling.value = this.value"> <output class="font-black text-blue-600">5</output></div>
                <div><label class="block font-bold mb-2">跌倒風險評估 (Morse Scale)</label><select class="w-full p-4 border rounded-2xl bg-slate-50 outline-none"><option>低風險 (0-24)</option><option>中風險 (25-44)</option><option>高風險 (>45)</option></select></div>
                <div><label class="block font-bold mb-2">壓瘡風險評估 (Braden Scale)</label><input type="number" placeholder="總分 (6-23)" class="w-full p-4 border rounded-2xl bg-slate-50 outline-none"></div>
                <div class="md:col-span-2 border-t pt-6 mt-4">
                    <label class="block font-bold mb-4 text-blue-600">生命徵象 (Vital Signs)</label>
                    <div class="grid grid-cols-4 gap-4">
                        <input placeholder="BT (°C)" class="p-4 border rounded-2xl bg-slate-50 outline-none text-center font-bold">
                        <input placeholder="HR (bpm)" class="p-4 border rounded-2xl bg-slate-50 outline-none text-center font-bold">
                        <input placeholder="RR (bpm)" class="p-4 border rounded-2xl bg-slate-50 outline-none text-center font-bold">
                        <input placeholder="BP (mmHg)" class="p-4 border rounded-2xl bg-slate-50 outline-none text-center font-bold">
                    </div>
                </div>
            </div>
            <button onclick="openSign(() => { alert('評估已儲存！'); navTo('patients'); })" class="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-green-700 transition">提交評估單並進行身分簽章</button>
        </div>`;
}

// --- 人員管理 ---
function renderStaff(container) {
    if (user.role !== 'ADMIN') return;
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white p-8 rounded-3xl shadow-sm border border-blue-100">
                <h3 class="text-xl font-bold text-blue-700 mb-6">新增員工帳號</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input id="s-id" placeholder="員工編號" class="p-4 border rounded-2xl outline-none">
                    <input id="s-name" placeholder="姓名" class="p-4 border rounded-2xl outline-none">
                    <input id="s-pw" type="password" placeholder="登入密碼" class="p-4 border rounded-2xl outline-none">
                    <select id="s-title" class="p-4 border rounded-2xl outline-none"><option>護理師</option><option>護理長</option><option>醫師</option></select>
                </div>
                <button onclick="addStaff()" class="mt-6 bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition">建立資料</button>
            </div>
            <div class="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
                <table class="w-full">
                    <tr class="bg-slate-50 text-slate-500 text-sm tracking-widest uppercase border-b"><th class="p-6 text-left">職稱/姓名</th><th class="p-6 text-left">員工編號</th><th class="p-6 text-right">帳號管理</th></tr>
                    ${staff.map(s => `
                        <tr class="border-b hover:bg-slate-50 transition">
                            <td class="p-6"><div class="font-bold">${s.title} ${s.name}</div></td>
                            <td class="p-6 font-mono">${s.id}</td>
                            <td class="p-6 text-right">${s.id === user.id ? '<span class="text-slate-300 italic">當前登入中</span>' : `<button onclick="delStaff('${s.id}')" class="text-red-500 hover:underline">刪除帳號</button>`}</td>
                        </tr>`).join('')}
                </table>
            </div>
        </div>`;
}

function addStaff() {
    const id = document.getElementById('s-id').value;
    const name = document.getElementById('s-name').value;
    const pw = document.getElementById('s-pw').value;
    const title = document.getElementById('s-title').value;
    if(!id || !name || !pw) return alert("資料不完整");
    staff.push({ id, name, password: pw, title, role: title === "護理長" ? "ADMIN" : "RN" });
    save(); navTo('staff');
}

function delStaff(id) {
    if(confirm("確定要刪除嗎？")) { staff = staff.filter(s => s.id !== id); save(); navTo('staff'); }
}

// --- 簽章系統 ---
function openSign(callback) {
    onSignCallback = callback;
    document.getElementById('modal-sign').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-sign').classList.add('hidden');
    document.getElementById('sig-pw').value = '';
}

function doSign() {
    if (document.getElementById('sig-pw').value === user.password) {
        closeModal();
        if (onSignCallback) onSignCallback();
    } else {
        alert("驗證密碼錯誤！");
    }
}

// --- 個人密碼修改 ---
function renderSettings(container) {
    container.innerHTML = `
        <div class="max-w-md mx-auto bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 text-center">
            <h2 class="text-2xl font-bold mb-8">修改個人密碼</h2>
            <input type="password" id="new-pw-set" placeholder="請輸入新密碼" class="w-full p-4 border rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
            <button onclick="updatePw()" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition">確認修改</button>
        </div>`;
}

function updatePw() {
    const np = document.getElementById('new-pw-set').value;
    if(!np) return alert("不可為空");
    const idx = staff.findIndex(s => s.id === user.id);
    staff[idx].password = np;
    user.password = np;
    save(); alert("密碼已成功更新！");
    navTo('patients');
}

// --- 資料存儲 ---
function save() {
    localStorage.setItem('nis_v3_staff', JSON.stringify(staff));
    localStorage.setItem('nis_v3_patients', JSON.stringify(patients));
}
