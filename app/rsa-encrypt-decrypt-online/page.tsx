'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Key,
  Upload,
  Download,
  Copy,
  CheckCircle,
  Eraser,
  Lock,
  Unlock,
  FileText,
  ShieldCheck,
  ClipboardPaste,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

/* ============================
   Utilities: PEM <-> ArrayBuffer
   ============================ */

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string) {
  const bin = atob(b64);
  const len = bin.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function formatPem(base64: string, type: 'PUBLIC KEY' | 'PRIVATE KEY') {
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

function pemToBase64(pem: string) {
  return pem.replace(/-----(BEGIN|END)[\w\s]+-----/g, '').replace(/\s+/g, '');
}

/* ============================
   WebCrypto helpers
   ============================ */

type RsaKeyPair = { publicKey: CryptoKey; privateKey: CryptoKey };

async function generateRsaKeyPair(modulusLength = 2048): Promise<RsaKeyPair> {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );

  return { publicKey: pair.publicKey, privateKey: pair.privateKey } as RsaKeyPair;
}

async function exportPublicKeyToPem(key: CryptoKey) {
  const spki = await crypto.subtle.exportKey('spki', key);
  const b64 = arrayBufferToBase64(spki);
  return formatPem(b64, 'PUBLIC KEY');
}

async function exportPrivateKeyToPem(key: CryptoKey) {
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', key);
  const b64 = arrayBufferToBase64(pkcs8);
  return formatPem(b64, 'PRIVATE KEY');
}

async function importPublicKeyFromPem(pem: string, usage: 'encrypt' | 'verify' = 'encrypt') {
  try {
    const b64 = pemToBase64(pem);
    const buf = base64ToArrayBuffer(b64);
    return await crypto.subtle.importKey(
      'spki',
      buf,
      {
        name: usage === 'encrypt' ? 'RSA-OAEP' : 'RSA-PSS',
        hash: 'SHA-256'
      },
      true,
      usage === 'encrypt' ? ['encrypt'] : ['verify']
    );
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function importPrivateKeyFromPem(pem: string, usage: 'decrypt' | 'sign' = 'decrypt') {
  try {
    const b64 = pemToBase64(pem);
    const buf = base64ToArrayBuffer(b64);
    return await crypto.subtle.importKey(
      'pkcs8',
      buf,
      {
        name: usage === 'decrypt' ? 'RSA-OAEP' : 'RSA-PSS',
        hash: 'SHA-256'
      },
      true,
      usage === 'decrypt' ? ['decrypt'] : ['sign']
    );
  } catch (e) {
    console.error(e);
    return null;
  }
}

/* ============================
   AES-GCM helpers for hybrid
   ============================ */

async function generateAesKey(length = 256) {
  return await crypto.subtle.generateKey({ name: 'AES-GCM', length }, true, ['encrypt', 'decrypt']);
}

async function aesGcmEncrypt(aesKey: CryptoKey, plaintext: Uint8Array, iv?: Uint8Array) {
  const nonce = iv ?? crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    plaintext
  );
  return { ciphertext: new Uint8Array(ct), iv: nonce };
}

async function aesGcmDecrypt(aesKey: CryptoKey, ciphertext: Uint8Array, iv: Uint8Array) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
  return new Uint8Array(pt);
}

async function exportAesKeyRaw(key: CryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

async function importAesKeyFromRaw(raw: Uint8Array) {
  return await crypto.subtle.importKey('raw', raw.buffer, 'AES-GCM', true, ['encrypt', 'decrypt']);
}

/* ============================
   RSA Hybrid Encrypt / Decrypt
   ============================ */

async function rsaHybridEncrypt(publicKey: CryptoKey, plaintext: Uint8Array) {
  const aesKey = await generateAesKey(256);
  const rawAes = await exportAesKeyRaw(aesKey);
  const encKeyBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAes.buffer);
  const { ciphertext, iv } = await aesGcmEncrypt(aesKey, plaintext);
  return {
    mode: 'hybrid',
    encKey: arrayBufferToBase64(encKeyBuf),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext.buffer),
    rsa: 'RSA-OAEP',
    aes: 'AES-GCM'
  };
}

async function rsaHybridDecrypt(privateKey: CryptoKey, payload: { encKey: string; iv: string; ciphertext: string }) {
  const encKeyBuf = base64ToArrayBuffer(payload.encKey);
  const rawAesBuf = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encKeyBuf);
  const aesKey = await importAesKeyFromRaw(new Uint8Array(rawAesBuf));
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = new Uint8Array(base64ToArrayBuffer(payload.ciphertext));
  const pt = await aesGcmDecrypt(aesKey, ciphertext, iv);
  return pt;
}

/* ============================
   RSA Direct encrypt (small messages)
   ============================ */

async function rsaEncryptDirect(publicKey: CryptoKey, plaintext: Uint8Array) {
  const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, plaintext);
  return new Uint8Array(ct);
}

async function rsaDecryptDirect(privateKey: CryptoKey, ciphertext: Uint8Array) {
  const pt = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, ciphertext);
  return new Uint8Array(pt);
}

/* ============================
   RSA Sign / Verify (RSA-PSS)
   ============================ */

async function importPrivateKeyForSign(pem: string) {
  try {
    const b64 = pemToBase64(pem);
    const buf = base64ToArrayBuffer(b64);
    return await crypto.subtle.importKey('pkcs8', buf, { name: 'RSA-PSS', hash: 'SHA-256' }, true, ['sign']);
  } catch {
    return null;
  }
}

async function importPublicKeyForVerify(pem: string) {
  try {
    const b64 = pemToBase64(pem);
    const buf = base64ToArrayBuffer(b64);
    return await crypto.subtle.importKey('spki', buf, { name: 'RSA-PSS', hash: 'SHA-256' }, true, ['verify']);
  } catch {
    return null;
  }
}

async function rsaSign(privateKey: CryptoKey, data: Uint8Array) {
  const sig = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, privateKey, data);
  return new Uint8Array(sig);
}

async function rsaVerify(publicKey: CryptoKey, data: Uint8Array, signature: Uint8Array) {
  return await crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, publicKey, signature.buffer, data.buffer);
}

function bytesToBase64(bytes: Uint8Array) {
  return arrayBufferToBase64(bytes.buffer);
}


/* ============================
   React Component UI
   ============================ */

export default function RSAEncryptDecryptTool(): JSX.Element {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [useHybrid, setUseHybrid] = useState(true);
  const [keySize, setKeySize] = useState<number>(2048);

  const [publicPem, setPublicPem] = useState('');
  const [privatePem, setPrivatePem] = useState('');

  const [pubKeyObj, setPubKeyObj] = useState<CryptoKey | null>(null);
  const [privKeyObj, setPrivKeyObj] = useState<CryptoKey | null>(null);

  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inputIsFile, setInputIsFile] = useState(false);

  const [outputText, setOutputText] = useState('');
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const [running, setRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleGenerateKeys = async () => {
    try {
      setRunning(true);
      const pair = await crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: keySize, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: 'SHA-256' },
        true,
        ['encrypt', 'decrypt']
      );
      const pubPem = await exportPublicKeyToPem(pair.publicKey);
      const privPem = await exportPrivateKeyToPem(pair.privateKey);
      setPublicPem(pubPem);
      setPrivatePem(privPem);
      setPubKeyObj(pair.publicKey);
      setPrivKeyObj(pair.privateKey);
      toast.success('RSA key pair generated');
    } catch (e) {
      console.error(e);
      toast.error('Key generation failed');
    } finally {
      setRunning(false);
    }
  };

  const handleImportPublic = async () => {
    const k = await importPublicKeyFromPem(publicPem, 'encrypt');
    if (k) {
      setPubKeyObj(k);
      toast.success('Public key imported');
    } else {
      toast.error('Failed to import public key (PEM invalid?)');
    }
  };

  const handleImportPrivate = async () => {
    const k = await importPrivateKeyFromPem(privatePem, 'decrypt');
    if (k) {
      setPrivKeyObj(k);
      toast.success('Private key imported');
    } else {
      toast.error('Failed to import private key (PEM invalid?)');
    }
  };

  const handleExportPublic = async () => {
    if (!pubKeyObj) { toast.error('No public key to export'); return; }
    const pem = await exportPublicKeyToPem(pubKeyObj);
    setPublicPem(pem);
    toast.success('Public PEM exported to textarea');
  };

  const handleExportPrivate = async () => {
    if (!privKeyObj) { toast.error('No private key to export'); return; }
    const pem = await exportPrivateKeyToPem(privKeyObj);
    setPrivatePem(pem);
    toast.success('Private PEM exported to textarea');
  };

  const handleDownloadBothKeys = () => {
    if (!publicPem || !privatePem) {
      toast.error('Generate or import both keys first');
      return;
    }
    
    const combined = `# RSA Key Pair - Generated ${new Date().toISOString()}\n\n${publicPem}\n\n${privatePem}`;
    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsa-keypair-${keySize}bit.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Key pair downloaded');
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) toast.success(`File selected: ${f.name}`);
  };

  const runNow = async () => {
    try {
      setRunning(true);
      setOutputText('');
      setOutputBytes(null);

      let inputBytes: Uint8Array;
      if (inputIsFile) {
        if (!file) { toast.error('Upload a file first'); return; }
        const buf = await file.arrayBuffer();
        inputBytes = new Uint8Array(buf);
      } else {
        inputBytes = new TextEncoder().encode(textInput || '');
      }

      if (mode === 'encrypt') {
        if (!pubKeyObj) { toast.error('Provide/import a public key'); return; }

        if (useHybrid) {
          const payload = await rsaHybridEncrypt(pubKeyObj, inputBytes);
          const json = JSON.stringify(payload);
          const b64 = btoa(json);
          setOutputText(b64);
          setOutputBytes(new Uint8Array(new TextEncoder().encode(json)));
          toast.success('Hybrid encryption complete (RSA-OAEP + AES-GCM)');
        } else {
          const ct = await rsaEncryptDirect(pubKeyObj, inputBytes);
          const b64 = arrayBufferToBase64(ct.buffer);
          setOutputText(b64);
          setOutputBytes(ct);
          toast.success('Direct RSA encryption complete (OAEP)');
        }
      } else {
        if (!privKeyObj) { toast.error('Provide/import a private key'); return; }
        
        const tryStr = (() => {
          try {
            return new TextDecoder().decode(inputBytes);
          } catch {
            return null;
          }
        })();

        let asJson: any = null;
        try {
          const maybeB64 = new TextDecoder().decode(inputBytes);
          try {
            const decoded = atob(maybeB64);
            asJson = JSON.parse(decoded);
          } catch (_) {
            try {
              asJson = JSON.parse(maybeB64);
            } catch (_) {
              asJson = null;
            }
          }
        } catch (_) { asJson = null; }

        if (asJson && asJson.encKey && asJson.ciphertext) {
          const pt = await rsaHybridDecrypt(privKeyObj, { encKey: asJson.encKey, iv: asJson.iv, ciphertext: asJson.ciphertext });
          try {
            setOutputText(new TextDecoder().decode(pt));
            setOutputBytes(pt);
            toast.success('Hybrid decryption successful');
          } catch {
            setOutputText(bytesToBase64(pt));
            setOutputBytes(pt);
            toast.success('Hybrid decryption (binary) successful');
          }
        } else {
          try {
            const b64 = new TextDecoder().decode(inputBytes);
            const ctBuf = base64ToArrayBuffer(b64);
            if (!ctBuf) throw new Error('Invalid base64 for direct RSA ciphertext');
            const pt = await rsaDecryptDirect(privKeyObj, new Uint8Array(ctBuf));
            try {
              setOutputText(new TextDecoder().decode(pt));
              setOutputBytes(pt);
              toast.success('Direct RSA decryption successful');
            } catch {
              setOutputText(bytesToBase64(pt));
              setOutputBytes(pt);
              toast.success('Direct RSA decryption (binary) successful');
            }
          } catch (err) {
            console.error(err);
            toast.error('Failed to detect or decrypt payload. For hybrid payload use the hybrid option or paste the exact base64 JSON previously produced.');
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Operation failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSign = async () => {
    if (!privatePem) { toast.error('Paste/import a private PEM to sign'); return; }
    const pk = await importPrivateKeyForSign(privatePem);
    if (!pk) { toast.error('Invalid private PEM for signing'); return; }
    const data = new TextEncoder().encode(textInput || '');
    const sig = await rsaSign(pk, data);
    setOutputText(arrayBufferToBase64(sig.buffer));
    setOutputBytes(sig);
    toast.success('Data signed (RSA-PSS, SHA-256)');
  };

  const handleVerify = async () => {
    if (!publicPem) { toast.error('Paste/import a public PEM to verify'); return; }
    const pub = await importPublicKeyForVerify(publicPem);
    if (!pub) { toast.error('Invalid public PEM for verify'); return; }
    try {
      const sigBuf = base64ToArrayBuffer(outputText.trim());
      if (!sigBuf) { toast.error('Provide signature in output field (base64)'); return; }
      const data = new TextEncoder().encode(textInput || '');
      const ok = await rsaVerify(pub, data, new Uint8Array(sigBuf));
      toast.success(ok ? 'Signature verified' : 'Signature INVALID');
    } catch {
      toast.error('Verification error');
    }
  };

  const downloadResult = (filename = '') => {
    if (!outputBytes && !outputText) { toast.error('No result to download'); return; }
    if (outputBytes) {
      const blob = new Blob([outputBytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || (mode === 'encrypt' ? 'rsa-encrypted.bin' : 'rsa-decrypted.bin');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded result');
    } else {
      const blob = new Blob([outputText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'rsa-result.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded text result');
    }
  };

  const pasteToInput = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      setTextInput((p) => (p ? p + txt : txt));
      toast.success('Pasted to input');
    } catch {
      toast.error('Paste failed');
    }
  };

  const copyOutput = async () => {
    if (!outputText) { toast.error('No output to copy'); return; }
    try {
      await navigator.clipboard.writeText(outputText);
      toast.success('Output copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-indigo-100/50 dark:from-black dark:to-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">RSA Encrypt Decrypt & Key Generator Online</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Generate/import RSA keys, encrypt/decrypt large files (RSA-OAEP + AES-GCM hybrid), sign/verify (RSA-PSS). Runs entirely in your browser.
          </p>
        </div>

        {/* Mode & Actions */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold">Mode:</span>
              <div className="flex bg-blue-100 dark:bg-blue-900/40 rounded-lg p-1">
                <button
                  onClick={() => setMode('encrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'encrypt' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                  }`}
                >
                  <Lock className="inline h-4 w-4 mr-1" /> Encrypt
                </button>
                <button
                  onClick={() => setMode('decrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'decrypt' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white'
                  }`}
                >
                  <Unlock className="inline h-4 w-4 mr-1" /> Decrypt
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => { 
                  setTextInput(''); 
                  setFile(null); 
                  setOutputText(''); 
                  setOutputBytes(null); 
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  toast.success('Cleared'); 
                }} 
                className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100"
              >
                <Eraser className="inline h-4 w-4 mr-2" /> Clear
              </button>
              <button 
                onClick={runNow} 
                disabled={running}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="inline h-4 w-4 mr-2" /> Run
              </button>
            </div>
          </div>

          {/* Hybrid option */}
          <div className="flex items-center gap-3 mt-4">
            <label className="text-sm text-muted-foreground">Hybrid (RSA-OAEP + AES-GCM)</label>
            <input 
              type="checkbox" 
              checked={useHybrid} 
              onChange={(e) => setUseHybrid(e.target.checked)} 
              className="h-4 w-4 text-blue-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
            />
          </div>
        </div>

        {/* Keys section */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-base sm:text-lg font-semibold mb-2 block">
                <Key className="inline h-5 w-5 mr-2" /> Key Size
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[2048, 3072, 4096].map((size) => (
                  <button
                    key={size}
                    onClick={() => setKeySize(size)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      keySize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {size} bits
                  </button>
                ))}
              </div>
              <button 
                onClick={handleGenerateKeys} 
                disabled={running}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded transition-colors mb-2"
              >
                Generate Key Pair
              </button>
              <button 
                onClick={handleDownloadBothKeys} 
                className="w-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 px-3 py-2 rounded transition-colors"
              >
                <Download className="inline mr-2 w-4 h-4" />
                Download Both Keys
              </button>
            </div>

            <div>
              <label className="text-base sm:text-lg font-semibold mb-2 block">Public Key (PEM)</label>
              <textarea 
                value={publicPem} 
                onChange={(e) => setPublicPem(e.target.value)} 
                className="w-full h-40 p-3 border rounded-lg bg-background resize-none" 
                placeholder="Paste or export public PEM here" 
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleImportPublic} 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded text-sm"
                >
                  Import
                </button>
                <button 
                  onClick={handleExportPublic} 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded text-sm"
                >
                  Export
                </button>
              </div>
            </div>

            <div>
              <label className="text-base sm:text-lg font-semibold mb-2 block">Private Key (PEM)</label>
              <textarea 
                value={privatePem} 
                onChange={(e) => setPrivatePem(e.target.value)} 
                className="w-full h-40 p-3 border rounded-lg bg-background resize-none" 
                placeholder="Paste private PEM here (keep secret!)" 
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleImportPrivate} 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded text-sm"
                >
                  Import
                </button>
                <button 
                  onClick={handleExportPrivate} 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded text-sm"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Input / Output */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {inputIsFile ? 'File Input' : mode === 'encrypt' ? 'Plaintext' : 'Ciphertext / Payload'}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={pasteToInput} 
                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded text-sm"
                  >
                    <ClipboardPaste className="inline h-4 w-4 mr-1" /> Paste
                  </button>
                  <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded text-sm">
                    <Upload className="inline h-4 w-4 mr-2" /> Upload File
                    <input ref={fileInputRef} type="file" className="hidden" onChange={onUpload} />
                  </label>
                  <label className="cursor-pointer bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded text-sm flex items-center">
                    <input 
                      type="checkbox" 
                      checked={inputIsFile} 
                      onChange={(e) => setInputIsFile(e.target.checked)} 
                      className="mr-2 h-4 w-4 text-blue-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                    />
                    File Mode
                  </label>
                </div>
              </div>

              {inputIsFile ? (
                <div className="bg-muted/50 rounded-lg p-4 min-h-[160px] flex items-center">
                  {file ? (
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Upload a file or switch to text mode.</div>
                  )}
                </div>
              ) : (
                <>
                  <textarea 
                    value={textInput} 
                    onChange={(e) => setTextInput(e.target.value)} 
                    className="w-full h-48 sm:h-64 p-4 border rounded-lg bg-background resize-none" 
                    placeholder={mode === 'encrypt' ? 'Enter text to encrypt (or use file mode)' : 'Paste base64 hybrid payload or base64 ciphertext here'} 
                  />
                  <p className="text-sm text-muted-foreground mt-2">Characters: {textInput.length}</p>
                </>
              )}
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">Output</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyOutput} 
                    disabled={!outputText}
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 px-3 py-2 rounded text-sm disabled:opacity-50"
                  >
                    <Copy className="inline h-4 w-4 mr-1" /> Copy
                  </button>
                  <button 
                    onClick={() => downloadResult()} 
                    disabled={!outputBytes && !outputText}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 px-3 py-2 rounded text-sm disabled:opacity-50"
                  >
                    <Download className="inline h-4 w-4 mr-1" /> Download
                  </button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 min-h-[160px] sm:min-h-[220px]">
                <code className="text-sm font-mono break-all">
                  {outputText || 'Result will appear here…'}
                </code>
                
                {outputText && (
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">
                      {outputBytes ? `${outputBytes.length} bytes` : `${outputText.length} chars`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sign / Verify */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3">Sign / Verify (RSA-PSS, SHA-256)</h3>
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={handleSign} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              <FileText className="inline mr-2 w-4 h-4" />
              Sign (use private PEM)
            </button>
            <button 
              onClick={handleVerify} 
              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
            >
              <ShieldCheck className="inline mr-2 w-4 h-4" />
              Verify (use public PEM)
            </button>
            <div className="text-sm text-muted-foreground self-center">
              Signature appears in output (base64)
            </div>
          </div>
        </div>

        {/* Security Notes */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Security Notes</h3>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Hybrid mode (RSA-OAEP wrapping AES-GCM) is recommended for messages/files of arbitrary length.</li>
            <li>RSA direct encryption is only for very small messages. Use OAEP padding.</li>
            <li>Sign/Verify uses RSA-PSS with SHA-256 (recommended).</li>
            <li>Everything runs client-side. Never paste private keys on untrusted machines.</li>
          </ul>
        </div>

        {/* Technical Information */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">How RSA Encryption Works</h3>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">RSA Algorithm Overview</h4>
              <p className="text-sm">
                RSA is an asymmetric cryptographic algorithm that uses a pair of keys: a public key for encryption and a private key for decryption. 
                The security of RSA relies on the mathematical difficulty of factoring large prime numbers.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">Hybrid Encryption (Recommended)</h4>
              <p className="text-sm">
                Since RSA can only encrypt small amounts of data directly, hybrid encryption combines RSA with symmetric encryption:
              </p>
              <ul className="text-sm list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Generate a random AES-256-GCM key</li>
                <li>Encrypt your data with AES-GCM (fast, handles large files)</li>
                <li>Encrypt the AES key with RSA-OAEP (secure key exchange)</li>
                <li>Combine both encrypted parts into a single payload</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Digital Signatures</h4>
              <p className="text-sm">
                Digital signatures provide authentication and non-repudiation. This tool uses RSA-PSS (Probabilistic Signature Scheme) 
                with SHA-256 hashing, which is more secure than traditional PKCS#1 v1.5 signatures.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Key Sizes and Security</h4>
              <ul className="text-sm list-disc list-inside space-y-1 ml-4">
                <li><strong>2048 bits:</strong> Current minimum recommendation, suitable for most applications</li>
                <li><strong>3072 bits:</strong> Enhanced security, equivalent to 128-bit symmetric encryption</li>
                <li><strong>4096 bits:</strong> High security for long-term protection, slower performance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Common Use Cases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Secure File Sharing</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Encrypt sensitive documents, images, or any files before sharing them via email or cloud storage.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Message Encryption</h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Encrypt confidential messages that only the intended recipient can read.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Document Signing</h4>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Create digital signatures to verify document authenticity and integrity.
                </p>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">API Security</h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Generate key pairs for API authentication and secure data exchange.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Security Best Practices</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">Keep Private Keys Secure:</strong> Never share your private key. 
                Store it in a secure location and consider using password protection for long-term storage.
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">Use Hybrid Encryption:</strong> Always use hybrid mode for files 
                or messages larger than a few bytes. Direct RSA encryption is limited and slower.
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">Verify Recipients:</strong> Always verify you have the correct 
                public key for your intended recipient before encrypting sensitive data.
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">Client-Side Security:</strong> This tool runs entirely in your browser. 
                No keys or data are sent to external servers, ensuring your privacy.
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">Regular Key Rotation:</strong> For high-security applications, 
                consider generating new key pairs periodically and securely distributing public keys.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
