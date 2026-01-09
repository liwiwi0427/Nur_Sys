// 工作人員名單：新增職稱(title)
const initialStaff = [
    { id: "N90221", name: "黎哲瑋", password: "A11516", role: "ADMIN", title: "護理長" },
    { id: "N93610", name: "唐若素", password: "936103", role: "RN", title: "護理人員／護理師（N1）" },
    { id: "N002", name: "張大華", password: "123", role: "RN", title: "護理師" }
];

// 初始病患與其專屬藥單
const initialPatients = [
    { 
        id: "P001", name: "張三", bed: "701-1", ward: "7F 內科病房", age: 75, diagnosis: "肺炎",
        medications: [
            { id: 1, name: "Aspirin", dose: "100mg", route: "PO", freq: "QD" }
        ],
        history: [] 
    },
    { 
        id: "P002", name: "李四", bed: "805-2", ward: "8F 外科病房", age: 62, diagnosis: "骨折",
        medications: [
            { id: 2, name: "Morphine", dose: "5mg", route: "IV", freq: "PRN" }
        ],
        history: [] 
    }
];

const wardList = ["全部區域", "7F 內科病房", "8F 外科病房"];
