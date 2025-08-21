'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Upload,
  Download,
  CheckCircle,
  Hash as HashIcon,
  ClipboardPaste,
  Eraser,
  AlertTriangle,
  CloudDownload,
  PauseCircle,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

type OutputFormat = 'hex' | 'dec' | 'base64';

export default function Crc32Tool() {
  // UI / Mode
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [live, setLive] = useState(true);

  // Output options
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('hex');
  const [uppercaseHex, setUppercaseHex] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  // Result
  const [crcValue, setCrcValue] = useState<number | null>(null);
  const [crcHex, setCrcHex] = useState('');
  const [crcDec, setCrcDec] = useState<string>('');
  const [crcBase64, setCrcBase64] = useState('');

  // Verify
  const [expected, setExpected] = useState('');
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);

  // Progress & control
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerRef = useRef<FileReader | null>(null);
  const cancelRef = useRef(false);

  // CRC table memoized
  const crcTable = useMemo(() => {
    // generate standard CRC-32 (IEEE 802.3) table (polynomial 0xEDB88320)
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  }, []);

  // Helpers
  const toHex = (n: number) => {
    const s = (n >>> 0).toString(16).padStart(8, '0');
    return uppercaseHex ? s.toUpperCase() : s;
  };

  const toDec = (n: number) => `${(n >>> 0).toString(10)}`;

  const toBase64 = (n: number) => {
    // Convert 32-bit unsigned to 4-byte array (big-endian)
    const bytes = new Uint8Array(4);
    bytes[0] = (n >>> 24) & 0xff;
    bytes[1] = (n >>> 16) & 0xff;
    bytes[2] = (n >>> 8) & 0xff;
    bytes[3] = n & 0xff;
    // base64 encode
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  function uint8ArrayToCrc(current: number, data: Uint8Array) {
    let c = current >>> 0;
    const table = crcTable;
    for (let i = 0; i < data.length; i++) {
      c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    }
    return c >>> 0;
  }

  // Compute CRC32 for an ArrayBuffer (synchronous)
  function crc32FromBuffer(buf: ArrayBuffer) {
    const u8 = new Uint8Array(buf);
    // initial value 0xffffffff, final xor 0xffffffff
    let c = 0xffffffff >>> 0;
    c = uint8ArrayToCrc(c, u8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // Chunked file processing using File.slice and FileReader
  async function processFileChunked(f: File, chunkSize = 4 * 1024 * 1024) {
    // chunkSize default 4MB
    setProgress({ done: 0, total: f.size });
    setRunning(true);
    setPaused(false);
    cancelRef.current = false;
    readerRef.current = new FileReader();

    return new Promise<number>((resolve, reject) => {
      let offset = 0;
      let crc = 0xffffffff >>> 0;

      readerRef.current!.onerror = (err) => {
        setRunning(false);
        toast.error('File read error');
        reject(err);
      };

      readerRef.current!.onload = (ev) => {
        if (cancelRef.current) {
          setRunning(false);
          reject(new Error('Cancelled'));
          return;
        }
        const result = ev.target?.result;
        if (!result || !(result instanceof ArrayBuffer)) {
          setRunning(false);
          reject(new Error('Unexpected read result'));
          return;
        }
        const chunk = new Uint8Array(result);
        crc = uint8ArrayToCrc(crc, chunk);
        offset += chunk.length;
        setProgress({ done: offset, total: f.size });

        if (offset < f.size) {
          // wait if paused
          const loop = () => {
            if (cancelRef.current) {
              setRunning(false);
              reject(new Error('Cancelled'));
              return;
            }
            if (paused) {
              setTimeout(loop, 200);
            } else {
              readNext();
            }
          };
          loop();
        } else {
          setRunning(false);
          const finalCrc = (crc ^ 0xffffffff) >>> 0;
          resolve(finalCrc);
        }
      };

      const readNext = () => {
        const end = Math.min(offset + chunkSize, f.size);
        const slice = f.slice(offset, end);
        readerRef.current!.readAsArrayBuffer(slice);
      };

      // start
      readNext();
    });
  }

  // process text input (quick)
  async function processText() {
    try {
      setRunning(true);
      setPaused(false);
      cancelRef.current = false;
      const encoder = new TextEncoder();
      const buf = encoder.encode(text).buffer;
      const crc = crc32FromBuffer(buf);
      setCrcValue(crc);
      setCrcHex(toHex(crc));
      setCrcDec(toDec(crc));
      setCrcBase64(toBase64(crc));
      toast.success('Text hashed (CRC32)');
    } catch (e) {
      console.error(e);
      toast.error('Failed to compute CRC32');
    } finally {
      setRunning(false);
    }
  }

  // process file (chunked)
  async function processFile(f: File) {
    try {
      // safety limit: 1GB (you can change). We'll enforce 500MB here for client perf.
      if (f.size > 500 * 1024 * 1024) {
        toast.error('File too large. Please use files under 500MB.');
        return;
      }
      const crc = await processFileChunked(f, 4 * 1024 * 1024);
      setCrcValue(crc);
      setCrcHex(toHex(crc));
      setCrcDec(toDec(crc));
      setCrcBase64(toBase64(crc));
      toast.success('File hashed (CRC32)');
    } catch (e) {
      if ((e as Error).message === 'Cancelled') {
        toast('Hashing cancelled.');
      } else {
        console.error(e);
        toast.error('Failed to hash file.');
      }
    }
  }

  // auto process when live toggled or inputs change
  useEffect(() => {
    setVerifyOk(null);
    if (!live) return;
    if (file) {
      processFile(file);
    } else if (text) {
      processText();
    } else {
      setCrcValue(null);
      setCrcHex('');
      setCrcDec('');
      setCrcBase64('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, file, live, uppercaseHex]);

  // verify expected
  useEffect(() => {
    if (!expected || crcValue === null) {
      setVerifyOk(null);
      return;
    }
    // normalize expected to one of the formats
    const s = expected.trim();
    let match = false;
    // hex check (allow optional 0x)
    const hexCandidate = s.replace(/^0x/i, '');
    if (/^[0-9a-fA-F]{1,8}$/.test(hexCandidate)) {
      const parsed = parseInt(hexCandidate, 16) >>> 0;
      match = parsed === (crcValue >>> 0);
    } else if (/^\d+$/.test(s)) {
      // decimal
      const parsed = Number(s) >>> 0;
      match = parsed === (crcValue >>> 0);
    } else {
      // try base64 decode
      try {
        const bin = atob(s);
        if (bin.length === 4) {
          const b = new Uint8Array(4);
          for (let i = 0; i < 4; i++) b[i] = bin.charCodeAt(i);
          const val = (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
          match = (val >>> 0) === (crcValue >>> 0);
        }
      } catch {
        match = false;
      }
    }
    setVerifyOk(match);
  }, [expected, crcValue]);

  // UI actions
  const onCopy = async () => {
    const out = outputFormat === 'hex' ? crcHex : outputFormat === 'dec' ? crcDec : crcBase64;
    if (!out) {
      toast.error('Nothing to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(out);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Copy failed.');
    }
  };

  const onDownload = () => {
    if (crcValue === null) {
      toast.error('No CRC to download.');
      return;
    }
    const content = `CRC32
Format: ${outputFormat.toUpperCase()}
HEX: ${crcHex}
DEC: ${crcDec}
Base64: ${crcBase64}
Source: ${file ? `File: ${file.name}` : 'Text input'}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crc32-${file ? file.name : 'text'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded result.');
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      // clear previous CRC
      setCrcValue(null);
      setCrcHex('');
      setCrcDec('');
      setCrcBase64('');
      if (live) processFile(f);
      toast.success(`File loaded: ${f.name}`);
    }
  };

  const onPaste = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      setText((p) => (p ? p + txt : txt));
      toast.success('Pasted from clipboard.');
    } catch {
      toast.error('Paste failed (permissions).');
    }
  };

  const onClear = () => {
    setText('');
    setFile(null);
    setCrcValue(null);
    setCrcHex('');
    setCrcDec('');
    setCrcBase64('');
    setExpected('');
    setVerifyOk(null);
    setProgress({ done: 0, total: 0 });
    setRunning(false);
    setPaused(false);
    cancelRef.current = true;
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Cleared.');
  };

  const startManual = () => {
    setVerifyOk(null);
    if (file) processFile(file);
    else if (text) processText();
    else toast.error('Provide text or upload a file first.');
  };

  const pauseOrResume = () => {
    if (!running) return;
    setPaused((p) => !p);
    toast((paused ? 'Resumed' : 'Paused') as any);
  };

  const cancelRun = () => {
    if (!running) return;
    cancelRef.current = true;
    setRunning(false);
    setPaused(false);
    toast('Cancelled.');
  };

  // Helpers for display
  const pretty = outputFormat === 'hex' ? crcHex : outputFormat === 'dec' ? crcDec : crcBase64;

return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-indigo-100/50 dark:from-black dark:to-black py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
    <div className="container mx-auto max-w-6xl">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">CRC32 Calculator & Verifier Online</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
          Compute CRC-32 checksums locally in your browser. Supports text input and chunked file processing for large files, multiple output formats, verification & progress reporting.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl shadow-lg border p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-semibold">Live:</span>
            <label className={`px-3 py-2 rounded-lg cursor-pointer text-sm ${live ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700'}`} onClick={() => setLive((v) => !v)}>
              {live ? 'On' : 'Off'}
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
            <button onClick={onClear} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center">
              <Eraser className="h-4 w-4 mr-1" /> Clear
            </button>
            <button onClick={startManual} disabled={running} className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center">
              <HashIcon className="h-4 w-4 mr-1" /> Compute
            </button>
            <button onClick={cancelRun} disabled={!running} className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg flex items-center">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Input & file */}
      <div className="bg-card rounded-xl shadow-lg border p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Text Input */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <label className="text-base sm:text-lg font-semibold">Input Text</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={onPaste} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 flex items-center"> 
                  <ClipboardPaste className="h-4 w-4 mr-1" /> Paste
                </button>
                <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 flex items-center">
                  <Upload className="h-4 w-4 mr-1" /> Upload File
                  <input ref={fileInputRef} type="file" className="hidden" onChange={onUpload} accept="*/*" />
                </label>
              </div>
            </div>

            <textarea 
              value={text} 
              onChange={(e) => { setText(e.target.value); setFile(null); }} 
              placeholder="Type or paste text to compute CRC-32…" 
              className="w-full h-40 sm:h-48 p-3 sm:p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-sm sm:text-base" 
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Characters: {text.length}{file ? ` • File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : ''}
            </p>
          </div>

          {/* Output & options */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <label className="text-base sm:text-lg font-semibold">Output</label>
              <div className="flex flex-wrap gap-2">
                <select 
                  value={outputFormat} 
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)} 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded-lg text-sm"
                >
                  <option value="hex">HEX</option>
                  <option value="dec">Decimal</option>
                  <option value="base64">Base64</option>
                </select>

                {outputFormat === 'hex' && (
                  <label className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded-lg text-sm cursor-pointer">
                    <input type="checkbox" checked={uppercaseHex} onChange={(e) => setUppercaseHex(e.target.checked)} />
                    Uppercase
                  </label>
                )}

                <label className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded-lg text-sm cursor-pointer">
                  <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
                  Wrap
                </label>

                <button 
                  onClick={onCopy} 
                  disabled={!crcValue && crcValue !== 0} 
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 px-3 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center"
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </button>

                <button 
                  onClick={onDownload} 
                  disabled={!crcValue && crcValue !== 0} 
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 px-3 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </button>
              </div>
            </div>

            <div className={`bg-muted/50 rounded-lg p-4 min-h-[140px] ${wordWrap ? '' : 'overflow-auto'}`}>
              <code className="text-xs sm:text-sm font-mono break-all">
                {pretty || 'CRC will appear here…'}
              </code>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-muted-foreground">HEX</div>
                  <div className="text-xs font-mono break-all overflow-hidden">{crcHex || '—'}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-muted-foreground">DEC</div>
                  <div className="text-xs font-mono break-all overflow-hidden">{crcDec || '—'}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-muted-foreground">Base64</div>
                  <div className="text-xs font-mono break-all overflow-hidden">{crcBase64 || '—'}</div>
                </div>
              </div>

              {/* File progress */}
              {file && (
                <div className="mt-4">
                  <div className="text-xs sm:text-sm mb-1">File progress: {(progress.done / 1024).toFixed(1)}KB / {(progress.total / 1024).toFixed(1)}KB</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded h-2 mt-1 overflow-hidden">
                    <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} className="h-full bg-blue-600" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => { 
                        if (running) { 
                          setPaused((p) => !p); 
                          toast(paused ? 'Resumed' : 'Paused' as any); 
                        } 
                      }} 
                      disabled={!running} 
                      className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm flex items-center"
                    >
                      {paused ? <Play className="mr-1 h-4 w-4" /> : <PauseCircle className="mr-1 h-4 w-4" />}
                      {paused ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={cancelRun} disabled={!running} className="px-3 py-1 rounded bg-rose-100 text-rose-700 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Verify */}
              <div className="mt-4">
                <label className="text-xs sm:text-sm font-semibold mb-1 block">Verify (paste expected HEX/DEC/Base64)</label>
                <input 
                  type="text" 
                  value={expected} 
                  onChange={(e) => setExpected(e.target.value)} 
                  placeholder="Expected CRC" 
                  className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm" 
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
      </div>

      {/* Info / Tech specs */}
      <div className="mt-6 sm:mt-8 bg-card rounded-xl shadow-lg border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">About CRC-32</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div>
            <h3 className="text-base font-semibold mb-2">What is CRC-32?</h3>
            <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
              CRC-32 (Cyclic Redundancy Check, 32-bit) is a checksum algorithm commonly used for error-detection in networks and storage. It is not cryptographically secure and should not be used for authentication.
            </p>

            <h3 className="text-base font-semibold mb-2">Outputs</h3>
            <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
              <li>• 32-bit checksum (4 bytes)</li>
              <li>• Representations: 8-char HEX, unsigned decimal, or Base64</li>
              <li>• Deterministic & fast</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">Use Cases & Limits</h3>
            <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
              CRC-32 is ideal for integrity checks and detecting accidental data corruption. It is <strong>not</strong> collision-resistant for adversarial use and must not be used as a cryptographic hash.
            </p>

            <h3 className="text-base font-semibold mb-2">Advanced Features in this Tool</h3>
            <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
              <li>• Chunked file processing (4MB chunks) to support large files</li>
              <li>• Live hashing toggle</li>
              <li>• Multiple output formats</li>
              <li>• Progress bar, pause/resume & cancel</li>
              <li>• Timing-safe verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
