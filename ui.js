const XLSX = window.XLSX || null;
import { income, outcome } from './finance.js';

export class UI {
    constructor(manager) {
        this.manager = manager;

        // DOM references
        this.totalincomeE1 = document.getElementById('total-income');
        this.totalOutcomeE1 = document.getElementById('total-outcome');
        this.balanceE1 = document.getElementById('balance');
        this.incomeListE1 = document.getElementById('income-list');
        this.outcomeListE1 = document.getElementById('outcome-list');
        this.incomeForm = document.getElementById('income-form');
        this.outcomeForm = document.getElementById('outcome-form');
        this.seedBtn = document.getElementById('seed-data');
        this.clearBtn = document.getElementById('clear-data');

        this.exportBtn = document.getElementById('export-excel');
        this.importInput = document.getElementById('import-excel');

        this.bindEvents();
        this.render();
    }

    // ==================== EVENT BINDING ====================
    bindEvents() {

        // Form income
        this.incomeForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const form = e.target;

            const category = form.category.value;
            const amount = Number(form.amount.value);
            const description = form.description.value;

            if (!amount || amount <= 0) {
                return alert("Masukkan jumlah yang valid (>0).");
            }

            const inc = new income({ category, amount, description });
            this.manager.addIncome(inc);

            form.reset();
            this.render();
        });

        // Form outcome
        this.outcomeForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const form = e.target;

            const category = form.category.value;
            const amount = Number(form.amount.value);
            const description = form.description.value;

            if (!amount || amount <= 0) {
                return alert("Masukkan jumlah yang valid (>0).");
            }

            const out = new outcome({ category, amount, description });
            this.manager.addOutcome(out);

            form.reset();
            this.render();
        });

        // Seed data
        this.seedBtn.addEventListener("click", () => {
            this.manager.seedsampledata();
            this.render();
        });

        // Clear all
        this.clearBtn.addEventListener("click", () => {
            if (!confirm("Yakin hapus semua data sementara?")) return;

            this.manager.clearAll();
            this.render();
        });

        // Export Excel
        this.exportBtn.addEventListener("click", () => this.exportToExcel());

        // Import Excel
        this.importInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.importFromExcel(file);
            e.target.value = "";
        });

        // Delete income item
        this.incomeListE1.addEventListener("click", (e) => {
            const li = e.target.closest("li[data-id]");
            if (!li) return;

            if (e.target.classList.contains("delete")) {
                const id = li.dataset.id;
                this.manager.incomes = this.manager.incomes.filter(i => i.id !== id);
                this.render();
            }
        });

        // Delete outcome item
        this.outcomeListE1.addEventListener("click", (e) => {
            const li = e.target.closest("li[data-id]");
            if (!li) return;

            if (e.target.classList.contains("delete")) {
                const id = li.dataset.id;
                this.manager.outcomes = this.manager.outcomes.filter(o => o.id !== id);
                this.render();
            }
        });
    }

    // ==================== EXPORT EXCEL ====================
    exportToExcel() {
        if (!XLSX) {
            alert("Library XLSX belum termuat.");
            return;
        }

        const incomeData = this.manager.incomes.map(i => ({
            Tipe: "Income",
            Kategori: i.category,
            Jumlah: i.amount,
            Keterangan: i.description,
            Tanggal: i.date.toLocaleDateString(),
        }));

        const outcomeData = this.manager.outcomes.map(o => ({
            Tipe: "Outcome",
            Kategori: o.category,
            Jumlah: o.amount,
            Keterangan: o.description,
            Tanggal: o.date.toLocaleDateString(),
        }));

        const combined = [...incomeData, ...outcomeData];

        if (combined.length === 0) {
            alert("Tidak ada data untuk diekspor.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(combined);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DataKeuangan");

        XLSX.writeFile(wb, "perencanaan_keuangan.xlsx");
    }

    // ==================== IMPORT EXCEL ====================
    importFromExcel(file) {
        if (!XLSX) {
            alert("Library XLSX belum termuat.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                const rows = XLSX.utils.sheet_to_json(firstSheet);

                if (!Array.isArray(rows) || rows.length === 0) {
                    alert("File Excel tidak berisi data valid.");
                    return;
                }

                this.manager.clearAll();

                for (const r of rows) {
                    const tipe = (r.Tipe || "").toLowerCase();
                    const category = r.Kategori || "";
                    const amount = Number(r.Jumlah || 0);
                    const description = r.Keterangan || "";
                    const date = r.Tanggal ? new Date(r.Tanggal) : new Date();

                    if (tipe === "income") {
                        this.manager.addIncome(new income({ category, amount, description, date }));
                    } else if (tipe === "outcome") {
                        this.manager.addOutcome(new outcome({ category, amount, description, date }));
                    }
                }

                alert("Data berhasil diimpor!");
                this.render();

            } catch (err) {
                console.error(err);
                alert("Gagal membaca file Excel.");
            }
        };

        reader.readAsArrayBuffer(file);
    }

    // ==================== HELPER ====================
    formatRupiah(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(value);
    }

    makeListItem(entry) {
        const li = document.createElement("li");
        li.dataset.id = entry.id;

        const left = document.createElement("div");
        left.innerHTML = `
            <div><strong>${entry.category}</strong></div>
            <div class="item-meta">${entry.description || "-"} • ${entry.date.toLocaleDateString()}</div>
        `;

        const right = document.createElement("div");
        right.innerHTML = `
            <div class="item-amount">${this.formatRupiah(entry.amount)}</div>
            <button class="delete btn">hapus</button>
        `;

        li.appendChild(left);
        li.appendChild(right);

        return li;
    }

    // ==================== RENDER LISTS ====================
    renderLists() {
        // Income
        this.incomeListE1.innerHTML = '';
        if (this.manager.incomes.length === 0) {
            this.incomeListE1.innerHTML = '<li class="empty">Belum ada pemasukan</li>';
        } else {
            for (const inc of this.manager.incomes) {
                this.incomeListE1.appendChild(this.makeListItem(inc));
            }
        }

        // Outcome
        this.outcomeListE1.innerHTML = '';
        if (this.manager.outcomes.length === 0) {
            this.outcomeListE1.innerHTML = '<li class="empty">Belum ada pengeluaran</li>';
        } else {
            for (const out of this.manager.outcomes) {
                this.outcomeListE1.appendChild(this.makeListItem(out));
            }
        }
    }

    // ==================== RENDER TOTAL ====================
    renderTotals() {
        const tIncome = this.manager.getTotalIncome();
        const tOutcome = this.manager.getTotalOutcome();
        const balance = this.manager.getBalance();

        this.totalincomeE1.textContent = this.formatRupiah(tIncome);
        this.totalOutcomeE1.textContent = this.formatRupiah(tOutcome);
        this.balanceE1.textContent = this.formatRupiah(balance);

        this.balanceE1.style.color =
            balance < 0 ? 'var(--danger)' : 'var(--success)';
    }

    // ==================== RENDER MAIN ====================
    render() {
        this.renderLists();
        this.renderTotals();
    }
}
