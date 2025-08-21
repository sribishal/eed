'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Key, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export default function AESEncryptDecrypt() {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt'>('encrypt');
  
  // Encrypt state
  const [encryptInput, setEncryptInput] = useState('');
  const [encryptKey, setEncryptKey] = useState('');
  const [encryptOutput, setEncryptOutput] = useState('');
  const [encryptCopied, setEncryptCopied] = useState(false);
  const [encryptError, setEncryptError] = useState('');

  // Decrypt state
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptKey, setDecryptKey] = useState('');
  const [decryptOutput, setDecryptOutput] = useState('');
  const [decryptCopied, setDecryptCopied] = useState(false);
  const [decryptError, setDecryptError] = useState('');

  // AES encryption function
  const aesEncrypt = async (text: string, password: string): Promise<string> => {
    try {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      // Generate key from password
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        data
      );

      // Combine salt, iv, and encrypted data
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encrypted), salt.length + iv.length);

      // Convert to base64
      return btoa(String.fromCharCode.apply(null, Array.from(result)));
    } catch (error) {
      throw new Error('Encryption failed: ' + (error as Error).message);
    }
  };

  // AES decryption function
  const aesDecrypt = async (encryptedData: string, password: string): Promise<string> => {
    try {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);

      // Generate key from password
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encrypted
      );

      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed. Please check your key and encrypted data.');
    }
  };

  // Encrypt handlers
  const handleEncrypt = async () => {
    if (!encryptInput.trim()) {
      setEncryptOutput('');
      setEncryptError('');
      return;
    }

    if (!encryptKey.trim()) {
      setEncryptError('Please enter an encryption key');
      setEncryptOutput('');
      return;
    }

    if (encryptKey.length < 8) {
      setEncryptError('Key must be at least 8 characters long');
      setEncryptOutput('');
      return;
    }

    try {
      setEncryptError('');
      const encrypted = await aesEncrypt(encryptInput, encryptKey);
      setEncryptOutput(encrypted);
    } catch (error) {
      setEncryptError((error as Error).message);
      setEncryptOutput('');
    }
  };

  // Decrypt handlers
  const handleDecrypt = async () => {
    if (!decryptInput.trim()) {
      setDecryptOutput('');
      setDecryptError('');
      return;
    }

    if (!decryptKey.trim()) {
      setDecryptError('Please enter the decryption key');
      setDecryptOutput('');
      return;
    }

    if (decryptKey.length < 8) {
      setDecryptError('Key must be at least 8 characters long');
      setDecryptOutput('');
      return;
    }

    try {
      setDecryptError('');
      const decrypted = await aesDecrypt(decryptInput, decryptKey);
      setDecryptOutput(decrypted);
    } catch (error) {
      setDecryptError((error as Error).message);
      setDecryptOutput('');
    }
  };

  const handleEncryptInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEncryptInput(value);
    if (value.trim() && encryptKey.trim() && encryptKey.length >= 8) {
      handleEncrypt();
    } else {
      setEncryptOutput('');
      setEncryptError('');
    }
  };

  const handleEncryptKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEncryptKey(value);
    if (encryptInput.trim() && value.trim() && value.length >= 8) {
      handleEncrypt();
    } else {
      setEncryptOutput('');
      if (value.trim() && value.length < 8) {
        setEncryptError('Key must be at least 8 characters long');
      } else {
        setEncryptError('');
      }
    }
  };

  const handleDecryptInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDecryptInput(value);
    if (value.trim() && decryptKey.trim() && decryptKey.length >= 8) {
      handleDecrypt();
    } else {
      setDecryptOutput('');
      setDecryptError('');
    }
  };

  const handleDecryptKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDecryptKey(value);
    if (decryptInput.trim() && value.trim() && value.length >= 8) {
      handleDecrypt();
    } else {
      setDecryptOutput('');
      if (value.trim() && value.length < 8) {
        setDecryptError('Key must be at least 8 characters long');
      } else {
        setDecryptError('');
      }
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    if (activeTab === 'encrypt') {
      setEncryptKey(result);
      if (encryptInput.trim()) {
        handleEncrypt();
      }
    } else {
      setDecryptKey(result);
      if (decryptInput.trim()) {
        handleDecrypt();
      }
    }
  };

  const copyToClipboard = async (text: string, isEncrypt: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isEncrypt) {
        setEncryptCopied(true);
        setTimeout(() => setEncryptCopied(false), 2000);
      } else {
        setDecryptCopied(true);
        setTimeout(() => setDecryptCopied(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (activeTab === 'encrypt') {
          setEncryptInput(content);
          if (encryptKey.trim() && encryptKey.length >= 8) {
            handleEncrypt();
          }
        } else {
          setDecryptInput(content);
          if (decryptKey.trim() && decryptKey.length >= 8) {
            handleDecrypt();
          }
        }
        toast.success('File uploaded successfully!');
      };
      reader.readAsText(file);
    }
  };

  const downloadResult = (content: string, filename: string) => {
    if (!content) {
      toast.error('No content to download');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  const currentInput = activeTab === 'encrypt' ? encryptInput : decryptInput;
  const currentKey = activeTab === 'encrypt' ? encryptKey : decryptKey;
  const currentOutput = activeTab === 'encrypt' ? encryptOutput : decryptOutput;
  const currentError = activeTab === 'encrypt' ? encryptError : decryptError;
  const currentCopied = activeTab === 'encrypt' ? encryptCopied : decryptCopied;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-teal-100/50 dark:from-emerald-950/20 dark:to-teal-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            AES Encrypt & Decrypt Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Encrypt and decrypt text or files using Advanced Encryption Standard (AES) with 256-bit keys. 
            Secure your sensitive data with military-grade encryption.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex bg-muted p-1 rounded-lg max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('encrypt')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'encrypt'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="inline h-4 w-4 mr-2" />
              Encrypt
            </button>
            <button
              onClick={() => setActiveTab('decrypt')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'decrypt'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Unlock className="inline h-4 w-4 mr-2" />
              Decrypt
            </button>
          </div>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          {/* Key Input */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-base sm:text-lg font-semibold">
                {activeTab === 'encrypt' ? 'Encryption' : 'Decryption'} Key
              </label>
              <button
                onClick={generateRandomKey}
                className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <Key className="inline h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Generate Random Key</span>
              </button>
            </div>
            <input
              type="password"
              value={currentKey}
              onChange={activeTab === 'encrypt' ? handleEncryptKeyChange : handleDecryptKeyChange}
              placeholder={`Enter ${activeTab} key (minimum 8 characters)...`}
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Key length: {currentKey.length} characters {currentKey.length >= 8 ? '✓' : '(minimum 8 required)'}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {activeTab === 'encrypt' ? 'Plain Text' : 'Encrypted Data'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.json,.xml,.csv"
                    />
                  </label>
                </div>
              </div>
              <textarea
                value={currentInput}
                onChange={activeTab === 'encrypt' ? handleEncryptInputChange : handleDecryptInputChange}
                placeholder={
                  activeTab === 'encrypt' 
                    ? 'Enter text to encrypt...' 
                    : 'Enter encrypted data to decrypt...'
                }
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {currentInput.length}
              </p>
              {currentError && (
                <p className="text-sm text-red-500 mt-2">{currentError}</p>
              )}
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {activeTab === 'encrypt' ? 'Encrypted Output' : 'Decrypted Output'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => copyToClipboard(currentOutput, activeTab === 'encrypt')}
                    disabled={!currentOutput}
                    className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentCopied ? (
                      <>
                        <CheckCircle className="inline h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="inline h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadResult(
                      currentOutput, 
                      activeTab === 'encrypt' ? 'aes-encrypted.txt' : 'aes-decrypted.txt'
                    )}
                    disabled={!currentOutput}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
              <textarea
                value={currentOutput}
                readOnly
                placeholder={
                  activeTab === 'encrypt' 
                    ? 'Encrypted text will appear here...' 
                    : 'Decrypted text will appear here...'
                }
                className={`w-full h-48 sm:h-64 p-4 border rounded-lg bg-muted/50 resize-none text-sm ${
                  activeTab === 'encrypt' ? 'font-mono' : ''
                }`}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {currentOutput.length}
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About AES Encryption & Decryption
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is AES?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                AES (Advanced Encryption Standard) is a symmetric encryption algorithm widely used 
                across the globe to secure sensitive data. It uses the same key for both encryption 
                and decryption operations.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Security Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• 256-bit encryption keys</li>
                <li>• PBKDF2 key derivation</li>
                <li>• Random salt and IV generation</li>
                <li>• AES-GCM authenticated encryption</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Important Notes</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Keep your encryption key safe! The same key used for encryption must be used for 
                decryption. Without the correct key, encrypted data cannot be recovered.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Military-grade encryption</li>
                <li>• Real-time encryption/decryption</li>
                <li>• Random key generation</li>
                <li>• File upload support</li>
                <li>• Client-side processing</li>
                <li>• Copy and download results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
