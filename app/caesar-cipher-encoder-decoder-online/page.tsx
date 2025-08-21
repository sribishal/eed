'use client';

import { useState, useMemo, useCallback } from 'react';
import { Copy, CheckCircle, ArrowRightLeft, Key, Lock, Unlock, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CaesarCipherEncoderDecoder() {
  const [input, setInput] = useState('');
  const [shift, setShift] = useState(3);
  const [activeTab, setActiveTab] = useState<'encoder' | 'decoder'>('encoder');
  const [copied, setCopied] = useState(false);
  
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [bruteForceResults, setBruteForceResults] = useState<{shift: number, text: string}[]>([]);

  // The core cipher logic, wrapped in useCallback for performance
  const performCipher = useCallback((str: string, shiftAmount: number): string => {
    if (shiftAmount === 0 || !str) return str;
    
    // The modulo operator in JS can be weird with negative numbers, so this ensures it wraps correctly
    const wrappedShift = ((shiftAmount % 26) + 26) % 26;

    return str.split('').map(char => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) { // Uppercase
        return String.fromCharCode(((code - 65 + wrappedShift) % 26) + 65);
      } else if (code >= 97 && code <= 122) { // Lowercase
        return String.fromCharCode(((code - 97 + wrappedShift) % 26) + 97);
      }
      return char; // Non-alphabetic characters are unchanged
    }).join('');
  }, []);

  // useMemo will re-calculate the output only when dependencies change
  const output = useMemo(() => {
    const currentShift = activeTab === 'encoder' ? shift : -shift;
    return performCipher(input, currentShift);
  }, [input, shift, activeTab, performCipher]);

  const handleModeToggle = () => {
    setActiveTab(prev => prev === 'encoder' ? 'decoder' : 'encoder');
    // Swap input and output for a seamless experience
    setInput(output);
  };
  
  const handleRot13 = () => {
    setShift(13);
    setActiveTab('encoder');
    toast.info("Shift set to 13 (ROT13)");
  }

  const runBruteForce = () => {
    if (activeTab === 'encoder' || !input) {
        toast.error("Please enter some text in Decoder mode to analyze.");
        return;
    }
    const results = [];
    for (let i = 1; i <= 25; i++) {
        results.push({
            shift: i,
            text: performCipher(input, -i)
        });
    }
    setBruteForceResults(results);
    setShowAnalysis(true);
    toast.success("Cipher analysis complete!");
  }

  const copyToClipboard = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Output copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Clear analysis when input changes
    if (showAnalysis) {
      setShowAnalysis(false);
      setBruteForceResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/50 to-indigo-100/50 dark:from-sky-950/20 dark:to-indigo-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Caesar Cipher Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            A powerful tool to encrypt, decrypt, and analyze Caesar ciphers with advanced features including ROT13 and brute-force analysis.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-xl shadow-lg border p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('encoder')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'encoder'
                    ? 'bg-indigo-500 text-white'
                    : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                }`}
              >
                <Lock className="h-4 w-4" />
                Encoder
              </button>
              <button
                onClick={() => setActiveTab('decoder')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'decoder'
                    ? 'bg-teal-500 text-white'
                    : 'text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                }`}
              >
                <Unlock className="h-4 w-4" />
                Decoder
              </button>
            </div>
          </div>
        </div>

        {/* Main Tool Card */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          {/* Mode Indicator */}
          <div className={`mb-6 text-center p-3 rounded-lg ${activeTab === 'encoder' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300' : 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300'}`}>
            <h2 className="text-lg font-semibold flex items-center justify-center gap-2">
              {activeTab === 'encoder' ? (
                <>
                  <Lock className="h-5 w-5" />
                  Encoding Mode - Convert Plain Text to Cipher Text
                </>
              ) : (
                <>
                  <Unlock className="h-5 w-5" />
                  Decoding Mode - Convert Cipher Text to Plain Text
                </>
              )}
            </h2>
          </div>

          {/* Input/Output Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-semibold mb-3 text-muted-foreground">
                {activeTab === 'encoder' ? 'Plain Text (Input)' : 'Cipher Text (Input)'}
              </label>
              <textarea
                value={input}
                onChange={e => handleInputChange(e.target.value)}
                placeholder={`Enter your ${activeTab === 'encoder' ? 'plain text' : 'cipher text'} here...`}
                className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background transition-all"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {input.length}
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-base font-semibold text-muted-foreground">
                  {activeTab === 'encoder' ? 'Cipher Text (Output)' : 'Plain Text (Output)'}
                </label>
                <button 
                  onClick={copyToClipboard} 
                  disabled={!output} 
                  className="text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="w-full h-40 p-4 border rounded-lg bg-muted/50 overflow-y-auto">
                <p className="text-sm break-words whitespace-pre-wrap font-mono">
                  {output || 'Output will appear here...'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-8 space-y-6">
            {/* Shift Control */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <label htmlFor="shift" className="block text-base font-semibold text-center mb-3">
                Shift Key: <span className="font-bold text-xl text-primary">{shift}</span>
              </label>
              <input 
                id="shift" 
                type="range" 
                min="1" 
                max="25" 
                value={shift} 
                onChange={(e) => setShift(Number(e.target.value))} 
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>13 (ROT13)</span>
                <span>25</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={handleModeToggle} 
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Switch Mode
              </button>
              
              <button 
                onClick={handleRot13} 
                className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium py-3 px-4 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Key className="h-4 w-4" />
                Use ROT13
              </button>
              
              <button 
                onClick={runBruteForce} 
                disabled={activeTab === 'encoder' || !input} 
                className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium py-3 px-4 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeTab === 'encoder' ? 'Switch to Decoder mode to use analysis' : 'Analyze all possible shifts'}
              >
                <HelpCircle className="h-4 w-4" />
                Brute Force
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        {showAnalysis && bruteForceResults.length > 0 && (
          <div className="mt-8 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Brute-Force Analysis</h2>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              All possible decryptions using shifts 1-25. Look for meaningful text:
            </p>
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold text-sm w-20">Shift</th>
                    <th className="p-3 text-left font-semibold text-sm">Decoded Text</th>
                  </tr>
                </thead>
                <tbody>
                  {bruteForceResults.map((result, index) => (
                    <tr key={result.shift} className={`border-t hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-3 font-mono font-bold text-center text-primary">
                        {result.shift}
                      </td>
                      <td className="p-3 font-mono text-sm break-all">
                        {result.text || <span className="text-muted-foreground italic">No output</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About the Caesar Cipher & Cryptanalysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is a Caesar Cipher?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                The Caesar cipher is one of the earliest known forms of encryption. It's a substitution cipher where each letter in the plaintext is "shifted" a certain number of places down the alphabet. For instance, with a shift of 3, 'A' becomes 'D', 'B' becomes 'E', and the alphabet wraps around so 'Z' becomes 'C'.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is ROT13?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                ROT13 ("rotate by 13 places") is a special case of the Caesar cipher with a fixed shift of 13. Because the English alphabet has 26 letters, applying ROT13 twice to a piece of text will restore it to its original form, making it a convenient way to hide spoilers or jokes.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Brute-Force Analysis</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                The Caesar cipher is considered cryptographically weak because it can be easily broken using a technique called "brute-force attack". Since there are only 25 possible shifts, an attacker can simply try every key and check the results for coherent text. Our "Brute Force" feature automates this process.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features of this Tool</h3>
              <ul className="text-muted-foreground space-y-2 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Clear Mode Selection:</strong> Separate tabs for encoding and decoding operations.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Live Processing:</strong> Instantly see results as you type.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>ROT13 Preset:</strong> Apply the common shift of 13 with one click.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Brute-Force Analyzer:</strong> Automatically decrypt messages by trying all possible keys.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span><strong>Case & Symbol Preservation:</strong> Non-alphabetic characters are ignored, and letter case is maintained.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
