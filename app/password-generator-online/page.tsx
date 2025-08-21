'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, CheckCircle, RefreshCw, AlertTriangle, Download, Upload, Eye, EyeOff, History, Shield, Key, Lock, Zap, Settings, Save, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: 'il1Lo0O',
  similar: 'il1Lo0O2Z5S',
};

const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', '1234567890', 'password1', '123123'
];

const PRESET_CONFIGS = {
  'High Security': { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true },
  'Medium Security': { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false },
  'Basic': { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false },
  'PIN Only': { length: 6, uppercase: false, lowercase: false, numbers: true, symbols: false },
  'Alphanumeric': { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: false },
  'Letters Only': { length: 16, uppercase: true, lowercase: true, numbers: false, symbols: false },
};

// Type definitions
type StrengthData = {
  text: string;
  color: string;
  score: number;
};

type BatchPassword = {
  password: string;
  strength: StrengthData;
};

type SavedPassword = {
  id: number;
  password: string;
  created: string;
  strength: StrengthData;
};

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [customCharset, setCustomCharset] = useState('');
  const [useCustomOnly, setUseCustomOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<StrengthData>({ text: '', color: '', score: 0 });
  const [showPassword, setShowPassword] = useState(true);
  const [passwordHistory, setPasswordHistory] = useState<string[]>([]);
  const [savedPasswords, setSavedPasswords] = useState<SavedPassword[]>([]);
  const [activeTab, setActiveTab] = useState('generator');
  const [entropy, setEntropy] = useState(0);
  const [crackTime, setCrackTime] = useState('');
  const [batchCount, setBatchCount] = useState(5);
  const [batchPasswords, setBatchPasswords] = useState<BatchPassword[]>([]);
  const [pronounceableMode, setPronounceableMode] = useState(false);
  const [passphraseMode, setPassphraseMode] = useState(false);
  const [passphraseWords, setPassphraseWords] = useState(4);
  const [selectedPreset, setSelectedPreset] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const WORD_LIST = [
    'apple', 'brave', 'cloud', 'dance', 'earth', 'flame', 'grace', 'happy', 'jewel', 'knife',
    'light', 'magic', 'north', 'ocean', 'peace', 'queen', 'river', 'stone', 'truth', 'unity',
    'voice', 'water', 'youth', 'zebra', 'angel', 'beach', 'chair', 'dream', 'eagle', 'field',
    'giant', 'house', 'image', 'joker', 'karma', 'lemon', 'mouse', 'night', 'orbit', 'plant'
  ];

  const calculateEntropy = useCallback((pwd: string) => {
    let charsetSize = 0;
    if (includeUppercase && !useCustomOnly) charsetSize += 26;
    if (includeLowercase && !useCustomOnly) charsetSize += 26;
    if (includeNumbers && !useCustomOnly) charsetSize += 10;
    if (includeSymbols && !useCustomOnly) charsetSize += 24;
    if (useCustomOnly && customCharset) charsetSize = new Set(customCharset).size;
    
    const entropy = pwd.length * Math.log2(charsetSize);
    setEntropy(Math.round(entropy * 100) / 100);
    
    // Calculate crack time estimation
    const guessesPerSecond = 1e12; // Assume 1 trillion guesses per second
    const totalPossibilities = Math.pow(charsetSize, pwd.length);
    const avgGuesses = totalPossibilities / 2;
    const timeSeconds = avgGuesses / guessesPerSecond;
    
    if (timeSeconds < 60) {
      setCrackTime('Instantly');
    } else if (timeSeconds < 3600) {
      setCrackTime(`${Math.round(timeSeconds / 60)} minutes`);
    } else if (timeSeconds < 86400) {
      setCrackTime(`${Math.round(timeSeconds / 3600)} hours`);
    } else if (timeSeconds < 31536000) {
      setCrackTime(`${Math.round(timeSeconds / 86400)} days`);
    } else if (timeSeconds < 31536000000) {
      setCrackTime(`${Math.round(timeSeconds / 31536000)} years`);
    } else {
      setCrackTime('Centuries');
    }
  }, [includeUppercase, includeLowercase, includeNumbers, includeSymbols, customCharset, useCustomOnly]);

  const calculateStrength = useCallback((pwd: string): StrengthData => {
    let score = 0;
    
    // Length scoring
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (pwd.length >= 20) score += 1;
    
    // Character type scoring
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(pwd)) score -= 1; // Repeated characters
    if (/123|abc|qwe/i.test(pwd)) score -= 1; // Sequential patterns
    if (COMMON_PASSWORDS.some(common => pwd.toLowerCase().includes(common))) score -= 2;
    
    // Bonus for variety
    const uniqueChars = new Set(pwd).size;
    if (uniqueChars / pwd.length > 0.7) score += 1;

    score = Math.max(0, Math.min(10, score));
    
    let strengthData: StrengthData;
    if (score <= 2) {
      strengthData = { text: 'Very Weak', color: 'bg-red-500', score };
    } else if (score <= 4) {
      strengthData = { text: 'Weak', color: 'bg-orange-500', score };
    } else if (score <= 6) {
      strengthData = { text: 'Fair', color: 'bg-yellow-500', score };
    } else if (score <= 8) {
      strengthData = { text: 'Good', color: 'bg-blue-500', score };
    } else {
      strengthData = { text: 'Excellent', color: 'bg-green-500', score };
    }
    
    setStrength(strengthData);
    return strengthData;
  }, []);

  const generatePronounceablePassword = useCallback(() => {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      if (i % 2 === 0) {
        result += consonants[Math.floor(Math.random() * consonants.length)];
      } else {
        result += vowels[Math.floor(Math.random() * vowels.length)];
      }
    }
    
    // Add numbers and symbols if requested
    if (includeNumbers) {
      const numCount = Math.ceil(length * 0.2);
      for (let i = 0; i < numCount; i++) {
        const pos = Math.floor(Math.random() * result.length);
        result = result.substring(0, pos) + Math.floor(Math.random() * 10) + result.substring(pos + 1);
      }
    }
    
    if (includeSymbols) {
      const symbols = '!@#$%&*';
      const symCount = Math.ceil(length * 0.1);
      for (let i = 0; i < symCount; i++) {
        const pos = Math.floor(Math.random() * result.length);
        result = result.substring(0, pos) + symbols[Math.floor(Math.random() * symbols.length)] + result.substring(pos + 1);
      }
    }
    
    if (includeUppercase) {
      // Capitalize some letters
      result = result.split('').map((char, index) => 
        Math.random() < 0.3 && /[a-z]/.test(char) ? char.toUpperCase() : char
      ).join('');
    }
    
    return result.substring(0, length);
  }, [length, includeNumbers, includeSymbols, includeUppercase]);

  const generatePassphrase = useCallback(() => {
    const selectedWords = [];
    for (let i = 0; i < passphraseWords; i++) {
      const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      selectedWords.push(randomWord);
    }
    
    let result = selectedWords.join('-');
    
    // Add numbers if requested
    if (includeNumbers) {
      result += '-' + Math.floor(Math.random() * 9999);
    }
    
    // Add symbols if requested
    if (includeSymbols) {
      const symbols = '!@#$%';
      result += symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    // Apply case changes
    if (includeUppercase) {
      result = result.split('').map(char => 
        Math.random() < 0.3 && /[a-z]/.test(char) ? char.toUpperCase() : char
      ).join('');
    }
    
    return result;
  }, [passphraseWords, includeNumbers, includeSymbols, includeUppercase]);

  const generatePassword = useCallback(() => {
    if (passphraseMode) {
      const newPassword = generatePassphrase();
      setPassword(newPassword);
      calculateStrength(newPassword);
      calculateEntropy(newPassword);
      return;
    }
    
    if (pronounceableMode) {
      const newPassword = generatePronounceablePassword();
      setPassword(newPassword);
      calculateStrength(newPassword);
      calculateEntropy(newPassword);
      return;
    }
    
    let charset = '';
    
    if (useCustomOnly && customCharset) {
      charset = customCharset;
    } else {
      if (includeUppercase) charset += CHARSETS.uppercase;
      if (includeLowercase) charset += CHARSETS.lowercase;
      if (includeNumbers) charset += CHARSETS.numbers;
      if (includeSymbols) charset += CHARSETS.symbols;
    }

    // Remove ambiguous/similar characters if requested
    if (excludeAmbiguous) {
      charset = charset.split('').filter(char => !CHARSETS.ambiguous.includes(char)).join('');
    }
    if (excludeSimilar) {
      charset = charset.split('').filter(char => !CHARSETS.similar.includes(char)).join('');
    }

    if (!charset) {
      toast.error('Please select at least one character type or provide custom characters.');
      setPassword('');
      return;
    }

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      newPassword += charset[randomIndex];
    }
    
    setPassword(newPassword);
    calculateStrength(newPassword);
    calculateEntropy(newPassword);
    setCopied(false);
    
    // Add to history
    if (newPassword && !passwordHistory.includes(newPassword)) {
      setPasswordHistory(prev => [newPassword, ...prev.slice(0, 9)]);
    }
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, 
      excludeAmbiguous, excludeSimilar, customCharset, useCustomOnly, passwordHistory,
      pronounceableMode, passphraseMode, generatePronounceablePassword, generatePassphrase,
      calculateStrength, calculateEntropy]);

  const generateBatch = useCallback(() => {
    const batch: BatchPassword[] = [];
    for (let i = 0; i < batchCount; i++) {
      let charset = '';
      
      if (useCustomOnly && customCharset) {
        charset = customCharset;
      } else {
        if (includeUppercase) charset += CHARSETS.uppercase;
        if (includeLowercase) charset += CHARSETS.lowercase;
        if (includeNumbers) charset += CHARSETS.numbers;
        if (includeSymbols) charset += CHARSETS.symbols;
      }

      if (excludeAmbiguous) {
        charset = charset.split('').filter(char => !CHARSETS.ambiguous.includes(char)).join('');
      }
      if (excludeSimilar) {
        charset = charset.split('').filter(char => !CHARSETS.similar.includes(char)).join('');
      }

      if (!charset) continue;

      let pwd = '';
      if (passphraseMode) {
        pwd = generatePassphrase();
      } else if (pronounceableMode) {
        pwd = generatePronounceablePassword();
      } else {
        for (let j = 0; j < length; j++) {
          pwd += charset[Math.floor(Math.random() * charset.length)];
        }
      }
      
      batch.push({
        password: pwd,
        strength: calculateStrength(pwd)
      });
    }
    setBatchPasswords(batch);
  }, [batchCount, length, includeUppercase, includeLowercase, includeNumbers, includeSymbols,
      excludeAmbiguous, excludeSimilar, customCharset, useCustomOnly, passphraseMode,
      pronounceableMode, generatePassphrase, generatePronounceablePassword, calculateStrength]);

  useEffect(() => {
    if (password) {
      calculateStrength(password);
      calculateEntropy(password);
    }
  }, [password, calculateStrength, calculateEntropy]);

  useEffect(() => {
    generatePassword();
  }, []);

  const copyToClipboard = async (text = password) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Password copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy password.');
    }
  };

  const savePassword = (pwd = password) => {
    if (!pwd) return;
    const savedItem: SavedPassword = {
      id: Date.now(),
      password: pwd,
      created: new Date().toLocaleString(),
      strength: calculateStrength(pwd)
    };
    setSavedPasswords(prev => [savedItem, ...prev]);
    toast.success('Password saved!');
  };

  const removeSavedPassword = (id: number) => {
    setSavedPasswords(prev => prev.filter(item => item.id !== id));
    toast.success('Password removed!');
  };

  const exportPasswords = () => {
    const data = {
      history: passwordHistory,
      saved: savedPasswords,
      exported: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passwords-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Passwords exported!');
  };

  const importPasswords = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.history) setPasswordHistory(data.history);
        if (data.saved) setSavedPasswords(data.saved);
        toast.success('Passwords imported successfully!');
      } catch (error) {
        toast.error('Invalid file format!');
      }
    };
    reader.readAsText(file);
  };

  const applyPreset = (presetName: string) => {
    const preset = PRESET_CONFIGS[presetName as keyof typeof PRESET_CONFIGS];
    if (!preset) return;
    
    setLength(preset.length);
    setIncludeUppercase(preset.uppercase);
    setIncludeLowercase(preset.lowercase);
    setIncludeNumbers(preset.numbers);
    setIncludeSymbols(preset.symbols);
    setSelectedPreset(presetName);
    toast.success(`Applied ${presetName} preset!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Advanced Password Generator Online
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Advanced password generation with enterprise-grade security features, batch processing, and comprehensive analysis tools like Entropy & Crack Time.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'generator', label: 'Generator', icon: Key },
            { id: 'batch', label: 'Batch Generate', icon: Zap },
            { id: 'history', label: 'History', icon: History },
            { id: 'saved', label: 'Saved', icon: Star },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Generator Tab */}
        {activeTab === 'generator' && (
          <div className="space-y-8">
            {/* Main Generator Card */}
            <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
              {/* Password Display */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/50 p-4 rounded-lg">
                <code className={`text-lg sm:text-xl font-mono break-all flex-grow text-center sm:text-left ${!showPassword ? 'filter blur-sm select-none' : ''}`}>
                  {password || 'Your password appears here...'}
                </code>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard()}
                    disabled={!password}
                    className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => savePassword()}
                    disabled={!password}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Strength & Analysis */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Strength</span>
                    <span className="font-semibold">{strength.text}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`} 
                      style={{ width: `${(strength.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Entropy</div>
                  <div className="text-lg font-bold text-blue-600">{entropy} bits</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Crack Time</div>
                  <div className="text-lg font-bold text-blue-600">{crackTime}</div>
                </div>
              </div>

              {/* Password Type Modes */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => {setPassphraseMode(false); setPronounceableMode(false);}}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    !passphraseMode && !pronounceableMode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-muted hover:border-blue-300'
                  }`}
                >
                  <Lock className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Random</div>
                </button>
                <button
                  onClick={() => {setPronounceableMode(true); setPassphraseMode(false);}}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    pronounceableMode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-muted hover:border-blue-300'
                  }`}
                >
                  <Key className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Pronounceable</div>
                </button>
                <button
                  onClick={() => {setPassphraseMode(true); setPronounceableMode(false);}}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    passphraseMode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-muted hover:border-blue-300'
                  }`}
                >
                  <Shield className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Passphrase</div>
                </button>
              </div>

              {/* Configuration Options */}
              <div className="mt-6 space-y-6">
                {/* Presets */}
                <div>
                  <label className="block text-base font-semibold mb-3">Quick Presets</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {Object.keys(PRESET_CONFIGS).map(preset => (
                      <button
                        key={preset}
                        onClick={() => applyPreset(preset)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedPreset === preset
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length/Words Slider */}
                <div>
                  <label htmlFor="length" className="block text-base font-semibold mb-2">
                    {passphraseMode ? `Word Count: ${passphraseWords}` : `Password Length: ${length}`}
                  </label>
                  {passphraseMode ? (
                    <input
                      type="range"
                      min="3"
                      max="8"
                      value={passphraseWords}
                      onChange={(e) => setPassphraseWords(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  ) : (
                    <input
                      id="length"
                      type="range"
                      min="6"
                      max="128"
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  )}
                </div>

                {/* Character Options */}
                {!passphraseMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input 
                          id="uppercase" 
                          type="checkbox" 
                          checked={includeUppercase} 
                          onChange={(e) => setIncludeUppercase(e.target.checked)} 
                          className="h-5 w-5 rounded accent-blue-600"
                        />
                        <label htmlFor="uppercase" className="ml-3 text-sm font-medium">Include Uppercase (A-Z)</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          id="lowercase" 
                          type="checkbox" 
                          checked={includeLowercase} 
                          onChange={(e) => setIncludeLowercase(e.target.checked)} 
                          className="h-5 w-5 rounded accent-blue-600"
                        />
                        <label htmlFor="lowercase" className="ml-3 text-sm font-medium">Include Lowercase (a-z)</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          id="numbers" 
                          type="checkbox" 
                          checked={includeNumbers} 
                          onChange={(e) => setIncludeNumbers(e.target.checked)} 
                          className="h-5 w-5 rounded accent-blue-600"
                        />
                        <label htmlFor="numbers" className="ml-3 text-sm font-medium">Include Numbers (0-9)</label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input 
                          id="symbols" 
                          type="checkbox" 
                          checked={includeSymbols} 
                          onChange={(e) => setIncludeSymbols(e.target.checked)} 
                          className="h-5 w-5 rounded accent-blue-600"
                        />
                        <label htmlFor="symbols" className="ml-3 text-sm font-medium">Include Symbols (!@#$...)</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          id="ambiguous" 
                          type="checkbox" 
                          checked={excludeAmbiguous} 
                          onChange={(e) => setExcludeAmbiguous(e.target.checked)} 
                          className="h-5 w-5 rounded accent-blue-600"
                        />
                        <label htmlFor="ambiguous" className="ml-3 text-sm font-medium">Exclude Ambiguous (il1Lo0O)</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          id="similar" 
                          type="checkbox" 
                          checked={excludeSimilar} 
                          onChange={(e) => setExcludeSimilar(e.target.checked)} 
                          className="h-5 w-5 rounded accent-blue-600"
                        />
                        <label htmlFor="similar" className="ml-3 text-sm font-medium">Exclude Similar (il1Lo0O2Z5S)</label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Charset */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <input 
                      id="custom-only" 
                      type="checkbox" 
                      checked={useCustomOnly} 
                      onChange={(e) => setUseCustomOnly(e.target.checked)} 
                      className="h-5 w-5 rounded accent-blue-600"
                    />
                    <label htmlFor="custom-only" className="text-sm font-medium">Use Custom Characters Only</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter custom characters..."
                    value={customCharset}
                    onChange={(e) => setCustomCharset(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Generate Button */}
              <div className="mt-8">
                <button
                  onClick={generatePassword}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-5 w-5"/>
                  Generate Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Generate Tab */}
        {activeTab === 'batch' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold">Batch Password Generation</h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-base font-semibold mb-2">
                Number of Passwords: {batchCount}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <button
              onClick={generateBatch}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-6"
            >
              Generate {batchCount} Passwords
            </button>

            {batchPasswords.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {batchPasswords.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <code className="flex-grow font-mono text-sm break-all">{item.password}</code>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.strength.color.replace('bg-', 'bg-opacity-20 bg-') + ' ' + 
                      item.strength.color.replace('bg-', 'text-')
                    }`}>
                      {item.strength.text}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.password)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => savePassword(item.password)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold">Password History</h2>
              </div>
              <button
                onClick={() => setPasswordHistory([])}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear History
              </button>
            </div>

            {passwordHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No passwords in history</p>
            ) : (
              <div className="space-y-3">
                {passwordHistory.map((pwd, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <code className="flex-grow font-mono text-sm break-all">{pwd}</code>
                    <button
                      onClick={() => copyToClipboard(pwd)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => savePassword(pwd)}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold">Saved Passwords</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportPasswords}
                  className="flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={importPasswords}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-green-100 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </button>
              </div>
            </div>

            {savedPasswords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No saved passwords</p>
            ) : (
              <div className="space-y-3">
                {savedPasswords.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-grow">
                      <code className="font-mono text-sm break-all">{item.password}</code>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{item.created}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.strength.color.replace('bg-', 'bg-opacity-20 bg-') + ' ' + 
                          item.strength.color.replace('bg-', 'text-')
                        }`}>
                          {item.strength.text}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.password)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeSavedPassword(item.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold">Advanced Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Security Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Auto-clear clipboard after copy</span>
                    <input type="checkbox" className="h-5 w-5 rounded accent-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hide passwords by default</span>
                    <input type="checkbox" className="h-5 w-5 rounded accent-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Require confirmation for clear history</span>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded accent-blue-600" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Display Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Show strength analysis</span>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded accent-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Show entropy calculation</span>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded accent-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Show crack time estimation</span>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded accent-blue-600" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Storage Limits</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max History Items</label>
                    <input 
                      type="number" 
                      defaultValue="10" 
                      min="1" 
                      max="100"
                      className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Saved Passwords</label>
                    <input 
                      type="number" 
                      defaultValue="50" 
                      min="1" 
                      max="500"
                      className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-blue-600"/> Password Security Best Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-muted-foreground text-sm sm:text-base">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Length & Complexity</h3>
              <ul className="space-y-2">
                <li>• Use at least 16 characters for critical accounts</li>
                <li>• Mix uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid dictionary words and personal information</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Unique Passwords</h3>
              <ul className="space-y-2">
                <li>• Never reuse passwords across different sites</li>
                <li>• Use a password manager for storage</li>
                <li>• Enable two-factor authentication when possible</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Regular Maintenance</h3>
              <ul className="space-y-2">
                <li>• Update passwords every 90 days for sensitive accounts</li>
                <li>• Change passwords immediately after breaches</li>
                <li>• Monitor accounts for suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
