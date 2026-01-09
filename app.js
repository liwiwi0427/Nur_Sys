let staff = JSON.parse(localStorage.getItem('nis_staff')) || initialStaff;
let patients = JSON.parse(localStorage.getItem('nis_patients')) || initialPatients;
let currentUser = null;
let currentPatient = null;
let currentView = 'patients';
let pendingAction = null;

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    const ws = document.getElementById('ward-select');
    wardList.forEach(w => ws.add(new Option(w, w)));
    setInterval(() => document.getElementById('clock').innerText = new Date().toLocaleString(), 1000);
});

// --- 登入 ---
function handleLogin() {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;
    const user = staff.find(u => u.id === id && u.password === pw);

    if (user) {
        currentUser = user;
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-system').classList.remove('hidden');
        document.getElementById('user-display').innerHTML = `${user.title} ${user.name}<br><small>員編：${user.id}</small>`;
        if (user.role === 'ADMIN') document.getElementById('admin-staff-btn').classList.remove('hidden');
        switchView('patients');
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

// --- 視圖控制 ---
function switchView(view) {
    currentView = view;
    const area = document.getElementById('content-area');
    area.innerHTML = '';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    if (view === 'patients') renderPatients(area);
    else if (view === 'mar') renderMAR(area);
    else if (view === 'assessment') renderAssessment(area);
    else if (view === 'staff') renderStaff(area);
    else if (view === 'settings') renderSettings(area);
}

// --- 病患清單 ---
function renderPatients(container) {
    const ward = document.getElementById('ward-select').value;
    const filtered = ward === '全部區域' ? patients : patients.filter(p => p.ward === ward);
    let html = `<div class="grid grid-cols-2 gap-6">`;
    filtered.forEach(p => {
        html += `
        <div onclick="selectPatient('${p.id}')" class="bg-white p-6 rounded-2xl shadow-sm border-2 cursor-pointer ${currentPatient?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
            <div class="flex justify-between font-bold text-blue-600 mb-2"><span>${p.bed}</span><span>${p.ward}</span></div>
            <div class="text-xl font-bold">${p.name} (${p.age}歲)</div>
            <div class="text-red-500 text-sm mt-2">診斷：${p.diagnosis}</div>
        </div>`;
    });
    container.innerHTML = html + `</div>`;
}

function selectPatient(id) {
    currentPatient = patients.find(p => p.id === id);
    document.getElementById('active-patient-header').innerText = `${currentPatient.bed} ${currentPatient.name}`;
    switchView('patients');
}

// --- 給藥系統 (含管理員調整功能) ---
function renderMAR(container) {
    if (!currentPatient) return container.innerHTML = "請先選擇病患";
    
    let html = `
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="p-6 bg-blue-600 text-white flex justify-between items-center">
                <h2 class="text-xl font-bold">給藥執行清單 (MAR)</h2>
                ${currentUser.role === 'ADMIN' ? `<button onclick="showAddMed()" class="bg-yellow-400 text-blue-900 px-4 py-1 rounded-lg font-bold text-sm">+ 管理藥單</button>` : ''}
            </div>
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr><th class="p-4">藥名</th><th class="p-4">劑量/途徑</th><th class="p-4">頻率</th><th class="p-4">操作</th></tr>
                </thead>
                <tbody>
                    ${currentPatient.medications.map(m => `
                        <tr class="border-b">
                            <td class="p-4 font-bold text-blue-700">${m.name}</td>
                            <td class="p-4">${m.dose} / ${m.route}</td>
                            <td class="p-4">${m.freq}</td>
                            <td class="p-4"><button onclick="signAction('給藥: ${m.name}')" class="bg-blue-600 text-white px-4 py-1 rounded">簽署給藥</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    container.innerHTML = html;
}

function showAddMed() {
    const name = prompt("請輸入藥名:");
    if (!name) return;
    const dose = prompt("劑量/途徑 (例如: 10mg/PO):");
    const freq = prompt("頻率 (例如: QD):");
    currentPatient.medications.push({ id: Date.now(), name, dose, freq });
    save();
    switchView('mar');
}

// --- 強化護理評估 ---
function renderAssessment(container) {
    if (!currentPatient) return container.innerHTML = "請先選擇病患";
    container.innerHTML = `
        <div class="bg-white p-8 rounded-2xl shadow-sm max-w-2xl mx-auto space-y-6">
            <h2 class="text-2xl font-bold border-b pb-2">綜合護理評估</h2>
            <div class="grid grid-cols-2 gap-6">
                <div><label class="block text-sm font-bold">意識狀態 (GCS)</label>
                    <select class="w-full border p-2 rounded"><option>Clear (E4V5M6)</option><option>Drowsy</option><option>Coma</option></select>
                </div>
                <div><label class="block text-sm font-bold">疼痛評估 (0-10)</label>
                    <input type="number" min="0" max="10" class="w-full border p-2 rounded" placeholder="分數">
                </div>
                <div><label class="block text-sm font-bold">跌倒風險 (Morse)</label>
                    <select class="w-full border p-2 rounded"><option>低風險</option><option>中風險</option><option>高風險</option></select>
                </div>
                <div><label class="block text-sm font-bold">壓瘡評估 (Braden)</label>
                    <input type="number" class="w-full border p-2 rounded" placeholder="總分">
                </div>
                <div class="col-span-2"><label class="block text-sm font-bold">生命徵象 (BT/HR/RR/BP)</label>
                    <div class="flex space-x-2"><input placeholder="BT" class="w-1/4 border p-2 rounded"><input placeholder="HR" class="w-1/4 border p-2 rounded"><input placeholder="RR" class="w-1/4 border p-2 rounded"><input placeholder="BP" class="w-1/4 border p-2 rounded"></div>
                </div>
            </div>
            <button onclick="signAction('護理評估存檔')" class="w-full bg-green-600 text-white py-3 rounded-xl font-bold">儲存評估並進行電子簽章</button>
        </div>`;
}

// --- 人員管理 ---
function renderStaff(container) {
    if (currentUser.role !== 'ADMIN') return;
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm">
                <h3 class="font-bold mb-4">新增員工</h3>
                <div class="flex space-x-2">
                    <input id="s-id" placeholder="員編" class="border p-2 rounded">
                    <input id="s-name" placeholder="姓名" class="border p-2 rounded">
                    <input id="s-pw" placeholder="密碼" class="border p-2 rounded">
                    <select id="s-title" class="border p-2 rounded"><option>護理師</option><option>護理長</option></select>
                    <button onclick="addStaff()" class="bg-blue-600 text-white px-4 rounded">建立</button>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <tr class="bg-gray-50 border-b"><th class="p-4">職稱</th><th class="p-4">姓名</th><th class="p-4">員編</th><th class="p-4">操作</th></tr>
                    ${staff.map(s => `
                        <tr class="border-b">
                            <td class="p-4">${s.title}</td><td class="p-4">${s.name}</td><td class="p-4">${s.id}</td>
                            <td class="p-4"><button onclick="delStaff('${s.id}')" class="text-red-500">刪除</button></td>
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
    if(!id || !name || !pw) return alert("必填項目缺失");
    staff.push({ id, name, password: pw, title, role: title === '護理長' ? 'ADMIN' : 'RN' });
    save(); switchView('staff');
}

function delStaff(id) {
    if(id === currentUser.id) return alert("不能刪除自己");
    staff = staff.filter(s => s.id !== id);
    save(); switchView('staff');
}

// --- 簽章核心 ---
function signAction(action) {
    pendingAction = action;
    document.getElementById('sig-info').innerText = `簽署操作：${action}\n執行人：${currentUser.title} ${currentUser.name}`;
    document.getElementById('sign-modal').classList.remove('hidden');
}

function closeSign() {
    document.getElementById('sign-modal').classList.add('hidden');
    document.getElementById('sig-pw').value = '';
}

function confirmSign() {
    if (document.getElementById('sig-pw').value === currentUser.password) {
        alert("簽署成功！");
        closeSign();
        if (currentView === 'assessment') switchView('patients');
    } else {
        alert("密碼錯誤，簽章失敗");
    }
}

// --- 輔助 ---
function save() {
    localStorage.setItem('nis_staff', JSON.stringify(staff));
    localStorage.setItem('nis_patients', JSON.stringify(patients));
}

function renderSettings(container) {
    container.innerHTML = `<div class="bg-white p-8 rounded-2xl shadow-sm max-w-sm mx-auto">
        <h2 class="text-xl font-bold mb-4">修改個人密碼</h2>
        <input id="p-new" type="password" placeholder="輸入新密碼" class="w-full border p-2 rounded mb-4">
        <button onclick="updatePw()" class="w-full bg-blue-600 text-white py-2 rounded">更新</button>
    </div>`;
}

function updatePw() {
    const np = document.getElementById('p-new').value;
    const idx = staff.findIndex(s => s.id === currentUser.id);
    staff[idx].password = np;
    currentUser.password = np;
    save(); alert("已更新");
}
