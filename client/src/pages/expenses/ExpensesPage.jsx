import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Plus, 
  Trash2, 
  X,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { 
  getUserTransactions, 
  addUserTransaction, 
  deleteUserTransaction, 
  clearAllTransactions,
  resetToDemoData
} from '../../services/userDataService';

export const ExpensesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [getStartedMode, setGetStartedMode] = useState('signup');
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleOpenGetStarted = (mode = 'signup') => {
    setGetStartedMode(typeof mode === 'string' ? mode : 'signup');
    setIsGetStartedOpen(true);
  };

  // New Transaction Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [type, setType] = useState('expense');

  // Dynamic Transactions State
  const [transactions, setTransactions] = useState(getUserTransactions());

  useEffect(() => {
    const handleSync = () => {
      setTransactions(getUserTransactions());
    };
    window.addEventListener('userDataChanged', handleSync);
    return () => window.removeEventListener('userDataChanged', handleSync);
  }, []);

  const categories = ['All', 'Groceries', 'Utilities', 'Subscription', 'EMI', 'Food', 'Housing', 'Health', 'Travel', 'Income'];

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesType = selectedType === 'All' || tx.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleAddTx = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || isNaN(amount)) return;

    const newTx = {
      id: Date.now(),
      title: title.trim(),
      category,
      amount: Number(amount),
      type,
      date: new Date().toISOString().split('T')[0]
    };

    const updated = addUserTransaction(newTx);
    setTransactions(updated);
    setTitle('');
    setAmount('');
    setShowAddModal(false);
  };

  const handleDeleteTx = (id) => {
    const updated = deleteUserTransaction(id);
    setTransactions(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all recorded transactions to enter your own custom data?')) {
      const updated = clearAllTransactions();
      setTransactions(updated);
    }
  };

  const handleResetDemo = () => {
    resetToDemoData();
    setTransactions(getUserTransactions());
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
              onClick={handleResetDemo}
              className="border border-[#1A1A1A]/30 hover:border-[#088fff] text-[#1A1A1A] text-xs font-bold font-mono px-4 py-3 rounded-sm transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset sample data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Demo Data</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
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
              ₹{totalExpense.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold block mb-2 font-mono">
              Total User Income
            </span>
            <span className="text-3xl font-editorial font-bold text-emerald-600">
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold block mb-2 font-mono">
              Calculated Net Cash Flow
            </span>
            <span className={`text-3xl font-editorial font-bold ${totalIncome - totalExpense >= 0 ? 'text-[#088fff]' : 'text-rose-600'}`}>
              ₹{(totalIncome - totalExpense).toLocaleString('en-IN')}
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
                          onClick={() => setShowAddModal(true)}
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
                          {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[#1A1A1A]">{tx.title}</td>
                      <td className="p-4 text-[#1A1A1A]/70">{tx.category}</td>
                      <td className="p-4 font-mono text-[#1A1A1A]/60">{tx.date}</td>
                      <td className={`p-4 text-right font-mono font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-[#1A1A1A]/40 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F8F5] w-full max-w-md rounded-sm shadow-2xl border border-[#1A1A1A] p-6 relative text-[#1A1A1A]">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-editorial font-bold text-[#1A1A1A] mb-4">Add Custom Transaction Record</h3>

            <form onSubmit={handleAddTx} className="space-y-4">
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

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/20 text-xs rounded-sm focus:outline-none focus:border-[#088fff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/20 text-xs rounded-sm focus:outline-none focus:border-[#088fff]"
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Housing">Housing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Subscription">Subscription</option>
                    <option value="EMI">EMI</option>
                    <option value="Food">Food</option>
                    <option value="Health">Health</option>
                    <option value="Travel">Travel</option>
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
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer onGetStarted={handleOpenGetStarted} />
      <GetStartedModal isOpen={isGetStartedOpen} initialMode={getStartedMode} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default ExpensesPage;
