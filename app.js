// --- 核心變數 ---
let state = {
    staff: JSON.parse(localStorage.getItem('nis_v5_staff')) || INITIAL_DATA.staff,
    patients: JSON.parse(localStorage.getItem('nis_v5_patients')) || INITIAL_DATA.patients,
    user: null,
    activeP: null,
    onSign: null
};

// --- 初始化 ---
window.onload = () => {
    const wardSel = document.getElementById('sel-ward');
    INITIAL_DATA.wards.forEach(w => wardSel.add(new Option(w, w)));
};

// --- 介面控制 ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('show');
    document.getElementById('overlay').classList.toggle('hidden');
}

// --- 登入邏輯 (修復沒反應問題) ---
function handleLogin() {
    const id = document.getElementById('inp-id').value;
    const pw = document.getElementById('inp-pw').value;
    const user = state.staff.find(s => s.id === id && s.password === pw);

    if (user) {
        state.user = user;
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('view-main').classList.remove('hidden');
        document.getElementById('user-info').innerHTML = `
            <div class="text-blue-400 text-xs font-bold mb-1">${user.title}</div>
            <div class="text-lg font-bold">${user.name}</div>
            <div class="text-xs text-slate-500 italic">員編: ${user.id}</div>
        `;
        if(user.role === 'ADMIN') document.getElementById('nav-admin').classList.remove('hidden');
        switchPage('patients');
    } else {
        const err = document.getElementById('err-msg');
        err.classList.remove('hidden');
        setTimeout(() => err.classList.add('hidden'), 2000);
    }
}

// --- 路由導航 ---
function switchPage(page) {
    if (window.innerWidth < 1024) toggleMenu(); // 手機版自動收合
    
    const content = document.getElementById('content');
    content.innerHTML = '';
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(page));
    });

    switch(page) {
        case 'patients': renderPatients(); break;
        case 'mar': renderMAR(); break;
        case 'eval': renderEval(); break;
        case 'staff': renderStaff(); break;
    }
}

// --- 病患管理 ---
function renderPatients() {
    const ward = document.getElementById('sel-ward').value;
    const list = ward === "全部區域" ? state.patients : state.patients.filter(p => p.ward === ward);
    const container = document.getElementById('content');
    
    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;
    list.forEach(p => {
        const isSel = state.activeP?.id === p.id;
        html += `
            <div onclick="selectPatient('${p.id}')" class="p-6 bg-white rounded-3xl shadow-sm border-2 cursor-pointer transition active:scale-95 ${isSel ? 'border-blue-500 bg-blue-50' : 'border-transparent'}">
                <div class="flex justify-between font-bold text-xs text-slate-400 mb-2"><span>${p.ward}</span><span>${p.bed}</span></div>
                <div class="text-xl font-bold text-slate-800">${p.name} <span class="text-sm font-normal text-slate-500">${p.age}歲</span></div>
                <div class="mt-4 text-red-500 text-xs font-bold bg-red-50 p-2 rounded-xl">${p.diagnosis}</div>
            </div>`;
    });
    container.innerHTML = html + `</div>`;
}

function selectPatient(id) {
    state.activeP = state.patients.find(p => p.id === id);
    const tag = document.getElementById('p-tag');
    tag.innerText = `${state.activeP.bed} ${state.activeP.name}`;
    tag.classList.remove('hidden');
    renderPatients();
}

// --- 給藥單 (MAR) ---
function renderMAR() {
    const container = document.getElementById('content');
    if(!state.activeP) return container.innerHTML = `<div class="p-20 text-center text-slate-400 font-bold">請先點擊「病患管理」選擇病人</div>`;
    
    container.innerHTML = `
        <div class="bg-white rounded-3xl shadow-sm overflow-hidden border">
            <div class="p-6 bg-blue-600 text-white flex justify-between items-center">
                <h2 class="text-xl font-bold">給藥執行清單 (MAR)</h2>
                ${state.user.role === 'ADMIN' ? `<button onclick="adminAddMed()" class="bg-white text-blue-600 px-4 py-1 rounded-lg font-bold text-xs shadow-lg">新增藥物</button>` : ''}
            </div>
            <div class="divide-y">
                ${state.activeP.meds.map(m => `
                    <div class="p-6 flex justify-between items-center hover:bg-slate-50">
                        <div><div class="font-bold text-blue-700 text-lg">${m.name}</div><div class="text-sm text-slate-400">${m.dose} | ${m.freq}</div></div>
                        <button onclick="openModal(()=>alert('給藥完成！'))" class="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm">執行</button>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

function adminAddMed() {
    const name = prompt("藥名:"); if(!name) return;
    state.activeP.meds.push({ id: Date.now(), name, dose: prompt("劑量/途徑:"), freq: prompt("頻率:") });
    save(); renderMAR();
}

// --- 護理評估 ---
function renderEval() {
    const container = document.getElementById('content');
    if(!state.activeP) return container.innerHTML = `<div class="p-20 text-center text-slate-400 font-bold">請先點擊「病患管理」選擇病人</div>`;
    
    container.innerHTML = `
        <div class="bg-white p-6 lg:p-10 rounded-3xl shadow-sm border max-w-2xl mx-auto space-y-6">
            <h2 class="text-2xl font-bold text-slate-800 border-b pb-4">護理評估記錄表</h2>
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2"><label class="text-xs font-bold text-slate-400">GCS 意識</label><select class="w-full p-4 border rounded-2xl bg-slate-50 outline-none"><option>E4V5M6 (Clear)</option><option>Drowsy</option><option>Coma</option></select></div>
                <div><label class="text-xs font-bold text-slate-400">BT 體溫</label><input type="number" step="0.1" class="w-full p-4 border rounded-2xl outline-none" placeholder="36.5"></div>
                <div><label class="text-xs font-bold text-slate-400">HR 脈搏</label><input type="number" class="w-full p-4 border rounded-2xl outline-none" placeholder="72"></div>
                <div><label class="text-xs font-bold text-slate-400">RR 呼吸</label><input type="number" class="w-full p-4 border rounded-2xl outline-none" placeholder="18"></div>
                <div><label class="text-xs font-bold text-slate-400">BP 血壓</label><input type="text" class="w-full p-4 border rounded-2xl outline-none" placeholder="120/80"></div>
            </div>
            <button onclick="openModal(()=>{alert('評估存檔成功！'); switchPage('patients');})" class="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg">確認並進行簽章</button>
        </div>`;
}

// --- 簽章邏輯 ---
function openModal(callback) {
    state.onSign = callback;
    document.getElementById('modal-sign').classList.remove('hidden');
    document.getElementById('sig-pw').focus();
}

function closeModal() {
    document.getElementById('modal-sign').classList.add('hidden');
    document.getElementById('sig-pw').value = '';
}

function confirmSign() {
    if (document.getElementById('sig-pw').value === state.user.password) {
        closeModal();
        if(state.onSign) state.onSign();
    } else {
        alert("密碼不正確，簽署失敗");
    }
}

// --- 輔助功能 ---
function save() {
    localStorage.setItem('nis_v5_staff', JSON.stringify(state.staff));
    localStorage.setItem('nis_v5_patients', JSON.stringify(state.patients));
}

function resetSystem() {
    if(confirm("重設後將清空所有自訂資料，確定嗎？")) {
        localStorage.clear();
        location.reload();
    }
}

// 系統人員管理介面 (簡化版)
function renderStaff() {
    const container = document.getElementById('content');
    container.innerHTML = `
        <div class="bg-white rounded-3xl p-6 border shadow-sm">
            <h2 class="text-xl font-bold mb-4">工作人員清單</h2>
            <div class="space-y-2">
                ${state.staff.map(s => `<div class="p-3 bg-slate-50 rounded-xl flex justify-between font-mono text-sm"><span>${s.title} ${s.name}</span><span>ID: ${s.id}</span></div>`).join('')}
            </div>
        </div>`;
}
