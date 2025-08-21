'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Upload,
  Download,
  Copy,
  CheckCircle,
  Eraser,
  Clipboard,
  Play,
  PauseCircle
} from 'lucide-react';
import { toast } from 'sonner';

type KeyFormat = 'utf8' | 'hex';
type OutputFormat = 'hex' | 'base64' | 'utf8';
type Mode = 'encrypt' | 'decrypt';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();


function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.replace(/[\s:]/g, '');
  if (clean.length % 2 !== 0) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = clean.substring(i * 2, i * 2 + 2); // Fixed: use substring instead of substr
    const n = parseInt(byte, 16);
    if (isNaN(n)) return null;
    out[i] = n;
  }
  return out;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBytes(s: string) {
  try {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function randomBytes(len: number) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

export default function XorCipherTool(): JSX.Element {
  const [mode, setMode] = useState<Mode>('encrypt');
  const [inputIsFile, setInputIsFile] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [keyFormat, setKeyFormat] = useState<KeyFormat>('utf8');
  const [keyInput, setKeyInput] = useState('');
  const [keyLengthBytes, setKeyLengthBytes] = useState<number>(32);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('hex');
  const [chunkMB, setChunkMB] = useState<number>(4);
  const [live, setLive] = useState(false);
  const [uppercaseHex, setUppercaseHex] = useState(false);

  const [resultText, setResultText] = useState('');
  const [resultBytesPreview, setResultBytesPreview] = useState<Uint8Array | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [copied, setCopied] = useState(false);

  const cancelRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse key depending on format
  function parseKeyInput(): Uint8Array | null {
    if (!keyInput) return null;
    if (keyFormat === 'hex') {
      const b = hexToBytes(keyInput);
      if (!b || b.length === 0) return null;
      return b;
    } else {
      const b = textEncoder.encode(keyInput);
      if (b.length === 0) return null;
      return b;
    }
  }

  function encodeOutput(b: Uint8Array) {
    if (outputFormat === 'hex') {
      const h = bytesToHex(b);
      return uppercaseHex ? h.toUpperCase() : h;
    } else if (outputFormat === 'base64') {
      return bytesToBase64(b);
    } else {
      try {
        return textDecoder.decode(b);
      } catch {
        return bytesToBase64(b);
      }
    }
  }

  // Parse input based on mode and format
  function parseInput(input: string): Uint8Array | null {
    if (mode === 'encrypt' || outputFormat === 'utf8') {
      return textEncoder.encode(input);
    } else if (outputFormat === 'hex') {
      return hexToBytes(input);
    } else if (outputFormat === 'base64') {
      return base64ToBytes(input);
    }
    return textEncoder.encode(input);
  }

  // XOR a Uint8Array with key bytes (key cycles)
  function xorBuffer(input: Uint8Array, keyBytes: Uint8Array) {
    const out = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      out[i] = input[i] ^ keyBytes[i % keyBytes.length];
    }
    return out;
  }

  // Process text input
  async function processText() {
    const keyBytes = parseKeyInput();
    if (!keyBytes) {
      toast.error('Invalid or empty key.');
      return;
    }
    try {
      setRunning(true);
      cancelRef.current = false;
      
      let inBytes: Uint8Array;
      if (mode === 'encrypt') {
        inBytes = textEncoder.encode(textInput || '');
      } else {
        // For decrypt mode, parse input based on expected format
        const parsed = parseInput(textInput || '');
        if (!parsed) {
          toast.error('Invalid input format for decryption.');
          return;
        }
        inBytes = parsed;
      }
      
      const outBytes = xorBuffer(inBytes, keyBytes);
      setResultBytesPreview(outBytes);
      setResultText(encodeOutput(outBytes));
      toast.success(mode === 'encrypt' ? 'Text encrypted successfully!' : 'Text decrypted successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Processing failed.');
    } finally {
      setRunning(false);
    }
  }

  // Process file - chunked XOR to avoid blocking UI
  async function processFile(f: File) {
    const keyBytes = parseKeyInput();
    if (!keyBytes) {
      toast.error('Invalid or empty key.');
      return;
    }
    if (!f) {
      toast.error('No file selected.');
      return;
    }

    const chunkSize = Math.max(1, Math.floor(chunkMB)) * 1024 * 1024;
    const total = f.size;
    let processed = 0;
    cancelRef.current = false;
    setRunning(true);
    setPaused(false);
    setProgress({ done: 0, total });

    const resultChunks: Uint8Array[] = [];

    try {
      while (processed < total) {
        if (cancelRef.current) throw new Error('Cancelled');
        while (paused && !cancelRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (cancelRef.current) throw new Error('Cancelled');
        
        const end = Math.min(processed + chunkSize, total);
        const slice = f.slice(processed, end);
        const buf = await slice.arrayBuffer();
        const inBytes = new Uint8Array(buf);
        const outChunk = xorBuffer(inBytes, keyBytes);
        resultChunks.push(outChunk);

        processed = end;
        setProgress({ done: processed, total });

        // Yield to UI
        await new Promise((r) => setTimeout(r, 1));
      }

      // Join chunks
      let len = 0;
      for (const c of resultChunks) len += c.length;
      const joined = new Uint8Array(len);
      let off = 0;
      for (const c of resultChunks) {
        joined.set(c, off);
        off += c.length;
      }

      setResultBytesPreview(joined);
      setResultText(encodeOutput(joined));
      toast.success(`File ${mode === 'encrypt' ? 'encrypted' : 'processed'} successfully!`);
    } catch (e: any) {
      if (e.message === 'Cancelled') {
        toast('Operation cancelled.');
      } else {
        console.error(e);
        toast.error('File processing failed.');
      }
    } finally {
      setRunning(false);
      setPaused(false);
    }
  }

  // UI action handlers
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      toast.success(`File loaded: ${f.name}`);
    }
  };

  const onDownload = () => {
    if (!resultBytesPreview) {
      toast.error('No result to download');
      return;
    }
    const blob = new Blob([resultBytesPreview], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xor-${mode === 'encrypt' ? 'encrypted' : 'output'}.bin`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded result.');
  };

  const onCopy = async () => {
    if (!resultText) {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = resultText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 1400);
    }
  };

  const onPaste = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      setTextInput((p) => (p ? p + txt : txt));
      toast.success('Pasted from clipboard.');
    } catch {
      toast.error('Paste failed. Please paste manually.');
    }
  };

  const onClear = () => {
    setTextInput('');
    setFile(null);
    setResultText('');
    setResultBytesPreview(null);
    setProgress({ done: 0, total: 0 });
    cancelRef.current = true;
    setRunning(false);
    setPaused(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Cleared.');
  };

  const generateRandomKey = () => {
    const k = randomBytes(Math.max(1, Math.floor(keyLengthBytes)));
    if (keyFormat === 'hex') {
      setKeyInput(bytesToHex(k));
    } else {
      // For UTF-8, generate printable characters
      const printableChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
      let result = '';
      for (let i = 0; i < keyLengthBytes; i++) {
        result += printableChars.charAt(k[i] % printableChars.length);
      }
      setKeyInput(result);
    }
    toast.success(`Random key generated (${keyLengthBytes} bytes)`);
  };

  const runNow = async () => {
    if (running) {
      cancelRef.current = true;
      return;
    }
    
    setResultText('');
    setResultBytesPreview(null);
    setProgress({ done: 0, total: 0 });
    cancelRef.current = false;
    
    if (inputIsFile && file) {
      await processFile(file);
    } else if (textInput || mode === 'decrypt') {
      await processText();
    } else {
      toast.error('Please enter text or select a file to process.');
    }
  };

  const togglePause = () => {
    if (!running) return;
    setPaused((p) => !p);
    toast(paused ? 'Resumed' : 'Paused');
  };

  // Live mode: auto-run when text changes (debounced)
  useEffect(() => {
    if (!live || inputIsFile || running) return;
    
    const timer = setTimeout(() => {
      if (textInput && keyInput) {
        processText();
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [textInput, keyInput, keyFormat, outputFormat, uppercaseHex, live, mode]);

  // Update output when format changes
  useEffect(() => {
    if (resultBytesPreview) {
      setResultText(encodeOutput(resultBytesPreview));
    }
  }, [outputFormat, uppercaseHex, resultBytesPreview]);

  const keyHint = keyFormat === 'hex' ? 'Enter hex string (e.g., deadbeef)' : 'Enter UTF-8 text key';
  const outputHint = outputFormat === 'hex' ? 'Hexadecimal' : outputFormat === 'base64' ? 'Base64' : 'UTF-8 (text)';

return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-indigo-100/50 dark:from-black dark:to-black py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
    <div className="container mx-auto max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">XOR Cipher Encrypt Decrypt Online</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          XOR cipher tool for encryption and decryption. Perfect for learning cryptography concepts and simple obfuscation. 
          <strong> Not suitable for secure encryption of sensitive data.</strong>
        </p>
      </div>

      {/* Mode & Actions */}
      <div className="bg-white dark:bg-black rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <span className="text-base sm:text-lg font-semibold mr-0 sm:mr-2">Mode:</span>
            <div className="flex bg-blue-100 dark:bg-blue-900/40 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setMode('encrypt')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'encrypt' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                }`}
              >
                <Lock className="inline h-4 w-4 mr-1" /> Encrypt
              </button>
              <button
                onClick={() => setMode('decrypt')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'decrypt' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                }`}
              >
                <Unlock className="inline h-4 w-4 mr-1" /> Decrypt
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-start mt-3 sm:mt-0">
            <button 
              onClick={onClear} 
              className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-100 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center"
            >
              <Eraser className="h-4 w-4 mr-1" /> Clear
            </button>
            <button 
              onClick={runNow} 
              disabled={(!textInput && !file) || (inputIsFile && !file)} 
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {running ? 'Cancel' : (
                <>
                  <Play className="h-4 w-4 mr-1" /> 
                  {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
                </>
              )}
            </button>
            {running && (
              <button 
                onClick={togglePause} 
                className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200 px-3 py-2 rounded-lg flex items-center"
              >
                <PauseCircle className="h-4 w-4 mr-1" /> 
                {paused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Section */}
      <div className="bg-white dark:bg-black rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="text-base sm:text-lg font-semibold mb-2 block flex items-center">
              <Key className="h-5 w-5 mr-2" /> Key
            </label>
            <input 
              value={keyInput} 
              onChange={(e) => setKeyInput(e.target.value)} 
              placeholder={keyHint} 
              className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-gray-100 text-sm sm:text-base" 
            />
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
              Key format: {keyFormat.toUpperCase()} | Output: {outputHint}
            </p>
          </div>

          <div>
            <label className="text-base sm:text-lg font-semibold mb-2 block">Key Options</label>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <input 
                  id="kf-utf8" 
                  type="radio" 
                  checked={keyFormat === 'utf8'} 
                  onChange={() => setKeyFormat('utf8')} 
                  className="h-4 w-4" 
                />
                <label htmlFor="kf-utf8" className="text-sm">UTF-8</label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  id="kf-hex" 
                  type="radio" 
                  checked={keyFormat === 'hex'} 
                  onChange={() => setKeyFormat('hex')} 
                  className="h-4 w-4" 
                />
                <label htmlFor="kf-hex" className="text-sm">HEX</label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min={1} 
                  max={1024}
                  value={keyLengthBytes} 
                  onChange={(e) => setKeyLengthBytes(Math.max(1, Math.min(1024, Number(e.target.value))))} 
                  className="w-20 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-black text-sm" 
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">bytes</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={generateRandomKey} 
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50"
                >
                  Generate Key
                </button>
                <button 
                  onClick={() => { setKeyInput(''); toast.success('Key cleared'); }} 
                  className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 px-3 py-2 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/70"
                >
                  Clear Key
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input / Output */}
      <div className="bg-white dark:bg-black rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Left: Input */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <label className="text-base sm:text-lg font-semibold">
                {inputIsFile ? 'File Input' : mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
              </label>
              <div className="flex flex-wrap gap-2">
                {!inputIsFile && (
                  <button 
                    onClick={onPaste} 
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center"
                  >
                    <Clipboard className="h-4 w-4 mr-1" /> Paste
                  </button>
                )}
                <label className="cursor-pointer bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 flex items-center">
                  <Upload className="h-4 w-4 mr-1" /> Upload
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={onUpload} 
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded">
                  <input 
                    type="checkbox" 
                    checked={inputIsFile} 
                    onChange={(e) => setInputIsFile(e.target.checked)} 
                  /> 
                  <span>File Mode</span>
                </label>
              </div>
            </div>

            {inputIsFile ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[120px] flex items-center">
                {file ? (
                  <div>
                    <div className="font-medium text-sm sm:text-base">{file.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB ({file.size.toLocaleString()} bytes)
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    No file selected. Click "Upload" to select a file.
                  </div>
                )}
              </div>
            ) : (
              <>
                <textarea 
                  value={textInput} 
                  onChange={(e) => setTextInput(e.target.value)} 
                  placeholder={mode === 'encrypt' ? 'Enter plaintext to encrypt...' : 'Enter ciphertext to decrypt...'} 
                  className="w-full h-40 sm:h-48 p-3 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black resize-none text-gray-900 dark:text-gray-100 text-sm sm:text-base" 
                />
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Characters: {textInput.length} | Bytes: {new Blob([textInput]).size}
                </p>
              </>
            )}
          </div>

          {/* Right: Output */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <label className="text-base sm:text-lg font-semibold">Output</label>
              <div className="flex flex-wrap gap-2">
                <select 
                  value={outputFormat} 
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)} 
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded text-sm border-0"
                >
                  <option value="hex">HEX</option>
                  <option value="base64">Base64</option>
                  <option value="utf8">UTF-8</option>
                </select>
                {outputFormat === 'hex' && (
                  <label className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded text-sm">
                    <input 
                      type="checkbox" 
                      checked={uppercaseHex} 
                      onChange={(e) => setUppercaseHex(e.target.checked)} 
                    /> 
                    <span className="text-blue-700 dark:text-blue-300">Uppercase</span>
                  </label>
                )}
                <button 
                  onClick={onCopy} 
                  disabled={!resultText} 
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded text-sm disabled:opacity-50 hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center"
                >
                  {copied ? (
                    <><CheckCircle className="h-4 w-4 mr-1" />Copied</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" />Copy</>
                  )}
                </button>
                <button 
                  onClick={onDownload} 
                  disabled={!resultBytesPreview} 
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded text-sm disabled:opacity-50 hover:bg-purple-200 dark:hover:bg-purple-900/50 flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[160px] border border-gray-200 dark:border-gray-700 overflow-auto">
              <div className="mb-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Result:</div>
                <code className="text-xs sm:text-sm font-mono break-all text-gray-900 dark:text-gray-100">
                  {resultText || `${mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} result will appear here...`}
                </code>
              </div>

              {resultBytesPreview && (
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <div className="bg-white dark:bg-black rounded-lg p-3 border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Preview (first 256 chars)
                    </div>
                    <div className="text-xs font-mono break-all text-gray-900 dark:text-gray-100 overflow-auto max-h-20">
                      {resultText.length > 256 ? resultText.slice(0, 256) + '…' : resultText}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-black rounded-lg p-3 border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Binary preview (first 32 bytes as hex)
                    </div>
                    <div className="text-xs font-mono break-all text-gray-900 dark:text-gray-100 overflow-auto max-h-20">
                      {bytesToHex(resultBytesPreview.slice(0, 32))}
                      {resultBytesPreview.length > 32 ? '…' : ''}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-black rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Statistics
                    </div>
                    <div className="text-xs text-gray-900 dark:text-gray-100">
                      Size: {resultBytesPreview.length.toLocaleString()} bytes ({(resultBytesPreview.length / 1024).toFixed(2)} KB)
                    </div>
                  </div>
                </div>
              )}

              {running && inputIsFile && file && (
                <div className="mt-4 bg-white dark:bg-black rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Processing: {paused ? 'Paused' : 'Running'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {(progress.done / 1024).toFixed(1)}KB / {(progress.total / 1024).toFixed(1)}KB
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div 
                      style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} 
                      className={`h-full transition-all duration-200 ${paused ? 'bg-orange-500' : 'bg-blue-600'}`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {progress.total ? Math.round((progress.done / progress.total) * 100) : 0}% complete
                  </div>
                </div>
              )}
            </div>

            {/* Advanced options */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  Chunk size (MB)
                </label>
                <input 
                  type="number" 
                  min={1} 
                  max={100}
                  value={chunkMB} 
                  onChange={(e) => setChunkMB(Math.max(1, Math.min(100, Number(e.target.value))))} 
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-black text-sm text-gray-900 dark:text-gray-100" 
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Larger files are processed in chunks to keep the UI responsive.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  Live Mode
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLive(!live)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      live 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {live ? 'ON' : 'OFF'}
                  </button>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Auto-process text changes
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Automatically processes text when you type (text mode only).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 sm:mt-8 bg-white dark:bg-black rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Technical Information & Security Notes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Algorithm Details</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-xs sm:text-sm">
              <li>• <strong>Algorithm:</strong> XOR (Exclusive OR) with repeating key</li>
              <li>• <strong>Key formats:</strong> UTF-8 text or hexadecimal bytes</li>
              <li>• <strong>Output formats:</strong> Hexadecimal, Base64, or UTF-8 text</li>
              <li>• <strong>File processing:</strong> Chunked processing for large files</li>
              <li>• <strong>Key cycling:</strong> Key repeats when shorter than data</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Security & Usage Warnings</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-xs sm:text-sm">
              <li>• <strong>⚠️ NOT cryptographically secure</strong> for confidential data</li>
              <li>• <strong>Educational use only:</strong> Learn XOR cipher concepts</li>
              <li>• <strong>Simple obfuscation:</strong> Hide data from casual viewing</li>
              <li>• <strong>For real security:</strong> Use AES, ChaCha20, or similar</li>
              <li>• <strong>Key reuse:</strong> Never reuse keys with different data</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900/60 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-xs sm:text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Important Security Notice
              </h4>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                XOR cipher is vulnerable to frequency analysis, known-plaintext attacks, and key reuse attacks. 
                It provides NO security against determined attackers. Use modern cryptographic libraries for protecting sensitive information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
