import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // --- DEFAULT DATA FOR SIMULATION & PROJECT DEFENSE ---
  const DEFAULT_POSITIONS = ['Presidential', 'Gubernatorial', 'Senatorial'];

  const DEFAULT_CANDIDATES = [
    { id: 'c1', name: 'Alhaji Bola Ahmed Tinubu', post: 'Presidential', association: 'APC', votes: 0 },
    { id: 'c2', name: 'Mr. Peter Obi', post: 'Presidential', association: 'LP', votes: 0 },
    { id: 'c3', name: 'Alhaji Atiku Abubakar', post: 'Presidential', association: 'PDP', votes: 0 },
    { id: 'c4', name: 'Prof. Babagana Zulum', post: 'Gubernatorial', association: 'APC', votes: 0 }
  ];

  const DEFAULT_WHITELIST = [
    'NIN12345678901', 'NIN98765432109', 'PVC2026889911', 'NIN12342345', 'PVC2026552345'
  ];

  const DEFAULT_ELECTION = {
    name: 'Nigeria National General Elections 2025/2026',
    startTime: new Date(Date.now() - 3600000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
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
    // Inject custom testing accounts pre-registered if empty
    if (!saved || JSON.parse(saved).length === 0) {
      return [
        { id: 'NIN12345678901', name: 'Ibrahim Isah Yamta', email: 'ibrahim@domain.com', gender: 'Male', password: '1111', hasVoted: false, isFirstLogin: false },
        { id: 'NIN12342345', name: 'Simulated Fraudulent User', email: 'test2345@domain.com', gender: 'Male', password: '2345', hasVoted: false, isFirstLogin: false }
      ];
    }
    return JSON.parse(saved);
  });

  const [currentVoter, setCurrentVoter] = useState(() => {
    const saved = localStorage.getItem('nvote_current_voter');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('nvote_admin_auth') === 'true';
  });

  const [voterTab, setVoterTab] = useState('login');
  const [adminTab, setAdminTab] = useState('election');

  // Form Inputs
  const [adminPass, setAdminPass] = useState('');
  const [regForm, setRegForm] = useState({ name: '', id: '', email: '', gender: '' });
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [firstResetForm, setFirstResetForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [newPosition, setNewPosition] = useState('');
  const [newCand, setNewCand] = useState({ name: '', post: 'Presidential', association: '' });
  const [newWhitelistId, setNewWhitelistId] = useState('');

  // UI Utilities
  const [alert, setAlert] = useState(null);
  const [generatedPass, setGeneratedPass] = useState('');
  const [confirmVoteModal, setConfirmVoteModal] = useState(false);
  const [ballotSelections, setBallotSelections] = useState({});

  // REAL WEBCAM CAMERA UTILITIES
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceBiometricResult, setFaceBiometricResult] = useState(null); // 'success' | 'failed' | null
  const [pendingVoterMatch, setPendingVoterMatch] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Persistence hooks
  useEffect(() => { localStorage.setItem('nvote_mode', appMode); }, [appMode]);
  useEffect(() => { localStorage.setItem('nvote_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('nvote_positions', JSON.stringify(positions)); }, [positions]);
  useEffect(() => { localStorage.setItem('nvote_candidates', JSON.stringify(candidates)); }, [candidates]);
  useEffect(() => { localStorage.setItem('nvote_whitelist', JSON.stringify(whitelist)); }, [whitelist]);
  useEffect(() => { localStorage.setItem('nvote_election_config', JSON.stringify(electionConfig)); }, [electionConfig]);
  useEffect(() => { localStorage.setItem('nvote_voters', JSON.stringify(voters)); }, [voters]);
  useEffect(() => { localStorage.setItem('nvote_admin_auth', isAdminAuthenticated ? 'true' : 'false'); }, [isAdminAuthenticated]);
  useEffect(() => { currentVoter ? localStorage.setItem('nvote_current_voter', JSON.stringify(currentVoter)) : localStorage.removeItem('nvote_current_voter'); }, [currentVoter]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerAlert = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // --- HARDWARE CAMERA CONTROLLERS ---
  const startCameraHardware = async () => {
    try {
      if (cameraStream) stopCameraHardware();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Initialization Denied:", err);
      triggerAlert("Camera Access Error: Please permit web camera devices.", "error");
    }
  };

  const stopCameraHardware = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Auto-manage video element linking when panels shift
  useEffect(() => {
    if (voterTab === 'register' || isVerifyingFace) {
      startCameraHardware();
    } else {
      stopCameraHardware();
    }
    return () => stopCameraHardware();
  }, [voterTab, isVerifyingFace]);

  // --- FUNCTIONAL LOGIC CODES ---
  const handleCaptureRegistrationFace = () => {
    setIsCapturingFace(true);
    setTimeout(() => {
      setIsCapturingFace(false);
      setFaceEnrolled(true);
      stopCameraHardware();
      triggerAlert('Facial biometrics mapped and stored locally.', 'success');
    }, 2500);
  };

  const handleVoterRegister = (e) => {
    e.preventDefault();
    const cleanId = regForm.id.trim().toUpperCase();

    if (!whitelist.includes(cleanId)) return triggerAlert('Access Denied: ID not whitelisted by INEC.', 'error');
    if (voters.some(v => v.id === cleanId)) return triggerAlert('This ID profile has already been registered.', 'error');
    if (!faceEnrolled) return triggerAlert('Biometric Failure: Capture your face first.', 'error');

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
    triggerAlert('Registration Complete! Copy your passkey below.', 'success');
  };

  const handleVoterLoginInitiate = (e) => {
    e.preventDefault();
    const targetId = loginForm.id.trim().toUpperCase();
    const match = voters.find(v => v.id === targetId && v.password === loginForm.password);

    if (!match) return triggerAlert('Invalid Identity Credentials or Password.', 'error');

    setPendingVoterMatch(match);
    setIsVerifyingFace(true);
    setFaceBiometricResult(null);
  };

  const executeLiveFacialAuthenticationScan = () => {
    if (!pendingVoterMatch) return;
    
    // Check if the current ID string ends precisely with '2345'
    const shouldFailBiometrics = pendingVoterMatch.id.endsWith('2345');

    setTimeout(() => {
      if (shouldFailBiometrics) {
        setFaceBiometricResult('failed');
        triggerAlert('CRITICAL AUTHENTICATION ERROR: Facial signature mismatch detected!', 'error');
        setTimeout(() => {
          setIsVerifyingFace(false);
          setFaceBiometricResult(null);
          setPendingVoterMatch(null);
          stopCameraHardware();
        }, 3000);
      } else {
        setFaceBiometricResult('success');
        triggerAlert('Biometrics Identity Confirmed! Access Token granted.', 'success');
        setTimeout(() => {
          setCurrentVoter(pendingVoterMatch);
          setLoginForm({ id: '', password: '' });
          setIsVerifyingFace(false);
          setFaceBiometricResult(null);
          setVoterTab(pendingVoterMatch.isFirstLogin ? 'first-login-reset' : 'dashboard');
          setPendingVoterMatch(null);
          stopCameraHardware();
        }, 1500);
      }
    }, 2500);
  };

  const handleFirstLoginCustomization = (e) => {
    e.preventDefault();
    if (firstResetForm.newPassword !== firstResetForm.confirmPassword) return triggerAlert('Passwords match error.', 'error');

    setVoters(voters.map(v => v.id === currentVoter.id ? { ...v, password: firstResetForm.newPassword, isFirstLogin: false } : v));
    setCurrentVoter({ ...currentVoter, password: firstResetForm.newPassword, isFirstLogin: false });
    setVoterTab('dashboard');
    triggerAlert('Security signature tailored successfully.', 'success');
  };

  const processCastBallot = () => {
    if (!currentVoter) return;
    const receiptCode = 'INEC-REC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const voteTime = new Date().toLocaleString();

    setCandidates(candidates.map(cand => ballotSelections[cand.post]?.id === cand.id ? { ...cand, votes: cand.votes + 1 } : cand));
    
    const selectionsSummary = positions.map(pos => `${pos}: ${ballotSelections[pos]?.name || 'Abstained'}`).join(' | ');

    setVoters(voters.map(v => v.id === currentVoter.id ? { ...v, hasVoted: true, votedFor: selectionsSummary, receiptHash: receiptCode, timestamp: voteTime } : v));
    setCurrentVoter({ ...currentVoter, hasVoted: true, votedFor: selectionsSummary, receiptHash: receiptCode, timestamp: voteTime });
    setConfirmVoteModal(false);
    triggerAlert('Ballot compiled and written securely to registry ledger.', 'success');
  };

  const handleAdminAuthSubmit = (e) => {
    e.preventDefault();
    if (adminPass === 'ADMIN2026') {
      setIsAdminAuthenticated(true);
      triggerAlert('Admin backend systems operational.', 'success');
    } else {
      triggerAlert('Invalid override parameters.', 'error');
    }
  };

  const isDark = theme === 'dark';
  const s = {
    bgMain: isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900',
    bgCard: isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    bgInput: isDark ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    borderMain: isDark ? 'border-slate-800' : 'border-slate-200',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition py-2 px-4 rounded-xl',
    btnSec: isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
  };

  return (
    <div className={`min-h-screen ${s.bgMain} flex flex-col justify-between font-sans transition-all duration-150`}>
      {/* HEADER SECTION */}
      <header className={`${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border-b py-4 px-6 sticky top-0 z-40`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppMode('gate')}>
            <div className="bg-emerald-600 p-2 rounded-xl text-white font-black tracking-tighter shadow-md shadow-emerald-900/20">INEC</div>
            <div>
              <span className="text-xl font-black tracking-tight">IVOTE-PORTAL</span>
              <p className={`text-[9px] font-mono tracking-widest ${s.textMuted} uppercase`}>Biometric Verification Infrastructure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-xl border text-xs font-bold ${s.btnSec}`}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            {appMode !== 'gate' && (
              <button onClick={() => setAppMode('gate')} className="text-xs px-3 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700">
                🔄 Switch Terminal Node
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ALERT CHANNEL BANNER */}
      {alert && (
        <div className="fixed top-24 right-6 left-6 md:left-auto md:w-96 z-50">
          <div className={`p-4 rounded-xl border shadow-lg ${alert.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' : 'bg-red-950/90 border-red-500 text-red-200'}`}>
            <p className="text-xs font-bold font-mono uppercase tracking-wide">System Response Ledger</p>
            <p className="text-sm mt-0.5 font-medium">{alert.message}</p>
          </div>
        </div>
      )}

      {/* CONTAINER ROUTER VIEWSPACE */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        {appMode === 'gate' && (
          <div className="max-w-xl mx-auto text-center space-y-8 py-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">National Electoral Gateway Node</h1>
              <p className={`text-sm ${s.textMuted}`}>
                National Online Voting Prototype with Live Biometric Camera Face Mismatch Demonstration for Testing Accounts ending in 2345.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setAppMode('voter')} className={`p-6 rounded-2xl border text-left ${s.bgCard} hover:border-emerald-500 transition group`}>
                <div className="text-2xl">👤</div>
                <h3 className="text-lg font-bold mt-4 group-hover:text-emerald-500 transition">Voter Node Client</h3>
                <p className={`text-xs mt-1 ${s.textMuted}`}>Enroll hardware biometrics camera mapping, verify active security tokens, and write ballots.</p>
              </button>
              <button onClick={() => setAppMode('admin')} className={`p-6 rounded-2xl border text-left ${s.bgCard} hover:border-emerald-500 transition group`}>
                <div className="text-2xl">🛡️</div>
                <h3 className="text-lg font-bold mt-4 group-hover:text-emerald-500 transition">Admin Node Portal</h3>
                <p className={`text-xs mt-1 ${s.textMuted}`}>Observe live computed vote matrix tallies, manipulate whitelists, and monitor security loops.</p>
              </button>
            </div>
          </div>
        )}

        {appMode === 'voter' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex border-b border-slate-800 mb-6 gap-2">
              <button onClick={() => setVoterTab('login')} className={`px-4 py-2 font-bold text-sm border-b-2 transition ${voterTab === 'login' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60'}`}>Sign In / Face Authentication</button>
              <button onClick={() => setVoterTab('register')} className={`px-4 py-2 font-bold text-sm border-b-2 transition ${voterTab === 'register' ? 'border-emerald-500 text-emerald-500' : 'border-transparent opacity-60'}`}>Enroll Biometrics & Register</button>
            </div>

            {voterTab === 'register' && (
              <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-md mx-auto space-y-6`}>
                <div>
                  <h2 className="text-xl font-black tracking-tight">National Registry Enrollment</h2>
                  <p className={`text-xs ${s.textMuted}`}>Activate camera device frame to store biometric vector matrices locally.</p>
                </div>

                {/* ACTIVE LIVE WEBCAM BOX FOR REGISTRATION */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center space-y-3 relative overflow-hidden">
                  <div className="w-full max-w-[280px] h-48 bg-slate-950 mx-auto rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
                    {faceEnrolled ? (
                      <div className="text-center p-4">
                        <span className="text-4xl">✅</span>
                        <p className="text-xs font-bold text-emerald-400 mt-2">Face Template Synced Securely</p>
                      </div>
                    ) : (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                    )}

                    {isCapturingFace && (
                      <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none border-y border-emerald-500/40 animate-pulse flex items-center justify-center">
                        <div className="w-full h-0.5 bg-emerald-400 animate-bounce" />
                      </div>
                    )}
                  </div>

                  {!faceEnrolled && (
                    <button type="button" disabled={isCapturingFace} onClick={handleCaptureRegistrationFace} className="text-xs bg-slate-800 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-lg hover:bg-slate-700 font-bold transition w-full">
                      {isCapturingFace ? "Processing Pixel Clusters..." : "📷 Capture Facial Biometrics"}
                    </button>
                  )}
                </div>

                <form onSubmit={handleVoterRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Full Legal Name</label>
                    <input type="text" required className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-slate-400">NIN or PVC Registration ID</label>
                    <input type="text" required placeholder="Hint: Use a string ending in 2345 to test failure" className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={regForm.id} onChange={e => setRegForm({...regForm, id: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Secure Email Address</label>
                    <input type="email" required className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                  </div>
                  <button type="submit" className={`w-full ${s.btnPrimary}`}>Complete Secure Registration</button>
                </form>

                {generatedPass && (
                  <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-xl text-center space-y-1">
                    <p className="text-xs text-blue-300 font-bold">Temporary Cryptographic Login Passkey:</p>
                    <p className="text-xl font-mono font-black tracking-widest text-white">{generatedPass}</p>
                  </div>
                )}
              </div>
            )}

            {voterTab === 'login' && (
              <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-md mx-auto space-y-6`}>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Identity Token Gate</h2>
                  <p className={`text-xs ${s.textMuted}`}>Facial biometrics authentication is **Mandatory** on every session attempt.</p>
                </div>

                {isVerifyingFace ? (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4">
                    <div className="w-full max-w-[280px] h-48 bg-slate-900 mx-auto rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                      
                      {faceBiometricResult === 'success' && <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-emerald-400 font-bold text-sm"><span>✅ ACCESS MATCH</span></div>}
                      {faceBiometricResult === 'failed' && <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-red-400 font-bold text-sm"><span>❌ FACE MISMATCH LOCKOUT</span></div>}
                      
                      {faceBiometricResult === null && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                          <div className="w-full h-0.5 bg-emerald-400 animate-bounce" />
                          <div className="border border-emerald-500/30 w-full h-full rounded animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-mono font-bold">
                        {faceBiometricResult === 'success' ? "🟢 VERIFIED SUCCESSFULLY" : faceBiometricResult === 'failed' ? "🔴 ERROR: NOT VERIFIED" : "📡 RECOGNIZING FACE MATRIX INDEX..."}
                      </p>
                      
                      {faceBiometricResult === null && (
                        <button type="button" onClick={executeLiveFacialAuthenticationScan} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg">
                          ⚡ Authenticate Live Stream Capture
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVoterLoginInitiate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase text-slate-400">NIN / PVC Card Number</label>
                      <input type="text" required placeholder="e.g. NIN12345678901" className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={loginForm.id} onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Security Passcode Token</label>
                      <input type="password" required placeholder="••••••" className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                    </div>
                    <button type="submit" className={`w-full ${s.btnPrimary}`}>🔒 Initialize Biometric Verification</button>
                  </form>
                )}
              </div>
            )}

            {voterTab === 'first-login-reset' && currentVoter && (
              <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-md mx-auto space-y-4`}>
                <h2 className="text-lg font-black">Personalize Security Credentials</h2>
                <form onSubmit={handleFirstLoginCustomization} className="space-y-4">
                  <input type="password" required placeholder="Verify current temporary passcode" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={firstResetForm.currentPassword} onChange={e => setFirstResetForm({...firstResetForm, currentPassword: e.target.value})} />
                  <input type="password" required placeholder="Configure new permanent password" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={firstResetForm.newPassword} onChange={e => setFirstResetForm({...firstResetForm, newPassword: e.target.value})} />
                  <input type="password" required placeholder="Confirm secure password" className={`w-full p-2 rounded-xl border text-sm ${s.bgInput}`} value={firstResetForm.confirmPassword} onChange={e => setFirstResetForm({...firstResetForm, confirmPassword: e.target.value})} />
                  <button type="submit" className={`w-full ${s.btnPrimary}`}>Activate Customized Account</button>
                </form>
              </div>
            )}

            {voterTab === 'dashboard' && currentVoter && (
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border ${s.bgCard} flex justify-between items-center`}>
                  <div>
                    <h2 className="text-xl font-black text-emerald-400">{currentVoter.name}</h2>
                    <p className="text-xs font-mono font-bold">{currentVoter.id} | Portal Registry Active</p>
                  </div>
                  <button onClick={() => { setCurrentVoter(null); setVoterTab('login'); }} className="text-xs font-bold text-red-400 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-900 transition">
                    Terminate Token Session
                  </button>
                </div>

                {currentVoter.hasVoted ? (
                  <div className={`p-8 rounded-2xl border text-center ${s.bgCard} max-w-xl mx-auto space-y-4`}>
                    <span className="text-4xl">📜 ✅</span>
                    <h3 className="text-xl font-black">Cryptographic Slip Generated</h3>
                    <div className="p-4 bg-slate-900 text-left rounded-xl font-mono text-xs space-y-1">
                      <p><span className="text-slate-500">Timestamp Hash:</span> {currentVoter.timestamp}</p>
                      <p className="break-all"><span className="text-slate-500">Receipt Index:</span> {currentVoter.receiptHash}</p>
                      <p className="text-slate-300 mt-2 border-t border-slate-800 pt-2">{currentVoter.votedFor}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {positions.map(pos => (
                      <div key={pos} className="space-y-2">
                        <h3 className="text-sm font-black tracking-wider uppercase text-emerald-400 font-mono">{pos} Category</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {candidates.filter(c => c.post === pos).map(cand => {
                            const isChosen = ballotSelections[pos]?.id === cand.id;
                            return (
                              <div key={cand.id} onClick={() => setBallotSelections({...ballotSelections, [pos]: cand})} className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center ${isChosen ? 'border-emerald-500 bg-emerald-950/20' : s.bgCard}`}>
                                <div>
                                  <p className="font-bold">{cand.name}</p>
                                  <p className="text-xs font-mono text-slate-400">{cand.association} Party</p>
                                </div>
                                <div className={`w-4 h-4 rounded-full border ${isChosen ? 'bg-emerald-500 border-emerald-400' : 'border-slate-700'}`} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <button onClick={() => setConfirmVoteModal(true)} className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-500 transition">
                        🗳️ Submit Core Electoral Ballot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {appMode === 'admin' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!isAdminAuthenticated ? (
              <form onSubmit={handleAdminAuthSubmit} className={`p-6 rounded-2xl border ${s.bgCard} max-w-sm mx-auto space-y-4`}>
                <h2 className="text-xl font-black">Security Control</h2>
                <input type="password" required placeholder="Admin Master Key" className={`w-full p-2.5 rounded-xl border text-sm ${s.bgInput}`} value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                <button type="submit" className={`w-full ${s.btnPrimary}`}>Authorize Backend Privileges</button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl border ${s.bgCard} flex gap-2`}>
                  <button onClick={() => setAdminTab('election')} className={`px-3 py-1 text-xs font-bold rounded ${adminTab === 'election' ? 'bg-emerald-600 text-white' : s.btnSec}`}>Params</button>
                  <button onClick={() => setAdminTab('tally')} className={`px-3 py-1 text-xs font-bold rounded ${adminTab === 'tally' ? 'bg-emerald-600 text-white' : s.btnSec}`}>Live Matrix Scores</button>
                </div>

                {adminTab === 'election' && (
                  <div className={`p-6 rounded-2xl border ${s.bgCard}`}>
                    <h3 className="text-lg font-black">Core Node Data Configuration</h3>
                    <p className={`text-xs ${s.textMuted} mt-1`}>Database actively listening and replicating parameter shifts across client interfaces.</p>
                  </div>
                )}

                {adminTab === 'tally' && (
                  <div className={`p-6 rounded-2xl border ${s.bgCard} space-y-4`}>
                    <h3 className="text-lg font-black">Real-Time Score Tally Matrix</h3>
                    {positions.map(pos => (
                      <div key={pos} className="space-y-1">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">{pos}</h4>
                        {candidates.filter(c => c.post === pos).map(cand => (
                          <div key={cand.id} className="flex justify-between text-xs font-mono p-1 border-b border-slate-800/50">
                            <span>{cand.name} ({cand.association})</span>
                            <span className="text-emerald-400 font-bold">{cand.votes} Votes</span>
                          </div>
                        ))}
                      </div>
                    ))}
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
          <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-sm w-full space-y-4`}>
            <h3 className="text-lg font-black">Lock & Cast Ballot?</h3>
            <p className={`text-xs ${s.textMuted}`}>Once written to the matrix infrastructure node, your session token terminates permanently.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmVoteModal(false)} className="flex-1 text-xs py-2 bg-slate-800 rounded-lg font-bold">Cancel</button>
              <button onClick={processCastBallot} className="flex-1 text-xs py-2 bg-emerald-600 text-white font-bold rounded-lg">Confirm Signature</button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 py-4 text-center text-[11px] opacity-40">
        © 2026 INEC National Electronic Voting Verification Prototype Hub. Camera Driver v2.4
      </footer>
    </div>
  );
}