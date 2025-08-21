'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Hash, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export default function RailFenceCipher() {
  const [input, setInput] = useState('');
  const [rails, setRails] = useState(3);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [copied, setCopied] = useState(false);

  // Rail Fence Cipher Encoding
  const railFenceEncode = (text: string, numRails: number): string => {
    if (numRails < 2 || !text) return text;

    const rails: string[][] = Array(numRails).fill(null).map(() => []);
    let currentRail = 0;
    let direction = 1; // 1 for down, -1 for up

    // Place characters in zigzag pattern
    for (let i = 0; i < text.length; i++) {
      rails[currentRail].push(text[i]);
      
      // Change direction at the top and bottom rails
      if (currentRail === 0) {
        direction = 1;
      } else if (currentRail === numRails - 1) {
        direction = -1;
      }
      
      currentRail += direction;
    }

    // Read off the rails to get the cipher text
    return rails.map(rail => rail.join('')).join('');
  };

  // Rail Fence Cipher Decoding
  const railFenceDecode = (cipher: string, numRails: number): string => {
    if (numRails < 2 || !cipher) return cipher;

    const rails: string[][] = Array(numRails).fill(null).map(() => []);
    const railLengths: number[] = Array(numRails).fill(0);
    
    // Calculate the length of each rail
    let currentRail = 0;
    let direction = 1;
    
    for (let i = 0; i < cipher.length; i++) {
      railLengths[currentRail]++;
      
      if (currentRail === 0) {
        direction = 1;
      } else if (currentRail === numRails - 1) {
        direction = -1;
      }
      
      currentRail += direction;
    }

    // Distribute cipher characters to rails
    let cipherIndex = 0;
    for (let rail = 0; rail < numRails; rail++) {
      for (let i = 0; i < railLengths[rail]; i++) {
        rails[rail].push(cipher[cipherIndex++]);
      }
    }

    // Read the message using the zigzag pattern
    const result: string[] = [];
    const railPointers: number[] = Array(numRails).fill(0);
    currentRail = 0;
    direction = 1;

    for (let i = 0; i < cipher.length; i++) {
      result.push(rails[currentRail][railPointers[currentRail]++]);
      
      if (currentRail === 0) {
        direction = 1;
      } else if (currentRail === numRails - 1) {
        direction = -1;
      }
      
      currentRail += direction;
    }

    return result.join('');
  };

  // Visualize the rail fence pattern
  const visualizeRailFence = (text: string, numRails: number): string[][] => {
    if (numRails < 2 || !text) return [];

    const visualization: string[][] = Array(numRails).fill(null).map(() => Array(text.length).fill(''));
    let currentRail = 0;
    let direction = 1;

    for (let i = 0; i < text.length; i++) {
      visualization[currentRail][i] = text[i];
      
      if (currentRail === 0) {
        direction = 1;
      } else if (currentRail === numRails - 1) {
        direction = -1;
      }
      
      currentRail += direction;
    }

    return visualization;
  };

  const handleProcess = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    if (rails < 2 || rails > 10) {
      toast.error('Number of rails must be between 2 and 10');
      return;
    }

    try {
      const result = mode === 'encode' 
        ? railFenceEncode(input, rails)
        : railFenceDecode(input, rails);
      setOutput(result);
    } catch (error) {
      console.error('Cipher processing error:', error);
      toast.error('Error processing cipher');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
  };

  const handleRailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 3;
    if (value >= 2 && value <= 10) {
      setRails(value);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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
        setInput(content);
        toast.success('File uploaded successfully!');
      };
      reader.readAsText(file);
    }
  };

  const downloadResult = () => {
    if (!output) {
      toast.error('No content to download');
      return;
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `railfence-${mode}-${rails}rails.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  // Generate visualization for display
  const displayVisualization = () => {
    if (!input.trim()) return null;
    
    const maxDisplayLength = 20; // Limit display length for UI
    const displayText = input.slice(0, maxDisplayLength);
    const visualization = visualizeRailFence(displayText, rails);
    
    if (visualization.length === 0) return null;
    
    return visualization;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-teal-100/50 dark:from-green-950/20 dark:to-teal-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Rail Fence Cipher Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Encode and decode messages using the Rail Fence (Zigzag) cipher. This transposition cipher 
            arranges text in a zigzag pattern across multiple rails before reading it off linearly.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold">Mode:</span>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setMode('encode')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'encode'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Lock className="inline h-4 w-4 mr-1" />
                  Encode
                </button>
                <button
                  onClick={() => setMode('decode')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'decode'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Unlock className="inline h-4 w-4 mr-1" />
                  Decode
                </button>
              </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={!input.trim()}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'encode' ? 'Encode Message' : 'Decode Message'}
            </button>
          </div>
        </div>

        {/* Rails Configuration */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <label className="text-base sm:text-lg font-semibold mb-4 block">
                <Hash className="inline h-5 w-5 mr-2" />
                Number of Rails
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={rails}
                  onChange={handleRailsChange}
                  className="w-24 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-center font-mono"
                />
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={rails}
                  onChange={handleRailsChange}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">Rails: {rails}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Choose between 2-10 rails. More rails create more complex zigzag patterns.
              </p>
            </div>
            <div>
              <label className="text-base sm:text-lg font-semibold mb-4 block">
                Zigzag Pattern Preview
              </label>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
                {displayVisualization() ? (
                  <div className="font-mono text-xs overflow-x-auto max-w-full">
                    {displayVisualization()!.map((rail, railIndex) => (
                      <div key={railIndex} className="whitespace-nowrap mb-1">
                        {rail.map((char, charIndex) => (
                          <span 
                            key={charIndex} 
                            className={`inline-block w-6 text-center ${
                              char ? 'text-foreground font-bold' : 'text-transparent'
                            }`}
                          >
                            {char || '·'}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Enter text to see the zigzag pattern</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Plain Text' : 'Encoded Text'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
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
                value={input}
                onChange={handleInputChange}
                placeholder={mode === 'encode' 
                  ? "Enter plain text to encode..." 
                  : "Enter encoded text to decode..."
                }
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {input.length}
              </p>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Encoded Text' : 'Decoded Text'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!output}
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
                    disabled={!output}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[192px] sm:min-h-[256px] flex items-center">
                <code className="text-sm font-mono break-all">
                  {output || `${mode === 'encode' ? 'Encoded' : 'Decoded'} text will appear here...`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Length: {output.length} characters
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Rail Fence Cipher
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Rail Fence Cipher?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                The Rail Fence cipher, also known as the Zigzag cipher, is a form of transposition cipher. 
                It derives its name from the way it arranges the plaintext in a zigzag pattern across multiple "rails" or lines.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">How It Works</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Text is written in a zigzag pattern across multiple rails</li>
                <li>• Direction alternates at the top and bottom rails</li>
                <li>• Cipher text is read off by rails sequentially</li>
                <li>• Number of rails determines complexity</li>
                <li>• Decryption reverses the process</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Algorithm Steps</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                <strong>Encoding:</strong> Write text diagonally down-up-down across rails, then read each rail left to right.<br/>
                <strong>Decoding:</strong> Calculate rail lengths, distribute cipher text, then read in zigzag pattern.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Example with 3 Rails</h3>
              <div className="bg-muted/30 rounded p-3 font-mono text-sm">
                <div>Plain: "HELLO WORLD"</div>
                <div>Pattern:</div>
                <div>H · · · O · · · R · ·</div>
                <div>· E · L · · W · · L ·</div>
                <div>· · L · · · · O · · D</div>
                <div>Cipher: "HORELWLLOD"</div>
              </div>
            </div>
          </div>
          
          {/* SEO Information Section */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Rail Fence Cipher Variations & Applications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Cipher Variations:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li><strong>Standard Rail Fence:</strong> Basic zigzag pattern with variable rails</li>
                  <li><strong>Offset Rail Fence:</strong> Starting from different positions</li>
                  <li><strong>Modified Rail Fence:</strong> Irregular patterns or spacing</li>
                  <li><strong>Combined Ciphers:</strong> Rail Fence with substitution ciphers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Historical Usage:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Ancient Greek and Roman military communications</li>
                  <li>Civil War era telegraph encryption</li>
                  <li>Early 20th century diplomatic codes</li>
                  <li>World War I field communications</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Security Analysis & Cryptographic Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Strengths:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Simple to implement manually</li>
                  <li>No frequency analysis weakness</li>
                  <li>Preserves letter frequency distribution</li>
                  <li>Fast encoding and decoding process</li>
                  <li>Scalable difficulty with more rails</li>
                  <li>Good for educational cryptography</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Weaknesses:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Vulnerable to brute force (limited key space)</li>
                  <li>Pattern analysis can reveal rail count</li>
                  <li>No protection against known plaintext attacks</li>
                  <li>Relatively easy to break with modern methods</li>
                  <li>Preserves word boundaries in some cases</li>
                  <li>Limited security for sensitive data</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Mathematical Properties & Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Key Space Analysis:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Key space limited to number of rails (typically 2-26)</li>
                  <li>Brute force attack complexity: O(n) where n = max rails</li>
                  <li>For practical purposes, 2-10 rails are commonly used</li>
                  <li>Security increases logarithmically with rail count</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Pattern Recognition:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Period length = 2(n-1) for n rails</li>
                  <li>First and last rails have regular spacing</li>
                  <li>Middle rails follow predictable intervals</li>
                  <li>Statistical analysis can reveal rail structure</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Modern Applications & Educational Value</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Educational Uses:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Introduction to transposition ciphers</li>
                  <li>Pattern recognition exercises</li>
                  <li>Algorithm visualization</li>
                  <li>Cryptanalysis practice</li>
                  <li>Historical cipher studies</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Puzzle Applications:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Escape room challenges</li>
                  <li>Cryptographic puzzles</li>
                  <li>Treasure hunt clues</li>
                  <li>Programming challenges</li>
                  <li>Mathematical competitions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tool Features:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Interactive rail count adjustment</li>
                  <li>Visual zigzag pattern display</li>
                  <li>Real-time encoding/decoding</li>
                  <li>File upload and download support</li>
                  <li>Dark mode compatibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
