import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Plus, 
  Pencil,
  Trash2, 
  X,
  Sparkles
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { useCurrency } from '../../utils/formatCurrency';
import { 
  getUserTransactions, 
  addUserTransaction, 
  updateUserTransaction,
  deleteUserTransaction, 
  clearAllTransactions,
  EXPENSE_CATEGORIES
} from '../../services/userDataService';

export const ExpensesPage = () => {
  const { symbol, formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [getStartedMode, setGetStartedMode] = useState('signup');
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const [pendingDeleteTx, setPendingDeleteTx] = useState(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  const handleOpenGetStarted = (mode = 'signup') => {
    setGetStartedMode(typeof mode === 'string' ? mode : 'signup');
    setIsGetStartedOpen(true);
  };

  // Transaction Form State (Add & Edit)
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Dynamic Transactions State
  const [transactions, setTransactions] = useState(getUserTransactions());

  useEffect(() => {
    const handleSync = () => {
      setTransactions(getUserTransactions());
    };
    window.addEventListener('userDataChanged', handleSync);
    return () => window.removeEventListener('userDataChanged', handleSync);
  }, []);

  const categories = ['All', ...EXPENSE_CATEGORIES, 'Income'];

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesType = selectedType === 'All' || tx.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleOpenAddModal = () => {
    setEditingTxId(null);
    setTitle('');
    setAmount('');
    setCategory('Groceries');
    setType('expense');
    setDate(new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTxId(tx.id);
    setTitle(tx.title || '');
    setAmount(String(tx.amount ?? ''));
    setCategory(tx.category || 'Groceries');
    setType(tx.type || 'expense');
    setDate(tx.date || new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleSaveTx = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || isNaN(amount)) return;

    if (editingTxId !== null) {
      const updated = updateUserTransaction(editingTxId, {
        title: title.trim(),
        category,
        amount: Number(amount),
        type,
        date: date || new Date().toISOString().split('T')[0]
      });
      setTransactions(updated);
    } else {
      const newTx = {
        id: Date.now(),
        title: title.trim(),
        category,
        amount: Number(amount),
        type,
        date: date || new Date().toISOString().split('T')[0]
      };
      const updated = addUserTransaction(newTx);
      setTransactions(updated);
    }

    setEditingTxId(null);
    setTitle('');
    setAmount('');
    setShowAddModal(false);
  };

  const handleDeleteTx = (id) => {
    const updated = deleteUserTransaction(id);
    setTransactions(updated);
  };

  const handleClearAll = () => {
    setIsConfirmClearAllOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => handleOpenGetStarted('signup')} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#1A1A1A]/10 gap-6 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              USER LEDGER & FINANCIAL TRANSACTION RECORD
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              EXPENSE <span className="italic text-[#088fff]">MANAGER</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleClearAll}
              className="border border-[#1A1A1A]/30 hover:border-rose-600 hover:text-rose-600 text-[#1A1A1A] text-xs font-bold font-mono px-4 py-3 rounded-sm transition-colors cursor-pointer"
            >
              Clear Ledger
            </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3.5 px-6 rounded-sm transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold block mb-2 font-mono">
              Total User Expenses
            </span>
            <span className="text-3xl font-editorial font-bold text-rose-600">
              {formatCurrency(totalExpense)}
            </span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold block mb-2 font-mono">
              Total User Income
            </span>
            <span className="text-3xl font-editorial font-bold text-emerald-600">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold block mb-2 font-mono">
              Calculated Net Cash Flow
            </span>
            <span className={`text-3xl font-editorial font-bold ${totalIncome - totalExpense >= 0 ? 'text-[#088fff]' : 'text-rose-600'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs text-[#1A1A1A] focus:outline-none focus:border-[#088fff]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs font-bold uppercase tracking-wider text-[#1A1A1A] focus:outline-none focus:border-[#088fff]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs font-bold uppercase tracking-wider text-[#1A1A1A] focus:outline-none focus:border-[#088fff]"
            >
              <option value="All">All Types</option>
              <option value="expense">Expense Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-sm border border-[#1A1A1A]/15 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-mono">
                  <th className="p-4">Type</th>
                  <th className="p-4">Title / Beneficiary</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/10 text-xs">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-[#1A1A1A]/60 font-mono">
                      <div className="max-w-sm mx-auto space-y-3">
                        <Sparkles className="w-8 h-8 text-[#088fff] mx-auto opacity-70" />
                        <p className="font-bold text-sm text-[#1A1A1A]">No transactions recorded yet.</p>
                        <p className="text-xs">Click <strong>"Add Transaction"</strong> to start logging your custom income & expenses!</p>
                        <button
                          onClick={handleOpenAddModal}
                          className="mt-2 bg-[#088fff] hover:bg-[#0077e6] text-white font-bold text-xs uppercase px-4 py-2 rounded-sm cursor-pointer"
                        >
                          + Add Your First Record
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F9F8F5] transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[#1A1A1A]">{tx.title}</td>
                      <td className="p-4 text-[#1A1A1A]/70">{tx.category}</td>
                      <td className="p-4 font-mono text-[#1A1A1A]/60">{tx.date}</td>
                      <td className={`p-4 text-right font-mono font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(tx)}
                            className="text-[#1A1A1A]/40 hover:text-[#088fff] hover:bg-[#088fff]/10 rounded transition-colors p-1.5 cursor-pointer"
                            title="Edit transaction"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteTx(tx)}
                            className="text-[#1A1A1A]/40 hover:text-rose-600 hover:bg-rose-500/10 rounded transition-colors p-1.5 cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F8F5] w-full max-w-md rounded-sm shadow-2xl border border-[#1A1A1A] p-6 relative text-[#1A1A1A]">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingTxId(null);
              }}
              className="absolute top-4 right-4 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-editorial font-bold text-[#1A1A1A] mb-1">
              {editingTxId !== null ? 'Edit Transaction Record' : 'Add Custom Transaction Record'}
            </h3>
            <p className="text-[11px] font-mono text-[#1A1A1A]/60 mb-4">
              {editingTxId !== null ? 'Update any field below to correct this ledger entry.' : 'Enter details below to log a new transaction.'}
            </p>

            <form onSubmit={handleSaveTx} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Salary, Groceries, House Rent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/20 text-xs rounded-sm focus:outline-none focus:border-[#088fff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Amount ({symbol})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/20 text-xs rounded-sm focus:outline-none focus:border-[#088fff]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/20 text-xs font-mono rounded-sm focus:outline-none focus:border-[#088fff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/20 text-xs rounded-sm focus:outline-none focus:border-[#088fff]"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/20 text-xs rounded-sm focus:outline-none focus:border-[#088fff]"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A1A1A] hover:bg-[#088fff] text-white py-3 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors mt-2 cursor-pointer"
              >
                {editingTxId !== null ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Single Transaction */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteTx)}
        onClose={() => setPendingDeleteTx(null)}
        onConfirm={() => {
          if (pendingDeleteTx) {
            handleDeleteTx(pendingDeleteTx.id);
            setPendingDeleteTx(null);
          }
        }}
        title="Delete Transaction?"
        itemName={pendingDeleteTx?.title}
        itemDetails={pendingDeleteTx ? `${formatCurrency(pendingDeleteTx.amount)} • ${pendingDeleteTx.category} (${pendingDeleteTx.type === 'income' ? 'Income' : 'Expense'})` : ''}
        message="Are you sure you want to permanently delete this transaction record? Your totals and history will update immediately."
        confirmText="Delete Record"
      />

      {/* Confirm Clear All Ledger */}
      <ConfirmDeleteModal
        isOpen={isConfirmClearAllOpen}
        onClose={() => setIsConfirmClearAllOpen(false)}
        onConfirm={() => {
          const updated = clearAllTransactions();
          setTransactions(updated);
          setIsConfirmClearAllOpen(false);
        }}
        title="Reset & Clear All Transactions?"
        itemName="All Transaction Records"
        itemDetails={`${transactions.length} total entries will be removed`}
        message="Are you sure you want to clear your entire transaction history? This will reset all your spending telemetry so you can start completely fresh."
        confirmText="Clear All Data"
        dangerLevel="high"
      />

      <Footer onGetStarted={handleOpenGetStarted} />
      <GetStartedModal isOpen={isGetStartedOpen} initialMode={getStartedMode} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default ExpensesPage;
