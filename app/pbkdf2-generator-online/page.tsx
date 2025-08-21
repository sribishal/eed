'use client';

import { useState, useRef } from 'react';
import { Copy, Upload, Download, CheckCircle, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

export default function PBKDF2Tool() {
  const [password, setPassword] = useState('');
  const [salt, setSalt] = useState('');
  const [iterations, setIterations] = useState(100000);
  const [keyLength, setKeyLength] = useState(64);
  const [digest, setDigest] = useState('SHA-256');
  const [format, setFormat] = useState('hex');
  const [derivedKey, setDerivedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const saltFileInputRef = useRef<HTMLInputElement>(null);

  const generateRandomSalt = () => {
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    const hexString = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setSalt(hexString);
    toast.success('Random salt generated!');
  };

  const handleSaltFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSalt(content);
      toast.success('Salt file uploaded!');
    };
    reader.readAsText(file);
  };

  const arrayBufferToHex = (buffer: ArrayBuffer) => {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  };

  const deriveKey = async () => {
    if (!password || !salt) {
      toast.error('Password and salt are required');
      return;
    }

    setIsProcessing(true);
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      const saltBuffer = encoder.encode(salt);

      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations,
          hash: digest,
        },
        keyMaterial,
        keyLength * 8
      );

      const result = format === 'hex' 
        ? arrayBufferToHex(derivedBits)
        : arrayBufferToBase64(derivedBits);

      setDerivedKey(result);
      toast.success('Key derivation successful!');
    } catch (error) {
      console.error('Key derivation error:', error);
      toast.error('Failed to derive key');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!derivedKey) return;
    
    try {
      await navigator.clipboard.writeText(derivedKey);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  const downloadResult = () => {
    if (!derivedKey) {
      toast.error('No key to download');
      return;
    }
    
    const blob = new Blob([derivedKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pbkdf2-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download complete!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 to-orange-100/50 dark:from-red-950/20 dark:to-orange-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            PBKDF2 Key Derivation Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Generate cryptographic keys using Password-Based Key Derivation Function 2 (PBKDF2). 
            Securely derive keys from passwords with customizable parameters.
          </p>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <label className="text-base sm:text-lg font-semibold mb-3 block">
                  Password
                </label>
                <textarea
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password..."
                  className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-base sm:text-lg font-semibold">
                    Salt
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={generateRandomSalt}
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Shuffle className="inline h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Random</span>
                    </button>
                    <button
                      onClick={() => saltFileInputRef.current?.click()}
                      className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Upload className="inline h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">File</span>
                    </button>
                    <input
                      type="file"
                      ref={saltFileInputRef}
                      className="hidden"
                      onChange={handleSaltFileUpload}
                      accept=".txt,.bin"
                    />
                  </div>
                </div>
                <textarea
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  placeholder="Enter salt or upload file..."
                  className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-base font-semibold mb-2 block">
                    Iterations
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000000"
                    value={iterations}
                    onChange={(e) => setIterations(parseInt(e.target.value) || 1000)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  />
                </div>
                
                <div>
                  <label className="text-base font-semibold mb-2 block">
                    Key Length (bytes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="512"
                    value={keyLength}
                    onChange={(e) => setKeyLength(parseInt(e.target.value) || 32)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-base font-semibold mb-2 block">
                    Digest Algorithm
                  </label>
                  <select
                    value={digest}
                    onChange={(e) => setDigest(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  >
                    <option value="SHA-1">SHA-1</option>
                    <option value="SHA-256">SHA-256</option>
                    <option value="SHA-384">SHA-384</option>
                    <option value="SHA-512">SHA-512</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-base font-semibold mb-2 block">
                    Output Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  >
                    <option value="hex">Hexadecimal</option>
                    <option value="base64">Base64</option>
                  </select>
                </div>
              </div>

              <button
                onClick={deriveKey}
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isProcessing
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
                }`}
              >
                {isProcessing ? 'Deriving Key...' : 'Derive Key'}
              </button>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  Derived Key
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!derivedKey}
                    className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
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
                    onClick={downloadResult}
                    disabled={!derivedKey}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[300px] flex items-center">
                <code className="text-sm font-mono break-all">
                  {derivedKey || 'Derived key will appear here...'}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {derivedKey 
                  ? `Key length: ${derivedKey.length} characters (${keyLength} bytes)` 
                  : 'Enter parameters and click "Derive Key"'}
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About PBKDF2 Key Derivation
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is PBKDF2?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                PBKDF2 (Password-Based Key Derivation Function 2) is a cryptographic algorithm
                designed to derive secure keys from passwords. It applies a pseudorandom function
                (like HMAC) along with a salt and repeated iterations to produce cryptographic keys.
              </p>
              
              <h3 className="text-base sm:text-lg font-semibold mb-3">Security Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Salt prevents rainbow table attacks</li>
                <li>• Iteration count slows down brute-force attempts</li>
                <li>• Configurable key length for different security requirements</li>
                <li>• Supports multiple cryptographic hash functions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Applications</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Password storage and verification</li>
                <li>• Encryption key generation</li>
                <li>• Secure token generation</li>
                <li>• Cryptographic key derivation</li>
                <li>• Multi-factor authentication systems</li>
              </ul>
              
              <h3 className="text-base sm:text-lg font-semibold mb-3 mt-4">Best Practices</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Use at least 100,000 iterations (more for sensitive data)</li>
                <li>• Always use a cryptographically random salt</li>
                <li>• Prefer SHA-256 or SHA-512 over SHA-1</li>
                <li>• Store salt separately from derived keys</li>
                <li>• Use key lengths of 64+ bytes for high-security applications</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Technical Details</h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              PBKDF2 is defined in RFC 8018 and is widely adopted in security standards. 
              The algorithm works by applying a pseudorandom function (typically HMAC) to the 
              input password and salt, then repeatedly re-hashing the result many times to 
              produce the final output.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base">
              This implementation uses the Web Crypto API for all cryptographic operations, 
              ensuring keys are derived entirely in your browser without server interaction. 
              Your passwords and sensitive data never leave your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
