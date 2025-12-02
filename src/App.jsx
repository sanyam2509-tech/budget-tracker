import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  IndianRupee, 
  Calendar, 
  Tag, 
  PieChart, 
  Filter,
  X,
  Moon,
  Sun,
  Sparkles,
  Loader2,
  Lightbulb
} from 'lucide-react';

// --- Utility Components ---

const Card = ({ children, className = "", isDarkMode }) => (
  <div className={`rounded-2xl shadow-sm border transition-colors duration-200 ${
    isDarkMode 
      ? 'bg-slate-800 border-slate-700' 
      : 'bg-white border-slate-100'
  } ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", isDarkMode, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-md shadow-indigo-200",
    secondary: isDarkMode 
      ? "bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 focus:ring-slate-500"
      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-200",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    ai: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-md shadow-fuchsia-200",
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Main Application ---

export default function App() {
  // State
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // AI State
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
  const [smartAddText, setSmartAddText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'General',
    date: new Date().toISOString().split('T')[0]
  });

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Load data from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('budget-tracker-transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    } else {
      // Dummy data for first-time users
      setTransactions([
        { id: 1, description: 'Freelance Project', amount: 15000, type: 'income', category: 'Work', date: '2023-10-25' },
        { id: 2, description: 'Grocery Run', amount: 2450, type: 'expense', category: 'Food', date: '2023-10-26' },
        { id: 3, description: 'House Rent', amount: 18000, type: 'expense', category: 'Housing', date: '2023-11-01' },
      ]);
    }
    
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Save data to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('budget-tracker-transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const balance = totalIncome - totalExpense;

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const newTransaction = {
      id: Date.now(),
      description: formData.description,
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date
    };

    setTransactions([newTransaction, ...transactions]);
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: 'General',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      // maximumFractionDigits: 0,  <-- REMOVE OR COMMENT OUT THIS LINE
    }).format(amount);
  };

  // --- Gemini API Functions ---

  const handleSmartAddSubmit = async (e) => {
    e.preventDefault();
    if (!smartAddText.trim()) return;

    setIsAiLoading(true);
    try {
      const prompt = `Extract transaction details from the text: "${smartAddText}". 
      Current date is ${new Date().toISOString().split('T')[0]}. 
      Return valid JSON only (no markdown formatting) with keys: 
      "description" (string), 
      "amount" (number), 
      "type" ("income" or "expense"), 
      "category" (string from list: General, Food, Housing, Transportation, Entertainment, Shopping, Work, Health), 
      "date" (YYYY-MM-DD).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
        }
      );

      const data = await response.json();
      const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (extractedText) {
        const parsedData = JSON.parse(extractedText);
        setFormData({
          description: parsedData.description || smartAddText,
          amount: parsedData.amount || '',
          type: parsedData.type || 'expense',
          category: parsedData.category || 'General',
          date: parsedData.date || new Date().toISOString().split('T')[0]
        });
        
        setIsSmartAddOpen(false);
        setSmartAddText('');
        setIsModalOpen(true); // Open the main modal for review
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Couldn't process the text. Please try again or enter manually.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateInsights = async () => {
    setIsInsightLoading(true);
    try {
      const recentTransactions = transactions.slice(0, 15); // Send last 15 to avoid token limits
      const prompt = `Analyze these recent financial transactions and provide a friendly financial summary and 2-3 specific, actionable tips (bullet points) for the user. 
      Focus on spending patterns, biggest expenses, or savings opportunities. Keep it under 100 words.
      Use Indian Rupees (₹) for currency.
      
      Transactions Data: ${JSON.stringify(recentTransactions)}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
        }
      );

      const data = await response.json();
      const insightText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiInsights(insightText);

    } catch (error) {
      console.error("Insight Error:", error);
    } finally {
      setIsInsightLoading(false);
    }
  };


  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  // Calculate category breakdown for simple visualization
  const getCategoryBreakdown = () => {
    const categories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
    });
    
    // Sort and take top 4
    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
      }));
  };

  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className={`min-h-screen font-sans pb-12 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Header */}
      <div className="bg-indigo-600 text-white pb-24 pt-8 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">BudgetTracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-indigo-100 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="text-indigo-100 hover:text-white transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center border border-indigo-400">
                <span className="font-medium text-sm">JD</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Shifted up to overlap header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Balance */}
          <Card isDarkMode={isDarkMode} className="p-6 border-l-4 border-l-indigo-500">
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Balance</p>
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(balance)}</h2>
            <div className={`mt-4 text-sm flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <PieChart className="w-4 h-4" />
              <span>Available funds</span>
            </div>
          </Card>

          {/* Income */}
          <Card isDarkMode={isDarkMode} className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Income</p>
                <h2 className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</h2>
              </div>
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </Card>

          {/* Expenses */}
          <Card isDarkMode={isDarkMode} className="p-6 border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Expenses</p>
                <h2 className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpense)}</h2>
              </div>
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-rose-500/10' : 'bg-rose-100'}`}>
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Transaction List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Transactions</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className={`flex rounded-lg p-1 shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                   {['all', 'income', 'expense'].map(type => (
                     <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                          filterType === type 
                            ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-400'
                        }`}
                     >
                       {type}
                     </button>
                   ))}
                </div>
                
                {/* AI Smart Add Button */}
                <Button variant="ai" onClick={() => setIsSmartAddOpen(true)}>
                  <Sparkles className="w-4 h-4" />
                  Smart Add
                </Button>

                <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4" />
                  Add New
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border border-dashed ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <Tag className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No transactions found.</p>
                </div>
              ) : (
                filteredTransactions.map(transaction => (
                  <Card key={transaction.id} isDarkMode={isDarkMode} className="p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1 min-w-0">
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' 
                            ? (isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100')
                            : (isDarkMode ? 'bg-rose-500/20' : 'bg-rose-100')
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className={`w-5 h-5 ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`} />
                          ) : (
                            <TrendingDown className={`w-5 h-5 ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{transaction.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate">
                            <span className="flex items-center gap-1 shrink-0">
                              <Calendar className="w-3 h-3" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className={`px-1.5 py-0.5 rounded truncate ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <span className={`font-bold whitespace-nowrap ${
                          transaction.type === 'income' ? 'text-emerald-600' : (isDarkMode ? 'text-slate-200' : 'text-slate-900')
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                        <button 
                          onClick={() => deleteTransaction(transaction.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-all"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Analytics & Quick Stats */}
          <div className="space-y-6">
            
             {/* AI Insights Card */}
             <Card isDarkMode={isDarkMode} className="p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                 <Sparkles className="w-24 h-24" />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <Lightbulb className="w-5 h-5 text-fuchsia-500" />
                  AI Insights
                </h3>
                <button 
                  onClick={generateInsights}
                  disabled={isInsightLoading}
                  className="text-xs font-medium text-fuchsia-600 hover:text-fuchsia-700 disabled:opacity-50"
                >
                  {isInsightLoading ? 'Analyzing...' : 'Refresh'}
                </button>
              </div>

              {isInsightLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
                  <p className="text-sm text-slate-400">Gemini is crunching the numbers...</p>
                </div>
              ) : aiInsights ? (
                <div className={`text-sm leading-relaxed whitespace-pre-line ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {aiInsights}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 mb-4">Get personalized tips based on your spending.</p>
                  <Button variant="ai" onClick={generateInsights} className="w-full">
                    <Sparkles className="w-4 h-4" />
                    Analyze Finances
                  </Button>
                </div>
              )}
            </Card>

            {/* Simple Spending Breakdown */}
            <Card isDarkMode={isDarkMode} className="p-6">
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                <PieChart className="w-5 h-5 text-indigo-500" />
                Spending Breakdown
              </h3>
              
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{cat.name}</span>
                        <span className="text-slate-500">{formatCurrency(cat.value)}</span>
                      </div>
                      <div className={`h-2 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                     <p className="text-xs text-center text-slate-500">Top expense categories this period</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Add expenses to see breakdown
                </div>
              )}
            </Card>

            {/* Quick Tips or Budget Status (Static for now) */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Budget Status</h3>
              <p className="text-indigo-100 text-sm mb-4">
                You've spent {formatCurrency(totalExpense)} so far. Keep tracking to stay on top of your finances!
              </p>
              <div className="w-full bg-white/20 h-1.5 rounded-full mb-2">
                <div className="bg-white h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-indigo-200 text-right">45% of monthly goal</p>
            </div>

          </div>
        </div>
      </div>

      {/* Smart Add Modal */}
      {isSmartAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
          <div className={`rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <Sparkles className="w-5 h-5 text-fuchsia-500" />
                Smart Add
              </h3>
              <button onClick={() => setIsSmartAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Type your transaction naturally. For example: <br/>
              <span className="italic text-indigo-500">"Spent 450 rupees on Pizza yesterday"</span>
            </p>
            
            <form onSubmit={handleSmartAddSubmit}>
              <textarea
                value={smartAddText}
                onChange={(e) => setSmartAddText(e.target.value)}
                placeholder="Describe your transaction..."
                className={`w-full p-4 rounded-xl border mb-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
                autoFocus
              />
              <div className="flex gap-3">
                 <Button variant="secondary" isDarkMode={isDarkMode} className="flex-1" type="button" onClick={() => setIsSmartAddOpen(false)}>
                  Cancel
                </Button>
                <Button variant="ai" type="submit" className="flex-1" disabled={isAiLoading || !smartAddText.trim()}>
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Process with AI
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
          <div className={`rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50/50'}`}>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Add Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    formData.type === 'income' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-500' 
                      : (isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    formData.type === 'expense' 
                      ? 'bg-rose-50 border-rose-200 text-rose-700 ring-1 ring-rose-500' 
                      : (isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                  }`}
                >
                  Expense
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Tag className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="description"
                    required
                    placeholder="e.g. Weekly Groceries"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <IndianRupee className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      name="amount"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <option value="General">General</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Housing">Housing</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Work">Work / Salary</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" isDarkMode={isDarkMode} className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Transaction
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}