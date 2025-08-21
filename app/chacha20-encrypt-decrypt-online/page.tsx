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
  ClipboardPaste,
  AlertTriangle,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

// -- ChaCha20 helpers
function rotl(a: number, b: number) {
  return ((a << b) | (a >>> (32 - b))) >>> 0;
}

function u8ToU32Little(bytes: Uint8Array, offset = 0) {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function u32ToU8Little(n: number, out: Uint8Array, offset = 0) {
  out[offset] = n & 0xff;
  out[offset + 1] = (n >>> 8) & 0xff;
  out[offset + 2] = (n >>> 16) & 0xff;
  out[offset + 3] = (n >>> 24) & 0xff;
}

function quarterRound(state: Uint32Array, a: number, b: number, c: number, d: number) {
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotl(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotl(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotl(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotl(state[b] ^ state[c], 7);
}

function chacha20Block(key32: Uint32Array, counter: number, nonce12: Uint8Array) {
  const state = new Uint32Array(16);
  // constants "expand 32-byte k"
  state[0] = 0x61707865;
  state[1] = 0x3320646e;
  state[2] = 0x79622d32;
  state[3] = 0x6b206574;

  for (let i = 0; i < 8; i++) state[4 + i] = key32[i];

  state[12] = counter >>> 0;
  state[13] = u8ToU32Little(nonce12, 0);
  state[14] = u8ToU32Little(nonce12, 4);
  state[15] = u8ToU32Little(nonce12, 8);

  const working = new Uint32Array(state);

  for (let i = 0; i < 10; i++) {
    quarterRound(working, 0, 4, 8, 12);
    quarterRound(working, 1, 5, 9, 13);
    quarterRound(working, 2, 6, 10, 14);
    quarterRound(working, 3, 7, 11, 15);

    quarterRound(working, 0, 5, 10, 15);
    quarterRound(working, 1, 6, 11, 12);
    quarterRound(working, 2, 7, 8, 13);
    quarterRound(working, 3, 4, 9, 14);
  }

  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) {
    const res = (working[i] + state[i]) >>> 0;
    u32ToU8Little(res, out, i * 4);
  }
  return out;
}

function chacha20XORBuffer(input: Uint8Array, keyBytes: Uint8Array, nonceBytes: Uint8Array, counterStart = 1) {
  if (keyBytes.length !== 32) throw new Error('Key must be 32 bytes');
  if (nonceBytes.length !== 12) throw new Error('Nonce must be 12 bytes');
  const key32 = new Uint32Array(8);
  for (let i = 0; i < 8; i++) key32[i] = u8ToU32Little(keyBytes, i * 4);

  const out = new Uint8Array(input.length);
  let counter = counterStart >>> 0;
  let offset = 0;

  while (offset < input.length) {
    const block = chacha20Block(key32, counter, nonceBytes);
    const take = Math.min(64, input.length - offset);
    for (let i = 0; i < take; i++) out[offset + i] = input[offset + i] ^ block[i];
    offset += take;
    counter = (counter + 1) >>> 0;
  }
  return out;
}

/* ---------------------
   Poly1305 (BigInt) implementation (straightforward, correct)
---------------------- */

function hexToBytes(hex: string): Uint8Array | null {
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
}

function bytesToHex(b: Uint8Array) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

function bytesToBase64(b: Uint8Array) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
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

// Poly1305 helper (BigInt)
function poly1305Tag(message: Uint8Array, key32Bytes: Uint8Array) {
  if (key32Bytes.length !== 32) throw new Error('Poly1305 key must be 32 bytes');

  const rBytes = key32Bytes.subarray(0, 16);
  const sBytes = key32Bytes.subarray(16, 32);

  // parse r little-endian
  let r = BigInt(0);
for (let i = 15; i >= 0; i--) r = (r << BigInt(8)) | BigInt(rBytes[i]);
  // mask r
  const maskHex = BigInt('0x0ffffffc0ffffffc0ffffffc0fffffff');
  r = r & maskHex;

  // parse s little-endian
  let s = 0n;
  for (let i = 15; i >= 0; i--) s = (s << 8n) | BigInt(sBytes[i]);

  const p = (1n << 130n) - 5n;

  let acc = 0n;
  const blockCount = Math.ceil(message.length / 16);

  for (let i = 0; i < blockCount; i++) {
    const start = i * 16;
    const end = Math.min(start + 16, message.length);
    const block = message.subarray(start, end);
    let n = 0n;
    for (let j = block.length - 1; j >= 0; j--) n = (n << 8n) | BigInt(block[j]);
    n += 1n << BigInt(8 * block.length);
    acc = (acc + n) % p;
    acc = (acc * r) % p;
  }

  const tag = (acc + s) % (1n << 128n);

  const out = new Uint8Array(16);
  let tmp = tag;
  for (let i = 0; i < 16; i++) {
    out[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  return out;
}

function pad16Len(n: number) {
  return n % 16 === 0 ? 0 : 16 - (n % 16);
}

function u64le(n: number) {
  const out = new Uint8Array(8);
  let v = BigInt(n);
  for (let i = 0; i < 8; i++) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function concatUint8(arrs: Uint8Array[]) {
  let len = 0;
  for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

function chacha20Poly1305Seal(
  keyBytes: Uint8Array,
  nonceBytes: Uint8Array,
  aad: Uint8Array,
  plaintext: Uint8Array,
  counterStart = 1
) {
  if (keyBytes.length !== 32) throw new Error('Key must be 32 bytes');
  if (nonceBytes.length !== 12) throw new Error('Nonce must be 12 bytes');

  const key32 = new Uint32Array(8);
  for (let i = 0; i < 8; i++) key32[i] = u8ToU32Little(keyBytes, i * 4);
  const block0 = chacha20Block(key32, 0, nonceBytes);
  const polyKey = block0.subarray(0, 32);

  const ciphertext = chacha20XORBuffer(plaintext, keyBytes, nonceBytes, counterStart);

  const aadPad = pad16Len(aad.length);
  const ctPad = pad16Len(ciphertext.length);
  const aadPadBytes = aadPad ? new Uint8Array(aadPad) : new Uint8Array(0);
  const ctPadBytes = ctPad ? new Uint8Array(ctPad) : new Uint8Array(0);

  const macData = concatUint8([
    aad,
    aadPadBytes,
    ciphertext,
    ctPadBytes,
    u64le(aad.length),
    u64le(ciphertext.length)
  ]);

  const tag = poly1305Tag(macData, polyKey);

  return { ciphertext, tag };
}

function chacha20Poly1305Open(
  keyBytes: Uint8Array,
  nonceBytes: Uint8Array,
  aad: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
  counterStart = 1
) {
  if (tag.length !== 16) throw new Error('Tag must be 16 bytes');

  const key32 = new Uint32Array(8);
  for (let i = 0; i < 8; i++) key32[i] = u8ToU32Little(keyBytes, i * 4);
  const block0 = chacha20Block(key32, 0, nonceBytes);
  const polyKey = block0.subarray(0, 32);

  const aadPad = pad16Len(aad.length);
  const ctPad = pad16Len(ciphertext.length);
  const aadPadBytes = aadPad ? new Uint8Array(aadPad) : new Uint8Array(0);
  const ctPadBytes = ctPad ? new Uint8Array(ctPad) : new Uint8Array(0);

  const macData = concatUint8([
    aad,
    aadPadBytes,
    ciphertext,
    ctPadBytes,
    u64le(aad.length),
    u64le(ciphertext.length)
  ]);

  const calcTag = poly1305Tag(macData, polyKey);

  // timing-safe compare
  let eq = true;
  for (let i = 0; i < 16; i++) {
    if (calcTag[i] !== tag[i]) eq = false;
  }
  if (!eq) return null;

  const plaintext = chacha20XORBuffer(ciphertext, keyBytes, nonceBytes, counterStart);
  return plaintext;
}

/* -------------------------
   React component UI
-------------------------- */

type KeyFormat = 'utf8' | 'hex';
type OutputFormat = 'hex' | 'base64';
type Mode = 'encrypt' | 'decrypt';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export default function ChaCha20Poly1305Tool(): JSX.Element {
  // UI & state
  const [mode, setMode] = useState<Mode>('encrypt');
  const [inputIsFile, setInputIsFile] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [keyFormat, setKeyFormat] = useState<KeyFormat>('hex');
  const [keyInput, setKeyInput] = useState('');
  const [nonceInput, setNonceInput] = useState('');
  const [counterStart, setCounterStart] = useState<number>(1);
  const [aadInput, setAadInput] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('hex');
  const [uppercaseHex, setUppercaseHex] = useState(false);
  const [chunkMB, setChunkMB] = useState<number>(4);
  const [live, setLive] = useState(false);

  const [resultText, setResultText] = useState('');
  const [resultBytesPreview, setResultBytesPreview] = useState<Uint8Array | null>(null);
  const [tagHex, setTagHex] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // helpers
  function parseKey(expectedLen: number, input: string, format: KeyFormat) {
    if (format === 'hex') {
      const b = hexToBytes(input);
      if (!b || b.length !== expectedLen) return null;
      return b;
    } else {
      const b = textEncoder.encode(input);
      if (b.length !== expectedLen) return null;
      return b;
    }
  }

  function generateRandomKey() {
    const k = randomBytes(32);
    setKeyFormat('hex');
    setKeyInput(bytesToHex(k));
    toast.success('Random 256-bit key generated (hex).');
  }
  function generateRandomNonce() {
    const n = randomBytes(12);
    setKeyFormat('hex');
    setNonceInput(bytesToHex(n));
    toast.success('Random 96-bit nonce generated (hex).');
  }

  function encodeOutput(b: Uint8Array) {
    if (outputFormat === 'hex') {
      const h = bytesToHex(b);
      return uppercaseHex ? h.toUpperCase() : h;
    } else {
      return bytesToBase64(b);
    }
  }

  // processing (text)
  async function processTextAEAD() {
    const keyBytes = parseKey(32, keyInput, keyFormat);
    const nonceBytes = parseKey(12, nonceInput, keyFormat);
    if (!keyBytes || !nonceBytes) {
      toast.error('Key must be 32 bytes and nonce 12 bytes (match key format).');
      return;
    }
    try {
      setRunning(true);
      cancelRef.current = false;
      const aad = textEncoder.encode(aadInput || '');
      if (mode === 'encrypt') {
        const pt = textEncoder.encode(textInput || '');
        const { ciphertext, tag } = chacha20Poly1305Seal(keyBytes, nonceBytes, aad, pt, counterStart);
        const out = encodeOutput(ciphertext);
        setResultText(out);
        setResultBytesPreview(ciphertext);
        setTagHex(bytesToHex(tag));
        toast.success('Text encrypted (AEAD).');
      } else {
        toast.error('Paste ciphertext into the text area and tag into the Tag field, then click Decrypt.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Processing failed.');
    } finally {
      setRunning(false);
    }
  }

  // processing (file) - reads into memory for AEAD (safe-limit)
  async function processFileAEAD(f: File) {
    const keyBytes = parseKey(32, keyInput, keyFormat);
    const nonceBytes = parseKey(12, nonceInput, keyFormat);
    if (!keyBytes || !nonceBytes) {
      toast.error('Key must be 32 bytes and nonce 12 bytes (match key format).');
      return;
    }
    if (!f) {
      toast.error('No file provided.');
      return;
    }

    const MAX_IN_MEMORY = 200 * 1024 * 1024; // 200MB
    if (f.size > MAX_IN_MEMORY) {
      toast.error('File too large for in-browser AEAD processing (limit 200MB). Use smaller files.');
      return;
    }

    try {
      setRunning(true);
      cancelRef.current = false;
      setProgress({ done: 0, total: f.size });

      const buf = await f.arrayBuffer();
      const pt = new Uint8Array(buf);

      if (mode === 'encrypt') {
        const aad = textEncoder.encode(aadInput || '');
        const { ciphertext, tag } = chacha20Poly1305Seal(keyBytes, nonceBytes, aad, pt, counterStart);
        setResultBytesPreview(ciphertext);
        setResultText(encodeOutput(ciphertext));
        setTagHex(bytesToHex(tag));
        toast.success('File encrypted (AEAD).');
      } else {
        toast.error('To decrypt a file: upload ciphertext and paste the Tag into the Tag input, then click Decrypt.');
      }
    } catch (e) {
      console.error(e);
      toast.error('File processing failed.');
    } finally {
      setRunning(false);
    }
  }

  // decrypt helpers
  async function decryptTextAead(encodedCiphertext: string, tagEncoded: string) {
    const keyBytes = parseKey(32, keyInput, keyFormat);
    const nonceBytes = parseKey(12, nonceInput, keyFormat);
    if (!keyBytes || !nonceBytes) {
      toast.error('Key must be 32 bytes and nonce 12 bytes (match key format).');
      return;
    }
    const ctBytes = outputFormat === 'hex' ? hexToBytes(encodedCiphertext) : base64ToBytes(encodedCiphertext);
    const tagBytes = hexToBytes(tagEncoded) ?? base64ToBytes(tagEncoded);
    if (!ctBytes || !tagBytes) {
      toast.error('Invalid ciphertext or tag format.');
      return;
    }
    const aad = textEncoder.encode(aadInput || '');
    const pt = chacha20Poly1305Open(keyBytes, nonceBytes, aad, ctBytes, tagBytes, counterStart);
    if (!pt) {
      toast.error('Tag verification failed — decryption aborted.');
      return;
    }
    try {
      const textOut = textDecoder.decode(pt);
      setResultText(textOut);
      setResultBytesPreview(pt);
      toast.success('Decryption verified and succeeded.');
    } catch {
      setResultBytesPreview(pt);
      setResultText(encodeOutput(pt));
      toast.success('Decryption succeeded (binary output).');
    }
  }

  async function decryptFileAead(f: File, tagEncoded: string) {
    const keyBytes = parseKey(32, keyInput, keyFormat);
    const nonceBytes = parseKey(12, nonceInput, keyFormat);
    if (!keyBytes || !nonceBytes) {
      toast.error('Key must be 32 bytes and nonce 12 bytes (match key format).');
      return;
    }
    if (!f) {
      toast.error('Upload ciphertext file first.');
      return;
    }
    const tagBytes = hexToBytes(tagEncoded) ?? base64ToBytes(tagEncoded);
    if (!tagBytes) {
      toast.error('Invalid tag format.');
      return;
    }

    const MAX_IN_MEMORY = 200 * 1024 * 1024;
    if (f.size > MAX_IN_MEMORY) {
      toast.error('File too large for in-browser AEAD processing (limit 200MB).');
      return;
    }

    try {
      setRunning(true);
      const buf = await f.arrayBuffer();
      const ct = new Uint8Array(buf);
      const aad = textEncoder.encode(aadInput || '');
      const pt = chacha20Poly1305Open(keyBytes, nonceBytes, aad, ct, tagBytes, counterStart);
      if (!pt) {
        toast.error('Tag verification failed — decryption aborted.');
        setRunning(false);
        return;
      }
      setResultBytesPreview(pt);
      try {
        const textOut = textDecoder.decode(pt);
        setResultText(textOut);
      } catch {
        setResultText(encodeOutput(pt));
      }
      toast.success('File decrypted and verified.');
    } catch (e) {
      console.error(e);
      toast.error('File decryption failed.');
    } finally {
      setRunning(false);
    }
  }

  /* UI actions */
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      toast.success(`File selected: ${f.name}`);
      if (live && mode === 'encrypt') processFileAEAD(f);
    }
  };

  const onCopy = async () => {
    if (!resultText) {
      toast.error('Nothing to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(resultText);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Copy failed.');
    }
  };

  const onDownload = () => {
    if (!resultBytesPreview) {
      toast.error('Nothing to download.');
      return;
    }
    const blob = new Blob([resultBytesPreview], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chacha20-poly1305-${mode === 'encrypt' ? 'ciphertext' : 'plaintext'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded result.');
  };

  const onClear = () => {
    setTextInput('');
    setFile(null);
    setResultText('');
    setResultBytesPreview(null);
    setTagHex('');
    setProgress({ done: 0, total: 0 });
    cancelRef.current = true;
    setRunning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Cleared.');
  };

  const runNow = async () => {
    setResultText('');
    setResultBytesPreview(null);
    setTagHex('');
    if (inputIsFile && file) {
      if (mode === 'encrypt') await processFileAEAD(file);
      else {
        toast.error('For file decryption: upload ciphertext and paste Tag into Tag input, then click Decrypt.');
      }
    } else {
      if (mode === 'encrypt') await processTextAEAD();
      else {
        toast.error('For text decryption: paste ciphertext into the text area and tag into Tag field, then click Decrypt.');
      }
    }
  };

  const decryptNow = async (tagField: string) => {
    if (inputIsFile && file) {
      await decryptFileAead(file, tagField);
    } else {
      await decryptTextAead(textInput, tagField);
    }
  };

  // live-mode auto-run (encrypt only)
  useEffect(() => {
    if (!live) return;
    if (inputIsFile && file && mode === 'encrypt') {
      processFileAEAD(file);
    } else if (!inputIsFile && mode === 'encrypt') {
      processTextAEAD();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyInput, nonceInput, aadInput, textInput, live, keyFormat, outputFormat, uppercaseHex, mode]);

  const keyHint = keyFormat === 'hex' ? '64 hex chars (32 bytes)' : '32 bytes (UTF-8)';
  const nonceHint = keyFormat === 'hex' ? '24 hex chars (12 bytes)' : '12 bytes (UTF-8)';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-indigo-100/50 dark:from-black dark:to-black py-4 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 px-2">
            ChaCha20 Poly1305 (AEAD) Encrypt Decrypt Online
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-4xl mx-auto px-2">
            ChaCha20-Poly1305 provides authenticated encryption (confidentiality + integrity). This runs entirely in your browser. Do not reuse key+nonce pairs.
          </p>
        </div>

        {/* Mode & Actions */}
        <div className="bg-white dark:bg-black rounded-lg shadow-lg border dark:border-gray-800 p-4 mb-4">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-base sm:text-lg font-semibold">Mode:</span>
              <div className="flex bg-blue-100 dark:bg-blue-900/40 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setMode('encrypt')}
                  className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'encrypt' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                  }`}
                >
                  <Lock className="inline h-4 w-4 mr-1" /> Encrypt
                </button>
                <button
                  onClick={() => setMode('decrypt')}
                  className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'decrypt' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                  }`}
                >
                  <Unlock className="inline h-4 w-4 mr-1" /> Decrypt
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <button 
                onClick={onClear} 
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <Eraser className="h-4 w-4 mr-2" /> Clear
              </button>
              <button 
                onClick={runNow} 
                disabled={running || (!textInput && !file && !inputIsFile)} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Play className="h-4 w-4 mr-2" /> {mode === 'encrypt' ? 'Encrypt' : 'Prepare Decrypt'}
              </button>
            </div>
          </div>
        </div>

        {/* Key & Nonce */}
        <div className="bg-white dark:bg-black rounded-lg shadow-lg border dark:border-gray-800 p-4 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm sm:text-base font-semibold flex items-center">
                <Key className="h-4 w-4 mr-2" /> Key (256-bit)
              </label>
              <input 
                value={keyInput} 
                onChange={(e) => setKeyInput(e.target.value)} 
                placeholder={keyFormat === 'hex' ? '64 hex characters' : 'Enter key (UTF-8, 32 bytes)'} 
                className="w-full p-3 border rounded-lg bg-white dark:bg-black dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input id="kf-utf8" type="radio" checked={keyFormat === 'utf8'} onChange={() => setKeyFormat('utf8')} className="h-4 w-4" />
                    <label htmlFor="kf-utf8" className="text-sm">UTF-8</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="kf-hex" type="radio" checked={keyFormat === 'hex'} onChange={() => setKeyFormat('hex')} className="h-4 w-4" />
                    <label htmlFor="kf-hex" className="text-sm">HEX</label>
                  </div>
                </div>
                <button 
                  onClick={generateRandomKey} 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Generate Random Key
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Expected: {keyHint}</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm sm:text-base font-semibold">Nonce (96-bit)</label>
              <input 
                value={nonceInput} 
                onChange={(e) => setNonceInput(e.target.value)} 
                placeholder={keyFormat === 'hex' ? '24 hex chars' : 'Enter nonce (UTF-8, 12 bytes)'} 
                className="w-full p-3 border rounded-lg bg-white dark:bg-black dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <button 
                  onClick={generateRandomNonce} 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Generate Random Nonce
                </button>
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-sm whitespace-nowrap">Initial counter</label>
                  <input 
                    type="number" 
                    value={counterStart} 
                    onChange={(e) => setCounterStart(Math.max(0, Number(e.target.value) >>> 0))} 
                    className="w-20 sm:w-24 p-2 border rounded bg-white dark:bg-black dark:border-gray-700 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Expected: {nonceHint}</p>
            </div>
          </div>
        </div>

        {/* AAD */}
        <div className="bg-white dark:bg-black rounded-lg shadow-lg border dark:border-gray-800 p-4 mb-4">
          <label className="text-sm sm:text-base font-semibold mb-2 block">Additional Authenticated Data (AAD)</label>
          <input 
            value={aadInput} 
            onChange={(e) => setAadInput(e.target.value)} 
            placeholder="Optional associated data (UTF-8 text)" 
            className="w-full p-3 border rounded bg-white dark:bg-black dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            AAD is authenticated but not encrypted. Include protocol headers, filenames, etc., if required.
          </p>
        </div>

        {/* Input / Output */}
        <div className="bg-white dark:bg-black rounded-lg shadow-lg border dark:border-gray-800 p-4 mb-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Input */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="text-sm sm:text-base font-semibold">
                  {inputIsFile ? 'File (ciphertext/plaintext)' : mode === 'encrypt' ? 'Plaintext' : 'Ciphertext (encoded)'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={async () => { 
                      try { 
                        const t = await navigator.clipboard.readText(); 
                        setTextInput((p) => (p ? p + t : t)); 
                        toast.success('Pasted'); 
                      } catch { 
                        toast.error('Paste failed'); 
                      } 
                    }} 
                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <ClipboardPaste className="inline h-3 w-3 mr-1" /> Paste
                  </button>

                  <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    <Upload className="inline h-3 w-3 mr-1" /> Upload
                    <input ref={fileInputRef} type="file" className="hidden" onChange={onUpload} />
                  </label>

                  <label className="cursor-pointer bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={inputIsFile} 
                      onChange={(e) => setInputIsFile(e.target.checked)} 
                      className="mr-1" 
                    /> File Mode
                  </label>
                </div>
              </div>

              {inputIsFile ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[120px] flex items-center">
                  {file ? (
                    <div>
                      <div className="font-medium text-sm">{file.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Upload a file (ciphertext for decrypt / plaintext for encrypt).
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <textarea 
                    value={textInput} 
                    onChange={(e) => setTextInput(e.target.value)} 
                    placeholder={mode === 'encrypt' ? 'Enter plaintext to encrypt...' : (outputFormat === 'hex' ? 'Paste HEX ciphertext here...' : 'Paste Base64 ciphertext here...')} 
                    className="w-full h-32 sm:h-40 p-3 border rounded-lg bg-white dark:bg-black dark:border-gray-700 resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Characters: {textInput.length}</p>
                </>
              )}
            </div>

            {/* Output */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="text-sm sm:text-base font-semibold">Output / Tag</label>
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={outputFormat} 
                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)} 
                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs focus:ring-2 focus:ring-blue-500 dark:border-gray-700"
                  >
                    <option value="hex">HEX</option>
                    <option value="base64">Base64</option>
                  </select>
                  {outputFormat === 'hex' && (
                    <label className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">
                      <input 
                        type="checkbox" 
                        checked={uppercaseHex} 
                        onChange={(e) => setUppercaseHex(e.target.checked)} 
                        className="h-3 w-3" 
                      /> Uppercase
                    </label>
                  )}
                  <button 
                    onClick={onCopy} 
                    disabled={!resultText} 
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <Copy className="inline h-3 w-3 mr-1" /> Copy
                  </button>
                  <button 
                    onClick={onDownload} 
                    disabled={!resultBytesPreview} 
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <Download className="inline h-3 w-3 mr-1" /> Download
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 min-h-[120px]">
                <code className="text-xs font-mono break-all block overflow-hidden">
                  {resultText || 'Result will appear here…'}
                </code>

                <div className="grid grid-cols-1 gap-2 mt-3">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Tag (HEX)</div>
                    <div className="text-xs font-mono break-all">{tagHex || '—'}</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Preview (first 128 chars)</div>
                    <div className="text-xs font-mono break-all">
                      {resultText ? (resultText.length > 128 ? resultText.slice(0, 128) + '…' : resultText) : '—'}
                    </div>
                  </div>
                </div>

                {inputIsFile && file && (
                  <div className="mt-3">
                    <div className="text-xs mb-2">
                      Progress: {(progress.done / 1024).toFixed(1)}KB / {(progress.total / 1024).toFixed(1)}KB
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded h-2 overflow-hidden">
                      <div 
                        style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} 
                        className="h-full bg-blue-600 transition-all duration-300" 
                      />
                    </div>
                  </div>
                )}

                {mode === 'decrypt' && (
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-semibold block">Tag (paste HEX or Base64)</label>
                    <input 
                      id="tag-input" 
                      type="text" 
                      placeholder="Paste Tag here (HEX/Base64)" 
                      className="w-full p-2 border rounded-lg bg-white dark:bg-black dark:border-gray-700 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={async () => {
                          const el = document.getElementById('tag-input') as HTMLInputElement | null;
                          const tagVal = el?.value || '';
                          if (!tagVal) { toast.error('Paste the Tag first'); return; }
                          await decryptNow(tagVal);
                        }} 
                        className="bg-red-600 text-white px-3 py-2 rounded text-xs hover:bg-red-700 transition-colors"
                      >
                        Decrypt & Verify
                      </button>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('tag-input') as HTMLInputElement | null;
                          if (el) { 
                            navigator.clipboard.readText().then((t) => { 
                              el.value = t; 
                              toast.success('Pasted Tag'); 
                            }).catch(()=>toast.error('Paste failed')); 
                          }
                        }} 
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-2 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Paste Tag
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Notes */}
        <div className="bg-white dark:bg-black rounded-lg shadow-lg border dark:border-gray-800 p-4">
          <h2 className="text-lg sm:text-xl font-bold mb-3">Security Notes & Best Practices</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                <AlertTriangle className="inline h-4 w-4 mr-2" />
                ChaCha20-Poly1305 is an AEAD cipher providing both confidentiality and integrity. The one-time Poly1305 key is derived from the ChaCha20 counter=0 block.
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-xs sm:text-sm ml-4">
                <li>• NEVER reuse the same key+nonce pair for multiple messages.</li>
                <li>• Use secure random nonces or unique counters to ensure uniqueness.</li>
                <li>• Keep keys secret and use secure random generation where possible.</li>
                <li>• Consider a header format for files (nonce + tag + ciphertext).</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm sm:text-base">Supported features</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-xs sm:text-sm ml-4">
                <li>• ChaCha20-Poly1305 AEAD (RFC 8439) — encrypt & verify</li>
                <li>• AAD support</li>
                <li>• Key/nonce HEX or UTF-8 inputs + secure random generation</li>
                <li>• Text + File processing (in-browser)</li>
                <li>• Copy, Download, Paste, Toast notifications</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
