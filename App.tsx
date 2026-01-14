import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, Receipt, Calendar as CalendarIcon, 
  BarChart3, Settings as SettingsIcon, Plus, Trash2, Edit2, 
  ChevronRight, ChevronLeft, CreditCard, PiggyBank, Banknote,
  TrendingUp, TrendingDown, RefreshCw, Sun, Moon,
  Utensils, Car, ShoppingBag, FileText, Film, DollarSign, Gift,
  Briefcase, Coffee, Music, Home, Smartphone, Tag, Globe,
  MoreHorizontal, Filter, ArrowRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { INITIAL_DATA } from './constants';
import { AppData, Category, Transaction, Wallet as WalletModel, TransactionType, WalletType, CashbackRule } from './types';
import { calculatePotentialCashback, formatCurrency, getCashbackCycleRange } from './utils/helpers';

// --- Icon Mapping ---
const IconMap: Record<string, any> = {
  Utensils, Car, ShoppingBag, FileText, Film, DollarSign, Gift,
  Briefcase, Coffee, Music, Home, Smartphone, Tag, Globe, LayoutDashboard
};

// --- Sub-Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in transition-all">
        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // Load/Save Logic
  useEffect(() => {
    const saved = localStorage.getItem('smartspend_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smartspend_data', JSON.stringify(data));
    if (data.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data]);

  const addTransaction = (t: Transaction) => {
    setData(prev => {
      const walletIndex = prev.wallets.findIndex(w => w.id === t.walletId);
      const newWallets = [...prev.wallets];
      
      if (walletIndex >= 0) {
        const wallet = newWallets[walletIndex];
        if (t.type === TransactionType.EXPENSE) {
          wallet.balance -= t.amount;
        } else {
          wallet.balance += t.amount;
        }
      }

      return {
        ...prev,
        wallets: newWallets,
        transactions: [t, ...prev.transactions]
      };
    });
  };

  const deleteTransaction = (id: string) => {
    setData(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;
      
      const newWallets = [...prev.wallets];
      const wIdx = newWallets.findIndex(w => w.id === tx.walletId);
      if (wIdx >= 0) {
        if (tx.type === TransactionType.EXPENSE) {
          newWallets[wIdx].balance += tx.amount;
        } else {
          newWallets[wIdx].balance -= tx.amount;
        }
      }
      
      return {
        ...prev,
        wallets: newWallets,
        transactions: prev.transactions.filter(t => t.id !== id)
      };
    });
  };

  // --- Transaction Form ---
  const TransactionForm = ({ onClose }: { onClose: () => void }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [walletId, setWalletId] = useState(data.wallets[0]?.id || '');
    const [categoryId, setCategoryId] = useState(data.categories[0]?.id || '');
    const [note, setNote] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [estimatedCashback, setEstimatedCashback] = useState(0);

    const availableCategories = useMemo(() => 
      data.categories.filter(c => c.type === type), 
    [data.categories, type]);

    useEffect(() => {
      if (!availableCategories.find(c => c.id === categoryId)) {
        setCategoryId(availableCategories[0]?.id || '');
      }
    }, [type, availableCategories, categoryId]);

    useEffect(() => {
      if (type === TransactionType.EXPENSE) {
        const wallet = data.wallets.find(w => w.id === walletId);
        const val = parseFloat(amount) || 0;
        if (wallet && val > 0) {
          setEstimatedCashback(calculatePotentialCashback(val, wallet, categoryId, date, data.transactions));
        } else {
          setEstimatedCashback(0);
        }
      } else {
        setEstimatedCashback(0);
      }
    }, [amount, walletId, categoryId, type, date, data.transactions]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseFloat(amount);
      if (!val || !walletId || !categoryId) return;

      const newTx: Transaction = {
        id: Date.now().toString(),
        walletId,
        categoryId,
        amount: val,
        date,
        note,
        type,
        cashbackAmount: estimatedCashback
      };
      
      addTransaction(newTx);
      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            className={`p-2 rounded-lg border text-center font-medium transition-colors ${type === TransactionType.EXPENSE ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-slate-400 dark:border-slate-600'}`}
            onClick={() => setType(TransactionType.EXPENSE)}
          >
            Chi tiêu
          </button>
          <button 
            type="button"
            className={`p-2 rounded-lg border text-center font-medium transition-colors ${type === TransactionType.INCOME ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-slate-400 dark:border-slate-600'}`}
            onClick={() => setType(TransactionType.INCOME)}
          >
            Thu nhập
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số tiền</label>
          <input 
            type="number" 
            required
            className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-slate-700 dark:text-white"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ví / Thẻ</label>
            <select 
              className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-slate-700 dark:text-white"
              value={walletId}
              onChange={e => setWalletId(e.target.value)}
            >
              {data.wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày</label>
            <input 
              type="date" 
              required
              className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-slate-700 dark:text-white"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Danh mục</label>
          <select 
            className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-slate-700 dark:text-white"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            {availableCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
          <input 
            type="text" 
            className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white dark:bg-slate-700 dark:text-white"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Mô tả giao dịch..."
          />
        </div>

        {estimatedCashback > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg flex items-center gap-2 border border-yellow-100 dark:border-yellow-800">
            <PiggyBank size={16} />
            <span className="text-sm">Hoàn tiền dự kiến: <strong>{formatCurrency(estimatedCashback, data.currency)}</strong></span>
          </div>
        )}

        <button type="submit" className="w-full py-3 bg-primary dark:bg-accent text-white font-bold rounded-lg hover:bg-secondary dark:hover:bg-blue-600 transition-colors">
          Lưu Giao Dịch
        </button>
      </form>
    );
  };

  // --- Wallets & Categories Management ---

  const CategoryManagement = () => {
    const [editCat, setEditCat] = useState<Category | null>(null);

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if(!editCat) return;
      setData(prev => {
         const exists = prev.categories.find(c => c.id === editCat.id);
         const newCats = exists 
           ? prev.categories.map(c => c.id === editCat.id ? editCat : c)
           : [...prev.categories, editCat];
         return { ...prev, categories: newCats };
      });
      setEditCat(null);
    };

    const handleDelete = (id: string) => {
       if (confirm("Xóa danh mục này?")) {
          setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
       }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý Danh mục</h2>
          <button 
            onClick={() => setEditCat({ id: Date.now().toString(), name: '', type: TransactionType.EXPENSE, icon: 'Tag', color: '#64748b' })}
            className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Thêm Danh mục
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.categories.map(c => {
             const Icon = IconMap[c.icon] || Tag;
             return (
              <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between group">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm" style={{backgroundColor: c.color}}>
                     <Icon size={20} />
                   </div>
                   <div>
                     <h4 className="font-medium text-gray-800 dark:text-white">{c.name}</h4>
                     <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-400'}`}>
                          {c.type === TransactionType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'}
                        </span>
                     </div>
                   </div>
                 </div>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditCat(c)} className="text-gray-400 hover:text-accent"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                 </div>
              </div>
             );
          })}
        </div>

        {editCat && (
          <Modal title={editCat.name ? 'Chỉnh sửa' : 'Thêm mới'} isOpen={true} onClose={() => setEditCat(null)}>
             <form onSubmit={handleSave} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên danh mục</label>
                   <input required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editCat.name} onChange={e => setEditCat({...editCat, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại</label>
                    <select className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editCat.type} onChange={e => setEditCat({...editCat, type: e.target.value as TransactionType})}>
                       <option value={TransactionType.EXPENSE}>Chi tiêu</option>
                       <option value={TransactionType.INCOME}>Thu nhập</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Màu sắc</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map(color => (
                        <button key={color} type="button" onClick={() => setEditCat({...editCat, color})} 
                           className={`w-6 h-6 rounded-full border-2 ${editCat.color === color ? 'border-gray-800 dark:border-white' : 'border-transparent'}`}
                           style={{backgroundColor: color}}
                        />
                      ))}
                   </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary dark:bg-accent text-white py-2 rounded-lg font-bold">Lưu</button>
             </form>
          </Modal>
        )}
      </div>
    );
  };

  const WalletsView = () => {
    const [editingWallet, setEditingWallet] = useState<WalletModel | null>(null);

    const handleSaveWallet = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingWallet) return;
      setData(prev => {
        const exists = prev.wallets.find(w => w.id === editingWallet.id);
        const newWallets = exists 
           ? prev.wallets.map(w => w.id === editingWallet.id ? editingWallet : w)
           : [...prev.wallets, editingWallet];
        return { ...prev, wallets: newWallets };
      });
      setEditingWallet(null);
    };

    const addRule = () => {
      if (!editingWallet) return;
      setEditingWallet({ 
        ...editingWallet, 
        cashbackRules: [...editingWallet.cashbackRules, {
          id: Date.now().toString(), categoryId: 'ALL', percentage: 1, minSpend: 0, maxRewardPerPeriod: 0
        }] 
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý Ví & Thẻ</h2>
          <button 
            onClick={() => setEditingWallet({
              id: Date.now().toString(), name: '', type: WalletType.CASH, balance: 0, cashbackRules: []
            })}
            className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
          >
            Thêm Ví Mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.wallets.map(w => (
            <div key={w.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 ${w.type === WalletType.CREDIT ? 'bg-purple-500' : 'bg-green-500'}`}></div>
               <div className="flex justify-between items-start mb-4 relative z-10">
                 <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-xl">
                   {w.type === WalletType.CREDIT ? <CreditCard size={24} className="text-purple-600 dark:text-purple-400" /> : <Banknote size={24} className="text-green-600 dark:text-green-400" />}
                 </div>
                 <button onClick={() => setEditingWallet(w)} className="text-gray-400 hover:text-accent"><Edit2 size={18} /></button>
               </div>
               <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{w.name}</h3>
               <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{w.type === WalletType.CREDIT ? 'Thẻ Tín Dụng' : 'Tiền mặt / Debit'}</p>
               <p className={`text-xl font-bold ${w.balance < 0 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>{formatCurrency(w.balance, data.currency)}</p>
            </div>
          ))}
        </div>

        {editingWallet && (
          <Modal title={editingWallet.name ? 'Chỉnh sửa Ví' : 'Thêm Ví Mới'} isOpen={true} onClose={() => setEditingWallet(null)}>
            <form onSubmit={handleSaveWallet} className="space-y-4 text-sm">
               <div>
                  <label className="block font-medium dark:text-gray-300">Tên Ví</label>
                  <input required className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingWallet.name} onChange={e => setEditingWallet({...editingWallet, name: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium dark:text-gray-300">Loại</label>
                    <select className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingWallet.type} onChange={e => setEditingWallet({...editingWallet, type: e.target.value as WalletType})}>
                      <option value={WalletType.CASH}>Tiền mặt / Debit</option>
                      <option value={WalletType.CREDIT}>Thẻ Tín Dụng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium dark:text-gray-300">Số dư</label>
                    <input required type="number" className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingWallet.balance} onChange={e => setEditingWallet({...editingWallet, balance: parseFloat(e.target.value)})} />
                  </div>
               </div>

               {editingWallet.type === WalletType.CREDIT && (
                 <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block font-bold text-purple-700 dark:text-purple-300 text-xs">Hạn mức</label>
                          <input type="number" className="w-full border p-1 rounded mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={editingWallet.creditLimit || 0} onChange={e => setEditingWallet({...editingWallet, creditLimit: parseFloat(e.target.value)})} />
                       </div>
                       <div>
                          <label className="block font-bold text-purple-700 dark:text-purple-300 text-xs">Ngày sao kê (1-31)</label>
                          <input type="number" className="w-full border p-1 rounded mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={editingWallet.statementDate || 1} onChange={e => setEditingWallet({...editingWallet, statementDate: parseInt(e.target.value)})} />
                       </div>
                    </div>
                    <div>
                       <label className="block font-bold text-purple-700 dark:text-purple-300 text-xs">Ngày bắt đầu chu kỳ hoàn tiền (1-31)</label>
                       <input type="number" className="w-full border p-1 rounded mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={editingWallet.cashbackCycleStartDay || 1} onChange={e => setEditingWallet({...editingWallet, cashbackCycleStartDay: parseInt(e.target.value)})} />
                    </div>
                 </div>
               )}

               {editingWallet.type === WalletType.CREDIT && (
                 <div className="border-t pt-4 dark:border-slate-700">
                    <div className="flex justify-between mb-2">
                       <h4 className="font-bold text-gray-700 dark:text-gray-300">Quy tắc hoàn tiền</h4>
                       <button type="button" onClick={addRule} className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded">Thêm</button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                       {editingWallet.cashbackRules.map((r, i) => (
                         <div key={r.id} className="p-3 bg-gray-50 dark:bg-slate-800 border dark:border-slate-600 rounded-lg space-y-2">
                            <div className="flex gap-2">
                               <select className="flex-1 border p-1 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={r.categoryId} onChange={e => {
                                  const newRules = [...editingWallet.cashbackRules];
                                  newRules[i].categoryId = e.target.value;
                                  setEditingWallet({...editingWallet, cashbackRules: newRules});
                               }}>
                                 <option value="ALL">Tất cả giao dịch khác</option>
                                 {data.categories.filter(c => c.type === TransactionType.EXPENSE).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                               <button type="button" className="text-red-500" onClick={() => setEditingWallet({...editingWallet, cashbackRules: editingWallet.cashbackRules.filter(x => x.id !== r.id)})}><Trash2 size={14}/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                               <div>
                                  <span className="text-[10px] uppercase text-gray-500">Hoàn (%)</span>
                                  <input type="number" step="0.1" className="w-full border p-1 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={r.percentage} onChange={e => {
                                     const newRules = [...editingWallet.cashbackRules];
                                     newRules[i].percentage = parseFloat(e.target.value);
                                     setEditingWallet({...editingWallet, cashbackRules: newRules});
                                  }} />
                               </div>
                               <div>
                                  <span className="text-[10px] uppercase text-gray-500">Min Chi Tiêu</span>
                                  <input type="number" className="w-full border p-1 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={r.minSpend} onChange={e => {
                                     const newRules = [...editingWallet.cashbackRules];
                                     newRules[i].minSpend = parseFloat(e.target.value);
                                     setEditingWallet({...editingWallet, cashbackRules: newRules});
                                  }} />
                               </div>
                               <div>
                                  <span className="text-[10px] uppercase text-gray-500">Max Hoàn/Kỳ</span>
                                  <input type="number" className="w-full border p-1 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={r.maxRewardPerPeriod} onChange={e => {
                                     const newRules = [...editingWallet.cashbackRules];
                                     newRules[i].maxRewardPerPeriod = parseFloat(e.target.value);
                                     setEditingWallet({...editingWallet, cashbackRules: newRules});
                                  }} />
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
               <button type="submit" className="w-full bg-primary dark:bg-accent text-white py-2 rounded-lg font-bold">Lưu Thông Tin</button>
            </form>
          </Modal>
        )}
      </div>
    );
  };

  // --- Enhanced Calendar View ---
  const CalendarView = () => {
    const [viewMode, setViewMode] = useState<'day'|'month'|'year'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedWalletId, setSelectedWalletId] = useState('ALL');

    const navigate = (dir: number) => {
       const newDate = new Date(currentDate);
       if (viewMode === 'day') newDate.setDate(currentDate.getDate() + dir);
       if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + dir);
       if (viewMode === 'year') newDate.setFullYear(currentDate.getFullYear() + dir);
       setCurrentDate(newDate);
    };

    const getDailyStats = (d: Date) => {
       const dateStr = d.toISOString().split('T')[0];
       const txs = data.transactions.filter(t => 
         t.date === dateStr && (selectedWalletId === 'ALL' || t.walletId === selectedWalletId)
       );
       return {
          income: txs.filter(t => t.type === TransactionType.INCOME).reduce((s,t) => s+t.amount,0),
          expense: txs.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t) => s+t.amount,0),
          txs
       };
    };

    const renderDayView = () => {
       const stats = getDailyStats(currentDate);
       return (
          <div className="space-y-4">
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between">
                <div className="text-green-500">
                   <div className="text-xs text-gray-500 dark:text-slate-400">Thu nhập</div>
                   <div className="font-bold">{formatCurrency(stats.income, data.currency)}</div>
                </div>
                <div className="text-red-500 text-right">
                   <div className="text-xs text-gray-500 dark:text-slate-400">Chi tiêu</div>
                   <div className="font-bold">{formatCurrency(stats.expense, data.currency)}</div>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {stats.txs.length === 0 ? <div className="p-8 text-center text-gray-400">Không có giao dịch</div> : 
                  stats.txs.map(t => (
                     <div key={t.id} className="p-4 border-b dark:border-slate-700 flex justify-between items-center last:border-0">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" 
                              style={{backgroundColor: data.categories.find(c => c.id === t.categoryId)?.color}}>
                              <Tag size={16}/>
                           </div>
                           <div>
                              <div className="font-medium dark:text-white">{data.categories.find(c => c.id === t.categoryId)?.name}</div>
                              <div className="text-xs text-gray-400">{t.note || data.wallets.find(w => w.id === t.walletId)?.name}</div>
                           </div>
                        </div>
                        <div className={`font-bold ${t.type === TransactionType.INCOME ? 'text-green-500' : 'text-slate-800 dark:text-white'}`}>
                           {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount, data.currency)}
                        </div>
                     </div>
                  ))
                }
             </div>
          </div>
       );
    };

    const renderMonthView = () => {
       const year = currentDate.getFullYear();
       const month = currentDate.getMonth();
       const daysInMonth = new Date(year, month + 1, 0).getDate();
       const startDay = new Date(year, month, 1).getDay();
       const days = Array(startDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));

       return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
             <div className="grid grid-cols-7 mb-2 text-center font-bold text-gray-400 text-xs">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d}>{d}</div>)}
             </div>
             <div className="grid grid-cols-7 gap-1 md:gap-2 auto-rows-[80px] md:auto-rows-[100px]">
                {days.map((day, idx) => {
                   if (!day) return <div key={idx}></div>;
                   const stats = getDailyStats(new Date(year, month, day));
                   return (
                      <div key={idx} 
                        onClick={() => { setCurrentDate(new Date(year, month, day)); setViewMode('day'); }}
                        className="border dark:border-slate-700 rounded-lg p-1 md:p-2 flex flex-col justify-between hover:border-accent cursor-pointer bg-gray-50 dark:bg-slate-900"
                      >
                         <span className={`font-bold text-xs ${stats.txs.length > 0 ? 'text-primary dark:text-white' : 'text-gray-400'}`}>{day}</span>
                         {stats.txs.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                               {stats.income > 0 && <div className="text-[10px] text-green-600 bg-green-100 dark:bg-green-900/30 rounded px-1 truncate">+{formatCurrency(stats.income, data.currency).split('₫')[0]}</div>}
                               {stats.expense > 0 && <div className="text-[10px] text-red-600 bg-red-100 dark:bg-red-900/30 rounded px-1 truncate">-{formatCurrency(stats.expense, data.currency).split('₫')[0]}</div>}
                            </div>
                         )}
                      </div>
                   );
                })}
             </div>
          </div>
       );
    };

    const renderYearView = () => {
       return (
          <div className="grid grid-cols-3 gap-4">
             {Array.from({length: 12}, (_, i) => {
                const start = new Date(currentDate.getFullYear(), i, 1);
                const end = new Date(currentDate.getFullYear(), i + 1, 0);
                const monthTxs = data.transactions.filter(t => {
                   const d = new Date(t.date);
                   return d >= start && d <= end && (selectedWalletId === 'ALL' || t.walletId === selectedWalletId);
                });
                const inc = monthTxs.filter(t => t.type === TransactionType.INCOME).reduce((s,t) => s+t.amount,0);
                const exp = monthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t) => s+t.amount,0);
                
                return (
                   <div key={i} onClick={() => { setCurrentDate(start); setViewMode('month'); }} 
                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 hover:border-accent cursor-pointer flex flex-col items-center justify-center gap-2"
                   >
                      <div className="font-bold text-lg dark:text-white">Thg {i+1}</div>
                      <div className="text-xs w-full">
                         <div className="flex justify-between text-green-500"><span>Thu</span> <span>{inc > 0 ? formatCurrency(inc, data.currency).split('₫')[0] : '-'}</span></div>
                         <div className="flex justify-between text-red-500"><span>Chi</span> <span>{exp > 0 ? formatCurrency(exp, data.currency).split('₫')[0] : '-'}</span></div>
                      </div>
                   </div>
                );
             })}
          </div>
       );
    };

    return (
      <div className="space-y-4">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
               {viewMode === 'day' && `Ngày ${currentDate.getDate()}/${currentDate.getMonth()+1}/${currentDate.getFullYear()}`}
               {viewMode === 'month' && `Tháng ${currentDate.getMonth()+1}/${currentDate.getFullYear()}`}
               {viewMode === 'year' && `Năm ${currentDate.getFullYear()}`}
            </h2>
            <div className="flex gap-2 w-full md:w-auto">
                <select 
                  value={selectedWalletId} 
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                >
                  <option value="ALL">Tất cả ví</option>
                  {data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <div className="flex bg-gray-200 dark:bg-slate-700 rounded-lg p-1">
                  {['day', 'month', 'year'].map(m => (
                      <button key={m} onClick={() => setViewMode(m as any)} className={`px-3 py-1 rounded-md text-sm capitalize ${viewMode === m ? 'bg-white dark:bg-slate-600 shadow text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {m === 'day' ? 'Ngày' : m === 'month' ? 'Tháng' : 'Năm'}
                      </button>
                  ))}
                </div>
            </div>
         </div>
         <div className="flex justify-between items-center">
             <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-full hover:bg-gray-50"><ChevronLeft size={20} className="dark:text-white"/></button>
             <button onClick={() => navigate(1)} className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-full hover:bg-gray-50"><ChevronRight size={20} className="dark:text-white"/></button>
         </div>
         
         {viewMode === 'day' && renderDayView()}
         {viewMode === 'month' && renderMonthView()}
         {viewMode === 'year' && renderYearView()}
      </div>
    );
  };

  // --- Enhanced Reports View ---
  const ReportsView = () => {
    const [reportType, setReportType] = useState<'week'|'month'|'year'|'custom'>('month');
    const [reportWalletId, setReportWalletId] = useState('ALL');
    const [customRange, setCustomRange] = useState({ 
       start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
       end: new Date().toISOString().split('T')[0] 
    });
    const [breakdownType, setBreakdownType] = useState<TransactionType>(TransactionType.EXPENSE);

    // Calculate Date Range
    const dateRange = useMemo(() => {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        if (reportType === 'week') {
            const day = now.getDay() || 7; // Get current day number, convert Sun(0) to 7
            if (day !== 1) start.setHours(-24 * (day - 1)); // Set to previous Monday
            else start.setHours(0,0,0,0);
            end.setDate(start.getDate() + 6);
        } else if (reportType === 'month') {
            start.setDate(1);
            end.setMonth(start.getMonth() + 1);
            end.setDate(0);
        } else if (reportType === 'year') {
            start.setMonth(0, 1);
            end.setMonth(11, 31);
        } else {
            return { start: new Date(customRange.start), end: new Date(customRange.end) };
        }
        return { start, end };
    }, [reportType, customRange]);

    // Filter Transactions
    const filteredTxs = useMemo(() => {
        return data.transactions.filter(t => {
            const tDate = new Date(t.date);
            const isWalletMatch = reportWalletId === 'ALL' || t.walletId === reportWalletId;
            const isDateMatch = tDate >= dateRange.start && tDate <= dateRange.end;
            return isWalletMatch && isDateMatch;
        });
    }, [data.transactions, reportWalletId, dateRange]);

    // Chart Data (Trend)
    const trendData = useMemo(() => {
        const groups: Record<string, any> = {};
        // Fill gaps if needed, but for simplicity showing present data
        filteredTxs.forEach(t => {
            if (!groups[t.date]) groups[t.date] = { date: t.date, income: 0, expense: 0 };
            if (t.type === TransactionType.INCOME) groups[t.date].income += t.amount;
            else groups[t.date].expense += t.amount;
        });
        return Object.values(groups).sort((a,b) => a.date.localeCompare(b.date));
    }, [filteredTxs]);

    // Breakdown Data (Category)
    const breakdownData = useMemo(() => {
        const cats = data.categories.filter(c => c.type === breakdownType);
        const total = filteredTxs
            .filter(t => t.type === breakdownType)
            .reduce((sum, t) => sum + t.amount, 0);

        return cats.map(c => {
            const amount = filteredTxs
                .filter(t => t.categoryId === c.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return {
                ...c,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0
            };
        }).filter(c => c.amount > 0).sort((a,b) => b.amount - a.amount);
    }, [filteredTxs, breakdownType, data.categories]);

    return (
      <div className="space-y-6">
         {/* Controls */}
         <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
             <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Ví / Thẻ</label>
                 <select 
                   value={reportWalletId} 
                   onChange={(e) => setReportWalletId(e.target.value)}
                   className="p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                 >
                   <option value="ALL">Tất cả ví</option>
                   {data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                 </select>
             </div>
             
             <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Thời gian</label>
                 <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                    {['week', 'month', 'year', 'custom'].map(t => (
                        <button 
                            key={t} 
                            onClick={() => setReportType(t as any)} 
                            className={`px-3 py-1 text-sm rounded-md transition-all ${reportType === t ? 'bg-white dark:bg-slate-600 shadow text-primary dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            {t === 'week' ? 'Tuần' : t === 'month' ? 'Tháng' : t === 'year' ? 'Năm' : 'Tùy chỉnh'}
                        </button>
                    ))}
                 </div>
             </div>

             {reportType === 'custom' && (
                 <div className="flex gap-2 items-end">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-gray-500">Từ</span>
                        <input type="date" className="p-1 border rounded text-sm dark:bg-slate-700 dark:text-white dark:border-slate-600" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-gray-500">Đến</span>
                        <input type="date" className="p-1 border rounded text-sm dark:bg-slate-700 dark:text-white dark:border-slate-600" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} />
                    </div>
                 </div>
             )}
         </div>

         {/* Trend Chart */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-80">
            <h3 className="font-bold mb-4 dark:text-white">Xu hướng (Thu/Chi)</h3>
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData}>
                  <defs>
                     <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                  <YAxis tickFormatter={(val) => `${val/1000}k`} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                    formatter={(value: number) => formatCurrency(value, data.currency)} 
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" name="Thu nhập" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" name="Chi tiêu" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
         
         {/* Detailed Breakdown */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold dark:text-white">Phân tích danh mục</h3>
                  <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                     <button onClick={() => setBreakdownType(TransactionType.EXPENSE)} className={`px-3 py-1 text-xs rounded transition-colors ${breakdownType === TransactionType.EXPENSE ? 'bg-red-500 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>Chi tiêu</button>
                     <button onClick={() => setBreakdownType(TransactionType.INCOME)} className={`px-3 py-1 text-xs rounded transition-colors ${breakdownType === TransactionType.INCOME ? 'bg-green-500 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>Thu nhập</button>
                  </div>
               </div>
               
               <div className="flex flex-col md:flex-row gap-6">
                  {/* Pie Chart */}
                  <div className="w-full md:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie 
                            data={breakdownData}
                            innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="amount"
                        >
                            {breakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value, data.currency)} />
                        </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* List Details */}
                  <div className="w-full md:w-1/2 space-y-3 overflow-y-auto max-h-64 pr-2">
                     <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase font-bold">
                        <span>Danh mục</span>
                        <span>Số tiền</span>
                     </div>
                     {breakdownData.map(c => (
                        <div key={c.id} className="group">
                           <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}}></div>
                                 <span className="text-sm font-medium dark:text-slate-200">{c.name}</span>
                              </div>
                              <span className="text-sm font-bold dark:text-white">{formatCurrency(c.amount, data.currency)}</span>
                           </div>
                           <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{width: `${c.percentage}%`, backgroundColor: c.color}}></div>
                           </div>
                           <div className="text-[10px] text-right text-gray-400 mt-0.5">{c.percentage.toFixed(1)}%</div>
                        </div>
                     ))}
                     {breakdownData.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Chưa có dữ liệu</p>}
                  </div>
               </div>
               
               <div className="mt-6 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Tổng cộng</span>
                  <span className={`text-xl font-bold ${breakdownType === TransactionType.EXPENSE ? 'text-red-500' : 'text-green-500'}`}>
                     {formatCurrency(breakdownData.reduce((s,c) => s+c.amount, 0), data.currency)}
                  </span>
               </div>
            </div>
         </div>
      </div>
    );
  };

  // --- Enhanced Cashback View ---
  const CashbackStatsView = () => {
     // Global Summary
     const totalSpend = data.transactions
        .filter(t => t.type === TransactionType.EXPENSE && data.wallets.find(w => w.id === t.walletId)?.type === WalletType.CREDIT)
        .reduce((sum, t) => sum + t.amount, 0);
     
     const totalCashback = data.transactions
        .reduce((sum, t) => sum + t.cashbackAmount, 0);

     // Stats by Wallet
     const stats = data.wallets
        .filter(w => w.type === WalletType.CREDIT)
        .map(w => {
           const { start, end } = getCashbackCycleRange(new Date().toISOString(), w.cashbackCycleStartDay || 1);
           
           // Filter txs for current cycle
           const cycleTxs = data.transactions.filter(t => 
             t.walletId === w.id && new Date(t.date) >= start && new Date(t.date) <= end
           );

           const cycleSpend = cycleTxs
             .filter(t => t.type === TransactionType.EXPENSE)
             .reduce((sum, t) => sum + t.amount, 0);
             
           const cycleCashback = cycleTxs.reduce((sum, t) => sum + t.cashbackAmount, 0);

           const theoreticalMax = w.cashbackRules.reduce((sum, r) => sum + r.maxRewardPerPeriod, 0);
           
           return {
              ...w,
              cycleSpend,
              cycleCashback,
              theoreticalMax
           };
        });

     return (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Thống kê Hoàn tiền</h2>
           
           {/* Global Summary Card */}
           <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                 <Globe size={20} />
                 <span className="font-medium tracking-wide">Tổng quan (Tất cả thẻ)</span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <div className="text-sm text-gray-400 mb-1">Tổng chi tiêu qua thẻ</div>
                    <div className="text-2xl md:text-3xl font-bold">{formatCurrency(totalSpend, data.currency)}</div>
                 </div>
                 <div>
                    <div className="text-sm text-orange-300 mb-1">Tổng hoàn tiền tích lũy</div>
                    <div className="text-2xl md:text-3xl font-bold text-orange-400">+{formatCurrency(totalCashback, data.currency)}</div>
                 </div>
              </div>
           </div>

           <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-8">Chi tiết theo thẻ (Kỳ hiện tại)</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.map(w => (
                 <div key={w.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h3 className="font-bold text-lg dark:text-white">{w.name}</h3>
                              <div className="text-sm text-gray-500">Chu kỳ: {w.cashbackCycleStartDay ? `Ngày ${w.cashbackCycleStartDay}` : 'Ngày 1'} hàng tháng</div>
                           </div>
                           <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-500 px-3 py-1 rounded-lg font-bold text-sm">
                              +{formatCurrency(w.cycleCashback, data.currency)}
                           </div>
                        </div>
                        
                        <div className="flex justify-between items-end mb-2">
                           <div>
                              <div className="text-xs text-gray-500 dark:text-slate-400">Đã chi tiêu kỳ này</div>
                              <div className="font-bold text-lg dark:text-slate-200">{formatCurrency(w.cycleSpend, data.currency)}</div>
                           </div>
                           {w.theoreticalMax > 0 && (
                              <div className="text-right">
                                 <div className="text-xs text-gray-500 dark:text-slate-400">Đạt max hoàn tiền</div>
                                 <div className="font-bold text-gray-700 dark:text-gray-300">{Math.round((w.cycleCashback / w.theoreticalMax) * 100)}%</div>
                              </div>
                           )}
                        </div>
                    </div>

                    {w.theoreticalMax > 0 && (
                       <div className="mt-3">
                          <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className="h-full bg-orange-500 transition-all duration-500" style={{width: `${Math.min(100, (w.cycleCashback / w.theoreticalMax) * 100)}%`}}></div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 text-right">Max ước tính: {formatCurrency(w.theoreticalMax, data.currency)}</p>
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>
     );
  };

  const SettingsView = () => (
     <div className="space-y-6 max-w-xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Cài đặt</h2>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
           <div>
              <label className="block font-medium mb-2 dark:text-white">Tên người dùng</label>
              <input className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={data.userName} onChange={e => setData({...data, userName: e.target.value})} />
           </div>
           <div className="flex items-center justify-between">
              <span className="font-medium dark:text-white">Chế độ Tối (Dark Mode)</span>
              <button 
                 onClick={() => setData({...data, darkMode: !data.darkMode})}
                 className={`w-12 h-6 rounded-full p-1 transition-colors ${data.darkMode ? 'bg-accent' : 'bg-gray-300'}`}
              >
                 <div className={`w-4 h-4 rounded-full bg-white transition-transform ${data.darkMode ? 'translate-x-6' : ''}`}></div>
              </button>
           </div>
           <div>
              <label className="block font-medium mb-2 dark:text-white">Đơn vị tiền tệ</label>
              <select className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={data.currency} onChange={e => setData({...data, currency: e.target.value})}>
                 <option value="VND">VND (₫)</option>
                 <option value="USD">USD ($)</option>
              </select>
           </div>
           <hr className="dark:border-slate-700" />
           <button onClick={() => { if(confirm("Reset toàn bộ?")) window.location.reload(); }} className="text-red-500 w-full text-left">Khôi phục mặc định</button>
        </div>
     </div>
  );

  const Sidebar = () => (
     <div className="w-16 md:w-64 bg-primary text-white flex-shrink-0 flex flex-col h-screen fixed md:sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3 font-bold text-xl border-b border-gray-700 h-16">
           <div className="bg-accent p-1.5 rounded-lg"><Banknote size={20} /></div>
           <span className="hidden md:block truncate">SmartSpend</span>
        </div>
        <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
           {[
              { id: 'wallets', label: 'Ví & Thẻ', icon: Wallet },
              { id: 'categories', label: 'Danh mục', icon: Tag },
              { id: 'transactions', label: 'Giao dịch', icon: Receipt },
              { id: 'calendar', label: 'Lịch', icon: CalendarIcon },
              { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
              { id: 'cashback', label: 'Hoàn tiền', icon: PiggyBank },
              { id: 'settings', label: 'Cài đặt', icon: SettingsIcon },
           ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-accent text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                 <item.icon size={20} />
                 <span className="hidden md:block">{item.label}</span>
              </button>
           ))}
        </nav>
        <div className="p-4 border-t border-gray-700 hidden md:block">
           <div className="text-xs text-gray-400">Xin chào,</div>
           <div className="font-bold truncate">{data.userName}</div>
        </div>
     </div>
  );
  
  // --- Main Render ---

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 font-sans transition-colors duration-200">
       <Sidebar />
       <main className="flex-1 p-4 md:p-8 ml-16 md:ml-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
             {activeTab === 'transactions' && 
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Giao dịch gần đây</h2>
                      <button onClick={() => setShowAddTransaction(true)} className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors"><Plus size={18}/> Thêm</button>
                   </div>
                   <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-left">
                         <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-300 text-xs uppercase">
                            <tr>
                               <th className="p-4 hidden md:table-cell">Ngày</th>
                               <th className="p-4">Danh mục</th>
                               <th className="p-4 hidden md:table-cell">Ví</th>
                               <th className="p-4 text-right">Số tiền</th>
                               <th className="p-4 text-right hidden md:table-cell">Hoàn tiền</th>
                               <th className="p-4 text-center"></th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {data.transactions.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chưa có dữ liệu</td></tr> : 
                               data.transactions.map(t => {
                                  const c = data.categories.find(x => x.id === t.categoryId);
                                  const w = data.wallets.find(x => x.id === t.walletId);
                                  const Icon = IconMap[c?.icon || 'Tag'] || Tag;
                                  return (
                                     <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                                        <td className="p-4 text-gray-600 dark:text-slate-400 hidden md:table-cell">{t.date}</td>
                                        <td className="p-4">
                                           <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0" style={{backgroundColor: c?.color}}>
                                                 <Icon size={16}/>
                                              </div>
                                              <div>
                                                 <div className="font-medium text-gray-800 dark:text-white">{c?.name}</div>
                                                 <div className="text-xs text-gray-400 md:hidden">{t.date} • {w?.name}</div>
                                                 <div className="text-xs text-gray-400">{t.note}</div>
                                              </div>
                                           </div>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-slate-400 text-sm hidden md:table-cell">{w?.name}</td>
                                        <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-500' : 'text-slate-800 dark:text-white'}`}>
                                           {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount, data.currency)}
                                        </td>
                                        <td className="p-4 text-right hidden md:table-cell">
                                           {t.cashbackAmount > 0 && <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">+{formatCurrency(t.cashbackAmount, data.currency)}</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                           <button onClick={() => deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                                        </td>
                                     </tr>
                                  );
                               })
                            }
                         </tbody>
                      </table>
                   </div>
                </div>
             }
             {activeTab === 'wallets' && <WalletsView />}
             {activeTab === 'categories' && <CategoryManagement />}
             {activeTab === 'calendar' && <CalendarView />}
             {activeTab === 'reports' && <ReportsView />}
             {activeTab === 'cashback' && <CashbackStatsView />}
             {activeTab === 'settings' && <SettingsView />}
          </div>
       </main>

       <Modal title="Thêm Giao Dịch" isOpen={showAddTransaction} onClose={() => setShowAddTransaction(false)}>
          <TransactionForm onClose={() => setShowAddTransaction(false)} />
       </Modal>
    </div>
  );
}