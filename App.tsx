
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, Receipt, Calendar as CalendarIcon, 
  BarChart3, Settings as SettingsIcon, Plus, Trash2, Edit2, 
  ChevronRight, ChevronLeft, CreditCard, PiggyBank, Banknote,
  Utensils, Car, ShoppingBag, FileText, Film, DollarSign, Gift,
  Tag, Globe, Filter, List, Sun, Moon, ArrowRight, Home, Coffee, Plane,
  TrendingDown, TrendingUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { INITIAL_DATA } from './constants';
import { AppData, TransactionGroup, Transaction, Wallet as WalletModel, TransactionType, WalletType, CashbackRule } from './types';
import { calculateRuleCashback, formatCurrency, getCashbackCycleRange } from './utils/helpers';

const IconMap: Record<string, any> = { 
  Utensils, Car, ShoppingBag, FileText, Film, DollarSign, Gift, Tag, Globe, List, Home, Coffee, Plane 
};

// --- Custom Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
          <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [globalWalletFilter, setGlobalWalletFilter] = useState('ALL');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('smartspend_v3_data');
    if (saved) {
      try { setData(JSON.parse(saved)); } catch(e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smartspend_v3_data', JSON.stringify(data));
    if (data.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [data]);

  // --- Handlers ---
  const saveTransaction = (t: Transaction) => {
    setData(prev => {
      let nw = [...prev.wallets];
      let nt = [...prev.transactions];

      const existing = nt.find(x => x.id === t.id);
      if (existing) {
        // Revert old transaction's impact on balance
        nw = nw.map(w => {
          if (w.id === existing.walletId) {
            return { ...w, balance: w.balance + (existing.type === TransactionType.INCOME ? -existing.amount : existing.amount) };
          }
          return w;
        });
        nt = nt.map(x => x.id === t.id ? t : x);
      } else {
        nt = [t, ...nt];
      }

      // Apply new/updated transaction's impact
      nw = nw.map(w => {
        if (w.id === t.walletId) {
          return { ...w, balance: w.balance + (t.type === TransactionType.INCOME ? t.amount : -t.amount) };
        }
        return w;
      });

      return { ...prev, wallets: nw, transactions: nt };
    });
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    if (!confirm("Xác nhận xóa giao dịch này?")) return;
    setData(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;
      const nw = prev.wallets.map(w => {
        if (w.id === tx.walletId) {
          return { ...w, balance: w.balance + (tx.type === TransactionType.INCOME ? -tx.amount : tx.amount) };
        }
        return w;
      });
      return { ...prev, wallets: nw, transactions: prev.transactions.filter(t => t.id !== id) };
    });
  };

  // --- Common UI Parts ---

  const TransactionForm = ({ transaction, onClose }: { transaction?: Transaction; onClose: () => void }) => {
    const [amount, setAmount] = useState(transaction?.amount.toString() || '');
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [walletId, setWalletId] = useState(transaction?.walletId || data.wallets[0]?.id || '');
    const [groupId, setGroupId] = useState(transaction?.transactionGroupId || data.transactionGroups[0]?.id || '');
    const [cashbackRuleId, setCashbackRuleId] = useState(transaction?.cashbackRuleId || '');
    const [note, setNote] = useState(transaction?.note || '');
    const [type, setType] = useState<TransactionType>(transaction?.type || TransactionType.EXPENSE);

    const selectedWallet = data.wallets.find(w => w.id === walletId);
    const availableGroups = data.transactionGroups.filter(g => g.type === type);

    const estCashback = useMemo(() => {
      if (!selectedWallet || type === TransactionType.INCOME || !cashbackRuleId) return 0;
      return calculateRuleCashback(parseFloat(amount) || 0, selectedWallet, cashbackRuleId, date, data.transactions.filter(t => t.id !== transaction?.id));
    }, [amount, walletId, cashbackRuleId, date, type, data.transactions, transaction]);

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (!val || !walletId || !groupId) return;
        saveTransaction({ 
          id: transaction?.id || Date.now().toString(), 
          walletId, 
          transactionGroupId: groupId, 
          cashbackRuleId: cashbackRuleId || undefined, 
          amount: val, 
          date, 
          note, 
          type, 
          cashbackAmount: estCashback 
        });
        onClose();
      }} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
          {Object.values(TransactionType).map(v => (
            <button key={v} type="button" onClick={() => setType(v)} className={`py-2 rounded-lg text-sm font-bold transition-all ${type === v ? 'bg-white dark:bg-slate-600 shadow text-primary dark:text-white' : 'text-gray-500'}`}>
              {v === TransactionType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Số tiền</label>
          <input required type="number" className="w-full p-4 text-xl font-black border-2 border-gray-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 dark:text-white focus:border-accent outline-none transition-all" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Ví / Thẻ</label>
            <select className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white outline-none" value={walletId} onChange={e => { setWalletId(e.target.value); setCashbackRuleId(''); }}>
              {data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Ngày</label>
            <input type="date" className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white outline-none" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Nhóm giao dịch</label>
          <select className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white outline-none" value={groupId} onChange={e => setGroupId(e.target.value)}>
            {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        {type === TransactionType.EXPENSE && selectedWallet?.type === WalletType.CREDIT && selectedWallet.cashbackRules.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-orange-400 uppercase">Quy tắc hoàn tiền</label>
            <select className="w-full p-3 border-2 border-orange-100 bg-orange-50/30 rounded-xl dark:bg-slate-700 dark:text-white outline-none" value={cashbackRuleId} onChange={e => setCashbackRuleId(e.target.value)}>
              <option value="">Không áp dụng</option>
              {selectedWallet.cashbackRules.map(r => <option key={r.id} value={r.id}>{r.groupName} ({r.percentage}%)</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Ghi chú</label>
          <input className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:text-white outline-none" value={note} onChange={e => setNote(e.target.value)} placeholder="Mô tả..." />
        </div>
        {estCashback > 0 && (
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-2xl flex justify-between items-center border border-orange-200">
             <div className="flex items-center gap-2 font-bold"><PiggyBank size={18}/> <span>Tiền hoàn ước tính:</span></div>
             <span className="text-lg font-black">{formatCurrency(estCashback, data.currency)}</span>
          </div>
        )}
        <button type="submit" className="w-full py-4 bg-accent text-white font-black text-lg rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
          {transaction ? 'Cập Nhật' : 'Lưu Giao Dịch'}
        </button>
      </form>
    );
  };

  // --- Module 1: Wallet Management ---
  const WalletManager = () => {
    const [editing, setEditing] = useState<WalletModel | null>(null);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Ví & Nguồn Tiền</h2>
          <button onClick={() => setEditing({ id: Date.now().toString(), name: '', type: WalletType.CASH, balance: 0, cashbackRules: [] })} className="bg-primary dark:bg-accent text-white px-6 py-3 rounded-2xl font-bold">+ Thêm Ví</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.wallets.map(w => (
            <div key={w.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
               <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl ${w.type === WalletType.CREDIT ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                    {w.type === WalletType.CREDIT ? <CreditCard size={32}/> : <Banknote size={32}/>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(w)} className="p-2 text-gray-300 hover:text-accent transition-colors"><Edit2 size={20}/></button>
                    <button onClick={() => { if(confirm("Xóa ví này?")) setData(p => ({...p, wallets: p.wallets.filter(x => x.id !== w.id)})); }} className="p-2 text-gray-100 hover:text-red-500"><Trash2 size={20}/></button>
                  </div>
               </div>
               <h3 className="text-xl font-black dark:text-white">{w.name}</h3>
               <div className="flex flex-wrap gap-2 mt-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{w.type}</span>
                 {w.type === WalletType.CREDIT && <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">• Statement Day: {w.statementDate}</span>}
               </div>
               <p className={`text-3xl font-black mt-4 ${w.balance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(w.balance, data.currency)}</p>
            </div>
          ))}
        </div>
        {editing && (
          <Modal title={editing.name || "Tạo Ví Mới"} isOpen={true} onClose={() => setEditing(null)}>
             <form onSubmit={(e) => {
               e.preventDefault();
               setData(prev => ({ ...prev, wallets: prev.wallets.find(w => w.id === editing.id) ? prev.wallets.map(w => w.id === editing.id ? editing : w) : [...prev.wallets, editing] }));
               setEditing(null);
             }} className="space-y-4">
                <input required placeholder="Tên nguồn tiền..." className="w-full p-4 border rounded-2xl dark:bg-slate-700 dark:text-white font-bold" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full p-4 border rounded-2xl dark:bg-slate-700 dark:text-white" value={editing.type} onChange={e => setEditing({...editing, type: e.target.value as WalletType})}>
                    <option value={WalletType.CASH}>Tiền mặt</option>
                    <option value={WalletType.DEBIT}>Thẻ Debit</option>
                    <option value={WalletType.CREDIT}>Thẻ Tín Dụng</option>
                  </select>
                  <input type="number" placeholder="Số dư" className="w-full p-4 border rounded-2xl dark:bg-slate-700 dark:text-white" value={editing.balance} onChange={e => setEditing({...editing, balance: parseFloat(e.target.value)})} />
                </div>
                {editing.type === WalletType.CREDIT && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border dark:border-slate-700 space-y-4">
                    <h4 className="font-black text-sm text-gray-500 uppercase">Cài đặt Credit & Cashback</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <span className="text-[10px] font-bold text-gray-400">Hạn mức</span>
                         <input type="number" className="w-full p-2 border rounded-xl dark:bg-slate-700" value={editing.creditLimit} onChange={e => setEditing({...editing, creditLimit: parseFloat(e.target.value)})} />
                       </div>
                       <div className="space-y-1">
                         <span className="text-[10px] font-bold text-gray-400">Ngày sao kê</span>
                         <input type="number" className="w-full p-2 border rounded-xl dark:bg-slate-700" value={editing.statementDate} onChange={e => setEditing({...editing, statementDate: parseInt(e.target.value)})} />
                       </div>
                    </div>
                    <div className="space-y-3">
                       {editing.cashbackRules.map((r, i) => (
                         <div key={r.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 relative shadow-sm">
                            <button type="button" onClick={() => setEditing({...editing, cashbackRules: editing.cashbackRules.filter(x => x.id !== r.id)})} className="absolute top-2 right-2 text-red-400 hover:text-red-600">✕</button>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                               <input placeholder="Tên quy tắc (Ăn uống...)" className="p-2 border rounded-xl dark:bg-slate-700 text-xs" value={r.groupName} onChange={e => { const nr = [...editing.cashbackRules]; nr[i].groupName = e.target.value; setEditing({...editing, cashbackRules: nr}); }} />
                               <input placeholder="Mã MCC" className="p-2 border rounded-xl dark:bg-slate-700 text-xs" value={r.mcc || ''} onChange={e => { const nr = [...editing.cashbackRules]; nr[i].mcc = e.target.value; setEditing({...editing, cashbackRules: nr}); }} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                               <div className="space-y-1">
                                 <span className="text-[8px] font-bold text-gray-400 block uppercase">Hoàn %</span>
                                 <input type="number" step="0.1" className="w-full p-2 border rounded-xl dark:bg-slate-700 text-xs" value={r.percentage} onChange={e => { const nr = [...editing.cashbackRules]; nr[i].percentage = parseFloat(e.target.value); setEditing({...editing, cashbackRules: nr}); }} />
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[8px] font-bold text-gray-400 block uppercase">Min Chi</span>
                                 <input type="number" className="w-full p-2 border rounded-xl dark:bg-slate-700 text-xs" value={r.minSpend} onChange={e => { const nr = [...editing.cashbackRules]; nr[i].minSpend = parseFloat(e.target.value); setEditing({...editing, cashbackRules: nr}); }} />
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[8px] font-bold text-gray-400 block uppercase">Max/Kỳ</span>
                                 <input type="number" className="w-full p-2 border rounded-xl dark:bg-slate-700 text-xs" value={r.maxRewardPerPeriod} onChange={e => { const nr = [...editing.cashbackRules]; nr[i].maxRewardPerPeriod = parseFloat(e.target.value); setEditing({...editing, cashbackRules: nr}); }} />
                               </div>
                            </div>
                         </div>
                       ))}
                       <button type="button" onClick={() => setEditing({...editing, cashbackRules: [...editing.cashbackRules, { id: Date.now().toString(), groupName: '', percentage: 1, minSpend: 0, maxRewardPerPeriod: 0 }]})} className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-gray-400 text-xs font-bold hover:border-accent hover:text-accent transition-all">+ Thêm Quy Tắc Hoàn Tiền</button>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Ngày bắt đầu chu kỳ hoàn tiền</label>
                       <input type="number" className="w-full p-3 border rounded-xl dark:bg-slate-700" value={editing.cashbackCycleStartDay || 1} onChange={e => setEditing({...editing, cashbackCycleStartDay: parseInt(e.target.value)})} />
                    </div>
                  </div>
                )}
                <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl">Lưu Thay Đổi</button>
             </form>
          </Modal>
        )}
      </div>
    );
  };

  // --- Module 2: Transaction Groups ---
  const GroupManager = () => {
    const [editing, setEditing] = useState<TransactionGroup | null>(null);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Nhóm Giao Dịch</h2>
          <button onClick={() => setEditing({ id: Date.now().toString(), name: '', type: TransactionType.EXPENSE, icon: 'Tag', color: '#64748b' })} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold">+ Thêm Nhóm</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
           {data.transactionGroups.map(g => {
             const Icon = IconMap[g.icon] || Tag;
             return (
               <div key={g.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 flex flex-col items-center group relative shadow-sm hover:shadow-lg transition-all">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(g)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl"><Edit2 size={14}/></button>
                    <button onClick={() => { if(confirm("Xóa nhóm này?")) setData(p => ({...p, transactionGroups: p.transactionGroups.filter(x => x.id !== g.id)})); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-xl"><Trash2 size={14}/></button>
                  </div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl" style={{backgroundColor: g.color}}><Icon size={32}/></div>
                  <h4 className="font-black text-sm dark:text-white text-center">{g.name}</h4>
                  <span className={`text-[10px] mt-2 px-3 py-1 rounded-full font-black uppercase tracking-tighter ${g.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>{g.type === TransactionType.EXPENSE ? 'Chi' : 'Thu'}</span>
               </div>
             );
           })}
        </div>
        {editing && (
          <Modal title="Thiết lập nhóm" isOpen={true} onClose={() => setEditing(null)}>
             <form onSubmit={(e) => {
               e.preventDefault();
               setData(prev => ({ ...prev, transactionGroups: prev.transactionGroups.find(x => x.id === editing.id) ? prev.transactionGroups.map(x => x.id === editing.id ? editing : x) : [...prev.transactionGroups, editing] }));
               setEditing(null);
             }} className="space-y-4">
                <input required placeholder="Tên nhóm (VD: Ăn uống, Giải trí...)" className="w-full p-4 border rounded-2xl dark:bg-slate-700 dark:text-white font-bold" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-2xl p-1">
                   {Object.values(TransactionType).map(t => (
                     <button key={t} type="button" onClick={() => setEditing({...editing, type: t})} className={`flex-1 py-3 rounded-xl text-sm font-black ${editing.type === t ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>{t === TransactionType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'}</button>
                   ))}
                </div>
                <div className="grid grid-cols-5 gap-3">
                   {Object.keys(IconMap).map(i => {
                     const Icon = IconMap[i];
                     return <button key={i} type="button" onClick={() => setEditing({...editing, icon: i})} className={`p-3 border-2 rounded-2xl flex items-center justify-center transition-all ${editing.icon === i ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-white dark:bg-slate-800'}`}><Icon size={24}/></button>;
                   })}
                </div>
                <div className="flex gap-2 flex-wrap">
                   {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#0f172a', '#1e293b'].map(c => (
                     <button key={c} type="button" onClick={() => setEditing({...editing, color: c})} className={`w-10 h-10 rounded-full border-4 ${editing.color === c ? 'border-gray-300' : 'border-transparent shadow-sm'}`} style={{backgroundColor: c}} />
                   ))}
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl">Lưu Nhóm</button>
             </form>
          </Modal>
        )}
      </div>
    );
  };

  // --- Module 4: Calendar View ---
  const CalendarManager = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [mode, setMode] = useState<'day' | 'month' | 'year'>('month');

    const filteredTransactions = useMemo(() => {
      return data.transactions.filter(t => {
        const d = new Date(t.date);
        const matchWallet = globalWalletFilter === 'ALL' || t.walletId === globalWalletFilter;
        if (mode === 'day') return d.toDateString() === viewDate.toDateString() && matchWallet;
        if (mode === 'month') return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear() && matchWallet;
        if (mode === 'year') return d.getFullYear() === viewDate.getFullYear() && matchWallet;
        return matchWallet;
      });
    }, [data.transactions, viewDate, mode, globalWalletFilter]);

    const stats = useMemo(() => {
      const exp = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t)=>s+t.amount,0);
      const inc = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s,t)=>s+t.amount,0);
      const cb = filteredTransactions.reduce((s,t)=>s+t.cashbackAmount,0);
      return { exp, inc, cb };
    }, [filteredTransactions]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-3xl font-black dark:text-white tracking-tight">
                {mode === 'month' ? `Tháng ${viewDate.getMonth()+1}/${viewDate.getFullYear()}` : mode === 'day' ? viewDate.toLocaleDateString('vi-VN') : `Năm ${viewDate.getFullYear()}`}
              </h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Lịch giao dịch & Biến động</p>
           </div>
           <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-2xl w-full md:w-auto">
              {['day', 'month', 'year'].map(m => (
                <button key={m} onClick={() => setMode(m as any)} className={`flex-1 md:w-24 py-2 rounded-xl text-xs font-black uppercase transition-all ${mode === m ? 'bg-white shadow text-primary dark:bg-slate-600 dark:text-white' : 'text-gray-400'}`}>
                  {m === 'day' ? 'Ngày' : m === 'month' ? 'Tháng' : 'Năm'}
                </button>
              ))}
           </div>
        </div>

        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-sm">
           <button onClick={() => {
             const d = new Date(viewDate);
             if (mode === 'day') d.setDate(d.getDate() - 1);
             else if (mode === 'month') d.setMonth(d.getMonth() - 1);
             else d.setFullYear(d.getFullYear() - 1);
             setViewDate(d);
           }} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-gray-100 transition-colors"><ChevronLeft size={20}/></button>
           
           <div className="flex gap-8 md:gap-16">
              <div className="text-center">
                 <p className="text-[10px] font-black text-green-500 uppercase">Thu</p>
                 <p className="font-black dark:text-white">{formatCurrency(stats.inc)}</p>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-red-500 uppercase">Chi</p>
                 <p className="font-black dark:text-white">{formatCurrency(stats.exp)}</p>
              </div>
              <div className="text-center hidden md:block">
                 <p className="text-[10px] font-black text-orange-400 uppercase">Hoàn</p>
                 <p className="font-black dark:text-white">{formatCurrency(stats.cb)}</p>
              </div>
           </div>

           <button onClick={() => {
             const d = new Date(viewDate);
             if (mode === 'day') d.setDate(d.getDate() + 1);
             else if (mode === 'month') d.setMonth(d.getMonth() + 1);
             else d.setFullYear(d.getFullYear() + 1);
             setViewDate(d);
           }} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-gray-100 transition-colors"><ChevronRight size={20}/></button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 shadow-sm overflow-hidden">
           {filteredTransactions.length === 0 ? (
             <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">Không có dữ liệu</div>
           ) : (
             <div className="divide-y dark:divide-slate-700">
                {filteredTransactions.map(t => {
                   const g = data.transactionGroups.find(x => x.id === t.transactionGroupId);
                   const w = data.wallets.find(x => x.id === t.walletId);
                   const Icon = IconMap[g?.icon || 'Tag'] || Tag;
                   return (
                     <div key={t.id} onClick={() => setEditingTransaction(t)} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{backgroundColor: g?.color}}><Icon size={24}/></div>
                           <div>
                              <p className="font-black text-sm dark:text-white group-hover:text-accent transition-colors">{t.note || g?.name}</p>
                              <div className="flex gap-2 text-[10px] font-black text-gray-400 uppercase mt-0.5">
                                 <span>{t.date}</span>
                                 <span>• {w?.name}</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={`font-black ${t.type === TransactionType.EXPENSE ? 'text-gray-900 dark:text-white' : 'text-green-500'}`}>
                             {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                           </p>
                           {t.cashbackAmount > 0 && <p className="text-[10px] font-black text-orange-500">+{formatCurrency(t.cashbackAmount)} Hoàn tiền</p>}
                        </div>
                     </div>
                   );
                })}
             </div>
           )}
        </div>
      </div>
    );
  };

  // --- Module 5: Detailed Reports ---
  const ReportsManager = () => {
    const [range, setRange] = useState<'week' | 'month' | 'year' | 'custom'>('month');
    const [breakdownType, setBreakdownType] = useState<TransactionType>(TransactionType.EXPENSE);

    const filtered = useMemo(() => {
      const now = new Date();
      return data.transactions.filter(t => {
        const d = new Date(t.date);
        const matchWallet = globalWalletFilter === 'ALL' || t.walletId === globalWalletFilter;
        if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && matchWallet;
        if (range === 'year') return d.getFullYear() === now.getFullYear() && matchWallet;
        if (range === 'week') {
           const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
           return d >= weekAgo && matchWallet;
        }
        return matchWallet;
      });
    }, [data.transactions, range, globalWalletFilter]);

    const statsByGroup = useMemo(() => {
      const groups = data.transactionGroups.filter(g => g.type === breakdownType);
      const total = filtered.filter(t => t.type === breakdownType).reduce((s,t) => s+t.amount, 0);
      return groups.map(g => {
        const amount = filtered.filter(t => t.transactionGroupId === g.id).reduce((s,t) => s+t.amount, 0);
        return { ...g, amount, percent: total > 0 ? (amount/total)*100 : 0 };
      }).filter(g => g.amount > 0).sort((a,b) => b.amount - a.amount);
    }, [filtered, breakdownType, data.transactionGroups]);

    return (
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-4xl font-black dark:text-white tracking-tighter">Báo cáo phân tích</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Trực quan hóa tài chính</p>
           </div>
           <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-2xl w-full md:w-auto">
              {['week', 'month', 'year'].map(r => (
                <button key={r} onClick={() => setRange(r as any)} className={`flex-1 md:w-28 py-2 rounded-xl text-xs font-black uppercase transition-all ${range === r ? 'bg-white shadow text-primary dark:bg-slate-600 dark:text-white' : 'text-gray-400'}`}>{r}</button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-sm border dark:border-slate-700">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="font-black text-xl tracking-tight">Cơ cấu {breakdownType === TransactionType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'}</h3>
                 <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
                    <button onClick={() => setBreakdownType(TransactionType.EXPENSE)} className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${breakdownType === TransactionType.EXPENSE ? 'bg-red-500 text-white' : 'text-gray-400'}`}>CHI</button>
                    <button onClick={() => setBreakdownType(TransactionType.INCOME)} className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${breakdownType === TransactionType.INCOME ? 'bg-green-500 text-white' : 'text-gray-400'}`}>THU</button>
                 </div>
              </div>
              <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={statsByGroup} innerRadius={70} outerRadius={95} dataKey="amount" paddingAngle={5}>
                          {statsByGroup.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                       </Pie>
                       <Tooltip 
                          contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                          formatter={(v) => formatCurrency(v as number)} 
                        />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-8 space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                 {statsByGroup.map(g => (
                   <div key={g.id}>
                      <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: g.color}}></div>
                            <span className="text-sm font-bold dark:text-gray-300">{g.name}</span>
                         </div>
                         <div className="text-right">
                           <span className="text-sm font-black dark:text-white block">{formatCurrency(g.amount)}</span>
                           <span className="text-[10px] font-black text-gray-400">{g.percent.toFixed(1)}%</span>
                         </div>
                      </div>
                      <div className="w-full h-1.5 bg-gray-50 dark:bg-slate-700 rounded-full overflow-hidden">
                         <div className="h-full rounded-full transition-all duration-1000" style={{backgroundColor: g.color, width: `${g.percent}%`}}></div>
                      </div>
                   </div>
                 ))}
                 {statsByGroup.length === 0 && <p className="text-center text-gray-400 py-10 font-bold uppercase tracking-widest text-xs">Chưa có dữ liệu</p>}
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary via-slate-800 to-primary p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent rounded-full opacity-20 blur-3xl group-hover:scale-125 transition-all duration-700"></div>
                 <h3 className="text-xs font-black opacity-50 uppercase tracking-[0.2em] mb-4">Tổng quan tài chính</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                       <p className="text-[10px] opacity-60 mb-1 uppercase font-black">Tổng chi</p>
                       <p className="text-4xl font-black">{formatCurrency(filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t)=>s+t.amount,0))}</p>
                    </div>
                    <div>
                       <p className="text-[10px] opacity-60 mb-1 uppercase font-black text-orange-400">Hoàn tiền kỳ này</p>
                       <p className="text-4xl font-black text-orange-400">+{formatCurrency(filtered.reduce((s,t)=>s+t.cashbackAmount,0))}</p>
                    </div>
                 </div>
                 <div className="mt-8 pt-8 border-t border-white/10">
                    <p className="text-[10px] opacity-60 mb-1 uppercase font-black">Thu nhập ròng</p>
                    <p className="text-2xl font-black text-green-400">+{formatCurrency(filtered.filter(t => t.type === TransactionType.INCOME).reduce((s,t)=>s+t.amount,0))}</p>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 shadow-sm h-72">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={statsByGroup}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: 'rgba(0,0,0,0.02)'}} 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                         {statsByGroup.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>
    );
  };

  // --- Main Sidebar & Layout ---
  const Sidebar = () => (
    <div className="w-20 md:w-80 bg-primary text-white h-screen fixed top-0 left-0 flex flex-col shadow-2xl z-20 border-r border-white/5">
       <div className="h-24 flex items-center gap-4 px-8 border-b border-white/5">
          <div className="p-3 bg-accent rounded-2xl shadow-lg shadow-accent/20"><Banknote size={28}/></div>
          <div className="hidden md:block">
            <span className="font-black text-2xl tracking-tighter uppercase italic block leading-none">SmartSpend</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Quản lý chuyên nghiệp</span>
          </div>
       </div>
       <nav className="flex-1 p-5 space-y-3 mt-4 overflow-y-auto custom-scrollbar">
          {[
            { id: 'wallets', label: 'Ví & Thẻ', icon: Wallet },
            { id: 'groups', label: 'Nhóm chi tiêu', icon: List },
            { id: 'transactions', label: 'Giao dịch', icon: Receipt },
            { id: 'calendar', label: 'Lịch tài chính', icon: CalendarIcon },
            { id: 'reports', label: 'Báo cáo thông minh', icon: BarChart3 },
            { id: 'cashback', label: 'Thống kê hoàn', icon: PiggyBank },
            { id: 'settings', label: 'Cài đặt hệ thống', icon: SettingsIcon },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${activeTab === item.id ? 'bg-accent shadow-xl shadow-accent/30 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
               <item.icon size={22} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}/>
               <span className="hidden md:block font-bold text-sm tracking-tight">{item.label}</span>
               {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
            </button>
          ))}
       </nav>
       <div className="p-6">
          <button onClick={() => setData({...data, darkMode: !data.darkMode})} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] text-slate-500 hover:text-white transition-all border border-white/5">
             <div className="flex items-center gap-3">{data.darkMode ? <Sun size={20}/> : <Moon size={20}/>} <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em]">{data.darkMode ? 'Sáng' : 'Tối'}</span></div>
          </button>
       </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 font-sans selection:bg-accent selection:text-white">
       <Sidebar />
       <main className="flex-1 ml-20 md:ml-80 p-6 md:p-14 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-12">
             {/* Header Bar */}
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                  <LayoutDashboard size={14}/> <span>Dashboard</span> <ArrowRight size={10}/> <span className="text-accent">{activeTab}</span>
                </div>
                <div className="flex gap-4">
                  <div className="relative group">
                    <select className="appearance-none bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl px-6 py-3 pr-10 text-xs font-black shadow-sm dark:text-white outline-none hover:border-accent transition-all cursor-pointer" value={globalWalletFilter} onChange={e => setGlobalWalletFilter(e.target.value)}>
                      <option value="ALL">Tất cả ví</option>
                      {data.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-accent"><ChevronDown size={14}/></div>
                  </div>
                  <button onClick={() => setShowAddTransaction(true)} className="bg-accent text-white p-3.5 rounded-2xl shadow-2xl shadow-accent/40 hover:rotate-90 hover:scale-110 active:scale-95 transition-all"><Plus size={24}/></button>
                </div>
             </div>

             {activeTab === 'transactions' && (
               <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-700 group hover:shadow-xl transition-all">
                        <div className="flex justify-between mb-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tổng chi</span><TrendingDown className="text-red-500" size={16}/></div>
                        <p className="text-4xl font-black text-red-500 tracking-tighter">{formatCurrency(data.transactions.filter(t => t.type === TransactionType.EXPENSE && (globalWalletFilter==='ALL' || t.walletId===globalWalletFilter)).reduce((s,t)=>s+t.amount,0))}</p>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-700 group hover:shadow-xl transition-all">
                        <div className="flex justify-between mb-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tổng thu</span><TrendingUp className="text-green-500" size={16}/></div>
                        <p className="text-4xl font-black text-green-500 tracking-tighter">{formatCurrency(data.transactions.filter(t => t.type === TransactionType.INCOME && (globalWalletFilter==='ALL' || t.walletId===globalWalletFilter)).reduce((s,t)=>s+t.amount,0))}</p>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-700 group hover:shadow-xl transition-all">
                        <div className="flex justify-between mb-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tổng hoàn tiền</span><PiggyBank className="text-orange-400" size={16}/></div>
                        <p className="text-4xl font-black text-orange-400 tracking-tighter">+{formatCurrency(data.transactions.filter(t => (globalWalletFilter==='ALL' || t.walletId===globalWalletFilter)).reduce((s,t)=>s+t.cashbackAmount,0))}</p>
                     </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
                     <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50/30 dark:bg-slate-900/30">
                        <h3 className="font-black text-xl tracking-tight">Giao dịch mới nhất</h3>
                        <Filter size={18} className="text-gray-400" />
                     </div>
                     <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-slate-700/30 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           <tr>
                              <th className="p-8">Thời gian</th>
                              <th className="p-8">Mô tả chi tiết</th>
                              <th className="p-8 text-right">Số tiền</th>
                              <th className="p-8 text-right">Hoàn</th>
                              <th className="p-8"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700/50">
                           {data.transactions.filter(t => globalWalletFilter==='ALL' || t.walletId===globalWalletFilter).slice(0, 15).map(t => {
                             const g = data.transactionGroups.find(x => x.id === t.transactionGroupId);
                             const w = data.wallets.find(x => x.id === t.walletId);
                             const Icon = IconMap[g?.icon || 'Tag'] || Tag;
                             return (
                               <tr key={t.id} onClick={() => setEditingTransaction(t)} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/20 transition-all group cursor-pointer">
                                  <td className="p-8 text-xs font-bold text-gray-400">{t.date}</td>
                                  <td className="p-8">
                                     <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-black/5" style={{backgroundColor: g?.color}}><Icon size={24}/></div>
                                        <div>
                                          <p className="font-black text-sm dark:text-white group-hover:text-accent transition-colors">{t.note || g?.name}</p>
                                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{w?.name} • {g?.name}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className={`p-8 text-right font-black ${t.type === TransactionType.EXPENSE ? 'text-gray-900 dark:text-white' : 'text-green-500'}`}>
                                    {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                                  </td>
                                  <td className="p-8 text-right">
                                     {t.cashbackAmount > 0 && <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-[10px] font-black tracking-tight">+{formatCurrency(t.cashbackAmount)}</span>}
                                  </td>
                                  <td className="p-8 text-center" onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }}>
                                     <button className="p-3 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-slate-700 rounded-xl"><Trash2 size={16}/></button>
                                  </td>
                                </tr>
                             );
                           })}
                        </tbody>
                     </table>
                     {data.transactions.length === 0 && <div className="p-32 text-center text-gray-300 font-black uppercase tracking-widest">Không có giao dịch nào</div>}
                  </div>
               </div>
             )}

             {activeTab === 'wallets' && <WalletManager />}
             {activeTab === 'groups' && <GroupManager />}
             {activeTab === 'calendar' && <CalendarManager />}
             {activeTab === 'reports' && <ReportsManager />}
             
             {activeTab === 'cashback' && (
               <div className="space-y-12">
                  <h2 className="text-4xl font-black dark:text-white tracking-tighter uppercase italic">Hiệu quả hoàn tiền</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white dark:bg-slate-800 p-12 rounded-[3.5rem] border dark:border-slate-700 flex justify-between items-center shadow-sm">
                        <div>
                           <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-2">Tổng tiền đã hoàn</p>
                           <p className="text-5xl font-black dark:text-white tracking-tight">{formatCurrency(data.transactions.reduce((s,t)=>s+t.cashbackAmount,0))}</p>
                        </div>
                        <div className="p-6 bg-orange-50 dark:bg-orange-900/20 text-orange-400 rounded-3xl"><PiggyBank size={64}/></div>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-12 rounded-[3.5rem] border dark:border-slate-700 flex justify-between items-center shadow-sm">
                        <div>
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Tổng chi qua thẻ</p>
                           <p className="text-5xl font-black dark:text-white tracking-tight">{formatCurrency(data.transactions.filter(t => data.wallets.find(w => w.id === t.walletId)?.type === WalletType.CREDIT).reduce((s,t)=>s+t.amount,0))}</p>
                        </div>
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 text-blue-400 rounded-3xl"><CreditCard size={64}/></div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h3 className="font-black text-2xl tracking-tight px-4">Xếp hạng hoàn tiền theo thẻ</h3>
                     <div className="grid grid-cols-1 gap-4">
                        {data.wallets.filter(w => w.type === WalletType.CREDIT).map(w => {
                           const spent = data.transactions.filter(t => t.walletId === w.id).reduce((s,t) => s+t.amount, 0);
                           const cb = data.transactions.filter(t => t.walletId === w.id).reduce((s,t) => s+t.cashbackAmount, 0);
                           const efficiency = spent > 0 ? (cb / spent) * 100 : 0;
                           return (
                              <div key={w.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-8 group">
                                 <div className="flex items-center gap-6 flex-1">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-accent transition-colors"><CreditCard size={32}/></div>
                                    <div>
                                       <p className="font-black text-lg dark:text-white">{w.name}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                             <div className="h-full bg-accent" style={{width: `${Math.min(efficiency * 10, 100)}%`}}></div>
                                          </div>
                                          <span className="text-[10px] font-black text-accent">{efficiency.toFixed(1)}% Hiệu suất</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex gap-12 text-right">
                                    <div className="space-y-1">
                                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đã chi</p>
                                       <p className="font-black text-xl">{formatCurrency(spent)}</p>
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Nhận lại</p>
                                       <p className="font-black text-xl text-orange-500">+{formatCurrency(cb)}</p>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'settings' && (
               <div className="max-w-3xl mx-auto space-y-12">
                  <div className="text-center space-y-4">
                     <h2 className="text-5xl font-black dark:text-white tracking-tighter uppercase italic italic">Hồ sơ cá nhân</h2>
                     <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em]">Thiết lập trải nghiệm người dùng</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border dark:border-slate-700 space-y-8 shadow-sm">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên hiển thị chuyên nghiệp</label>
                        <input className="w-full p-5 border-2 border-gray-100 dark:border-slate-700 rounded-3xl dark:bg-slate-700 dark:text-white font-black text-lg outline-none focus:border-accent" value={data.userName} onChange={e => setData({...data, userName: e.target.value})} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn vị tiền tệ chính</label>
                        <select className="w-full p-5 border-2 border-gray-100 dark:border-slate-700 rounded-3xl dark:bg-slate-700 dark:text-white font-black text-lg outline-none focus:border-accent" value={data.currency} onChange={e => setData({...data, currency: e.target.value})}>
                           <option value="VND">Việt Nam Đồng (VND)</option>
                           <option value="USD">Đô la Mỹ (USD)</option>
                        </select>
                     </div>
                     <div className="pt-8 border-t dark:border-slate-700 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-black text-sm text-gray-800 dark:text-white">Toàn bộ dữ liệu (Local Storage)</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Bao gồm 90 ngày Mock Data & Lịch sử giao dịch</p>
                        </div>
                        <button onClick={() => { if(confirm('Hành động này sẽ xóa toàn bộ 90 ngày Mock Data và cài đặt hiện tại. Xác nhận?')) { localStorage.clear(); window.location.reload(); } }} className="px-8 py-3 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Đặt lại hệ thống</button>
                     </div>
                  </div>
               </div>
             )}
          </div>
       </main>

       {/* Modals */}
       <Modal title="Thêm Giao Dịch Mới" isOpen={showAddTransaction} onClose={() => setShowAddTransaction(false)}>
          <TransactionForm onClose={() => setShowAddTransaction(false)} />
       </Modal>
       <Modal title="Chỉnh sửa giao dịch" isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)}>
          {editingTransaction && <TransactionForm transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />}
       </Modal>
    </div>
  );
}

const ChevronDown = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
