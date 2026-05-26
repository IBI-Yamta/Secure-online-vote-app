import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // --- DEFAULT DATA FOR SIMULATION & PROJECT DEFENSE ---
  const DEFAULT_POSITIONS = ['Presidential', 'Gubernatorial', 'Senatorial'];
  const DEFAULT_CANDIDATES = [
    { id: 'c1', name: 'Alhaji Bola Ahmed Tinubu', post: 'Presidential', association: 'APC', votes: 0, color: 'bg-blue-600' },
    { id: 'c2', name: 'Mr. Peter Obi', post: 'Presidential', association: 'LP', votes: 0, color: 'bg-emerald-600' },
    { id: 'c3', name: 'Alhaji Atiku Abubakar', post: 'Presidential', association: 'PDP', votes: 0, color: 'bg-amber-600' },
    { id: 'c4', name: 'Prof. Babagana Zulum', post: 'Gubernatorial', association: 'APC', votes: 0, color: 'bg-purple-600' }
  ];
  const DEFAULT_WHITELIST = [
    'NIN12345678901', 'NIN98765432109', 'PVC2026889911', 'PVC2026554422',
    'NIN55443322110', 'PVC9988776655' // Whitelisted natively as standard numbers
  ];
  const DEFAULT_ELECTION = {
    name: 'Nigeria National General Elections 2025/2026',
    startTime: new Date(Date.now() - 3600000).toISOString().slice(0, 16), // Started 1 hour ago
    endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16)   // Ends in 24 hours
  };

  // --- CORE STATE ENGINE ---
  const [appMode, setAppMode] = useState(() => localStorage.getItem('nvote_mode') || 'gate');
  const [theme, setTheme] = useState(() => localStorage.getItem('nvote_theme') || 'dark');
  
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('nvote_positions');
    return saved ? JSON.parse(saved) : DEFAULT_POSITIONS;
  });
  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('nvote_candidates');
    return saved ? JSON.parse(saved) : DEFAULT_CANDIDATES;
  });
  const [whitelist, setWhitelist] = useState(() => {
    const saved = localStorage.getItem('nvote_whitelist');
    return saved ? JSON.parse(saved) : DEFAULT_WHITELIST;
  });
  const [electionConfig, setElectionConfig] = useState(() => {
    const saved = localStorage.getItem('nvote_election_config');
    return saved ? JSON.parse(saved) : DEFAULT_ELECTION;
  });
  const [voters, setVoters] = useState(() => {
    const saved = localStorage.getItem('nvote_voters');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentVoter, setCurrentVoter] = useState(() => {
    const saved = localStorage.getItem('nvote_current_voter');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('nvote_admin_auth') === 'true';
  });

  // Navigation Tabs
  const [voterTab, setVoterTab] = useState('login');
  const [adminTab, setAdminTab] = useState('election');

  // Form Inputs
  const [adminPass, setAdminPass] = useState('');
  const [regForm, setRegForm] = useState({ name: '', id: '', email: '', gender: '' });
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [firstResetForm, setFirstResetForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [newPosition, setNewPosition] = useState('');
  const [newCand, setNewCand] = useState({ name: '', post: 'Presidential', association: '', color: 'bg-blue-600' });
  const [newWhitelistId, setNewWhitelistId] = useState('');

  // UI Utilities
  const [alert, setAlert] = useState(null);
  const [generatedPass, setGeneratedPass] = useState('');
  const [confirmVoteModal, setConfirmVoteModal] = useState(false);
  const [ballotSelections, setBallotSelections] = useState({});

  // Simulated Face Biometric States
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Hardware Camera Streams References
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // --- PERSISTENCE SYNCHRONIZATION ---
  useEffect(() => { localStorage.setItem('nvote_mode', appMode); }, [appMode]);
  useEffect(() => { localStorage.setItem('nvote_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('nvote_positions', JSON.stringify(positions)); }, [positions]);
  useEffect(() => { localStorage.setItem('nvote_candidates', JSON.stringify(candidates)); }, [candidates]);
  useEffect(() => { localStorage.setItem('nvote_whitelist', JSON.stringify(whitelist)); }, [whitelist]);
  useEffect(() => { localStorage.setItem('nvote_election_config', JSON.stringify(electionConfig)); }, [electionConfig]);
  useEffect(() => { localStorage.setItem('nvote_voters', JSON.stringify(voters)); }, [voters]);
  useEffect(() => { localStorage.setItem('nvote_admin_auth', isAdminAuthenticated ? 'true' : 'false'); }, [isAdminAuthenticated]);
  
  useEffect(() => {
    if (currentVoter) {
      localStorage.setItem('nvote_current_voter', JSON.stringify(currentVoter));
    } else {
      localStorage.removeItem('nvote_current_voter');
    }
  }, [currentVoter]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cross-Tab Propagation Engine
  useEffect(() => {
    const syncNetworkData = (e) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'nvote_candidates') setCandidates(JSON.parse(e.newValue));
        if (e.key === 'nvote_positions') setPositions(JSON.parse(e.newValue));
        if (e.key === 'nvote_whitelist') setWhitelist(JSON.parse(e.newValue));
        if (e.key === 'nvote_election_config') setElectionConfig(JSON.parse(e.newValue));
        if (e.key === 'nvote_voters') {
          const incomingVoters = JSON.parse(e.newValue);
          setVoters(incomingVoters);
          if (currentVoter) {
            const freshSelf = incomingVoters.find(v => v.id === currentVoter.id);
            if (freshSelf) setCurrentVoter(freshSelf);
          }
        }
      } catch (err) { console.error("Sync parsing error:", err); }
    };
    window.addEventListener('storage', syncNetworkData);
    return () => window.removeEventListener('storage', syncNetworkData);
  }, [currentVoter]);

  // Clean up camera hardware if component unmounts or tab switches unexpectedly
  useEffect(() => {
    return () => stopCameraStream();
  }, [voterTab, appMode]);

  const triggerAlert = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // --- HARDWARE CAMERA CONTROLLERS ---
  const startCameraStream = async () => {
    try {
      const constraints = { video: { width: 320, height: 240, facingMode: "user" } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera interface failure:", err);
      triggerAlert('Could not access device media camera backend.', 'error');
      setIsCapturingFace(false);
      setIsVerifyingFace(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleSimulateFacialEnrollment = async () => {
    setIsCapturingFace(true);
    setFaceEnrolled(false);
    
    setTimeout(async () => {
      await startCameraStream();
      
      setTimeout(() => {
        stopCameraStream();
        setIsCapturingFace(false);
        setFaceEnrolled(true);
        triggerAlert('Facial hardware matrix logged successfully.', 'success');
      }, 3500);
    }, 100);
  };

  // --- VOTER MANAGEMENT HANDLERS ---
  const handleVoterRegister = (e) => {
    e.preventDefault();
    const cleanId = regForm.id.trim().toUpperCase();

    if (!regForm.name || !regForm.id || !regForm.email) {
      return triggerAlert('Please provide all mandatory structural inputs.', 'error');
    }
    if (!whitelist.includes(cleanId)) {
      return triggerAlert('Access Denied: NIN or PVC number is not whitelisted by INEC.', 'error');
    }
    if (voters.some(v => v.id === cleanId)) {
      return triggerAlert('This Identification Number has already been registered.', 'error');
    }
    if (!faceEnrolled) {
      return triggerAlert('Biometric Failure: You must enroll your facial signature first.', 'error');
    }

    const passCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newVoter = {
      id: cleanId,
      name: regForm.name.trim(),
      email: regForm.email.trim().toLowerCase(),
      gender: regForm.gender,
      password: passCode,
      hasVoted: false,
      votedFor: null,
      receiptHash: '',
      timestamp: '',
      isFirstLogin: true
    };

    setVoters([...voters, newVoter]);
    setGeneratedPass(passCode);
    setFaceEnrolled(false); 
    triggerAlert('Registration Complete! Copy your temporary passkey below.', 'success');
  };

  const handleVoterLoginInitiate = (e) => {
    e.preventDefault();
    const targetId = loginForm.id.trim().toUpperCase();
    const match = voters.find(v => v.id === targetId && v.password === loginForm.password);

    if (!match) {
      return triggerAlert('Invalid Credentials or ID profile reference.', 'error');
    }

    // Displays the scanning interface exactly like any standard card holder
    setIsVerifyingFace(true);
    
    setTimeout(async () => {
      await startCameraStream();

      // Executes standard 3.5-second camera sweep layout
      setTimeout(() => {
        stopCameraStream();

        // THE LOCKOUT TRIGGER: Simulates facial layout ratio validation failure
        if (targetId === 'NIN55443322110' || targetId === 'PVC9988776655') {
          setIsVerifyingFace(false);
          setFaceVerified(false);
          triggerAlert('Mismatched certification failed: Facial biometric layout does not correspond to legal token owner.', 'error');
          return;
        }

        // Standard verification clearance if not flagged
        setIsVerifyingFace(false);
        setFaceVerified(true);
        
        setTimeout(() => {
          setCurrentVoter(match);
          setLoginForm({ id: '', password: '' });
          setFaceVerified(false);
          if (match.isFirstLogin) {
            setVoterTab('first-login-reset');
          } else {
            setVoterTab('dashboard');
          }
          triggerAlert(`Welcome, Secure Identity Token Verified.`, 'success');
        }, 1000);
      }, 3500);
    }, 100);
  };

  const handleFirstLoginCustomization = (e) => {
    e.preventDefault();
    if (firstResetForm.newPassword !== firstResetForm.confirmPassword) {
      return triggerAlert('Passwords do not match.', 'error');
    }
    if (firstResetForm.newPassword.length < 4) {
      return triggerAlert('Secure key must be at least 4 characters.', 'error');
    }

    const updatedVoters = voters.map(v => {
      if (v.id === currentVoter.id) {
        return { ...v, password: firstResetForm.newPassword, isFirstLogin: false };
      }
      return v;
    });

    setVoters(updatedVoters);
    setCurrentVoter({ ...currentVoter, password: firstResetForm.newPassword, isFirstLogin: false });
    setVoterTab('dashboard');
    triggerAlert('Security credentials customized successfully.', 'success');
  };

  const handleSelectBallotCandidate = (position, candidate) => {
    setBallotSelections(prev => ({ ...prev, [position]: candidate }));
  };

  const processCastBallot = () => {
    if (!currentVoter) return;

    const start = new Date(electionConfig.startTime);
    const end = new Date(electionConfig.endTime);
    if (currentTime < start || currentTime > end) {
      setConfirmVoteModal(false);
      return triggerAlert('Electoral Portal Lockout: Voting is not currently active.', 'error');
    }

    const receiptCode = 'INEC-REC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const voteTime = new Date().toLocaleString();

    setCandidates(prev => prev.map(cand => {
      const selected = ballotSelections[cand.post];
      if (selected && selected.id === cand.id) {
        return { ...cand, votes: cand.votes + 1 };
      }
      return cand;
    }));

    const selectionsSummary = positions.map(pos => `${pos}: ${ballotSelections[pos]?.name || 'Abstained'}`).join(' | ');
    const updatedVoters = voters.map(v => {
      if (v.id === currentVoter.id) {
        return { ...v, hasVoted: true, votedFor: selectionsSummary, receiptHash: receiptCode, timestamp: voteTime };
      }
      return v;
    });

    setVoters(updatedVoters);
    setCurrentVoter({ ...currentVoter, hasVoted: true, votedFor: selectionsSummary, receiptHash: receiptCode, timestamp: voteTime });
    setConfirmVoteModal(false);
    triggerAlert('Ballot compiled and written to decentralized portal registry.', 'success');
  };

  // --- ADMIN PORTAL HANDLERS ---
  const handleAdminAuthSubmit = (e) => {
    e.preventDefault();
    if (adminPass === 'ADMIN2026') {
      setIsAdminAuthenticated(true);
      triggerAlert('Administrator node access authorized.', 'success');
    } else {
      triggerAlert('Unauthorized master passcode credential.', 'error');
    }
  };

  const handleAddWhitelistId = (e) => {
    e.preventDefault();
    const clean = newWhitelistId.trim().toUpperCase();
    if (!clean) return;
    if (whitelist.includes(clean)) return triggerAlert('ID already present in matrix.', 'error');

    setWhitelist([...whitelist, clean]);
    setNewWhitelistId('');
    triggerAlert('National Identification Credential whitelisted.', 'success');
  };

  const handleCreateCandidate = (e) => {
    e.preventDefault();
    if (!newCand.name || !newCand.association) return triggerAlert('Provide name and political party label.', 'error');
    const created = {
      id: 'c-' + Math.random().toString(36).substring(2, 7),
      name: newCand.name.trim(),
      post: newCand.post,
      association: newCand.association.trim().toUpperCase(),
      votes: 0,
      color: 'bg-slate-700'
    };

    setCandidates([...candidates, created]);
    setNewCand({ ...newCand, name: '', association: '' });
    triggerAlert('Candidate profile added to cross-tab distribution node.', 'success');
  };

  const handleResetApplicationState = () => {
    localStorage.clear();
    setVoters([]);
    setPositions(DEFAULT_POSITIONS);
    setCandidates(DEFAULT_CANDIDATES);
    setWhitelist(DEFAULT_WHITELIST);
    setElectionConfig(DEFAULT_ELECTION);
    setCurrentVoter(null);
    setVoterTab('login');
    triggerAlert('Application database wiped completely.', 'info');
  };

  // UI Theme Mapping Config
  const isDark = theme === 'dark';
  const s = {
    bgMain: isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900',
    bgCard: isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    bgInput: isDark ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600',
    textMain: isDark ? 'text-slate-100' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    borderMain: isDark ? 'border-slate-800' : 'border-slate-200',
    bgHeader: isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition py-2 px-4 rounded-xl',
    btnSec: isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
  };

  const startT = new Date(electionConfig.startTime);
  const endT = new Date(electionConfig.endTime);
  const isElectionActive = currentTime >= startT && currentTime <= endT;

  return (
    <div className={`min-h-screen ${s.bgMain} flex flex-col justify-between font-sans transition-all duration-150`}>
      {/* HEADER SECTION */}
      <header className={`${s.bgHeader} border-b py-4 px-6 sticky top-0 z-40 transition-all`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppMode('gate')}>
            <div className="bg-emerald-600 p-2 rounded-xl text-white font-black tracking-tighter shadow-md shadow-emerald-900/20">
              INEC
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">IVOTE-PORTAL</span>
              <p className={`text-[9px] font-mono tracking-widest ${s.textMuted} uppercase`}>Biometric Verification Infrastructure</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl border font-bold ${s.btnSec}`}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            {appMode !== 'gate' && (
              <button onClick={() => setAppMode('gate')} className="text-xs px-3 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition">
                🔄 Switch Interface Node
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ALERT CONTAINER */}
      {alert && (
        <div className="fixed top-24 right-6 left-6 md:left-auto md:w-96 z-50">
          <div className={`p-4 rounded-xl border shadow-lg ${alert.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' : 'bg-red-950/90 border-red-500 text-red-200'}`}>
            <p className="text-xs font-bold font-mono uppercase tracking-wide">System Response Ledger</p>
            <p className="text-sm mt-0.5 font-medium">{alert.message}</p>
          </div>
        </div>
      )}

      {/* MASTER ROUTING VIEWSPACE */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        
        {/* --- VIEW 1: NODE GATEWAY GATE --- */}
        {appMode === 'gate' && (
          <div className="max-w-xl mx-auto text-center space-y-8 py-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Electoral Node System Framework</h1>
              <p className={`text-sm ${s.textMuted}`}>
                National Online Voting Prototype with Live Biometric Face Identity Hardware Streams.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setAppMode('voter')} className={`p-6 rounded-2xl border text-left ${s.bgCard} hover:border-emerald-500 transition group`}>
                <div className="text-2xl">👤</div>
                <h3 className="text-lg font-bold mt-4 group-hover:text-emerald-500 transition">Voter Node Client</h3>
                <p className={`text-xs mt-1 ${s.textMuted}`}>Access registration channels, fulfill live biometric hardware scanning, and review interactive electronic ballots.</p>
              </button>

              <button onClick={() => setAppMode('admin')} className={`p-6 rounded-2xl border text-left ${s.bgCard} hover:border-emerald-500 transition group`}>
                <div className="text-2xl">🛡️</div>
                <h3 className="text-lg font-bold mt-4 group-hover:text-emerald-500 transition">Admin Node Portal</h3>
                <p className={`text-xs mt-1 ${s.textMuted}`}>Control national eligibility whitelists, adjust time window schedules, upload candidate rosters, and audit results.</p>
              </button>
            </div>
           
        )}

        {/* --- VIEW 2: VOTER APPLICATION MODULE --- */}
        {appMode === 'voter' && (
          <div className="max-w-4xl mx-auto">
            {/* Nav Header Row */}
            <div className="flex border-b border-slate-800 mb-6 gap-2">
              <button onClick={() => setVoterTab('login')} className={`px-4 py-2 font-bold text-sm border-b-2 transition ${voterTab === 'login' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60'}`}>Sign In / Verify Identity</button>
              <button onClick={() => setVoterTab('register')} className={`px-4 py-2 font-bold text-sm border-b-2 transition ${voterTab === 'register' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60'}`}>Enroll Biometrics & Register</button>
              {currentVoter && <button onClick={() => setVoterTab('dashboard')} className={`px-4 py-2 font-bold text-sm border-b-2 transition ${voterTab === 'dashboard' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60'}`}>Ballot Dash</button>}
            </div>

            {/* Voter Register Sub-View */}
            {voterTab === 'register' && (
              <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-md mx-auto space-y-6`}>
                <div>
                  <h2 className="text-xl font-black tracking-tight">National Registry Enrollment</h2>
                  <p className={`text-xs ${s.textMuted}`}>Input your details and connect your media device camera array to log your biometric template signature.</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-3 relative overflow-hidden min-h-[220px] flex flex-col justify-center items-center">
                  {isCapturingFace ? (
                    <div className="w-full max-w-[280px] aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 relative">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      <div className="absolute inset-x-0 h-0.5 bg-emerald-400 opacity-80 shadow-[0_0_8px_#34d399] animate-[scan_2s_linear_infinite]" style={{ top: '0%' }} />
                    </div>
                  ) : faceEnrolled ? (
                    <div className="space-y-1 py-4">
                      <div className="w-16 h-16 bg-emerald-950 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto shadow-md">✓</div>
                      <p className="text-emerald-400 font-bold text-sm mt-2">Biometric Hash Generated</p>
                    </div>
                  ) : (
                    <div className="py-6 text-slate-600 flex flex-col items-center">
                      <span className="text-4xl mb-2">📷</span>
                      <p className="text-xs font-mono">Camera Lens Off-line</p>
                    </div>
                  )}

                  <style>{`
                    @keyframes scan {
                      0% { top: 0%; }
                      50% { top: 100%; }
                      100% { top: 0%; }
                    }
                  `}</style>

                  <div>
                    <p className="text-xs font-bold text-slate-300">
                      {isCapturingFace ? "Processing High-Resolution Matrix Nodes..." : faceEnrolled ? "Facial Profile Linked Successfully!" : "Simulated Identity Camera Unit"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">Secure localized capture layer via HTML5 MediaStreams</p>
                  </div>

                  {!faceEnrolled && (
                    <button
                      type="button"
                      disabled={isCapturingFace}
                      onClick={handleSimulateFacialEnrollment}
                      className="text-xs bg-slate-800 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-slate-700 font-bold transition w-full disabled:opacity-50"
                    >
                      {isCapturingFace ? "Analyzing Pixels..." : "📷 Capture Facial Biometrics"}
                    </button>
                  )}
                </div>

                <form onSubmit={handleVoterRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Full Legal Name</label>
                    <input type="text" placeholder="As written on official index card" required className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-slate-400">NIN or PVC Registration ID</label>
                    <input type="text" placeholder="e.g. NIN12345678901" required className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={regForm.id} onChange={e => setRegForm({...regForm, id: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Secure Contact Email Address</label>
                    <input type="email" placeholder="citizen@nigeria.gov.ng" required className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                  </div>

                  <button type="submit" className={`w-full ${s.btnPrimary}`}>Complete Secure Registration</button>
                </form>

                {generatedPass && (
                  <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-xl text-center space-y-1">
                    <p className="text-xs text-blue-300 font-bold">Registration Authenticated!</p>
                    <p className="text-xs text-slate-400">Your secure cryptographic temporary login key is:</p>
                    <p className="text-xl font-mono font-black tracking-widest text-white selection:bg-yellow-500">{generatedPass}</p>
                  </div>
                )}
              </div>
            )}

            {/* Voter Login & Identity Scan Sub-View */}
            {voterTab === 'login' && (
              <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-md mx-auto space-y-6`}>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Identity Token Access Gate</h2>
                  <p className={`text-xs ${s.textMuted}`}>Input security passcode tokens followed by structural facial signature validation mapping checks.</p>
                </div>

                {isVerifyingFace || faceVerified ? (
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4 flex flex-col items-center">
                    <div className="w-full max-w-[260px] aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 relative">
                      {faceVerified ? (
                        <div className="w-full h-full flex flex-col justify-center items-center bg-emerald-950/60 z-20 absolute inset-0 backdrop-blur-sm">
                          <span className="text-3xl text-emerald-400 font-black">✓ Approved</span>
                        </div>
                      ) : (
                        <>
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                          <div className="absolute inset-x-0 h-0.5 bg-emerald-400 opacity-80 shadow-[0_0_8px_#34d399] animate-[scan_2s_linear_infinite]" style={{ top: '0%' }} />
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-bold font-mono tracking-wide">
                        {faceVerified ? "🟢 BIOMETRIC VERIFIED!" : "📡 MATCHING FACIAL MAP INDEX..."}
                      </p>
                      <p className={`text-xs ${s.textMuted}`}>
                        {faceVerified ? "Access Authorization Granted by INEC Matrix." : "Validating pixel geometric ratios against secure local records base."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVoterLoginInitiate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase text-slate-400">NIN / PVC Number</label>
                      <input type="text" required placeholder="NIN12345678901" className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={loginForm.id} onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Security Passcode</label>
                      <input type="password" required placeholder="••••••" className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                    </div>

                    <button type="submit" className={`w-full ${s.btnPrimary}`}>🔒 Authenticate Passcode & Scan Face</button>
                  </form>
                )}
              </div>
            )}

            {/* Voter Password Reset */}
            {voterTab === 'first-login-reset' && currentVoter && (
              <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-md mx-auto space-y-4`}>
                <div>
                  <h2 className="text-lg font-black">Personalize Security Key</h2>
                  <p className={`text-xs ${s.textMuted}`}>First-time token signature change protocol initialized. Update credentials before opening electronic ballots.</p>
                </div>

                <form onSubmit={handleFirstLoginCustomization} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Verify Current Passkey</label>
                    <input type="password" required placeholder="Temporary passcode" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={firstResetForm.currentPassword} onChange={e => setFirstResetForm({...firstResetForm, currentPassword: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Configure New Password</label>
                    <input type="password" required placeholder="Minimum 4 symbols" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={firstResetForm.newPassword} onChange={e => setFirstResetForm({...firstResetForm, newPassword: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Confirm New Password</label>
                    <input type="password" required placeholder="Re-type credentials" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={firstResetForm.confirmPassword} onChange={e => setFirstResetForm({...firstResetForm, confirmPassword: e.target.value})} />
                  </div>

                  <button type="submit" className={`w-full ${s.btnPrimary}`}>Save Dynamic Security Credentials</button>
                </form>
              </div>
            )}

            {/* Voter Ballot Dashboard Platform */}
            {voterTab === 'dashboard' && currentVoter && (
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border ${s.bgCard} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                  <div>
                    <h2 className="text-xl font-black text-emerald-400">{currentVoter.name}</h2>
                    <p className="text-xs font-mono font-bold tracking-wider">{currentVoter.id} | Status Account Token Verified</p>
                    <p className={`text-xs mt-1 ${s.textMuted}`}>Electoral Frame Configured: <span className="text-slate-300 font-medium">{electionConfig.name}</span></p>
                  </div>
                  <button onClick={() => { setCurrentVoter(null); setVoterTab('login'); }} className="text-xs font-bold text-red-400 bg-red-950/30 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-900 hover:text-white transition">
                    Logout Terminal Secure
                  </button>
                </div>

                {currentVoter.hasVoted ? (
                  <div className={`p-8 rounded-2xl border text-center ${s.bgCard} max-w-xl mx-auto space-y-4`}>
                    <div className="text-4xl text-emerald-500">🔒 📜</div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">Ballot Successfully Written</h3>
                      <p className={`text-xs ${s.textMuted}`}>Your transactional footprint has been submitted. Double-voting checks prevent secondary entry into local nodes.</p>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left space-y-2 font-mono text-xs">
                      <p><span className="text-slate-500">Timestamp Log:</span> {currentVoter.timestamp}</p>
                      <p className="break-all"><span className="text-slate-500">Receipt Code:</span> {currentVoter.receiptHash}</p>
                      <div className="border-t border-slate-800 my-2 pt-2 text-slate-300">
                        {currentVoter.votedFor ? currentVoter.votedFor.split(' | ').map((line, i) => <p key={i}>{line}</p>) : null}
                      </div>
                    </div>
                  </div>
                ) : !isElectionActive ? (
                  <div className="p-12 text-center bg-red-950/20 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-2">
                    <span className="text-3xl">🏁</span>
                    <h3 className="text-lg font-bold text-red-400">Electoral Window Closed</h3>
                    <p className="text-xs text-slate-400">Current System Time falls outside active verification limits configured by system administrators.</p>
                    <p className="text-xs font-mono bg-slate-950 py-1 px-3 rounded text-slate-300 w-fit mx-auto mt-2">Server Sync: {currentTime.toLocaleTimeString()}</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {positions.map(pos => {
                      const options = candidates.filter(c => c.post === pos);
                      return (
                        <div key={pos} className="space-y-3">
                          <h3 className="text-lg font-black tracking-tight border-l-4 border-emerald-500 pl-2 uppercase">{pos} Category</h3>
                          {options.length === 0 ? (
                            <p className="text-xs text-slate-500 italic font-mono">No accredited candidates synchronized onto node ledger for this level.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {options.map(cand => {
                                const isChosen = ballotSelections[pos]?.id === cand.id;
                                return (
                                  <div
                                    key={cand.id}
                                    onClick={() => handleSelectBallotCandidate(pos, cand)}
                                    className={`p-4 rounded-xl border cursor-pointer transition flex justify-between items-center ${isChosen ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-500/10' : s.bgCard}`}
                                  >
                                    <div>
                                      <p className="font-bold text-base tracking-tight">{cand.name}</p>
                                      <p className="text-xs text-slate-400 font-mono tracking-wide">{cand.association} Party</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isChosen ? 'bg-emerald-500 border-emerald-400' : 'border-slate-700'}`}>
                                      {isChosen && <div className="w-2 h-2 bg-slate-950 rounded-full" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-4 border-t border-slate-800 text-center">
                      <button onClick={() => setConfirmVoteModal(true)} className="bg-emerald-600 text-white font-black px-8 py-3 rounded-xl hover:bg-emerald-500 tracking-wide shadow-lg transition">
                        🗳️ Compile & Submit Ballot Ledger
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 3: ADMINISTRATOR DASHBOARD BACKEND --- */}
        {appMode === 'admin' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!isAdminAuthenticated ? (
              <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-sm mx-auto space-y-4`}>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Security Command Center</h2>
                  <p className={`text-xs ${s.textMuted}`}>Provide cryptographic key parameters to authorize structural backend overrides.</p>
                </div>

                <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Admin Access Passcode</label>
                    <input type="password" required placeholder="••••••••" className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                  </div>
                  <button type="submit" className={`w-full ${s.btnPrimary}`}>Authenticate Privileges</button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl border ${s.bgCard} flex flex-wrap justify-between items-center gap-4`}>
                  <div className="flex gap-2">
                    <button onClick={() => setAdminTab('election')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${adminTab === 'election' ? 'bg-emerald-600 text-white' : s.btnSec}`}>Election Parameters</button>
                    <button onClick={() => setAdminTab('whitelist')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${adminTab === 'whitelist' ? 'bg-emerald-600 text-white' : s.btnSec}`}>Identity Whitelist</button>
                    <button onClick={() => setAdminTab('candidates')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${adminTab === 'candidates' ? 'bg-emerald-600 text-white' : s.btnSec}`}>Accredit Candidates</button>
                    <button onClick={() => setAdminTab('tally')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${adminTab === 'tally' ? 'bg-emerald-600 text-white' : s.btnSec}`}>Live Matrix Results</button>
                  </div>
                  <button onClick={() => setIsAdminAuthenticated(false)} className="text-xs font-bold text-red-400 bg-red-950/20 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition">
                    Exit Panel
                  </button>
                </div>

                {adminTab === 'election' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-2xl border ${s.bgCard} space-y-4`}>
                      <h3 className="text-lg font-black tracking-tight">Active Matrix Parameters</h3>
                      <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">Electoral Context Name</label>
                          <input type="text" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={electionConfig.name} onChange={e => setElectionConfig({...electionConfig, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">Universal ISO Window Start Time</label>
                          <input type="datetime-local" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={electionConfig.startTime} onChange={e => setElectionConfig({...electionConfig, startTime: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">Universal ISO Window End Time</label>
                          <input type="datetime-local" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={electionConfig.endTime} onChange={e => setElectionConfig({...electionConfig, endTime: e.target.value})} />
                        </div>
                      </form>
                    </div>

                    <div className={`p-6 rounded-2xl border ${s.bgCard} flex flex-col justify-between space-y-4`}>
                      <div>
                        <h3 className="text-lg font-black tracking-tight">Hard Reset System State</h3>
                        <p className={`text-xs mt-1 ${s.textMuted}`}>Wipe all operational registration parameters, voter entries, and candidate score counters to restore factory default presentation files.</p>
                      </div>
                      <button onClick={handleResetApplicationState} className="w-fit px-4 py-2 text-xs bg-red-600 text-white font-black rounded-lg hover:bg-red-500 transition">
                        ☢️ Execute Hard Data Factory Cleanse
                      </button>
                    </div>
                  </div>
                )}

                {adminTab === 'whitelist' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl border ${s.bgCard} h-fit space-y-4`}>
                      <h3 className="text-base font-black">Authorize Token Whitelist Entry</h3>
                      <form onSubmit={handleAddWhitelistId} className="space-y-3">
                        <input type="text" placeholder="NIN / PVC Registry Format" className={`w-full p-2 text-xs rounded-lg border ${s.bgInput}`} value={newWhitelistId} onChange={e => setNewWhitelistId(e.target.value)} />
                        <button type="submit" className={`w-full text-xs font-bold py-2 ${s.btnPrimary}`}>Add to Verified Registry</button>
                      </form>
                    </div>

                    <div className={`p-6 rounded-2xl border ${s.bgCard} md:col-span-2 space-y-3`}>
                      <h3 className="text-base font-black">Accredited Citizen Identification Codes ({whitelist.length})</h3>
                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-2 bg-slate-900/40 rounded-xl border border-slate-800">
                        {whitelist.map(id => (
                          <div key={id} className="text-xs font-mono px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-2">
                            <span>{id}</span>
                            <button onClick={() => setWhitelist(whitelist.filter(w => w !== id))} className="text-red-400 font-bold hover:text-red-500">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'candidates' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl border ${s.bgCard} h-fit space-y-4`}>
                      <h3 className="text-base font-black">Accredit New Candidate</h3>
                      <form onSubmit={handleCreateCandidate} className="space-y-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Target Category Office</label>
                          <select className={`w-full p-2 text-xs rounded-lg border ${s.bgInput}`} value={newCand.post} onChange={e => setNewCand({...newCand, post: e.target.value})}>
                            {positions.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Candidate Full Name</label>
                          <input type="text" required placeholder="e.g. Muhammadu Buhari" className={`w-full p-2 text-xs rounded-lg border ${s.bgInput}`} value={newCand.name} onChange={e => setNewCand({...newCand, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Political Party Affiliation</label>
                          <input type="text" required placeholder="e.g. APC, PDP, LP" className={`w-full p-2 text-xs rounded-lg border ${s.bgInput}`} value={newCand.association} onChange={e => setNewCand({...newCand, association: e.target.value})} />
                        </div>
                        <button type="submit" className={`w-full text-xs font-bold py-2 ${s.btnPrimary}`}>Commit Profile</button>
                      </form>
                    </div>

                    <div className={`p-6 rounded-2xl border ${s.bgCard} md:col-span-2 space-y-3`}>
                      <h3 className="text-base font-black">Accredited Roster Log ({candidates.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {candidates.map(c => (
                          <div key={c.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold">{c.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{c.post} — Party: {c.association}</p>
                            </div>
                            <button onClick={() => setCandidates(candidates.filter(item => item.id !== c.id))} className="text-xs font-bold text-red-400 bg-red-950/40 p-1 px-2.5 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition">Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'tally' && (
                  <div className={`p-6 rounded-2xl border ${s.bgCard} space-y-6`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-black tracking-tight">Real-Time Score Tally Matrix</h3>
                        <p className={`text-xs ${s.textMuted}`}>Live computed vote updates distributed from registered browser clients automatically.</p>
                      </div>
                      <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        Total Registered Submissions: {voters.filter(v => v.hasVoted).length}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {positions.map(pos => {
                        const pool = candidates.filter(c => c.post === pos);
                        const topVotes = Math.max(...pool.map(c => c.votes), 1);
                        return (
                          <div key={pos} className="space-y-2">
                            <h4 className="text-sm font-black font-mono tracking-wide text-slate-400 uppercase border-b border-slate-800 pb-1">{pos} Metrics Dashboard</h4>
                            <div className="space-y-3">
                              {pool.map(cand => {
                                const percentage = Math.round((cand.votes / topVotes) * 100);
                                return (
                                  <div key={cand.id} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                      <span>{cand.name} ({cand.association})</span>
                                      <span className="font-bold font-mono text-emerald-400">{cand.votes} Ballot Units</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${percentage}%` }} />
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
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CONFIRMATION OVERLAY MODAL */}
      {confirmVoteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-sm w-full space-y-4 animate-scaleUp`}>
            <div>
              <h3 className="text-lg font-black tracking-tight">Lock & Cast Ballot?</h3>
              <p className={`text-xs mt-1 ${s.textMuted}`}>Once committed to the INEC core ledger, your session token terminates and cannot be re-entered.</p>
            </div>

            <div className="space-y-1.5 p-3 bg-slate-900 rounded-xl text-xs font-mono border border-slate-800">
              {positions.map(pos => (
                <p key={pos} className="truncate"><span className="text-slate-500">{pos}:</span> {ballotSelections[pos]?.name || 'Abstained'}</p>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setConfirmVoteModal(false)} className={`flex-1 text-xs py-2 rounded-lg font-bold ${s.btnSec}`}>Cancel</button>
              <button onClick={processCastBallot} className="flex-1 text-xs py-2 rounded-lg font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-900/40">Confirm Signature</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BRANDS */}
      <footer className={`border-t border-slate-800 py-6 text-center text-xs ${s.textMuted}`}>
        <p>© 2026 INEC National Electronic Voting Verification Prototype Hub.</p>
        <p className="text-[10px] font-mono opacity-40 mt-0.5">Engineered with React Cross-Tab Data Synced Topology</p>
      </footer>
    </div>
  );
}