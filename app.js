let staff = JSON.parse(localStorage.getItem('staff')) || initialStaff;
let patients = JSON.parse(localStorage.getItem('patients')) || initialPatients;
let currentUser = null;
let currentPatient = null;
let currentWard = "全部區域";
let pendingAction = null;

document.addEventListener('DOMContentLoaded', () => {
    initWardSelector();
    setInterval(() => {
        document.getElementById('current-time').innerText = new Date().toLocaleString();
    }, 1000);
});

// --- 登入與使用者顯示 ---
function handleLogin() {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;
    const user = staff.find(s => s.id === id && s.password === pw);

    if (user) {
        currentUser = user;
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-system').classList.remove('hidden');
        
        // 修改顯示格式：職稱 姓名 (員編)
        document.getElementById('user-profile').innerHTML = `
            <div class="font-bold text-base text-blue-300">${user.title}</div>
            <div class="text-lg">${user.name}</div>
            <div class="text-xs text-slate-400 mt-1 italic">員編：${user.id}</div>
        `;
        document.getElementById('sig-display-name').innerText = `${user.title} ${user.name} (${user.id})`;
        
        if (user.role === 'ADMIN') document.getElementById('admin-nav').classList.remove('hidden');
        switchView('patients');
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

// --- 病房篩選邏輯 ---
function initWardSelector() {
    const selector = document.getElementById('ward-selector');
    wards.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.innerText = w;
        selector.appendChild(opt);
    });
}

function filterWard() {
    currentWard = document.getElementById('ward-selector').value;
    if (viewContext === 'patients') renderPatients(document.getElementById('content-area'));
}

let viewContext = 'patients';
function switchView(view) {
    viewContext = view;
    const area = document.getElementById('content-area');
    area.innerHTML = '';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    if (view === 'patients') renderPatients(area);
    else if (view === 'mar') renderMAR(area);
    else if (view === 'assessment') renderAssessment(area);
    else if (view === 'staff') renderStaffManagement(area);
}

// --- 病患顯示 ---
function renderPatients(container) {
    // 根據選擇的病房過濾
    const filtered = currentWard === "全部區域" ? patients : patients.filter(p => p.ward === currentWard);
    
    let html = `<div class="flex justify-between items-end mb-6">
                    <h2 class="text-2xl font-bold text-slate-700">病患清單 <span class="text-sm font-normal text-gray-400">目前顯示：${currentWard}</span></h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
    
    filtered.forEach(p => {
        const isSelected = currentPatient?.id === p.id;
        html += `
            <div onclick="selectPatient('${p.id}')" class="patient-card bg-white p-6 rounded-2xl shadow-sm cursor-pointer border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                <div class="flex justify-between mb-4">
                    <span class="bg-slate-100 px-3 py-1 rounded text-xs font-bold text-slate-500">${p.ward}</span>
                    <span class="text-blue-600 font-bold">${p.bed}</span>
                </div>
                <div class="text-xl font-bold mb-1">${p.name}</div>
                <div class="text-gray-500 text-sm mb-3">${p.id} | ${p.age}歲</div>
                <div class="text-red-500 text-sm font-medium"><i class="fa fa-notes-medical mr-1"></i>${p.diagnosis}</div>
            </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function selectPatient(id) {
    currentPatient = patients.find(p => p.id === id);
    document.getElementById('active-info').innerText = `${currentPatient.ward} | ${currentPatient.bed} | ${currentPatient.name}`;
    renderPatients(document.getElementById('content-area'));
}

// --- 簽章邏輯 ---
function openSignModal(action) {
    if (!currentPatient) return alert("請先選取病患！");
    pendingAction = action;
    document.getElementById('sign-modal').classList.remove('hidden');
}

function closeSignModal() {
    document.getElementById('sign-modal').classList.add('hidden');
    document.getElementById('sig-password').value = '';
}

function confirmSign() {
    const pw = document.getElementById('sig-password').value;
    if (pw === currentUser.password) {
        // 成功後的邏輯
        const record = {
            id: Date.now(),
            action: pendingAction,
            nurse: `${currentUser.title} ${currentUser.name}`,
            time: new Date().toLocaleString()
        };
        currentPatient.history.unshift(record);
        saveAll();
        alert(`簽名成功！\n操作：${pendingAction}\n簽署人：${currentUser.name}`);
        closeSignModal();
        switchView('patients');
    } else {
        alert("驗證密碼錯誤，簽章失敗！");
    }
}

function saveAll() {
    localStorage.setItem('staff', JSON.stringify(staff));
    localStorage.setItem('patients', JSON.stringify(patients));
}

function logout() {
    currentUser = null;
    location.reload();
}

// --- 模擬給藥介面 ---
function renderMAR(container) {
    if (!currentPatient) return container.innerHTML = "<div class='text-center p-20 text-gray-400'>請先選取病患</div>";
    container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="p-6 bg-blue-600 text-white font-bold text-lg">給藥執行紀錄單 (MAR)</div>
            <table class="w-full text-left">
                <thead class="bg-gray-50 border-b">
                    <tr><th class="p-4">時間</th><th class="p-4">藥名</th><th class="p-4">劑量/途徑</th><th class="p-4">簽章</th></tr>
                </thead>
                <tbody>
                    <tr class="border-b">
                        <td class="p-4 text-gray-500">09:00</td>
                        <td class="p-4 font-bold">Aspirin 100mg</td>
                        <td class="p-4">PO / QD</td>
                        <td class="p-4"><button onclick="openSignModal('給藥: Aspirin')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">密碼簽署</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// --- 評估單介面 ---
function renderAssessment(container) {
    if (!currentPatient) return container.innerHTML = "<div class='text-center p-20 text-gray-400'>請先選取病患</div>";
    container.innerHTML = `
        <div class="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
            <h2 class="text-xl font-bold mb-6">生命徵象評估記錄</h2>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <input id="v1" placeholder="體溫" class="border p-3 rounded-xl">
                    <input id="v2" placeholder="脈搏" class="border p-3 rounded-xl">
                </div>
                <button onclick="openSignModal('評估單儲存')" class="w-full bg-green-600 text-white py-4 rounded-xl font-bold">儲存並進行二次驗證簽章</button>
            </div>
        </div>
    `;
}
