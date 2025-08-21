'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Upload,
  Download,
  CheckCircle,
  Key,
  Shield,
  Hash as HashIcon,
  ClipboardPaste,
  Eraser,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

type OutputFormat = 'hex' | 'base64';
type KeyFormat = 'utf8' | 'hex';
type Mode = 'sha512' | 'hmac';

export default function Sha512HashGenerator() {
  const [mode, setMode] = useState<Mode>('sha512');

  // Inputs
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Options
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('hex');
  const [uppercaseHex, setUppercaseHex] = useState(false);

  // HMAC options
  const [keyFormat, setKeyFormat] = useState<KeyFormat>('utf8');
  const [hmacKey, setHmacKey] = useState('');

  // Results
  const [hashHex, setHashHex] = useState('');
  const [hashBase64, setHashBase64] = useState('');
  const [copied, setCopied] = useState(false);

  // Verify
  const [expected, setExpected] = useState('');
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // === Helpers ===
  const enc = useMemo(() => new TextEncoder(), []);
  const toHex = (buf: ArrayBuffer, upper: boolean) => {
    const v = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < v.length; i++) s += v[i].toString(16).padStart(2, '0');
    return upper ? s.toUpperCase() : s;
  };
  const toBase64 = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };
  const base64ToBytes = (b64: string): Uint8Array | null => {
    try {
      const bin = atob(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    } catch {
      return null;
    }
  };
  const hexToBytes = (hex: string) => {
    const clean = hex.replace(/\s+/g, '');
    if (clean.length % 2 !== 0) return null;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
      const byte = clean.substr(i * 2, 2);
      const n = Number.parseInt(byte, 16);
      if (Number.isNaN(n)) return null;
      out[i] = n;
    }
    return out;
  };
  const strToKeyBytes = (str: string, fmt: KeyFormat): Uint8Array | null =>
    fmt === 'utf8' ? enc.encode(str) : hexToBytes(str);

  const subtle = () => {
    if (!('crypto' in globalThis) || !crypto.subtle) {
      toast.error('Web Crypto not available in this browser.');
      throw new Error('No subtle crypto');
    }
    return crypto.subtle;
  };

  async function digestSHA512(bytes: ArrayBuffer): Promise<ArrayBuffer> {
    return await subtle().digest('SHA-512', bytes);
  }

  async function hmacSHA512(messageBytes: ArrayBuffer, keyBytes: ArrayBuffer): Promise<ArrayBuffer> {
    const key = await subtle().importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-512' } },
      false,
      ['sign']
    );
    return await subtle().sign('HMAC', key, messageBytes);
  }

  // Constant-time compare
  function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
    if (a.length !== b.length) return false;
    let r = 0;
    for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
    return r === 0;
  }

  function normalizeExpectedInput(str: string): { hex?: string; base64?: string } {
    const s = str.trim();
    if (!s) return {};
    if (/^[0-9a-fA-F\s]+$/.test(s) && s.replace(/\s+/g, '').length % 2 === 0) {
      return { hex: s.replace(/\s+/g, '') };
    }
    if (/^[0-9A-Za-z+/=]+$/.test(s)) return { base64: s };
    return {};
  }

  function present(hashBuf: ArrayBuffer) {
    setHashHex(toHex(hashBuf, uppercaseHex));
    setHashBase64(toBase64(hashBuf));
  }

  async function processText() {
    const source = enc.encode(text);
    try {
      if (mode === 'sha512') {
        const h = await digestSHA512(source);
        present(h);
      } else {
        if (!hmacKey) {
          setHashHex('');
          setHashBase64('');
          return;
        }
        const kb = strToKeyBytes(hmacKey, keyFormat);
        if (!kb) {
          toast.error('Invalid HMAC key (hex).');
          return;
        }
        const h = await hmacSHA512(source, kb.buffer.slice(0));
        present(h);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to hash text.');
    }
  }

  async function processFile(f: File) {
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      toast.error('File too large. Please keep it under 25MB.');
      return;
    }
    try {
      const buf = await f.arrayBuffer();
      if (mode === 'sha512') {
        const h = await digestSHA512(buf);
        present(h);
      } else {
        if (!hmacKey) {
          toast.error('Enter an HMAC key first.');
          return;
        }
        const kb = strToKeyBytes(hmacKey, keyFormat);
        if (!kb) {
          toast.error('Invalid HMAC key (hex).');
          return;
        }
        const h = await hmacSHA512(buf, kb.buffer.slice(0));
        present(h);
      }
      toast.success('File hashed successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to read/hash file.');
    }
  }

  // auto-update when inputs change
  useEffect(() => {
    setVerifyOk(null);
    if (file) return;
    if (!text) {
      setHashHex('');
      setHashBase64('');
      return;
    }
    processText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mode, hmacKey, keyFormat, uppercaseHex]);

  // verify whenever expected/hash change
  useEffect(() => {
    if (!expected || (!hashHex && !hashBase64)) {
      setVerifyOk(null);
      return;
    }
    const norm = normalizeExpectedInput(expected);
    let expBytes: Uint8Array | null = null;
    if (norm.hex) expBytes = hexToBytes(norm.hex);
    else if (norm.base64) expBytes = base64ToBytes(norm.base64);
    if (!expBytes) {
      setVerifyOk(false);
      return;
    }
    const current =
      outputFormat === 'hex'
        ? hexToBytes(hashHex || '')
        : base64ToBytes(hashBase64 || '');

    if (!current) {
      setVerifyOk(null);
      return;
    }
    setVerifyOk(timingSafeEqual(current, expBytes));
  }, [expected, hashHex, hashBase64, outputFormat]);

  // === UI actions ===
  const onCopy = async () => {
    const out = outputFormat === 'hex' ? hashHex : hashBase64;
    if (!out) {
      toast.error('Nothing to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Copy failed.');
    }
  };

  const onDownload = () => {
    const hex = hashHex;
    const b64 = hashBase64;
    if (!hex && !b64) {
      toast.error('No hash to download.');
      return;
    }
    const content = `Mode: ${mode === 'sha512' ? 'SHA-512' : 'HMAC-SHA512'}
Output (HEX): ${hex || '-'}
Output (Base64): ${b64 || '-'}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mode}-hash.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded.');
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) processFile(f);
  };

  const onPaste = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      setText((prev) => (prev ? prev + txt : txt));
      toast.success('Pasted from clipboard.');
    } catch {
      toast.error('Paste failed (permissions).');
    }
  };

  const onClear = () => {
    setText('');
    setFile(null);
    setHashHex('');
    setHashBase64('');
    setExpected('');
    setVerifyOk(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Cleared.');
  };

  const generateRandomHmacKey = () => {
    // 512-bit key for HMAC-SHA512
    const bytes = new Uint8Array(64);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setKeyFormat('hex');
    setHmacKey(hex);
    toast.success('Random HMAC key generated (512-bit hex).');
  };

  const prettyHash = outputFormat === 'hex' ? hashHex : hashBase64;
  const pageTitle = mode === 'sha512' ? 'SHA-512 Hash Generator Online' : 'HMAC-SHA512 Generator';

return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-indigo-100/50 dark:from-black dark:to-black py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
    <div className="container mx-auto max-w-6xl">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
          {mode === 'sha512' ? 'SHA-512 Hash Generator Online' : 'HMAC-SHA512 Generator Online'}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
          Fast, client-side {mode === 'sha512' ? 'SHA-512 hashing' : 'HMAC-SHA512 signing'} for text and files.
        </p>
      </div>

      {/* Mode & Primary Action */}
      <div className="bg-card rounded-xl shadow-lg border p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-base sm:text-lg font-semibold">Mode:</span>
            <div className="flex bg-blue-100 dark:bg-blue-900/40 rounded-lg p-1 w-full">
              <button
                onClick={() => setMode('sha512')}
                className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'sha512'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                }`}
              >
                <Shield className="inline h-4 w-4 mr-1" />
                SHA-512
              </button>
              <button
                onClick={() => setMode('hmac')}
                className={`flex-1 min-w-[120px] px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'hmac'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                }`}
              >
                <Lock className="inline h-4 w-4 mr-1" />
                HMAC
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={onClear}
              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center"
            >
              <Eraser className="h-4 w-4 mr-1" />
              Clear
            </button>
            <button
              onClick={() => {
                if (file) processFile(file);
                else processText();
              }}
              disabled={!text && !file}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <HashIcon className="h-4 w-4 mr-1" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* HMAC Config */}
      {mode === 'hmac' && (
        <div className="bg-card rounded-xl shadow-lg border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-base sm:text-lg font-semibold mb-2 block flex items-center">
                <Key className="h-5 w-5 mr-2" />
                HMAC Key
              </label>
              <input
                type="text"
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
                placeholder={keyFormat === 'utf8' ? 'Enter key (UTF-8)' : 'Enter key (hex)'}
                className="w-full p-3 sm:p-4 border rounded-lg bg-background text-sm sm:text-base"
              />
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <input
                    id="kf-utf8"
                    type="radio"
                    className="h-4 w-4"
                    checked={keyFormat === 'utf8'}
                    onChange={() => setKeyFormat('utf8')}
                  />
                  <label htmlFor="kf-utf8" className="text-sm">UTF-8</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="kf-hex"
                    type="radio"
                    className="h-4 w-4"
                    checked={keyFormat === 'hex'}
                    onChange={() => setKeyFormat('hex')}
                  />
                  <label htmlFor="kf-hex" className="text-sm">HEX</label>
                </div>
                <button
                  onClick={generateRandomHmacKey}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 flex items-center"
                >
                  <Key className="h-4 w-4 mr-1" />
                  Random Key
                </button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 flex items-start">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <AlertTriangle className="inline h-4 w-4 mr-2" />
                SHA-512 provides a 512-bit digest. Use HMAC-SHA512 for message authentication.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tool Interface */}
      <div className="bg-card rounded-xl shadow-lg border p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <label className="text-base sm:text-lg font-semibold">
                Input Text
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onPaste}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 flex items-center"
                >
                  <ClipboardPaste className="h-4 w-4 mr-1" />
                  Paste
                </button>

                <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 flex items-center">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload File
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={onUpload}
                    accept=".txt,.json,.xml,.csv,.bin"
                  />
                </label>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text to hash…"
              className="w-full h-40 sm:h-48 p-3 sm:p-4 border rounded-lg bg-background resize-none text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Characters: {text.length}{file ? ` • File: ${file.name} (${(file.size/1024).toFixed(1)} KB)` : ''}
            </p>
          </div>

          {/* Output */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <label className="text-base sm:text-lg font-semibold">
                Output Hash
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-sm"
                >
                  <option value="hex">HEX</option>
                  <option value="base64">Base64</option>
                </select>
                {outputFormat === 'hex' && (
                  <label className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uppercaseHex}
                      onChange={(e) => setUppercaseHex(e.target.checked)}
                    />
                    Uppercase
                  </label>
                )}
                <button
                  onClick={onCopy}
                  disabled={!prettyHash}
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm hover:bg-green-200 flex items-center disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={onDownload}
                  disabled={!prettyHash}
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 flex items-center disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 min-h-[120px]">
              <code className="text-xs sm:text-sm font-mono break-all">
                {prettyHash || 'Hash will appear here…'}
              </code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3">
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                <div className="text-xs text-muted-foreground">HEX</div>
                <div className="text-xs font-mono break-all overflow-hidden">{hashHex || '—'}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                <div className="text-xs text-muted-foreground">Base64</div>
                <div className="text-xs font-mono break-all overflow-hidden">{hashBase64 || '—'}</div>
              </div>
            </div>

            {/* Verify */}
            <div className="mt-4">
              <label className="text-xs sm:text-sm font-semibold mb-1 block">Verify (paste expected HEX/Base64)</label>
              <input
                type="text"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Expected hash…"
                className="w-full p-2 sm:p-3 border rounded-lg bg-background text-sm"
              />
              {verifyOk !== null && (
                <p className={`mt-1 text-xs sm:text-sm font-medium ${verifyOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {verifyOk ? 'Match' : 'Does not match'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Information / SEO block */}
      <div className="mt-6 sm:mt-8 bg-card rounded-xl shadow-lg border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">About SHA-512</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-base font-semibold mb-2">What is SHA-512?</h3>
            <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
              SHA-512 (Secure Hash Algorithm 512-bit) produces a 64-byte digest typically represented as a 128-character hexadecimal string.
            </p>
            <h3 className="text-base font-semibold mb-2">Outputs</h3>
            <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm list-disc list-inside">
              <li>512-bit digest (64 bytes)</li>
              <li>HEX (128 chars) or Base64</li>
              <li>Deterministic & one-way</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-2">Best Practices</h3>
            <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
              Use SHA-512 for checksums and integrity. For authentication use HMAC-SHA512.
            </p>
            <h3 className="text-base font-semibold mb-2">Common Uses</h3>
            <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm list-disc list-inside">
              <li>File integrity verification</li>
              <li>API signing (HMAC-SHA512)</li>
              <li>Data fingerprinting</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="text-base font-semibold mb-3">Tool Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Core</h4>
              <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
                <li>• Text & file hashing</li>
                <li>• Live hashing</li>
                <li>• HEX/Base64 outputs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">HMAC Mode</h4>
              <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
                <li>• UTF-8/HEX key input</li>
                <li>• Random key generator</li>
                <li>• File HMAC support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">UX</h4>
              <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
                <li>• Copy & Download</li>
                <li>• Paste from clipboard</li>
                <li>• Timing-safe verify</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

