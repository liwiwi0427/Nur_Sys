// 工作人員名單：新增職稱(title)
const initialStaff = [
    { id: "A001", name: "王大明", password: "123", role: "ADMIN", title: "護理長" },
    { id: "N001", name: "林小美", password: "123", role: "RN", title: "護理師" },
    { id: "N002", name: "張大華", password: "123", role: "RN", title: "護理師" }
];

// 病患名單：新增病房區域(ward)
const initialPatients = [
    { id: "P001", name: "張三", bed: "701-1", ward: "7F 內科病房", age: 75, diagnosis: "肺炎", history: [] },
    { id: "P002", name: "李四", bed: "701-2", ward: "7F 內科病房", age: 62, diagnosis: "心衰竭", history: [] },
    { id: "P003", name: "王五", bed: "805-1", ward: "8F 外科病房", age: 45, diagnosis: "闌尾炎", history: [] },
    { id: "P004", name: "趙六", bed: "805-2", ward: "8F 外科病房", age: 30, diagnosis: "骨折", history: [] }
];

const wards = ["全部區域", "7F 內科病房", "8F 外科病房"];
