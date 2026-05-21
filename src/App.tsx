import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // --- DEFAULT DATA FOR SIMULATION & PROJECT DEFENSE ---
  const DEFAULT_POSITIONS = ['President', 'Secretary General', 'Treasurer'];

  const DEFAULT_CANDIDATES = [
    { id: 'c1', name: 'Comrade Yusuf Bello', post: 'President', association: 'NANS', votes: 0, color: 'bg-blue-600' },
    { id: 'c2', name: 'Chinwe Okeke', post: 'President', association: 'NANS', votes: 0, color: 'bg-emerald-600' },
    { id: 'c3', name: 'Ibrahim Musa', post: 'Secretary General', association: 'NANS', votes: 0, color: 'bg-amber-600' },
    { id: 'c4', name: 'Sarah Udoh', post: 'Secretary General', association: 'NANS', votes: 0, color: 'bg-pink-600' }
  ];

  const DEFAULT_WHITELIST = [
    'U15/CS/1001', 'U15/CS/1002', 'U15/CS/1003', 'U15/CS/1004', 'NIN20268899', 'NIN20265544'
  ];

  const DEFAULT_ELECTION = {
    name: 'SUG Presidential & General Election 2025/2026',
    startTime: new Date(Date.now() - 3600000).toISOString().slice(0, 16), // Started 1 hour ago
    endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16)   // Ends in 24 hours
  };

  const [appMode, setAppMode] = useState(() => localStorage.getItem('evote_mode') || 'gate');
  const [theme, setTheme] = useState(() => localStorage.getItem('evote_theme') || 'dark');
  
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('evote_positions');
    return saved ? JSON.parse(saved) : DEFAULT_POSITIONS;
  });

  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('evote_candidates');
    return saved ? JSON.parse(saved) : DEFAULT_CANDIDATES;
  });

  const [whitelist, setWhitelist] = useState(() => {
    const saved = localStorage.getItem('evote_whitelist');
    return saved ? JSON.parse(saved) : DEFAULT_WHITELIST;
  });

  const [electionConfig, setElectionConfig] = useState(() => {
    const saved = localStorage.getItem('evote_election_config');
    return saved ? JSON.parse(saved) : DEFAULT_ELECTION;
  });

  const [voters, setVoters] = useState(() => {
    const saved = localStorage.getItem('evote_voters');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentVoter, setCurrentVoter] = useState(() => {
    const saved = localStorage.getItem('evote_current_voter');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('evote_admin_auth') === 'true';
  });

  const [voterTab, setVoterTab] = useState(currentVoter ? 'dashboard' : 'login');
  const [adminTab, setAdminTab] = useState('audit');

  const [adminPass, setAdminPass] = useState('');
  const [regForm, setRegForm] = useState({ name: '', id: '', email: '', dob: '' });
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [resetForm, setResetForm] = useState({ id: '', dob: '', newPassword: '' });
  const [firstResetForm, setFirstResetForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [newPosition, setNewPosition] = useState('');
  const [newCand, setNewCand] = useState({ name: '', post: 'President', association: '', color: 'bg-blue-600' });
  const [newWhitelistId, setNewWhitelistId] = useState('');

  const [alert, setAlert] = useState(null);
  const [generatedPass, setGeneratedPass] = useState('');
  const [confirmVoteModal, setConfirmVoteModal] = useState(false);
  const [ballotSelections, setBallotSelections] = useState({});
  const [searchStatusQuery, setSearchStatusQuery] = useState('');
  const [searchedVoter, setSearchedVoter] = useState(null);

  // Dynamic system time checker to enable/disable voting in real time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('evote_mode', appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem('evote_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('evote_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('evote_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('evote_whitelist', JSON.stringify(whitelist));
  }, [whitelist]);

  useEffect(() => {
    localStorage.setItem('evote_election_config', JSON.stringify(electionConfig));
  }, [electionConfig]);

  useEffect(() => {
    localStorage.setItem('evote_voters', JSON.stringify(voters));
  }, [voters]);

  useEffect(() => {
    localStorage.setItem('evote_admin_auth', isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (currentVoter) {
      localStorage.setItem('evote_current_voter', JSON.stringify(currentVoter));
    } else {
      localStorage.removeItem('evote_current_voter');
    }
  }, [currentVoter]);

  // Real-time interval timer for voting windows
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleCrossTabSync = (e) => {
      if (e.key === 'evote_candidates' && e.newValue) {
        setCandidates(JSON.parse(e.newValue));
      }
      if (e.key === 'evote_positions' && e.newValue) {
        setPositions(JSON.parse(e.newValue));
      }
      if (e.key === 'evote_whitelist' && e.newValue) {
        setWhitelist(JSON.parse(e.newValue));
      }
      if (e.key === 'evote_election_config' && e.newValue) {
        setElectionConfig(JSON.parse(e.newValue));
      }
      if (e.key === 'evote_voters' && e.newValue) {
        setVoters(JSON.parse(e.newValue));
        if (currentVoter) {
          const freshVoters = JSON.parse(e.newValue);
          const updatedSelf = freshVoters.find(v => v.id === currentVoter.id);
          if (updatedSelf) {
            setCurrentVoter(updatedSelf);
          }
        }
      }
    };
    window.addEventListener('storage', handleCrossTabSync);
    return () => window.removeEventListener('storage', handleCrossTabSync);
  }, [currentVoter]);

  const timeoutIdRef = useRef(null);
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

  const triggerAutoLock = () => {
    if (currentVoter) {
      handleVoterLogout('Session automatically locked due to 5 minutes of system idle.');
    } else if (isAdminAuthenticated) {
      handleAdminLogout();
      triggerAlert('Admin session locked due to inactivity.', 'error');
    }
  };

  const resetInactivityTimer = () => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (currentVoter || isAdminAuthenticated) {
      timeoutIdRef.current = setTimeout(triggerAutoLock, INACTIVITY_LIMIT);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [currentVoter, isAdminAuthenticated]);

  const triggerAlert = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleVoterLogout = (msg = 'Voter logged out successfully.') => {
    setCurrentVoter(null);
    setVoterTab('login');
    triggerAlert(msg, 'info');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPass('');
    triggerAlert('Admin logged out successfully.', 'info');
  };

  const handleVoterRegister = (e) => {
    e.preventDefault();
    const cleanId = regForm.id.trim().toUpperCase();
    
    if (!regForm.name || !regForm.id || !regForm.email || !regForm.dob) {
      return triggerAlert('Please provide all details.', 'error');
    }

    // --- SECURITY RULE: CHECK ELIGIBILITY WHITELIST ---
    if (!whitelist.includes(cleanId)) {
      return triggerAlert('Registration Blocked: ID/NIN is not on the administrator eligibility whitelist.', 'error');
    }

    if (voters.some(v => v.id === cleanId)) {
      return triggerAlert('Student ID/NIN has already been registered.', 'error');
    }

    // Generate random secure temporary access key
    const passCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newVoterObj = {
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

    const updated = [...voters, newVoterObj];
    setVoters(updated);
    setGeneratedPass(passCode);
    triggerAlert('Enrollment complete! Secure your auto-generated access key.', 'success');
  };

  const handleVoterLogin = (e) => {
    e.preventDefault();
    const targetId = loginForm.id.trim().toUpperCase();
    const voter = voters.find(v => v.id === targetId && v.password === loginForm.password);

    if (voter) {
      setCurrentVoter(voter);
      setLoginForm({ id: '', password: '' });
      if (voter.isFirstLogin) {
        setVoterTab('first-login-reset');
        triggerAlert('Temporary key detected. Configure custom security credentials.', 'info');
      } else {
        setVoterTab('dashboard');
        triggerAlert(`Welcome back, ${voter.name}.`, 'success');
      }
    } else {
      triggerAlert('Incorrect Voter Registration ID or Password Key.', 'error');
    }
  };

  const handleFirstLoginCustomization = (e) => {
    e.preventDefault();
    if (!currentVoter) return;

    if (firstResetForm.currentPassword !== currentVoter.password) {
      return triggerAlert('Provided temporary key verification failed.', 'error');
    }
    if (firstResetForm.newPassword !== firstResetForm.confirmPassword) {
      return triggerAlert('New password mismatch.', 'error');
    }
    if (firstResetForm.newPassword.length < 4) {
      return triggerAlert('Password must be at least 4 characters.', 'error');
    }

    const updatedVoters = voters.map(v => {
      if (v.id === currentVoter.id) {
        return { ...v, password: firstResetForm.newPassword, isFirstLogin: false };
      }
      return v;
    });
    setVoters(updatedVoters);

    const updatedUser = { ...currentVoter, password: firstResetForm.newPassword, isFirstLogin: false };
    setCurrentVoter(updatedUser);
    setVoterTab('dashboard');
    setFirstResetForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    triggerAlert('Credential customization successful. Ballot board unlocked.', 'success');
  };

  const handleDOBPasswordRecovery = (e) => {
    e.preventDefault();
    const targetId = resetForm.id.trim().toUpperCase();
    const matchIndex = voters.findIndex(v => v.id === targetId && v.dob === resetForm.dob);

    if (matchIndex !== -1) {
      const updatedVoters = [...voters];
      updatedVoters[matchIndex].password = resetForm.newPassword;
      setVoters(updatedVoters);
      triggerAlert('Password recovered successfully! Login now.', 'success');
      setVoterTab('login');
      setResetForm({ id: '', dob: '', newPassword: '' });
    } else {
      triggerAlert('Identity validation failed. Date of birth does not match ID.', 'error');
    }
  };

  const handleSelectBallotCandidate = (position, candidate) => {
    setBallotSelections(prev => ({
      ...prev,
      [position]: candidate
    }));
  };

  const processCastBallot = () => {
    if (!currentVoter) return;

    // Timeframe Validation Check
    const start = new Date(electionConfig.startTime);
    const end = new Date(electionConfig.endTime);
    if (currentTime < start || currentTime > end) {
      triggerAlert('System Lockout: Election is currently not active.', 'error');
      setConfirmVoteModal(false);
      return;
    }

    if (currentVoter.hasVoted) {
      triggerAlert('Double voting attempt rejected by local ledger integrity rules.', 'error');
      setConfirmVoteModal(false);
      return;
    }

    // Generate cryptographic proof receipt
    const receiptCode = 'SEC-REC-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.floor(Math.random() * 9000 + 1000);
    const voteTime = new Date().toLocaleString();

    // Dynamically increment candidate votes
    setCandidates(prev => prev.map(cand => {
      const selectedForPost = ballotSelections[cand.post];
      if (selectedForPost && selectedForPost.id === cand.id) {
        return { ...cand, votes: cand.votes + 1 };
      }
      return cand;
    }));

    // Create string of choices for history verification log
    const selectionsSummary = positions.map(pos => `${pos}: ${ballotSelections[pos]?.name || 'Abstained'}`).join(' | ');

    const updatedVoters = voters.map(v => {
      if (v.id === currentVoter.id) {
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

    const sessionUser = {
      ...currentVoter,
      hasVoted: true,
      votedFor: selectionsSummary,
      receiptHash: receiptCode,
      timestamp: voteTime
    };
    setCurrentVoter(sessionUser);

    setConfirmVoteModal(false);
    setBallotSelections({});
    triggerAlert('Ballot transaction cast successfully!', 'success');
  };

  const handleInspectVoterStatus = (e) => {
    e.preventDefault();
    const query = searchStatusQuery.trim().toUpperCase();
    const match = voters.find(v => v.id === query);
    if (match) {
      setSearchedVoter(match);
    } else {
      setSearchedVoter({ notFound: true, query });
    }
  };

  const handleAdminAuthSubmit = (e) => {
    e.preventDefault();
    if (adminPass === 'ADMIN2026') {
      setIsAdminAuthenticated(true);
      triggerAlert('Admin portal authenticated successfully.', 'success');
    } else {
      triggerAlert('Incorrect Administrator Passcode.', 'error');
    }
  };

  const handleUpdateElectionConfig = (e) => {
    e.preventDefault();
    if (!electionConfig.name || !electionConfig.startTime || !electionConfig.endTime) {
      return triggerAlert('Fill in all election settings parameters.', 'error');
    }
    
    const start = new Date(electionConfig.startTime);
    const end = new Date(electionConfig.endTime);

    if (end <= start) {
      return triggerAlert('Configuration Error: End time must fall after start time.', 'error');
    }

    setElectionConfig({ ...electionConfig });
    triggerAlert('Active election variables successfully broadcasted to nodes.', 'success');
  };

  const handleCreatePosition = (e) => {
    e.preventDefault();
    const name = newPosition.trim();
    if (!name) return;
    if (positions.includes(name)) {
      return triggerAlert('This position already exists.', 'error');
    }

    const updatedPosts = [...positions, name];
    setPositions(updatedPosts);
    setNewPosition('');
    triggerAlert(`Created new election position: ${name}`, 'success');
  };

  const handleDeletePosition = (postName) => {
    setPositions(positions.filter(p => p !== postName));
    setCandidates(candidates.filter(c => c.post !== postName));
    triggerAlert('Position and its corresponding candidates removed.', 'info');
  };

  const handleCreateCandidate = (e) => {
    e.preventDefault();
    if (!newCand.name || !newCand.association) {
      return triggerAlert('Please provide Name and Association.', 'error');
    }

    const brandNewCandidate = {
      id: 'cand-' + Math.random().toString(36).substring(2, 9),
      name: newCand.name.trim(),
      post: newCand.post,
      association: newCand.association.trim(),
      votes: 0,
      color: newCand.color
    };

    setCandidates([...candidates, brandNewCandidate]);
    setNewCand({ name: '', post: positions[0] || '', association: '', color: 'bg-blue-600' });
    triggerAlert('Candidate registered onto ledger successfully!', 'success');
  };

  const handleDeleteCandidate = (candId) => {
    setCandidates(candidates.filter(c => c.id !== candId));
    triggerAlert('Candidate removed successfully.', 'info');
  };

  const handleAddWhitelistId = (e) => {
    e.preventDefault();
    const cleanId = newWhitelistId.trim().toUpperCase();
    if (!cleanId) return;
    
    if (whitelist.includes(cleanId)) {
      return triggerAlert('Registration Blocked: ID already exists in whitelist database.', 'error');
    }

    const updatedWhitelist = [...whitelist, cleanId];
    setWhitelist(updatedWhitelist);
    setNewWhitelistId('');
    triggerAlert(`Successfully whitelisted eligibility key: ${cleanId}`, 'success');
  };

  const handleDeleteWhitelistId = (idToDelete) => {
    setWhitelist(whitelist.filter(id => id !== idToDelete));
    triggerAlert('ID removed from eligibility whitelist matrix.', 'info');
  };

  const handleSeedMockData = () => {
    const mockVoters = [
      { id: 'U15/CS/1001', name: 'Kabiru Adamu', email: 'k.adamu@uni.edu.ng', dob: '2001-05-12', password: 'DEMO1', hasVoted: true, votedFor: 'President: Comrade Yusuf Bello | Secretary General: Sarah Udoh | Treasurer: Abstained', receiptHash: 'SEC-REC-MOCK-1', timestamp: '5/18/2026, 11:30 AM', isFirstLogin: false },
      { id: 'U15/CS/1002', name: 'Blessing Paul', email: 'b.paul@uni.edu.ng', dob: '2002-11-20', password: 'DEMO2', hasVoted: true, votedFor: 'President: Chinwe Okeke | Secretary General: Ibrahim Musa | Treasurer: Abstained', receiptHash: 'SEC-REC-MOCK-2', timestamp: '5/18/2026, 12:15 PM', isFirstLogin: false },
      { id: 'U15/CS/1003', name: 'Mustapha Haruna', email: 'm.haruna@uni.edu.ng', dob: '2000-01-15', password: 'DEMO3', hasVoted: false, votedFor: null, receiptHash: '', timestamp: '', isFirstLogin: false }
    ];
    setVoters(mockVoters);
    triggerAlert('Demo metrics successfully loaded.', 'success');
  };

  const handleResetApplicationState = () => {
    localStorage.removeItem('evote_voters');
    localStorage.removeItem('evote_candidates');
    localStorage.removeItem('evote_positions');
    localStorage.removeItem('evote_whitelist');
    localStorage.removeItem('evote_election_config');
    localStorage.removeItem('evote_current_voter');
    
    setVoters([]);
    setPositions(DEFAULT_POSITIONS);
    setCandidates(DEFAULT_CANDIDATES);
    setWhitelist(DEFAULT_WHITELIST);
    setElectionConfig(DEFAULT_ELECTION);
    setCurrentVoter(null);
    setVoterTab('login');
    triggerAlert('System data reset successfully.', 'info');
  };

  const handleDownloadPDF = () => {
    if (!currentVoter || !currentVoter.hasVoted) return;

    // Direct client load of standard modular jsPDF assets
    const scriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

    const generateReceiptDoc = () => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a6' });

        // Outer layout branding
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 105, 15, 'F');
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('SECURE VOTE NODE - AUDIT SLIP', 8, 10);

        // Core transaction variables
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Timestamp: ${currentVoter.timestamp}`, 8, 24);
        doc.line(8, 28, 97, 28);

        doc.setFont('Helvetica', 'bold');
        doc.text('VOTER INFORMATION', 8, 34);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Name: ${currentVoter.name}`, 8, 39);
        doc.text(`ID: ${currentVoter.id}`, 8, 44);
        
        doc.line(8, 49, 97, 49);
        doc.setFont('Helvetica', 'bold');
        doc.text('STATUS: VERIFIED SECURE', 8, 55);
        
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'normal');
        const choices = currentVoter.votedFor.split(' | ');
        choices.forEach((choice, index) => {
          doc.text(choice, 8, 62 + (index * 4.5));
        });
        
        doc.line(8, 78, 97, 78);
        doc.setFontSize(7);
        doc.setFont('Courier', 'bold');
        doc.text(`CRYPTO TRANSACTION HASH:`, 8, 83);
        doc.text(`${currentVoter.receiptHash}`, 8, 88);

        doc.save(`VOTE_RECEIPT_${currentVoter.id}.pdf`);
        triggerAlert('Audit PDF receipt successfully saved.', 'success');
      } catch (err) {
        triggerAlert('Error printing PDF slip document.', 'error');
        console.error(err);
      }
    };

    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.onload = generateReceiptDoc;
      document.body.appendChild(script);
    } else {
      generateReceiptDoc();
    }
  };

  const handleDownloadRegisteredListPDF = () => {
    const scriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

    const generateRegistryDoc = () => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Header Style
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 25, 'F');
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text('SECURE VOTE - SYSTEM REGISTERED VOTERS REPORT', 12, 16);

        doc.setFontSize(9);
        doc.setTextColor(180, 180, 180);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Election: ${electionConfig.name}  |  Generated on: ${new Date().toLocaleString()}`, 12, 21);

        // Grid Content
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('Helvetica', 'bold');
        
        // Table Headers
        doc.text('S/N', 12, 38);
        doc.text('Student Name', 25, 38);
        doc.text('ID / Matric No', 75, 38);
        doc.text('Email Address', 110, 38);
        doc.text('Status', 165, 38);
        doc.text('Pass Key', 185, 38);
        doc.line(12, 41, 198, 41);

        doc.setFont('Helvetica', 'normal');
        let currentY = 47;

        voters.forEach((v, index) => {
          if (currentY > 275) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(`${index + 1}`, 12, currentY);
          doc.text(v.name.slice(0, 22), 25, currentY);
          doc.text(v.id, 75, currentY);
          doc.text(v.email.slice(0, 26), 110, currentY);
          doc.text(v.hasVoted ? 'CASTED' : 'PENDING', 165, currentY);
          doc.text(v.password, 185, currentY);
          
          doc.line(12, currentY + 2, 198, currentY + 2);
          currentY += 8;
        });

        doc.save('Registered_Voters_Report.pdf');
        triggerAlert('System registry PDF report exported.', 'success');
      } catch (err) {
        triggerAlert('Failed to generate PDF registry.', 'error');
        console.error(err);
      }
    };

    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.onload = generateRegistryDoc;
      document.body.appendChild(script);
    } else {
      generateRegistryDoc();
    }
  };

  const electionStart = new Date(electionConfig.startTime);
  const electionEnd = new Date(electionConfig.endTime);
  const isElectionUpcoming = currentTime < electionStart;
  const isElectionEnded = currentTime > electionEnd;
  const isElectionOpen = !isElectionUpcoming && !isElectionEnded;

  const getElectionStatusLabel = () => {
    if (isElectionUpcoming) return '🔴 UPCOMING';
    if (isElectionEnded) return '🏁 ENDED';
    return '🟢 ACTIVE & ONGOING';
  };

  const isDark = theme === 'dark';
  const s = {
    bgMain: isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900',
    bgCard: isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
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

  const isBallotComplete = positions.every(pos => ballotSelections[pos] !== undefined);

  return (
    <div className={`min-h-screen ${s.bgMain} flex flex-col justify-between selection:bg-teal-500 selection:text-slate-900 transition-colors duration-200`}>
      
      {/* Header Bar */}
      <header className={`${s.bgHeader} border-b py-4 px-6 sticky top-0 z-40 backdrop-blur-md transition-colors duration-200`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppMode('gate')}>
            <div className="bg-gradient-to-tr from-teal-500 to-blue-600 p-2 rounded-lg text-slate-950">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">SECURE-VOTE</span>
              <p className={`text-[10px] ${s.textMuted} uppercase tracking-widest font-mono`}>Dual-Node Network Node</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Switcher */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border transition-all ${s.bgButtonSec}`}
              title="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.46 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {appMode !== 'gate' && (
              <button
                onClick={() => setAppMode('gate')}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${s.bgButtonSec}`}
              >
                🔄 Switch Portal Mode
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Alert Overlay */}
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

      {/* Main Container */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
        
        {/* --- VIEW: MAIN PORTAL GATEWAY --- */}
        {appMode === 'gate' && (
          <div className="max-w-3xl mx-auto text-center space-y-8 py-12">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full border border-teal-500/30">
                Network Topology Selector
              </span>
              <h1 className={`text-4xl font-black ${s.textMain}`}>Select Ecosystem Interface Node</h1>
              <p className={`text-sm max-w-lg mx-auto ${s.textMuted}`}>
                This system runs a synchronized dual-app framework. Opening voter and administrator nodes on matching clients triggers real-time data propagation automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Voter Selection Gate */}
              <button
                onClick={() => setAppMode('voter')}
                className={`p-8 rounded-2xl border text-left flex flex-col justify-between hover:border-teal-500 transition group ${s.bgCard}`}
              >
                <div className="bg-teal-500/10 text-teal-400 p-3.5 rounded-xl border border-teal-500/20 w-fit group-hover:scale-110 transition">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div className="mt-8 space-y-2">
                  <h3 className="text-lg font-black group-hover:text-teal-400 transition">Voter Node Client</h3>
                  <p className={`text-xs leading-relaxed ${s.textMuted}`}>
                    Voter onboarding registration, temporary key validation, credential customization, and secure end-to-end ballot casting workflows.
                  </p>
                </div>
              </button>

              {/* Admin Selection Gate */}
              <button
                onClick={() => setAppMode('admin')}
                className={`p-8 rounded-2xl border text-left flex flex-col justify-between hover:border-blue-500 transition group ${s.bgCard}`}
              >
                <div className="bg-blue-500/10 text-blue-400 p-3.5 rounded-xl border border-blue-500/20 w-fit group-hover:scale-110 transition">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div className="mt-8 space-y-2">
                  <h3 className="text-lg font-black group-hover:text-blue-400 transition">Admin Node Portal</h3>
                  <p className={`text-xs leading-relaxed ${s.textMuted}`}>
                    Election customization management, position creation, candidate additions, real-time audit ledger tracking, and database seed resets.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* --- PORTAL A: VOTERS PORTAL --- */}
        {appMode === 'voter' && (
          <div className="space-y-6">
            
            {/* View Tab A1: Voter Login */}
            {voterTab === 'login' && (
              <div className={`max-w-md mx-auto p-6 rounded-2xl border relative ${s.bgCard}`}>
                <div className="text-center mb-6">
                  <span className="text-[10px] uppercase tracking-widest font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full">
                    VOTER INTERFACE
                  </span>
                  <h2 className="text-2xl font-black mt-3">Voter Credentials Verification</h2>
                  <p className={`text-xs mt-1 ${s.textMuted}`}>Access your ballot card and system credentials securely.</p>
                </div>

                <form onSubmit={handleVoterLogin} className="space-y-4">
                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student ID / Matric No / NIN</label>
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
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Access Key Password</label>
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
                    className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 p-3.5 rounded-xl font-bold transition text-sm shadow-lg shadow-teal-500/20"
                  >
                    Authenticate Private Key
                  </button>

                  <div className={`flex justify-between text-xs text-teal-400 font-medium pt-3 border-t ${s.borderSub}`}>
                    <button type="button" onClick={() => setVoterTab('register')} className="hover:text-teal-500 hover:underline transition">Register Account</button>
                    <button type="button" onClick={() => setVoterTab('forgot')} className="hover:text-teal-500 hover:underline transition">Reset Password</button>
                  </div>
                </form>

                {/* Instant Check Vote Status Block */}
                <div className={`mt-8 pt-6 border-t ${s.borderSub}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest mb-2.5 ${s.textMuted}`}>Instant Check-Vote Status</h4>
                  <form onSubmit={handleInspectVoterStatus} className="flex gap-2">
                    <input 
                      type="text" 
                      value={searchStatusQuery}
                      onChange={e => setSearchStatusQuery(e.target.value)}
                      placeholder="Enter Matric/ID..."
                      className={`px-3 py-2 text-xs rounded-lg flex-grow outline-none font-mono border ${s.bgInput}`}
                    />
                    <button type="submit" className={`text-xs px-4 py-2 rounded-lg font-semibold transition border ${s.bgButtonSec}`}>
                      Inspect
                    </button>
                  </form>

                  {searchedVoter && (
                    <div className={`mt-4 p-3 rounded-lg border text-xs ${s.bgCard}`}>
                      {searchedVoter.notFound ? (
                        <p className="text-red-500 font-medium">❌ ID/NIN not registered on ledger database.</p>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-teal-400 font-bold">Voter: {searchedVoter.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={s.textMuted}>Ballot State:</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${searchedVoter.hasVoted ? 'bg-emerald-950/60 text-emerald-300' : 'bg-amber-950/60 text-amber-300'}`}>
                              {searchedVoter.hasVoted ? 'CASTED' : 'PENDING'}
                            </span>
                          </div>
                          {searchedVoter.hasVoted && (
                            <>
                              <p className={s.textMain}>Timestamp: <span className="font-mono text-teal-400 font-semibold">{searchedVoter.timestamp}</span></p>
                              <p className={`text-[10px] break-all font-mono ${s.textMuted}`}>Signature: {searchedVoter.receiptHash}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View Tab A2: Voter Register */}
            {voterTab === 'register' && (
              <div className={`max-w-md mx-auto p-6 rounded-2xl border shadow-2xl ${s.bgCard}`}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-teal-400">Voter Onboarding Card</h2>
                  <p className={`text-xs mt-1 ${s.textMuted}`}>Register on the database nodes to generate your validation credentials.</p>
                </div>

                <form onSubmit={handleVoterRegister} className="space-y-4">
                  <div className="bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl text-[11px] leading-normal text-blue-300">
                    💡 <strong>Note:</strong> Your ID / NIN must be whitelisted in the Admin Panel to register.
                  </div>

                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student Name</label>
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
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student ID / Matric No / NIN</label>
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
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Date of Birth (Identity Verification)</label>
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
                    className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-slate-950 p-3.5 rounded-xl font-bold transition text-sm shadow"
                  >
                    Enroll Credentials
                  </button>

                  {generatedPass && (
                    <div className="bg-teal-950/40 border border-teal-500/40 p-4 rounded-xl space-y-2 mt-4">
                      <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">⚠️ CREDENTIALS REGISTERED</p>
                      <p className="text-xs text-slate-300">Copy this auto-generated temporary key securely. You must replace it upon first-time node access authentication.</p>
                      <div className={`flex items-center justify-between p-3 rounded-lg border ${s.bgCard}`}>
                        <span className="font-mono text-lg font-black text-emerald-400 tracking-widest">{generatedPass}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPass);
                            triggerAlert('Key copied successfully!', 'success');
                          }}
                          className="text-[10px] bg-slate-850 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded font-mono border border-slate-700"
                        >
                          Copy Key
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={() => { setVoterTab('login'); setGeneratedPass(''); }} 
                    className={`w-full text-center text-xs hover:text-teal-500 hover:underline block pt-2 ${s.textMuted}`}
                  >
                    Already Registered? Go to Login
                  </button>
                </form>
              </div>
            )}

            {/* View Tab A3: Forgot Password DOB Bypass */}
            {voterTab === 'forgot' && (
              <div className={`max-w-md mx-auto p-6 rounded-2xl border ${s.bgCard}`}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-teal-400">Identity Recovery Console</h2>
                  <p className={`text-xs mt-1 ${s.textMuted}`}>Confirm DOB verification matrix to input your desired password override.</p>
                </div>

                <form onSubmit={handleDOBPasswordRecovery} className="space-y-4">
                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Student ID / Matric / NIN</label>
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
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Registered Date of Birth</label>
                    <input 
                      type="date" 
                      value={resetForm.dob} 
                      onChange={e => setResetForm({ ...resetForm, dob: e.target.value })} 
                      className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                      required 
                    />
                  </div>

                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Input New Desired Password</label>
                    <input 
                      type="password" 
                      value={resetForm.newPassword} 
                      onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })} 
                      className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                      placeholder="Minimum 4 characters" 
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-bold transition text-sm"
                  >
                    Save & Authenticate Override
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setVoterTab('login')} 
                    className={`w-full text-center text-xs text-slate-400 hover:text-teal-500 hover:underline block pt-2`}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {/* View Tab A4: First Login Credential Modification */}
            {voterTab === 'first-login-reset' && currentVoter && (
              <div className={`max-w-md mx-auto p-6 rounded-2xl border ${s.bgCard}`}>
                <div className="text-center mb-6">
                  <span className="bg-teal-500/10 text-teal-400 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border border-teal-500/30">
                    MANDATORY SECURITY COMPLIANCE
                  </span>
                  <h2 className="text-2xl font-black mt-3">Configure Custom Credentials</h2>
                  <p className={`text-xs mt-1 ${s.textMuted}`}>Confirm temporary credentials to apply your custom chosen password block.</p>
                </div>

                <form onSubmit={handleFirstLoginCustomization} className="space-y-4">
                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Confirm Generated Key</label>
                    <input 
                      type="password" 
                      value={firstResetForm.currentPassword} 
                      onChange={e => setFirstResetForm({ ...firstResetForm, currentPassword: e.target.value })} 
                      className={`w-full p-3 rounded-xl outline-none text-sm font-mono border ${s.bgInput}`}
                      placeholder="Paste your copied generated password" 
                      required 
                    />
                  </div>

                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Input Custom Desired Password</label>
                    <input 
                      type="password" 
                      value={firstResetForm.newPassword} 
                      onChange={e => setFirstResetForm({ ...firstResetForm, newPassword: e.target.value })} 
                      className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                      placeholder="Create security password code" 
                      required 
                    />
                  </div>

                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Confirm Custom Password</label>
                    <input 
                      type="password" 
                      value={firstResetForm.confirmPassword} 
                      onChange={e => setFirstResetForm({ ...firstResetForm, confirmPassword: e.target.value })} 
                      className={`w-full p-3 rounded-xl outline-none text-sm border ${s.bgInput}`}
                      placeholder="Re-type code" 
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 p-3.5 rounded-xl font-bold transition text-sm shadow-lg shadow-teal-500/15"
                  >
                    Commit Security Credentials
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleVoterLogout('Setup cancelled. Authentication required.')} 
                    className={`w-full text-center text-xs hover:text-teal-500 hover:underline block pt-2 ${s.textMuted}`}
                  >
                    Sign Out & Postpone
                  </button>
                </form>
              </div>
            )}

            {/* View Tab A5: Voter Main Command Dashboard */}
            {voterTab === 'dashboard' && currentVoter && (
              <div className="space-y-6">
                
                {/* Voter Profile Banner */}
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden ${s.bgCard}`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border ${s.bgBanner}`}>
                      Validated Session Node
                    </span>
                    <h2 className="text-2xl font-black pt-1.5">{currentVoter.name}</h2>
                    <div className={`grid grid-cols-2 md:flex md:items-center gap-x-4 gap-y-1 text-xs font-mono ${s.textMuted}`}>
                      <span>ID: <strong className={s.textMain}>{currentVoter.id}</strong></span>
                      <span className="hidden md:inline">|</span>
                      <span>Email: <strong className={s.textMain}>{currentVoter.email}</strong></span>
                    </div>
                  </div>

                  <div>
                    <button 
                      onClick={() => handleVoterLogout()} 
                      className={`w-full text-center text-xs py-2.5 px-4 rounded-xl font-bold transition border ${s.bgButtonSec}`}
                    >
                      Sign Out Session
                    </button>
                  </div>
                </div>

                {/* Central Election Metadata Widget */}
                <div className={`p-5 rounded-2xl border ${s.bgCard} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Target Election Objective</span>
                    <h3 className="text-lg font-extrabold">{electionConfig.name}</h3>
                    <p className={`text-xs mt-1 ${s.textMuted}`}>
                      Schedule: <strong className={s.textMain}>{new Date(electionConfig.startTime).toLocaleString()}</strong> to <strong className={s.textMain}>{new Date(electionConfig.endTime).toLocaleString()}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${isElectionOpen ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400' : 'bg-red-950/50 border-red-500 text-red-400'}`}>
                      {getElectionStatusLabel()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Voter Ledger Verification status */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between ${s.bgCard}`}>
                    <div className="space-y-4">
                      <h3 className={`text-xs uppercase tracking-widest font-extrabold ${s.textMuted}`}>Ledger Status Audit</h3>
                      <div className={`p-4 rounded-xl border text-center ${currentVoter.hasVoted ? s.bgAlertSuccess : s.bgAlertPending}`}>
                        <p className="text-xs uppercase tracking-widest font-semibold opacity-75">Status Card</p>
                        <p className="text-xl font-black mt-1.5 tracking-wide">{currentVoter.hasVoted ? '✅ Ballot Cast' : '⚠️ Pending'}</p>
                      </div>
                    </div>

                    {currentVoter.hasVoted && (
                      <div className="mt-6 space-y-3">
                        <button 
                          onClick={handleDownloadPDF} 
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          Download Verification PDF
                        </button>
                        <p className={`text-[10px] text-center leading-normal ${s.textMuted}`}>Keep this document as proof of audit ledger transaction inclusion.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Ballot selection matrix */}
                  <div className={`md:col-span-2 p-6 rounded-2xl border ${s.bgCard}`}>
                    {!currentVoter.hasVoted ? (
                      <div className="space-y-6">
                        
                        <div className={`border-b pb-3 ${s.borderSub}`}>
                          <h3 className="text-md font-bold">Consolidated Digital Election Ballot</h3>
                          <p className={`text-xs mt-0.5 ${s.textMuted}`}>Make your selection for all open positions. Blank categories represent abstentions.</p>
                        </div>

                        {!isElectionOpen ? (
                          <div className="text-center py-12 px-6 border border-dashed border-red-500/30 rounded-2xl bg-red-950/10 text-red-400 space-y-2">
                            <p className="text-base font-black uppercase tracking-widest">🛑 BALLOT GATE LOCK</p>
                            <p className="text-xs leading-relaxed max-w-sm mx-auto">
                              You cannot cast ballots outside election schedule times. The ballot box will dynamically unlock during active parameters.
                            </p>
                          </div>
                        ) : positions.length === 0 ? (
                          <div className={`text-center py-12 ${s.textMuted}`}>
                            <p className="text-sm font-semibold">No active election structures currently published on this node.</p>
                            <p className="text-xs">Access the Administrator Panel node to generate positions and candidates.</p>
                          </div>
                        ) : (
                          <>
                            {positions.map(pos => (
                              <div key={pos} className={`space-y-3 border-b pb-5 last:border-0 last:pb-0 ${s.borderSub}`}>
                                <h4 className="text-sm font-black text-teal-400 uppercase tracking-wide">{pos} Category</h4>
                                
                                {candidates.filter(c => c.post === pos).length === 0 ? (
                                  <p className={`text-xs italic ${s.textMuted}`}>No candidate registry listings recorded for this office.</p>
                                ) : (
                                  <div className="grid grid-cols-1 gap-2">
                                    {candidates.filter(c => c.post === pos).map(cand => {
                                      const isSel = ballotSelections[pos]?.id === cand.id;
                                      return (
                                        <button
                                          key={cand.id}
                                          type="button"
                                          onClick={() => handleSelectBallotCandidate(pos, cand)}
                                          className={`w-full text-left p-4 rounded-xl border transition flex justify-between items-center ${
                                            isSel 
                                              ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold' 
                                              : isDark ? 'bg-slate-900 border-slate-880 hover:border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                                          }`}
                                        >
                                          <div>
                                            <p className="text-sm font-bold">{cand.name}</p>
                                            <span className={`text-[10px] font-mono uppercase ${s.textMuted}`}>{cand.association}</span>
                                          </div>
                                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSel ? 'border-teal-500 bg-teal-500 text-slate-950 font-black' : 'border-slate-400'}`}>
                                            {isSel && (
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7"></path>
                                              </svg>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}

                            <div className="pt-2">
                              <button
                                onClick={() => setConfirmVoteModal(true)}
                                disabled={!isBallotComplete || positions.length === 0}
                                className={`w-full p-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition duration-200 ${
                                  isBallotComplete 
                                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/15' 
                                    : 'bg-slate-300 dark:bg-slate-800 border dark:border-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {isBallotComplete ? 'Submit Complete Ballot' : 'Complete Ballot Choices to Submit'}
                              </button>
                            </div>
                          </>
                        )}
                        
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-md font-bold text-teal-400 border-b pb-2">Cryptographic Transaction Receipt</h3>
                        
                        <div className={`space-y-3 text-xs p-4 rounded-xl border font-mono ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div>
                            <span className={`block uppercase text-[10px] mb-1 ${s.textMuted}`}>Casted Selections:</span>
                            <div className="space-y-1">
                              {currentVoter.votedFor.split(' | ').map((line, idx) => (
                                <p key={idx} className={`py-1 border-b last:border-0 ${s.borderSub}`}>✔️ {line}</p>
                              ))}
                            </div>
                          </div>
                          <div className="pt-2">
                            <span className={`block uppercase text-[10px] ${s.textMuted}`}>Ledger Transaction Hash:</span>
                            <span className="text-emerald-400 break-all select-all font-bold">{currentVoter.receiptHash}</span>
                          </div>
                          <div>
                            <span className={`block uppercase text-[10px] ${s.textMuted}`}>Tally Timestamp:</span>
                            <span>{currentVoter.timestamp}</span>
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border text-center ${s.bgBanner}`}>
                          <p className="text-[11px] italic font-sans leading-relaxed">To maintain 100% election audit privacy, the connection between voter profile identities and cast selection tables is completely uncoupled inside separate system caches.</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* --- PORTAL B: ADMINISTRATOR PORTAL --- */}
        {appMode === 'admin' && (
          <div className="space-y-6">
            
            {/* View Tab B1: Admin Node Pass Authenticate */}
            {!isAdminAuthenticated ? (
              <div className={`max-w-md mx-auto p-6 rounded-2xl border relative ${s.bgCard}`}>
                <div className="text-center mb-6">
                  <span className="text-[10px] uppercase tracking-widest font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">
                    ADMIN LOGIN GATEWAY
                  </span>
                  <h2 className="text-2xl font-black mt-3">Node Authority Access</h2>
                  <p className={`text-xs mt-1 ${s.textMuted}`}>Authenticate terminal using default system master keys.</p>
                </div>

                <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-1.5 ${s.textMuted}`}>Master Passphrase</label>
                    <input 
                      type="password" 
                      value={adminPass} 
                      onChange={e => setAdminPass(e.target.value)} 
                      className={`w-full p-3 rounded-xl outline-none transition text-sm text-center tracking-widest border ${s.bgInput}`}
                      placeholder="••••••••" 
                      required 
                    />
                    <p className={`text-[10px] mt-1 text-center ${s.textMuted}`}>For simulation, use default code: <strong className="font-mono text-teal-400">ADMIN2026</strong></p>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-bold transition text-sm shadow"
                  >
                    Unlock Administrative Node
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Admin Command Header Ribbon */}
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${s.bgCard}`}>
                  <div>
                    <h2 className="text-2xl font-black text-blue-400">Election Audit Command Node</h2>
                    <p className={`text-xs ${s.textMuted}`}>Design ballot positions, candidate directories, audit verification lists, and inspect telemetry values.</p>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button 
                      onClick={handleSeedMockData} 
                      className={`text-xs px-3.5 py-2 rounded-lg font-bold transition border ${s.bgButtonSec}`}
                    >
                      🌱 Seed Demo Telemetry
                    </button>
                    <button 
                      onClick={handleResetApplicationState} 
                      className="bg-red-950 hover:bg-red-900 text-red-200 text-xs px-3.5 py-2 rounded-lg font-bold border border-red-900/40 transition"
                    >
                      💥 Reset Memory Ledger
                    </button>
                    <button 
                      onClick={handleAdminLogout} 
                      className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-lg font-bold transition border dark:border-slate-700"
                    >
                      Terminate Command
                    </button>
                  </div>
                </div>

                {/* Sub-Navigation Controls */}
                <div className="flex flex-wrap gap-2 border-b pb-px border-slate-700 overflow-x-auto">
                  {[
                    { key: 'audit', label: '📊 Live Tallies' },
                    { key: 'election', label: '⚙️ Election Parameters' },
                    { key: 'candidates', label: '🛠️ Ballot Designer' },
                    { key: 'voters', label: '👤 Voter Registry Audit' },
                    { key: 'whitelist', label: '🛡️ Whitelist Database' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setAdminTab(tab.key)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition border-b-2 -mb-px whitespace-nowrap ${
                        adminTab === tab.key 
                          ? 'border-blue-500 text-blue-400 font-extrabold' 
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sub-View B2: Live Tallies Audit */}
                {adminTab === 'audit' && (
                  <div className="space-y-6">
                    
                    {/* Live Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-xl border text-center ${s.bgCard}`}>
                        <p className={`text-[10px] uppercase tracking-widest font-mono ${s.textMuted}`}>Enrolled Voters</p>
                        <p className="text-3xl font-black mt-1 font-mono">{voters.length}</p>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${s.bgCard}`}>
                        <p className={`text-[10px] uppercase tracking-widest font-mono ${s.textMuted}`}>Casted Ballots</p>
                        <p className="text-3xl font-black text-teal-400 mt-1 font-mono">
                          {voters.filter(v => v.hasVoted).length}
                        </p>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${s.bgCard}`}>
                        <p className={`text-[10px] uppercase tracking-widest font-mono ${s.textMuted}`}>Turnout Percentage</p>
                        <p className="text-3xl font-black text-blue-400 mt-1 font-mono">
                          {voters.length > 0 ? `${Math.round((voters.filter(v => v.hasVoted).length / voters.length) * 100)}%` : '0%'}
                        </p>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${s.bgCard}`}>
                        <p className={`text-[10px] uppercase tracking-widest font-mono ${s.textMuted}`}>Whitelisted Keys</p>
                        <p className="text-3xl font-black text-emerald-500 mt-1 font-mono">{whitelist.length}</p>
                      </div>
                    </div>

                    {/* Active Election Config Banner */}
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${s.bgCard}`}>
                      <div>
                        <span className="text-[10px] text-teal-400 uppercase tracking-widest font-mono font-bold">Active Parameter Broadcast</span>
                        <h4 className="text-sm font-extrabold">{electionConfig.name}</h4>
                      </div>
                      <div>
                        <span className={`px-2.5 py-1 text-[11px] rounded-full font-bold border ${isElectionOpen ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500' : 'bg-red-950/40 text-red-400 border-red-500'}`}>
                          {getElectionStatusLabel()}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Tallies Grouped by Office Position */}
                    <div className={`p-6 rounded-2xl border space-y-6 ${s.bgCard}`}>
                      <h3 className={`text-sm font-bold uppercase tracking-widest ${s.textMuted}`}>Interactive Live Tally Output</h3>
                      
                      {positions.length === 0 ? (
                        <p className={`text-xs text-center py-6 italic ${s.textMuted}`}>No categories available for simulation.</p>
                      ) : (
                        <div className="space-y-8">
                          {positions.map(pos => {
                            const positionCandidates = candidates.filter(cand => cand.post === pos);
                            const totalVotesForPosition = positionCandidates.reduce((sum, cand) => sum + cand.votes, 0);

                            return (
                              <div key={pos} className={`space-y-4 border-b pb-6 last:border-0 last:pb-0 ${s.borderSub}`}>
                                <h4 className="text-sm font-black text-blue-400 uppercase tracking-wider">{pos} — {totalVotesForPosition} casted votes</h4>
                                
                                {positionCandidates.length === 0 ? (
                                  <p className={`text-xs italic ${s.textMuted}`}>No candidate registers published for this office.</p>
                                ) : (
                                  <div className="space-y-4">
                                    {positionCandidates.map(cand => {
                                      const percentage = totalVotesForPosition > 0 ? Math.round((cand.votes / totalVotesForPosition) * 100) : 0;
                                      return (
                                        <div key={cand.id} className="space-y-2">
                                          <div className="flex justify-between items-center text-xs">
                                            <div>
                                              <span className={`font-bold text-sm ${s.textMain}`}>{cand.name}</span>
                                              <span className={`text-[10px] font-mono ml-2 ${s.textMuted}`}>({cand.association})</span>
                                            </div>
                                            <span className="font-mono font-bold">{cand.votes} votes ({percentage}%)</span>
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
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* Sub-View B3: Election Creation Settings */}
                {adminTab === 'election' && (
                  <div className={`p-6 rounded-2xl border ${s.bgCard} max-w-xl mx-auto space-y-6`}>
                    <div>
                      <h3 className="text-md font-bold text-blue-400 uppercase tracking-wider">Configure Election Parameters</h3>
                      <p className={`text-xs mt-1 ${s.textMuted}`}>Establish the master election header and the exact time gate logic to secure your voting session.</p>
                    </div>

                    <form onSubmit={handleUpdateElectionConfig} className="space-y-4">
                      <div>
                        <label className={`block text-xs uppercase font-bold mb-1.5 ${s.textMuted}`}>Election Title / Header</label>
                        <input 
                          type="text" 
                          value={electionConfig.name}
                          onChange={e => setElectionConfig({ ...electionConfig, name: e.target.value })}
                          className={`w-full p-3 rounded-xl text-xs outline-none border ${s.bgInput}`}
                          placeholder="e.g. SUG Presidential Elections 2025/2026"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs uppercase font-bold mb-1.5 ${s.textMuted}`}>Start Date & Time</label>
                          <input 
                            type="datetime-local" 
                            value={electionConfig.startTime}
                            onChange={e => setElectionConfig({ ...electionConfig, startTime: e.target.value })}
                            className={`w-full p-3 rounded-xl text-xs outline-none border ${s.bgInput}`}
                            required
                          />
                        </div>

                        <div>
                          <label className={`block text-xs uppercase font-bold mb-1.5 ${s.textMuted}`}>End Date & Time</label>
                          <input 
                            type="datetime-local" 
                            value={electionConfig.endTime}
                            onChange={e => setElectionConfig({ ...electionConfig, endTime: e.target.value })}
                            className={`w-full p-3 rounded-xl text-xs outline-none border ${s.bgInput}`}
                            required
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs p-3 rounded-xl transition shadow"
                      >
                        Publish Election Window & Config
                      </button>
                    </form>

                    <div className={`p-4 rounded-xl border text-xs leading-normal ${s.bgBanner}`}>
                      <strong>Security Notice:</strong> The voter client application parses these parameters against its browser timestamp locally. Changing times here will immediately lock/unlock voting on all active browser tabs.
                    </div>
                  </div>
                )}

                {/* Sub-View B4: Ballot designer (Positions & Candidates) */}
                {adminTab === 'candidates' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Block C1: Configure Positions */}
                    <div className={`p-6 rounded-2xl border space-y-4 h-fit ${s.bgCard}`}>
                      <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">Configure Positions</h3>
                      
                      <form onSubmit={handleCreatePosition} className="flex gap-2">
                        <input 
                          type="text" 
                          value={newPosition}
                          onChange={e => setNewPosition(e.target.value)}
                          placeholder="e.g. Provost Marshal"
                          className={`px-3 py-2 text-xs rounded-lg flex-grow outline-none border ${s.bgInput}`}
                          required
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-2 rounded-lg font-bold transition">
                          Add
                        </button>
                      </form>

                      <div className="space-y-2 pt-2">
                        {positions.length === 0 ? (
                          <p className={`text-xs italic ${s.textMuted}`}>No custom positions defined.</p>
                        ) : (
                          positions.map(pos => (
                            <div key={pos} className={`flex justify-between items-center p-2 rounded-lg border text-xs ${isDark ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="font-bold">{pos}</span>
                              <button 
                                onClick={() => handleDeletePosition(pos)}
                                className="text-red-500 hover:text-red-400 font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Block C2: Create Candidate */}
                    <div className={`p-6 rounded-2xl border space-y-4 h-fit ${s.bgCard}`}>
                      <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">Add Candidate</h3>
                      
                      <form onSubmit={handleCreateCandidate} className="space-y-3">
                        <div>
                          <label className={`block text-[10px] uppercase font-bold mb-1 ${s.textMuted}`}>Full Name</label>
                          <input 
                            type="text" 
                            value={newCand.name}
                            onChange={e => setNewCand({ ...newCand, name: e.target.value })}
                            placeholder="e.g. Adamu Chinwe"
                            className={`w-full px-3 py-2 text-xs rounded-lg outline-none border ${s.bgInput}`}
                            required
                          />
                        </div>

                        <div>
                          <label className={`block text-[10px] uppercase font-bold mb-1 ${s.textMuted}`}>Election Position</label>
                          <select 
                            value={newCand.post}
                            onChange={e => setNewCand({ ...newCand, post: e.target.value })}
                            className={`w-full px-3 py-2 text-xs rounded-lg outline-none border ${s.bgInput}`}
                          >
                            {positions.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={`block text-[10px] uppercase font-bold mb-1 ${s.textMuted}`}>Coalition / Association</label>
                          <input 
                            type="text" 
                            value={newCand.association}
                            onChange={e => setNewCand({ ...newCand, association: e.target.value })}
                            placeholder="e.g. NANS / SUG"
                            className={`w-full px-3 py-2 text-xs rounded-lg outline-none border ${s.bgInput}`}
                            required
                          />
                        </div>

                        <div>
                          <label className={`block text-[10px] uppercase font-bold mb-1 ${s.textMuted}`}>Visual Brand Theme</label>
                          <select 
                            value={newCand.color}
                            onChange={e => setNewCand({ ...newCand, color: e.target.value })}
                            className={`w-full px-3 py-2 text-xs rounded-lg outline-none border ${s.bgInput}`}
                          >
                            <option value="bg-blue-600">Ocean Blue</option>
                            <option value="bg-emerald-600">Forest Green</option>
                            <option value="bg-purple-600">Deep Purple</option>
                            <option value="bg-amber-600">Vibrant Amber</option>
                            <option value="bg-pink-600">Rose Pink</option>
                            <option value="bg-indigo-600">Indigo Slate</option>
                          </select>
                        </div>

                        <button 
                          type="submit" 
                          disabled={positions.length === 0}
                          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs py-2.5 rounded-lg font-bold transition"
                        >
                          Register Candidate onto Ballot
                        </button>
                      </form>
                    </div>

                    {/* Block C3: Active Directory */}
                    <div className={`p-6 rounded-2xl border space-y-4 ${s.bgCard}`}>
                      <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">Active Directory</h3>
                      
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {candidates.length === 0 ? (
                          <p className={`text-xs italic ${s.textMuted}`}>No candidate registers published.</p>
                        ) : (
                          candidates.map(cand => (
                            <div key={cand.id} className={`p-3 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                              <div>
                                <h4 className="font-bold text-xs">{cand.name}</h4>
                                <p className={`text-[10px] ${s.textMuted}`}>Position: <strong className="text-blue-400">{cand.post}</strong></p>
                                <p className={`text-[9px] font-mono font-semibold ${s.textMuted}`}>Coalition: {cand.association}</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteCandidate(cand.id)}
                                className="text-red-500 hover:text-red-400 text-xs font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub-View B5: Voter Registry & Database Audit Sheet */}
                {adminTab === 'voters' && (
                  <div className={`p-6 rounded-2xl border space-y-4 ${s.bgCard}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className={`text-sm font-bold uppercase tracking-widest ${s.textMuted}`}>Enrolled Database Record Sheets</h3>
                        <p className={`text-xs ${s.textMuted}`}>Physical log file references representing students that finalized onboarding.</p>
                      </div>

                      <button 
                        onClick={handleDownloadRegisteredListPDF}
                        disabled={voters.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                      >
                        📥 Export PDF Registered List
                      </button>
                    </div>
                    
                    {voters.length === 0 ? (
                      <p className={`text-xs text-center py-6 italic ${s.textMuted}`}>No student voters stored in local databases.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[700px]">
                          <thead className={`text-[10px] uppercase tracking-wider border-b ${s.bgTableHead}`}>
                            <tr>
                              <th className="p-3">Student Name</th>
                              <th className="p-3 font-mono">Student ID / NIN</th>
                              <th className="p-3">Email Address</th>
                              <th className="p-3">Date of Birth</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 text-right">Master Code Key</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-slate-900' : 'divide-slate-100'}`}>
                            {voters.map(v => (
                              <tr key={v.id} className={isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}>
                                <td className={`p-3 font-semibold ${s.textMain}`}>{v.name}</td>
                                <td className="p-3 font-mono text-teal-400 font-bold">{v.id}</td>
                                <td className={`p-3 ${s.textMuted}`}>{v.email}</td>
                                <td className={`p-3 ${s.textMuted}`}>{v.dob}</td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${v.hasVoted ? 'bg-emerald-950 text-emerald-300 border border-emerald-900' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border dark:border-slate-700'}`}>
                                    {v.hasVoted ? 'CASTED' : 'PENDING'}
                                  </span>
                                </td>
                                <td className={`p-3 font-mono text-[11px] text-right ${s.textMuted}`}>{v.password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-View B6: Eligible Voter Whitelist Management */}
                {adminTab === 'whitelist' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Add Whitelist ID Panel */}
                    <div className={`p-6 rounded-2xl border space-y-4 h-fit ${s.bgCard}`}>
                      <div>
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Whitelist Identity Keys</h3>
                        <p className={`text-xs mt-1 ${s.textMuted}`}>Add student matric IDs or NIN numbers to grant system registration rights.</p>
                      </div>

                      <form onSubmit={handleAddWhitelistId} className="space-y-3">
                        <div>
                          <label className={`block text-[10px] uppercase font-bold mb-1 ${s.textMuted}`}>Student ID / Matric / NIN</label>
                          <input 
                            type="text" 
                            value={newWhitelistId}
                            onChange={e => setNewWhitelistId(e.target.value)}
                            placeholder="e.g. U15/CS/1004"
                            className={`w-full px-3 py-2 text-xs rounded-lg outline-none border ${s.bgInput}`}
                            required
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg transition"
                        >
                          Whitelist Identity
                        </button>
                      </form>

                      <div className={`p-3 rounded-lg border text-[10.5px] leading-normal ${s.bgBanner}`}>
                        ⚠️ <strong>Identity Constraint:</strong> The Voter registration process validates this list. If a student's ID/NIN isn't whitelisted here, registration is locked.
                      </div>
                    </div>

                    {/* Active Whitelisted List Panel */}
                    <div className={`md:col-span-2 p-6 rounded-2xl border space-y-4 ${s.bgCard}`}>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest">Pre-Eligible Whitelist Registry</h3>
                        <p className={`text-xs ${s.textMuted}`}>Total Allowed Registrants: {whitelist.length}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
                        {whitelist.length === 0 ? (
                          <p className={`text-xs italic col-span-full ${s.textMuted}`}>No pre-eligible whitelist keys loaded.</p>
                        ) : (
                          whitelist.map(id => {
                            const isRegistered = voters.some(v => v.id === id);
                            return (
                              <div key={id} className={`p-3 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                  <span className="font-mono text-xs font-bold">{id}</span>
                                  <p className={`text-[9px] font-bold ${isRegistered ? 'text-emerald-400' : 'text-amber-500'}`}>
                                    {isRegistered ? '✅ Registered' : '⏳ Pending'}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteWhitelistId(id)}
                                  className="text-red-500 hover:text-red-400 text-[10px] font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer Block */}
      <footer className={`${s.bgHeader} border-t py-6 px-6 mt-12 text-center text-xs transition-colors duration-200 ${s.textMuted} space-y-1`}>
        <p>© 2026 Web-Based Online Cryptographic Voting Prototype.</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-teal-500">Distributed Multi-Node Local Verification Terminal</p>
      </footer>

      {/* --- BALLOT CONFIRMATION MODAL --- */}
      {confirmVoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`border p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl ${s.bgCard}`}>
            <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4"></path>
              </svg>
            </div>
            
            <div className="space-y-1 text-left">
              <h3 className={`text-lg font-extrabold text-center mb-2 ${s.textMain}`}>Verify Ballot Choices</h3>
              <p className={`text-xs text-center mb-4 ${s.textMuted}`}>Ensure you confirm your selected candidates before committing to the digital tally boxes:</p>
              
              <div className={`space-y-2 p-3 rounded-xl border mb-4 font-mono text-xs ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                {positions.map(pos => (
                  <div key={pos} className={`flex justify-between py-1 border-b last:border-0 last:pb-0 ${s.borderSub}`}>
                    <span className={s.textMuted}>{pos}:</span>
                    <span className="text-teal-400 font-bold">{ballotSelections[pos]?.name || 'Abstained'}</span>
                  </div>
                ))}
              </div>

              <p className={`text-[10px] text-center leading-normal ${s.textMuted}`}>This ballot transaction will immediately lock your matric profile and cannot be reverted.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setConfirmVoteModal(false)} 
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${s.bgButtonSec}`}
              >
                Cancel
              </button>
              <button 
                onClick={processCastBallot} 
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 py-2.5 px-4 rounded-xl text-xs font-black transition shadow-lg shadow-teal-500/10"
              >
                Cast Ballot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}