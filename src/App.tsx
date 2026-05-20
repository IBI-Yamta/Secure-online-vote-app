import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // --- INITIALIZE ELECTION DATA ---
  const DEFAULT_CANDIDATES = [
    // President Candidates
    { id: 'pres_1', name: 'Comrade Yusuf Bello', post: 'President', association: 'NANS', votes: 0, color: 'bg-blue-600' },
    { id: 'pres_2', name: 'Chinwe Okeke', post: 'President', association: 'NANS', votes: 0, color: 'bg-emerald-600' },
    { id: 'pres_3', name: 'Amina Danjuma', post: 'President', association: 'NANS', votes: 0, color: 'bg-purple-600' },
    
    // Secretary General Candidates
    { id: 'sec_1', name: 'Ibrahim Musa', post: 'Secretary General', association: 'NANS', votes: 0, color: 'bg-amber-600' },
    { id: 'sec_2', name: 'Sarah Udoh', post: 'Secretary General', association: 'NANS', votes: 0, color: 'bg-pink-600' },
    
    // Treasurer Candidates
    { id: 'treas_1', name: 'Babajide Adebayo', post: 'Treasurer', association: 'NANS', votes: 0, color: 'bg-indigo-600' },
    { id: 'treas_2', name: 'Fatima Yusuf', post: 'Treasurer', association: 'NANS', votes: 0, color: 'bg-rose-600' }
  ];

  const POSITIONS = ['President', 'Secretary General', 'Treasurer'];

  // --- STATE MANAGEMENT ---
  const [voters, setVoters] = useState(() => {
    const saved = localStorage.getItem('evote_voters');
    return saved ? JSON.parse(saved) : [];
  });

  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('evote_candidates');
    return saved ? JSON.parse(saved) : DEFAULT_CANDIDATES;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('evote_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Theme support ('dark' or 'light')
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('evote_theme');
    return saved ? saved : 'dark';
  });

  // Navigation states: 'login' | 'register' | 'forgot' | 'first-login-reset' | 'dashboard' | 'admin'
  const [activeTab, setActiveTab] = useState(currentUser ? 'dashboard' : 'login');

  // Active Ballot Selections
  const [ballotSelections, setBallotSelections] = useState({
    'President': null,
    'Secretary General': null,
    'Treasurer': null
  });

  // Forms
  const [regForm, setRegForm] = useState({ name: '', id: '', email: '', dob: '' });
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [resetForm, setResetForm] = useState({ id: '', dob: '', newPassword: '' });
  const [firstResetForm, setFirstResetForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // Registration Results & Alerts
  const [generatedPass, setGeneratedPass] = useState('');
  const [alert, setAlert] = useState(null);
  const [confirmVoteModal, setConfirmVoteModal] = useState(false);

  // Status Check search query
  const [searchStatusQuery, setSearchStatusQuery] = useState('');
  const [searchedVoter, setSearchedVoter] = useState(null);

  // --- PERSIST TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('evote_voters', JSON.stringify(voters));
  }, [voters]);

  useEffect(() => {
    localStorage.setItem('evote_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('evote_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('evote_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('evote_current_user');
    }
  }, [currentUser]);

  // --- AUTO-LOCK LOGIC (5 MINUTES INACTIVITY) ---
  const timeoutIdRef = useRef(null);
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in milliseconds

  const triggerLogoutDueToInactivity = () => {
    if (currentUser) {
      handleLogout('Session expired due to 5 minutes of inactivity.');
    }
  };

  const resetInactivityTimer = () => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (currentUser) {
      timeoutIdRef.current = setTimeout(triggerLogoutDueToInactivity, INACTIVITY_LIMIT);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Listen to activity triggers
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetInactivityTimer));
      
      // Initialize timer
      resetInactivityTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      };
    }
  }, [currentUser]);

  // --- ALERTS TRIGGER HELPER ---
  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 6000);
  };

  // --- REGISTRATION ---
  const handleRegister = (e) => {
    e.preventDefault();
    const cleanId = regForm.id.trim().toUpperCase();
    
    if (!regForm.name || !regForm.id || !regForm.email || !regForm.dob) {
      return showAlert('Please fill out all registration fields.', 'error');
    }

    if (voters.some(v => v.id === cleanId)) {
      return showAlert('A student with this ID is already registered.', 'error');
    }

    // Auto-generate secure 6-character alpha-numeric password
    const passCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newVoter = {
      id: cleanId,
      name: regForm.name.trim(),
      email: regForm.email.trim().toLowerCase(),
      dob: regForm.dob,
      password: passCode,
      hasVoted: false,
      votedFor: null,
      receiptHash: '',
      timestamp: '',
      isFirstLogin: true
    };

    setVoters(prev => [...prev, newVoter]);
    setGeneratedPass(passCode);
    showAlert('Registration successful! Save your password securely.', 'success');
  };

  // --- LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    const targetId = loginForm.id.trim().toUpperCase();
    const user = voters.find(v => v.id === targetId && v.password === loginForm.password);

    if (user) {
      setCurrentUser(user);
      setLoginForm({ id: '', password: '' });
      if (user.isFirstLogin) {
        setActiveTab('first-login-reset');
        showAlert('First-time login detected. Please customize your password.', 'info');
      } else {
        setActiveTab('dashboard');
        showAlert(`Authentication successful. Welcome, ${user.name}.`, 'success');
      }
    } else {
      showAlert('Invalid Student ID or Password.', 'error');
    }
  };

  // --- FIRST LOGIN PASSWORD CUSTOMIZATION ---
  const handleFirstLoginResetSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (firstResetForm.currentPassword !== currentUser.password) {
      return showAlert('Verification failed: The generated key does not match.', 'error');
    }

    if (firstResetForm.newPassword !== firstResetForm.confirmPassword) {
      return showAlert('Mismatch: New passwords do not match.', 'error');
    }

    if (firstResetForm.newPassword.length < 4) {
      return showAlert('Security issue: Desired password must be at least 4 characters.', 'error');
    }

    // Update inside master database array
    const updatedVoters = voters.map(v => {
      if (v.id === currentUser.id) {
        return {
          ...v,
          password: firstResetForm.newPassword,
          isFirstLogin: false
        };
      }
      return v;
    });
    setVoters(updatedVoters);

    // Update active user context
    const updatedUser = {
      ...currentUser,
      password: firstResetForm.newPassword,
      isFirstLogin: false
    };
    setCurrentUser(updatedUser);

    setActiveTab('dashboard');
    setFirstResetForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showAlert('Password successfully customized! Welcome to your ballot board.', 'success');
  };

  // --- PASSWORD RESET (IDENTITY RECOVERY via DOB) ---
  const handleResetPassword = (e) => {
    e.preventDefault();
    const targetId = resetForm.id.trim().toUpperCase();
    const voterIndex = voters.findIndex(v => v.id === targetId && v.dob === resetForm.dob);

    if (voterIndex !== -1) {
      const updatedVoters = [...voters];
      updatedVoters[voterIndex].password = resetForm.newPassword;
      setVoters(updatedVoters);
      
      showAlert('Password updated successfully! Please log in with your new password.', 'success');
      setActiveTab('login');
      setResetForm({ id: '', dob: '', newPassword: '' });
    } else {
      showAlert('Identity verification failed. Information does not match database.', 'error');
    }
  };

  // --- SELECTING CANDIDATE FOR BALLOT ---
  const handleSelectCandidate = (pos, candidate) => {
    setBallotSelections(prev => ({
      ...prev,
      [pos]: candidate
    }));
  };

  // --- CASTING BALLOT ---
  const processVote = () => {
    if (!currentUser) return;
    if (currentUser.hasVoted) {
      showAlert('System Error: You have already cast a vote!', 'error');
      setConfirmVoteModal(false);
      return;
    }

    // Generate cryptographic security hash code (SHA256 Simulator)
    const receiptCode = 'SEC-REC-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.floor(Math.random() * 9000 + 1000);
    const voteTime = new Date().toLocaleString();

    // 1. Update Candidate counts for all selected choices
    setCandidates(prev => prev.map(cand => {
      const selectedForPost = ballotSelections[cand.post];
      if (selectedForPost && selectedForPost.id === cand.id) {
        return { ...cand, votes: cand.votes + 1 };
      }
      return cand;
    }));

    // Generate formatted summary string for ballot choices
    const selectionsSummary = POSITIONS.map(pos => `${pos}: ${ballotSelections[pos]?.name || 'Abstained'}`).join(' | ');

    // 2. Mark voter as voted
    const updatedVoters = voters.map(v => {
      if (v.id === currentUser.id) {
        return { 
          ...v, 
          hasVoted: true, 
          votedFor: selectionsSummary,
          receiptHash: receiptCode,
          timestamp: voteTime
        };
      }
      return v;
    });
    setVoters(updatedVoters);

    // Update session context
    const sessionUser = { 
      ...currentUser, 
      hasVoted: true, 
      votedFor: selectionsSummary,
      receiptHash: receiptCode,
      timestamp: voteTime
    };
    setCurrentUser(sessionUser);

    setConfirmVoteModal(false);
    setBallotSelections({ 'President': null, 'Secretary General': null, 'Treasurer': null });
    showAlert('Consolidated ballot successfully registered. Thank you!', 'success');
  };

  // --- LOGOUT ---
  const handleLogout = (msg = 'Logged out successfully.') => {
    setCurrentUser(null);
    setActiveTab('login');
    showAlert(msg, 'info');
  };

  // --- STATUS CHECKER ---
  const handleCheckStatus = (e) => {
    e.preventDefault();
    const query = searchStatusQuery.trim().toUpperCase();
    const found = voters.find(v => v.id === query);
    
    if (found) {
      setSearchedVoter(found);
    } else {
      setSearchedVoter({ notFound: true, query });
    }
  };

  // --- DYNAMIC PDF RECEIPT GENERATOR ---
  const handleDownloadPDF = () => {
    if (!currentUser || !currentUser.hasVoted) return;

    const scriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    
    const generate = () => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a6'
        });

        // Design modern election receipt header
        doc.setFillColor(15, 23, 42); // Navy Slate
        doc.rect(0, 0, 105, 15, 'F');
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('SECURE VOTE SYSTEM - RECEIPT', 8, 10);

        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Timestamp: ${currentUser.timestamp}`, 8, 24);
        doc.text(`Polling Station: Web-based Sandbox Node`, 8, 29);
        doc.line(8, 31, 97, 31);

        doc.setFont('Helvetica', 'bold');
        doc.text('VOTER DETAILS', 8, 37);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Student Name: ${currentUser.name}`, 8, 42);
        doc.text(`Student ID: ${currentUser.id}`, 8, 47);
        doc.text(`Email: ${currentUser.email}`, 8, 52);
        
        doc.line(8, 56, 97, 56);
        doc.setFont('Helvetica', 'bold');
        doc.text('STATUS: VERIFIED & CAST', 8, 62);
        
        // Split positions safely for printing layout
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'normal');
        const choices = currentUser.votedFor.split(' | ');
        choices.forEach((choice, index) => {
          doc.text(choice, 8, 68 + (index * 4.5));
        });
        
        doc.line(8, 83, 97, 83);
        doc.setFontSize(7);
        doc.setFont('Courier', 'bold');
        doc.text(`SECURITY RECEIPT STRING:`, 8, 88);
        doc.text(`${currentUser.receiptHash}`, 8, 93);

        // Footer block
        doc.setFillColor(241, 245, 249);
        doc.rect(0, 105, 105, 45, 'F');
        doc.setFont('Helvetica', 'oblique');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 100, 100);
        doc.text('This receipt provides mathematical proof that your vote', 8, 114);
        doc.text('was verified and recorded in the Local Ballot Box.', 8, 118);
        doc.text('Powered by local sandbox environment - Secure Ledger Protocol', 8, 124);

        doc.save(`VOTE_RECEIPT_${currentUser.id}.pdf`);
        showAlert('PDF Receipt downloaded successfully!', 'success');
      } catch (err) {
        showAlert('Failed to generate PDF. Is network online for CDN loading?', 'error');
        console.error(err);
      }
    };

    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.onload = generate;
      script.onerror = () => showAlert('Error loading script library. Try again.', 'error');
      document.body.appendChild(script);
    } else {
      generate();
    }
  };

  // --- SEED DUMMY DATA FOR DEMO PURPOSES ---
  const handleSeedDemoData = () => {
    const demoVoters = [
      { id: 'U15/CS/1001', name: 'Kabiru Adamu', email: 'k.adamu@uni.edu.ng', dob: '2001-05-12', password: 'DEMO1', hasVoted: true, votedFor: 'President: Comrade Yusuf Bello | Secretary General: Sarah Udoh | Treasurer: Babajide Adebayo', receiptHash: 'SEC-REC-DEMO-KABIRU', timestamp: '5/18/2026, 11:30 AM', isFirstLogin: false },
      { id: 'U15/CS/1002', name: 'Blessing Paul', email: 'b.paul@uni.edu.ng', dob: '2002-11-20', password: 'DEMO2', hasVoted: true, votedFor: 'President: Chinwe Okeke | Secretary General: Ibrahim Musa | Treasurer: Fatima Yusuf', receiptHash: 'SEC-REC-DEMO-BLESSING', timestamp: '5/18/2026, 12:15 PM', isFirstLogin: false },
      { id: 'U15/CS/1003', name: 'Mustapha Haruna', email: 'm.haruna@uni.edu.ng', dob: '2000-01-15', password: 'DEMO3', hasVoted: false, votedFor: null, receiptHash: '', timestamp: '', isFirstLogin: false }
    ];

    const demoCandidates = [
      { id: 'pres_1', name: 'Comrade Yusuf Bello', post: 'President', association: 'NANS', votes: 1, color: 'bg-blue-600' },
      { id: 'pres_2', name: 'Chinwe Okeke', post: 'President', association: 'NANS', votes: 1, color: 'bg-emerald-600' },
      { id: 'pres_3', name: 'Amina Danjuma', post: 'President', association: 'NANS', votes: 0, color: 'bg-purple-600' },
      { id: 'sec_1', name: 'Ibrahim Musa', post: 'Secretary General', association: 'NANS', votes: 1, color: 'bg-amber-600' },
      { id: 'sec_2', name: 'Sarah Udoh', post: 'Secretary General', association: 'NANS', votes: 1, color: 'bg-pink-600' },
      { id: 'treas_1', name: 'Babajide Adebayo', post: 'Treasurer', association: 'NANS', votes: 1, color: 'bg-indigo-600' },
      { id: 'treas_2', name: 'Fatima Yusuf', post: 'Treasurer', association: 'NANS', votes: 1, color: 'bg-rose-600' }
    ];

    setVoters(demoVoters);
    setCandidates(demoCandidates);
    showAlert('Demo voters & candidates seeded to local database!', 'success');
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setVoters([]);
    setCandidates(DEFAULT_CANDIDATES);
    setCurrentUser(null);
    setActiveTab('login');
    showAlert('System storage fully reset to default state.', 'info');
  };

  // Determine if voter completed all positions on current draft ballot
  const isBallotComplete = Object.values(ballotSelections).every(selection => selection !== null);

  // --- DYNAMIC ADAPTIVE LIGHT/DARK STYLING DICTIONARY ---
  const isDark = theme === 'dark';
  const s = {
    bgMain: isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900',
    bgCard: isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-md',
    bgInput: isDark ? 'bg-slate-900 border-slate-800 focus:border-teal-500 text-slate-100' : 'bg-slate-50 border-slate-200 focus:border-teal-500 text-slate-900',
    textMain: isDark ? 'text-slate-100' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    borderMain: isDark ? 'border-slate-800' : 'border-slate-200',
    borderSub: isDark ? 'border-slate-900' : 'border-slate-100',
    bgHeader: isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    bgBanner: isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700',
    bgButtonSec: isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700',
    bgAlertSuccess: isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    bgAlertPending: isDark ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800',
    bgTableHead: isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500',
  };

  return (
    <div className={`min-h-screen ${s.bgMain} flex flex-col justify-between selection:bg-teal-500 selection:text-slate-900 transition-colors duration-200`}>
      
      {/* HEADER SECTION */}
      <header className={`${s.bgHeader} border-b py-4 px-6 sticky top-0 z-40 backdrop-blur-md transition-colors duration-200`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-teal-500 to-blue-600 p-2 rounded-lg text-slate-950">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">SECURE-VOTE</span>
              <p className={`text-[10px] ${s.textMuted} uppercase tracking-widest font-mono`}>Student Voting Node</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border transition-all ${s.bgButtonSec}`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? (
                // Sun Icon
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.46 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                // Moon Icon
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {currentUser && (
              <span className={`hidden md:inline-block text-xs px-3 py-1.5 rounded-full border ${s.bgBanner}`}>
                👤 Active ID: <strong className="text-teal-400 font-mono">{currentUser.id}</strong>
              </span>
            )}
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${activeTab === 'admin' ? 'bg-teal-500 border-teal-500 text-slate-950' : s.bgButtonSec}`}
            >
              📊 System Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* FLOATING ACTION NOTIFICATION BANNER */}
      {alert && (
        <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-50 animate-bounce">
          <div className={`p-4 rounded-xl shadow-xl flex items-start gap-3 border ${alert.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : alert.type === 'error' ? 'bg-red-950 border-red-500 text-red-300' : 'bg-blue-950 border-blue-500 text-blue-300'}`}>
            <div className="mt-0.5">
              {alert.type === 'success' ? (
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              )}
            </div>
            <div>
              <p className="font-bold text-sm">System Alert</p>
              <p className="text-xs opacity-90">{alert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* CORE CONTENT */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        
        {/* --- VIEW: LOGIN CARD --- */}
        {activeTab === 'login' && (
          <div className={`max-w-md mx-auto p-6 rounded-2xl border relative ${s.bgCard} transition-colors duration-200`}>
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-gradient-to-r from-teal-500 to-blue-500 text-[9px] text-slate-950 font-extrabold uppercase py-1 px-3 rounded-md tracking-wider">
              Secure Node Protocol
            </div>

            <div className="text-center mb-6">
              <h2 className={`text-2xl font-black ${s.textMain}`}>Voter Authentication</h2>
              <p className={`text-xs mt-1 ${s.textMuted}`}>Access your personalized, secure voter card and ballot box.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student Voter ID (NIN/Reg No)</label>
                <input 
                  type="text" 
                  value={loginForm.id} 
                  onChange={e => setLoginForm({ ...loginForm, id: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none transition text-sm font-mono placeholder-slate-400 border ${s.bgInput}`}
                  placeholder="E.G. U15/CS/1001" 
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Auto-Generated Password</label>
                <input 
                  type="password" 
                  value={loginForm.password} 
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none transition text-sm placeholder-slate-400 border ${s.bgInput}`}
                  placeholder="••••••••" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 p-3.5 rounded-xl font-bold transition duration-200 transform active:scale-[0.99] text-sm shadow-lg shadow-teal-500/20"
              >
                Authenticate Secret Keys
              </button>

              <div className={`flex justify-between text-xs text-teal-400 font-medium pt-3 border-t ${s.borderSub}`}>
                <button type="button" onClick={() => setActiveTab('register')} className="hover:text-teal-500 hover:underline transition">Register New Voter</button>
                <button type="button" onClick={() => setActiveTab('forgot')} className="hover:text-teal-500 hover:underline transition">Reset / Change Password</button>
              </div>
            </form>

            {/* Quick Status Checker Widget */}
            <div className={`mt-8 pt-6 border-t ${s.borderSub}`}>
              <h4 className={`text-xs font-bold uppercase tracking-widest mb-2.5 ${s.textMuted}`}>Instant Eligibility & Check-Vote Status</h4>
              <form onSubmit={handleCheckStatus} className="flex gap-2">
                <input 
                  type="text" 
                  value={searchStatusQuery}
                  onChange={e => setSearchStatusQuery(e.target.value)}
                  placeholder="Enter Voter ID..."
                  className={`px-3 py-2 text-xs rounded-lg flex-grow outline-none font-mono border ${s.bgInput}`}
                />
                <button type="submit" className={`text-xs px-4 py-2 rounded-lg font-semibold transition border ${s.bgButtonSec}`}>
                  Inspect
                </button>
              </form>

              {searchedVoter && (
                <div className={`mt-4 p-3 rounded-lg border text-xs animate-fadeIn ${s.bgCard}`}>
                  {searchedVoter.notFound ? (
                    <p className="text-red-500 font-medium">❌ No enrollment found for ID <strong className="font-mono">{searchedVoter.query}</strong>.</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-teal-500 font-bold">Voter Found: {searchedVoter.name}</p>
                      <p className={s.textMain}>ID: <span className="font-mono">{searchedVoter.id}</span></p>
                      <p className={s.textMain}>Status: {searchedVoter.hasVoted ? '✅ Vote securely registered' : '⚠️ Has not cast ballot'}</p>
                      {searchedVoter.hasVoted && (
                        <p className={`text-[10px] break-all font-mono ${s.textMuted}`}>Receipt Hash: {searchedVoter.receiptHash}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: REGISTRATION CARD --- */}
        {activeTab === 'register' && (
          <div className={`max-w-md mx-auto p-6 rounded-2xl border shadow-2xl ${s.bgCard} transition-colors duration-200`}>
            <div className="text-center mb-6">
              <h2 className={`text-2xl font-black ${s.textMain}`}>Voter Enrollment Portal</h2>
              <p className={`text-xs mt-1 ${s.textMuted}`}>Enroll as a certified student voter inside local secure ledger.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student Full Name</label>
                <input 
                  type="text" 
                  value={regForm.name} 
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                  placeholder="e.g. Ibrahim Abubakar" 
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student Unique ID / Registration No</label>
                <input 
                  type="text" 
                  value={regForm.id} 
                  onChange={e => setRegForm({ ...regForm, id: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm font-mono border ${s.bgInput}`}
                  placeholder="e.g. U15/CS/1001" 
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>School Email Address</label>
                <input 
                  type="email" 
                  value={regForm.email} 
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                  placeholder="e.g. student@university.edu.ng" 
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Date of Birth (Used for Verification)</label>
                <input 
                  type="date" 
                  value={regForm.dob} 
                  onChange={e => setRegForm({ ...regForm, dob: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-slate-950 p-3.5 rounded-xl font-bold transition duration-200 text-sm"
              >
                Enroll Voter & Generate Access Key
              </button>

              {generatedPass && (
                <div className="bg-teal-950/40 border border-teal-500/40 p-4 rounded-xl space-y-2 mt-4 animate-pulse">
                  <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">⚠️ CREDENTIALS REGISTERED</p>
                  <p className="text-xs text-slate-300">Your secure, randomly generated voting password is below. Write it down. It is not recoverable unless verified against Date of Birth.</p>
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${s.bgCard}`}>
                    <span className="font-mono text-lg font-black text-emerald-400 tracking-widest">{generatedPass}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPass);
                        showAlert('Password copied to clipboard!', 'success');
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-2.5 rounded font-mono border border-slate-700"
                    >
                      Copy Pass
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="button" 
                onClick={() => { setActiveTab('login'); setGeneratedPass(''); }} 
                className={`w-full text-center text-xs hover:text-teal-500 hover:underline block pt-2 ${s.textMuted}`}
              >
                Already have an ID? Back to Login
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: PASSWORD RESET (DOB CHECK) --- */}
        {activeTab === 'forgot' && (
          <div className={`max-w-md mx-auto p-6 rounded-2xl border shadow-2xl ${s.bgCard} transition-colors duration-200`}>
            <div className="text-center mb-6">
              <h2 className={`text-2xl font-black ${s.textMain}`}>Identity-based Password Reset</h2>
              <p className={`text-xs mt-1 ${s.textMuted}`}>Provide your Student ID and exact Date of Birth to establish a new password.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student ID</label>
                <input 
                  type="text" 
                  value={resetForm.id} 
                  onChange={e => setResetForm({ ...resetForm, id: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm font-mono border ${s.bgInput}`}
                  placeholder="E.G. U15/CS/1001" 
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Date of Birth</label>
                <input 
                  type="date" 
                  value={resetForm.dob} 
                  onChange={e => setResetForm({ ...resetForm, dob: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>New Desired Password</label>
                <input 
                  type="password" 
                  value={resetForm.newPassword} 
                  onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                  placeholder="Enter custom desired password" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-bold transition duration-200 text-sm"
              >
                Verify & Reset Password
              </button>

              <button 
                type="button" 
                onClick={() => { setActiveTab('login'); }} 
                className={`w-full text-center text-xs hover:text-teal-500 hover:underline block pt-2 ${s.textMuted}`}
              >
                Back to Login
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: FIRST LOGIN PASSWORD CUSTOMIZATION --- */}
        {activeTab === 'first-login-reset' && currentUser && (
          <div className={`max-w-md mx-auto p-6 rounded-2xl border shadow-2xl ${s.bgCard} transition-colors duration-200`}>
            <div className="text-center mb-6">
              <span className="bg-teal-500/10 text-teal-400 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border border-teal-500/30">
                Mandatory Security Setup
              </span>
              <h2 className={`text-2xl font-black mt-3 ${s.textMain}`}>Configure Password</h2>
              <p className={`text-xs mt-1 ${s.textMuted}`}>This is your first login. To secure your voting credentials, verify your generated access key and set up your customized password.</p>
            </div>

            <form onSubmit={handleFirstLoginResetSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Verify Generated Key</label>
                <input 
                  type="password" 
                  value={firstResetForm.currentPassword} 
                  onChange={e => setFirstResetForm({ ...firstResetForm, currentPassword: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm font-mono placeholder-slate-400 border ${s.bgInput}`}
                  placeholder="Paste your generated password key" 
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>New Desired Password</label>
                <input 
                  type="password" 
                  value={firstResetForm.newPassword} 
                  onChange={e => setFirstResetForm({ ...firstResetForm, newPassword: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm placeholder-slate-400 border ${s.bgInput}`}
                  placeholder="Enter custom desired password" 
                  required 
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Confirm Desired Password</label>
                <input 
                  type="password" 
                  value={firstResetForm.confirmPassword} 
                  onChange={e => setFirstResetForm({ ...firstResetForm, confirmPassword: e.target.value })} 
                  className={`w-full p-3 rounded-xl outline-none text-sm placeholder-slate-400 border ${s.bgInput}`}
                  placeholder="Re-enter custom desired password" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 p-3.5 rounded-xl font-bold transition duration-200 text-sm shadow-lg shadow-teal-500/20"
              >
                Secure Account & Continue
              </button>

              <button 
                type="button" 
                onClick={() => handleLogout('Setup cancelled. Please login to configure credentials.')} 
                className={`w-full text-center text-xs hover:text-teal-500 hover:underline block pt-2 ${s.textMuted}`}
              >
                Cancel & Sign Out
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: ACTIVE USER PANEL (DASHBOARD) --- */}
        {activeTab === 'dashboard' && currentUser && (
          <div className="space-y-6">
            
            {/* Top Voter Card Banner */}
            <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:justify-between md:items-center gap-6 relative overflow-hidden ${s.bgCard} transition-colors duration-200`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-1">
                <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border ${s.bgBanner}`}>
                  Verified Active Session
                </span>
                <h2 className={`text-2xl font-black pt-1.5 ${s.textMain}`}>{currentUser.name}</h2>
                <div className={`grid grid-cols-2 md:flex md:items-center gap-x-4 gap-y-1 text-xs font-mono ${s.textMuted}`}>
                  <span>ID: <strong className={s.textMain}>{currentUser.id}</strong></span>
                  <span className="hidden md:inline">|</span>
                  <span>Email: <strong className={s.textMain}>{currentUser.email}</strong></span>
                  <span className="hidden md:inline">|</span>
                  <span>DOB: <strong className={s.textMain}>{currentUser.dob}</strong></span>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-44">
                <button 
                  onClick={() => handleLogout()} 
                  className={`w-full text-center text-xs py-2.5 px-4 rounded-xl font-bold transition border ${s.bgButtonSec}`}
                >
                  Terminate Session
                </button>
              </div>
            </div>

            {/* Voting Status and Action Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Side: Status Block */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between h-full ${s.bgCard} transition-colors duration-200`}>
                <div className="space-y-4">
                  <h3 className={`text-xs uppercase tracking-widest font-extrabold ${s.textMuted}`}>Ledger Verification</h3>
                  <div className={`p-4 rounded-xl border text-center ${currentUser.hasVoted ? s.bgAlertSuccess : s.bgAlertPending}`}>
                    <p className="text-xs uppercase tracking-widest font-semibold opacity-75">Status Status</p>
                    <p className="text-xl font-black mt-1.5 tracking-wide">{currentUser.hasVoted ? '✅ Ballot Cast' : '⚠️ Pending'}</p>
                  </div>
                </div>

                {currentUser.hasVoted && (
                  <div className={`mt-6 pt-6 border-t space-y-3 ${s.borderSub}`}>
                    <button 
                      onClick={handleDownloadPDF} 
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Download PDF Slip
                    </button>
                    <p className={`text-[10px] text-center ${s.textMuted}`}>Use this offline PDF slip as proof for accreditation verification.</p>
                  </div>
                )}
              </div>

              {/* Right Side: Voting booth / Receipt display */}
              <div className={`md:col-span-2 p-6 rounded-2xl border ${s.bgCard} transition-colors duration-200`}>
                {!currentUser.hasVoted ? (
                  <div className="space-y-6">
                    <div className={`border-b pb-3 ${s.borderSub}`}>
                      <h3 className={`text-md font-bold ${s.textMain}`}>Consolidated Executive Election Ballot</h3>
                      <p className={`text-xs ${s.textMuted}`}>Please make one choice for each open position. Your complete ballot will be securely committed once you hit "Submit Ballot".</p>
                    </div>

                    {/* Loop through each election position */}
                    {POSITIONS.map(pos => (
                      <div key={pos} className={`space-y-3 border-b pb-4 ${s.borderSub}`}>
                        <h4 className="text-sm font-bold text-teal-400 tracking-wide uppercase">{pos} Position</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {candidates.filter(cand => cand.post === pos).map(cand => {
                            const isSelected = ballotSelections[pos]?.id === cand.id;
                            return (
                              <button
                                key={cand.id}
                                type="button"
                                onClick={() => handleSelectCandidate(pos, cand)}
                                className={`w-full text-left p-4 rounded-xl border transition flex justify-between items-center ${
                                  isSelected 
                                    ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                                    : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <div>
                                  <p className="font-bold text-sm">{cand.name}</p>
                                  <span className={`text-[10px] font-mono uppercase tracking-widest ${s.textMuted}`}>{cand.association}</span>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-slate-400'}`}>
                                  {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-slate-950 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* consolidated submit logic */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setConfirmVoteModal(true)}
                        disabled={!isBallotComplete}
                        className={`w-full p-4 rounded-xl font-extrabold text-sm transition tracking-wider uppercase flex items-center justify-center gap-2 ${
                          isBallotComplete 
                            ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 active:scale-[0.99]' 
                            : 'bg-slate-300 dark:bg-slate-800 border dark:border-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isBallotComplete ? 'Submit Complete Ballot' : 'Complete All Positions To Submit'}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`border-b pb-3 ${s.borderSub}`}>
                      <h3 className={`text-md font-bold ${s.textMain}`}>Cryptographic Verification Proof</h3>
                      <p className={`text-xs ${s.textMuted}`}>These details represent your mathematical vote verification string in the local data nodes.</p>
                    </div>

                    <div className={`space-y-3 text-xs p-4 rounded-xl border font-mono ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <span className={`block uppercase text-[10px] mb-1 ${s.textMuted}`}>Selections Logged</span>
                        <div className={`space-y-1.5 text-xs ${s.textMain}`}>
                          {currentUser.votedFor.split(' | ').map((line, i) => (
                            <div key={i} className={`flex gap-1.5 py-0.5 border-b last:border-0 ${s.borderSub}`}>
                              <span className="text-teal-400 font-bold">✔️</span>
                              <span>{line}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className={`block uppercase text-[10px] ${s.textMuted}`}>Verification Signature</span>
                        <span className="text-emerald-500 break-all font-bold select-all">{currentUser.receiptHash}</span>
                      </div>
                      <div>
                        <span className={`block uppercase text-[10px] ${s.textMuted}`}>Timestamp</span>
                        <span className={s.textMain}>{currentUser.timestamp}</span>
                      </div>
                      <div>
                        <span className={`block uppercase text-[10px] ${s.textMuted}`}>Encrypted Payload Match</span>
                        <span className={`text-[10px] ${s.textMuted}`}>SHA256_LOCAL_PERSIST({currentUser.id || 'N/A'} || SALTING_VECTOR_329)</span>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-xl text-center border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-[10px] italic ${s.textMuted}`}>To ensure 100% voter choice anonymity, the association between your voter record and selected candidate choices is held strictly within separate memory blocks.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`text-center text-[10px] font-mono ${s.textMuted}`}>
              Auto-lock safety protocol active. Inactivity for 5 minutes will instantly terminate credentials.
            </div>
          </div>
        )}

        {/* --- VIEW: SYSTEM & RESULTS DASHBOARD (ADMIN VIEW) --- */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header / Admin options */}
            <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${s.bgCard} transition-colors duration-200`}>
              <div>
                <h2 className={`text-2xl font-black ${s.textMain}`}>Election Audit Dashboard</h2>
                <p className={`text-xs mt-0.5 ${s.textMuted}`}>Live local results auditing with built-in analytics visualization tools.</p>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={handleSeedDemoData} 
                  className={`text-xs px-3.5 py-2 rounded-lg font-bold transition border ${s.bgButtonSec}`}
                >
                  🌱 Seed Mock Data
                </button>
                <button 
                  onClick={handleResetAllData} 
                  className="bg-red-950 hover:bg-red-900 text-red-200 text-xs px-3.5 py-2 rounded-lg font-bold border border-red-900/40 transition"
                >
                  💥 Reset All Storage
                </button>
                <button 
                  onClick={() => setActiveTab(currentUser ? 'dashboard' : 'login')} 
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs px-3.5 py-2 rounded-lg font-bold transition flex-grow md:flex-grow-0 text-center"
                >
                  Return to Ballot
                </button>
              </div>
            </div>

            {/* Overall Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className={`p-5 rounded-xl border text-center ${s.bgCard} transition-colors duration-200`}>
                <p className={`text-xs uppercase tracking-widest font-mono ${s.textMuted}`}>Total Enrolled Voters</p>
                <p className={`text-4xl font-black mt-2 font-mono ${s.textMain}`}>{voters.length}</p>
              </div>

              <div className={`p-5 rounded-xl border text-center ${s.bgCard} transition-colors duration-200`}>
                <p className={`text-xs uppercase tracking-widest font-mono ${s.textMuted}`}>Total Enrolled Ballots</p>
                <p className="text-4xl font-black text-teal-400 mt-2 font-mono">
                  {voters.filter(v => v.hasVoted).length}
                </p>
              </div>

              <div className={`p-5 rounded-xl border text-center ${s.bgCard} transition-colors duration-200`}>
                <p className={`text-xs uppercase tracking-widest font-mono ${s.textMuted}`}>Voter Turnout Rate</p>
                <p className="text-4xl font-black text-blue-400 mt-2 font-mono">
                  {voters.length > 0 ? `${Math.round((voters.filter(v => v.hasVoted).length / voters.length) * 100)}%` : '0%'}
                </p>
              </div>

              <div className={`p-5 rounded-xl border text-center ${s.bgCard} transition-colors duration-200`}>
                <p className={`text-xs uppercase tracking-widest font-mono ${s.textMuted}`}>Integrity Status</p>
                <p className="text-lg font-black text-emerald-500 mt-4 uppercase tracking-widest">
                  🛡️ Legitimate
                </p>
              </div>
            </div>

            {/* Live Chart Results representation */}
            <div className={`p-6 rounded-2xl border space-y-6 ${s.bgCard} transition-colors duration-200`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest ${s.textMuted}`}>Live Vote Tally Results (Interactive)</h3>
              
              <div className="space-y-8">
                {POSITIONS.map(pos => {
                  const positionCandidates = candidates.filter(cand => cand.post === pos);
                  const totalVotesForPosition = positionCandidates.reduce((total, cand) => total + cand.votes, 0);

                  return (
                    <div key={pos} className={`space-y-4 border-b pb-6 last:border-0 last:pb-0 ${s.borderSub}`}>
                      <h4 className="text-sm font-black text-teal-400 uppercase tracking-wider">{pos} Ballot Tally ({totalVotesForPosition} total votes)</h4>
                      
                      <div className="space-y-4">
                        {positionCandidates.map(cand => {
                          const percentage = totalVotesForPosition > 0 ? Math.round((cand.votes / totalVotesForPosition) * 100) : 0;
                          return (
                            <div key={cand.id} className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <div>
                                  <span className={`font-extrabold text-sm ${s.textMain}`}>{cand.name}</span>
                                  <span className={`text-[10px] font-mono ml-2 ${s.textMuted}`}>({cand.association})</span>
                                </div>
                                <span className={`font-mono font-bold ${s.textMain}`}>{cand.votes} votes ({percentage}%)</span>
                              </div>
                              <div className={`w-full rounded-full h-3.5 overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${cand.color}`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voter Ledger Audit Log */}
            <div className={`p-6 rounded-2xl border space-y-4 ${s.bgCard} transition-colors duration-200`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest ${s.textMuted}`}>System Enrollment & Vote Logs</h3>
              
              {voters.length === 0 ? (
                <p className={`text-xs text-center py-4 italic ${s.textMuted}`}>No voter registration records located inside state storage cache.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`text-[10px] uppercase tracking-wider border-b ${s.bgTableHead}`}>
                      <tr>
                        <th className="p-3">Voter Name</th>
                        <th className="p-3 font-mono">Student ID</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">DOB</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3">Assigned password</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-900' : 'divide-slate-100'}`}>
                      {voters.map(v => (
                        <tr key={v.id} className={isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}>
                          <td className={`p-3 font-semibold ${s.textMain}`}>{v.name}</td>
                          <td className="p-3 font-mono text-teal-500">{v.id}</td>
                          <td className={`p-3 ${s.textMuted}`}>{v.email}</td>
                          <td className={`p-3 ${s.textMuted}`}>{v.dob}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${v.hasVoted ? 'bg-emerald-950 text-emerald-300 border border-emerald-900' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border dark:border-slate-700'}`}>
                              {v.hasVoted ? 'CAST' : 'PENDING'}
                            </span>
                          </td>
                          <td className={`p-3 font-mono text-[11px] ${s.textMuted}`}>{v.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className={`${s.bgHeader} border-t py-6 px-6 mt-12 text-center text-xs transition-colors duration-200 ${s.textMuted} space-y-1`}>
        <p>© 2026 Web-Based Online Cryptographic Voting Prototype.</p>
        <p className="font-mono text-[10px] uppercase tracking-widest">Distributed Ballot Box Implementation Node</p>
      </footer>

      {/* --- CONFIRMATION ACTION MODAL overlay --- */}
      {confirmVoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl ${s.bgCard}`}>
            <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4"></path>
              </svg>
            </div>
            
            <div className="space-y-1 text-left">
              <h3 className={`text-lg font-extrabold text-center mb-2 ${s.textMain}`}>Verify Ballot Selections</h3>
              <p className={`text-xs text-center mb-4 ${s.textMuted}`}>Review your selected candidate choices before final submission:</p>
              
              <div className={`space-y-2 p-3 rounded-xl border mb-4 font-mono text-xs ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                {POSITIONS.map(pos => (
                  <div key={pos} className={`flex justify-between py-1 border-b last:border-0 last:pb-0 ${s.borderSub}`}>
                    <span className={s.textMuted}>{pos}:</span>
                    <span className="text-teal-500 font-bold">{ballotSelections[pos]?.name}</span>
                  </div>
                ))}
              </div>

              <p className={`text-[10px] text-center leading-normal ${s.textMuted}`}>Selections will be anonymized and logged into the secure local storage registry. This action cannot be undone.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setConfirmVoteModal(false)} 
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${s.bgButtonSec}`}
              >
                Cancel
              </button>
              <button 
                onClick={processVote} 
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 py-2.5 px-4 rounded-xl text-xs font-black transition shadow-lg shadow-teal-500/10"
              >
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}