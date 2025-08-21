'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Key, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export default function PlayfairCipher() {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [copied, setCopied] = useState(false);

  // Generate Playfair key matrix
  const generateKeyMatrix = (keyword: string): string[][] => {
    const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // J is omitted, I/J are treated as same
    const cleanKeyword = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    
    let keyString = '';
    const used = new Set<string>();
    
    // Add unique letters from keyword
    for (const char of cleanKeyword) {
      if (!used.has(char)) {
        keyString += char;
        used.add(char);
      }
    }
    
    // Add remaining letters from alphabet
    for (const char of alphabet) {
      if (!used.has(char)) {
        keyString += char;
      }
    }
    
    // Create 5x5 matrix
    const matrix: string[][] = [];
    for (let i = 0; i < 5; i++) {
      matrix[i] = [];
      for (let j = 0; j < 5; j++) {
        matrix[i][j] = keyString[i * 5 + j];
      }
    }
    
    return matrix;
  };

  // Find position of character in matrix
  const findPosition = (matrix: string[][], char: string): [number, number] => {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (matrix[i][j] === char) {
          return [i, j];
        }
      }
    }
    return [0, 0];
  };

  // Prepare text for Playfair cipher
  const prepareText = (text: string): string => {
    let cleanText = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    let preparedText = '';
    
    for (let i = 0; i < cleanText.length; i += 2) {
      const char1 = cleanText[i];
      const char2 = cleanText[i + 1];
      
      if (char2 === undefined) {
        // Odd length, add X
        preparedText += char1 + 'X';
      } else if (char1 === char2) {
        // Same characters, insert X between them
        preparedText += char1 + 'X';
        i--; // Process the second character again
      } else {
        preparedText += char1 + char2;
      }
    }
    
    return preparedText;
  };

  // Encrypt/Decrypt pair of characters
  const processPair = (matrix: string[][], char1: string, char2: string, isEncrypt: boolean): string => {
    const [row1, col1] = findPosition(matrix, char1);
    const [row2, col2] = findPosition(matrix, char2);
    
    if (row1 === row2) {
      // Same row - shift columns
      const newCol1 = isEncrypt ? (col1 + 1) % 5 : (col1 + 4) % 5;
      const newCol2 = isEncrypt ? (col2 + 1) % 5 : (col2 + 4) % 5;
      return matrix[row1][newCol1] + matrix[row2][newCol2];
    } else if (col1 === col2) {
      // Same column - shift rows
      const newRow1 = isEncrypt ? (row1 + 1) % 5 : (row1 + 4) % 5;
      const newRow2 = isEncrypt ? (row2 + 1) % 5 : (row2 + 4) % 5;
      return matrix[newRow1][col1] + matrix[newRow2][col2];
    } else {
      // Rectangle - swap columns
      return matrix[row1][col2] + matrix[row2][col1];
    }
  };

  // Main cipher function
  const playfairCipher = (text: string, keyword: string, isEncrypt: boolean): string => {
    if (!text.trim() || !keyword.trim()) {
      return '';
    }

    const matrix = generateKeyMatrix(keyword);
    const preparedText = isEncrypt ? prepareText(text) : text.toUpperCase().replace(/[^A-Z]/g, '');
    
    let result = '';
    for (let i = 0; i < preparedText.length; i += 2) {
      const char1 = preparedText[i];
      const char2 = preparedText[i + 1] || 'X';
      result += processPair(matrix, char1, char2, isEncrypt);
    }
    
    return result;
  };

  const handleProcess = () => {
    if (!input.trim() || !keyword.trim()) {
      setOutput('');
      return;
    }
    
    try {
      const result = playfairCipher(input, keyword, mode === 'encrypt');
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

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
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
    a.download = `playfair-${mode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  // Generate key matrix for display
  const displayMatrix = () => {
    if (!keyword.trim()) return null;
    const matrix = generateKeyMatrix(keyword);
    return matrix;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Playfair Cipher Encrypt Decrypt Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Encrypt and decrypt messages using the classic Playfair cipher. This substitution cipher uses a 5×5 
            matrix of letters based on a keyword for encryption and decryption.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold">Mode:</span>
              <div className="flex bg-blue-100 dark:bg-blue-900 rounded-lg p-1">
                <button
                  onClick={() => setMode('encrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'encrypt'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100'
                  }`}
                >
                  <Lock className="inline h-4 w-4 mr-1" />
                  Encrypt
                </button>
                <button
                  onClick={() => setMode('decrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'decrypt'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100'
                  }`}
                >
                  <Unlock className="inline h-4 w-4 mr-1" />
                  Decrypt
                </button>
              </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={!input.trim() || !keyword.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'encrypt' ? 'Encrypt Message' : 'Decrypt Message'}
            </button>
          </div>
        </div>

        {/* Keyword Section */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <label className="text-base sm:text-lg font-semibold mb-4 block">
                <Key className="inline h-5 w-5 mr-2" />
                Cipher Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={handleKeywordChange}
                placeholder="Enter keyword for cipher..."
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Enter a keyword to generate the cipher matrix. Letters will be deduplicated automatically.
              </p>
            </div>
            <div>
              <label className="text-base sm:text-lg font-semibold mb-4 block">
                Key Matrix Preview
              </label>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
                {displayMatrix() ? (
                  <div className="grid grid-cols-5 gap-2 text-center font-mono">
                    {displayMatrix()!.flat().map((char, index) => (
                      <div key={index} className="w-8 h-8 bg-background rounded flex items-center justify-center text-sm font-bold">
                        {char}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Enter a keyword to see the cipher matrix</p>
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
                  {mode === 'encrypt' ? 'Plain Text' : 'Encrypted Text'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
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
                placeholder={mode === 'encrypt' 
                  ? "Enter plain text to encrypt..." 
                  : "Enter encrypted text to decrypt..."
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
                  {mode === 'encrypt' ? 'Encrypted Text' : 'Decrypted Text'}
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
                  {output || `${mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} text will appear here...`}
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
            About Playfair Cipher
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Playfair Cipher?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                The Playfair cipher is a digraph substitution cipher, invented by Charles Wheatstone in 1854 
                but popularized by Lord Playfair. It encrypts pairs of letters (digraphs) instead of individual letters.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">How It Works</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Uses a 5×5 grid of letters based on a keyword</li>
                <li>• Letters I and J are treated as the same</li>
                <li>• Text is processed in pairs (digraphs)</li>
                <li>• Three rules for encryption based on letter positions</li>
                <li>• Same row: shift right; Same column: shift down</li>
                <li>• Rectangle: swap columns</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Historical Significance</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                The Playfair cipher was used extensively during World War I and II by British forces. 
                It was considered unbreakable by amateur cryptanalysts and provided reasonable security for field use.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Modern Applications</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Educational cryptography demonstrations</li>
                <li>• Puzzle and game creation</li>
                <li>• Historical cipher analysis</li>
                <li>• Basic security for non-critical data</li>
                <li>• Understanding classical cryptography principles</li>
              </ul>
            </div>
          </div>
          
          {/* SEO Information Section */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Playfair Cipher Rules & Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Encryption Rules:</h4>
                <ol className="text-muted-foreground space-y-1 text-sm sm:text-base list-decimal list-inside">
                  <li>If both letters are in the same row, replace each with the letter to its right (wrapping to the beginning if necessary)</li>
                  <li>If both letters are in the same column, replace each with the letter below it (wrapping to the top if necessary)</li>
                  <li>If the letters form a rectangle, replace each letter with the one in the same row but the other letter's column</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Text Preparation:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Remove all non-alphabetic characters</li>
                  <li>Convert J to I (or treat them as the same)</li>
                  <li>Group letters into pairs (digraphs)</li>
                  <li>Insert X between identical pairs</li>
                  <li>Add X to the end if odd number of letters</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Security & Limitations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Strengths:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>More secure than simple substitution ciphers</li>
                  <li>Frequency analysis is more difficult</li>
                  <li>Can be performed manually without machines</li>
                  <li>Key is easy to memorize and distribute</li>
                  <li>Resistant to casual cryptanalysis</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Weaknesses:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Vulnerable to frequency analysis of digraphs</li>
                  <li>Known plaintext attacks are possible</li>
                  <li>Limited by 5×5 matrix (only 25 letters)</li>
                  <li>Patterns in the key matrix can be exploited</li>
                  <li>Not suitable for modern cryptographic needs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Tool Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Core Functions:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Real-time encryption/decryption</li>
                  <li>Custom keyword support</li>
                  <li>Automatic text preparation</li>
                  <li>Interactive key matrix display</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">File Operations:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>File upload support (up to 10MB)</li>
                  <li>Download encrypted/decrypted results</li>
                  <li>Multiple file format support</li>
                  <li>Batch text processing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">User Experience:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Dark mode support</li>
                  <li>Copy to clipboard functionality</li>
                  <li>Toast notifications</li>
                  <li>Responsive design</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
