import { Transaction, FinanceManager } from "./finance.js";
import { UI } from "./ui.js";

const manager = new FinanceManager();
const ui = new UI(manager);

// --- Kategori Dinamis ---
const categories = {
  income: ["Gaji Bulanan", "Freelance", "Pemasukan Lainnya"],
  outcome: ["Belanja Bulanan", "Operasional Kantor", "Uang Jajan Anak", "Hiburan Mingguan", "Biaya Tak Terduga"]
};

const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("category");

function updateCategoryOptions() {
  categorySelect.innerHTML = "";
  categories[typeSelect.value].forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

updateCategoryOptions();
typeSelect.addEventListener("change", updateCategoryOptions);

// --- Tambah Data ---
document.getElementById("addBtn").addEventListener("click", () => {
  const type = typeSelect.value;
  const category = categorySelect.value;
  const amount = parseFloat(document.getElementById("amount").value);
  const desc = document.getElementById("description").value;

  if (!amount || amount <= 0) {
    alert("Masukkan jumlah yang valid!");
    return;
  }

  const t = new Transaction(type, category, amount, desc);
  manager.addTransaction(t);
  ui.render();
});

// --- Ekspor Excel ---
document.getElementById("exportExcel").addEventListener("click", () => {
  const data = manager.transactions.map(t => ({
    Tipe: t.type,
    Kategori: t.category,
    Jumlah: t.amount,
    Keterangan: t.description
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DataKeuangan");
  XLSX.writeFile(wb, "data_keuangan.xlsx");
});

// --- Impor Excel ---
document.getElementById("importExcel").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    manager.transactions = rows.map(r => new Transaction(
      r.Tipe, r.Kategori, Number(r.Jumlah), r.Keterangan
    ));
    ui.render();
  };
  reader.readAsArrayBuffer(file);
});