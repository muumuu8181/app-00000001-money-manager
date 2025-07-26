/**
 * Money Manager - お金管理システム v1.0
 */

class MoneyManager {
    constructor() {
        // Data storage
        this.transactions = this.loadTransactions();
        this.currentEditId = null;
        
        // Categories
        this.categories = {
            income: {
                salary: '給与',
                bonus: 'ボーナス',
                investment: '投資収益',
                'other-income': 'その他収入'
            },
            expense: {
                food: '食費',
                transport: '交通費',
                housing: '住居費',
                utilities: '光熱費',
                entertainment: '娯楽費',
                'other-expense': 'その他支出'
            }
        };
        
        // Initialize
        this.init();
    }

    init() {
        console.log('💰 Money Manager v1.0 initializing...');
        
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateDisplay();
        this.initializeChart();
        this.setupMonthFilter();
        
        console.log('✅ Money Manager ready!');
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('transactionForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Type radio buttons change
        const typeRadios = document.querySelectorAll('input[name="type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateCategoryOptions('category', radio.value);
            });
        });

        // Edit form
        const editForm = document.getElementById('editForm');
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTransaction();
        });

        // Edit type radio buttons
        const editTypeRadios = document.querySelectorAll('input[name="editType"]');
        editTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateCategoryOptions('editCategory', radio.value);
            });
        });

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeModal();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAllTransactions();
        });

        // Filter controls
        document.getElementById('filterType').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('filterMonth').addEventListener('change', () => {
            this.updateDisplay();
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    updateCategoryOptions(selectId, type) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        // Clear current options
        select.innerHTML = '';
        
        // Add appropriate options based on type
        const optgroup = document.createElement('optgroup');
        optgroup.label = type === 'income' ? '収入' : '支出';
        
        const categories = type === 'income' ? this.categories.income : this.categories.expense;
        
        Object.entries(categories).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
        
        // Restore previous value if it exists in new options
        if (select.querySelector(`option[value="${currentValue}"]`)) {
            select.value = currentValue;
        }
    }

    addTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const transaction = {
            id: Date.now(),
            type: formData.get('type'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description') || '',
            date: formData.get('date'),
            timestamp: new Date().toISOString()
        };
        
        this.transactions.push(transaction);
        this.saveTransactions();
        this.updateDisplay();
        
        // Reset form
        form.reset();
        this.setDefaultDate();
        
        // Show notification
        this.showNotification('取引を記録しました', 'success');
    }

    updateTransaction() {
        const id = parseInt(document.getElementById('editId').value);
        const index = this.transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            this.transactions[index] = {
                ...this.transactions[index],
                type: document.querySelector('input[name="editType"]:checked').value,
                category: document.getElementById('editCategory').value,
                amount: parseFloat(document.getElementById('editAmount').value),
                description: document.getElementById('editDescription').value,
                date: document.getElementById('editDate').value
            };
            
            this.saveTransactions();
            this.updateDisplay();
            this.closeModal();
            this.showNotification('取引を更新しました', 'success');
        }
    }

    deleteTransaction(id) {
        if (confirm('この取引を削除してもよろしいですか？')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.updateDisplay();
            this.showNotification('取引を削除しました', 'info');
        }
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            // Set form values
            document.getElementById('editId').value = transaction.id;
            document.getElementById(transaction.type === 'income' ? 'editIncome' : 'editExpense').checked = true;
            
            // Update category options first
            this.updateCategoryOptions('editCategory', transaction.type);
            
            // Then set values
            document.getElementById('editCategory').value = transaction.category;
            document.getElementById('editAmount').value = transaction.amount;
            document.getElementById('editDescription').value = transaction.description;
            document.getElementById('editDate').value = transaction.date;
            
            // Show modal
            document.getElementById('editModal').classList.add('active');
        }
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('active');
    }

    updateDisplay() {
        this.updateBalance();
        this.updateMonthlySummary();
        this.updateTransactionList();
        this.updateChart();
    }

    updateBalance() {
        const balance = this.transactions.reduce((total, transaction) => {
            return transaction.type === 'income' 
                ? total + transaction.amount 
                : total - transaction.amount;
        }, 0);
        
        document.getElementById('balanceDisplay').textContent = this.formatCurrency(balance);
    }

    updateMonthlySummary() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = this.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = income - expense;
        
        document.getElementById('monthlyIncome').textContent = this.formatCurrency(income);
        document.getElementById('monthlyExpense').textContent = this.formatCurrency(expense);
        document.getElementById('monthlyBalance').textContent = this.formatCurrency(balance);
    }

    updateTransactionList() {
        const filterType = document.getElementById('filterType').value;
        const filterMonth = document.getElementById('filterMonth').value;
        
        let filteredTransactions = [...this.transactions];
        
        // Apply type filter
        if (filterType !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
        }
        
        // Apply month filter
        if (filterMonth !== 'all') {
            const [year, month] = filterMonth.split('-').map(Number);
            filteredTransactions = filteredTransactions.filter(t => {
                const date = new Date(t.date);
                return date.getFullYear() === year && date.getMonth() === month - 1;
            });
        }
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const listContainer = document.getElementById('transactionList');
        
        if (filteredTransactions.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">取引履歴がありません</div>
                    <div class="empty-subtext">上のフォームから取引を記録してください</div>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = filteredTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-type ${transaction.type}"></div>
                    <div class="transaction-details">
                        <div class="transaction-category">
                            ${this.getCategoryLabel(transaction.type, transaction.category)}
                        </div>
                        ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                        <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="action-btn edit" onclick="moneyManager.editTransaction(${transaction.id})" title="編集">
                        ✏️
                    </button>
                    <button class="action-btn delete" onclick="moneyManager.deleteTransaction(${transaction.id})" title="削除">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupMonthFilter() {
        const select = document.getElementById('filterMonth');
        const months = this.getAvailableMonths();
        
        // Add current month if not in transactions
        const currentMonth = new Date();
        const currentMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        if (!months.includes(currentMonthStr)) {
            months.unshift(currentMonthStr);
        }
        
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = this.formatMonth(month);
            select.appendChild(option);
        });
    }

    getAvailableMonths() {
        const months = new Set();
        this.transactions.forEach(t => {
            const date = new Date(t.date);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthStr);
        });
        return Array.from(months).sort().reverse();
    }

    formatMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
    }

    getCategoryLabel(type, category) {
        return this.categories[type][category] || category;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(amount);
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            weekday: 'short'
        });
    }

    exportToCSV() {
        const headers = ['日付', 'タイプ', 'カテゴリ', '金額', '説明'];
        const rows = this.transactions.map(t => [
            t.date,
            t.type === 'income' ? '収入' : '支出',
            this.getCategoryLabel(t.type, t.category),
            t.amount,
            t.description
        ]);
        
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        // Add BOM for proper Japanese encoding
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `money_manager_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showNotification('CSVファイルをダウンロードしました', 'success');
    }

    clearAllTransactions() {
        if (confirm('すべての取引履歴を削除してもよろしいですか？この操作は取り消せません。')) {
            this.transactions = [];
            this.saveTransactions();
            this.updateDisplay();
            this.showNotification('すべての取引を削除しました', 'info');
        }
    }

    initializeChart() {
        const canvas = document.getElementById('expenseChart');
        const ctx = canvas.getContext('2d');
        this.chartContext = ctx;
        this.updateChart();
    }

    updateChart() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyExpenses = this.transactions.filter(t => {
            const date = new Date(t.date);
            return t.type === 'expense' && 
                   date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
        });
        
        // Group by category
        const categoryTotals = {};
        monthlyExpenses.forEach(t => {
            const label = this.getCategoryLabel('expense', t.category);
            categoryTotals[label] = (categoryTotals[label] || 0) + t.amount;
        });
        
        // Draw chart
        this.drawPieChart(categoryTotals);
    }

    drawPieChart(data) {
        const canvas = document.getElementById('expenseChart');
        const ctx = this.chartContext;
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        const entries = Object.entries(data);
        if (entries.length === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('データがありません', width / 2, height / 2);
            return;
        }
        
        const total = entries.reduce((sum, [, value]) => sum + value, 0);
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        
        const colors = [
            '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
            '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
        ];
        
        let currentAngle = -Math.PI / 2;
        
        entries.forEach(([label, value], index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            
            // Draw slice
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = labelAngle > Math.PI / 2 && labelAngle < 3 * Math.PI / 2 ? 'right' : 'left';
            ctx.fillText(`${label}: ${this.formatCurrency(value)}`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 2000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveTransactions() {
        localStorage.setItem('moneyManagerTransactions', JSON.stringify(this.transactions));
    }

    loadTransactions() {
        const saved = localStorage.getItem('moneyManagerTransactions');
        return saved ? JSON.parse(saved) : [];
    }
}

// Create animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize application
let moneyManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('💰 Money Manager - お金管理システム v1.0');
    moneyManager = new MoneyManager();
});

// Export for debugging
window.MoneyManager = MoneyManager;