'use client';

import { useState, useCallback } from 'react';
import { Copy, Upload, Download, CheckCircle, ArrowRightLeft, Play, Pause, Volume2, Settings, Radio, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function MorseCodeTranslator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioTimeoutId, setAudioTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Audio settings
  const [frequency, setFrequency] = useState(600);
  const [dotDuration, setDotDuration] = useState(100);
  const [dashDuration, setDashDuration] = useState(300);
  const [pauseDuration, setPauseDuration] = useState(100);

  // Morse code dictionary
  const morseCode: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
    ' ': '/'
  };

  // Create reverse morse code dictionary
  const reverseMorseCode: { [key: string]: string } = {};
  Object.entries(morseCode).forEach(([letter, code]) => {
    reverseMorseCode[code] = letter;
  });

  // Encoding function
  const encodeToMorse = useCallback((text: string): string => {
    return text.toUpperCase()
      .split('')
      .map(char => morseCode[char] || char)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Decoding function
  const decodeFromMorse = useCallback((morse: string): string => {
    return morse.split(' ')
      .map(code => reverseMorseCode[code] || code)
      .join('')
      .replace(/\//g, ' ');
  }, []);

  const processText = (text: string): string => {
    if (!text.trim()) return '';

    try {
      if (mode === 'encode') {
        return encodeToMorse(text);
      } else {
        return decodeFromMorse(text);
      }
    } catch (error) {
      toast.error('Error processing text');
      return text;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    const processed = processText(value);
    setOutput(processed);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (input.trim()) {
      const processed = processText(input);
      setOutput(processed);
    }
  };

  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
    setMode(mode === 'encode' ? 'decode' : 'encode');
    toast.success('Input and output swapped!');
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInput(content);
        const processed = processText(content);
        setOutput(processed);
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
    a.download = `morse-${mode}-result.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  // Audio playback functionality
  const playMorseCode = async () => {
    if (isPlaying) {
      stopMorseCode();
      return;
    }
    
    const morseText = mode === 'encode' ? output : input;
    if (!morseText) {
      toast.error('No morse code to play');
      return;
    }

    setIsPlaying(true);
    
    try {
      // Clean up any existing audio context
      if (audioContext) {
        audioContext.close();
      }

      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(newAudioContext);
      
      const oscillator = newAudioContext.createOscillator();
      const gainNode = newAudioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(newAudioContext.destination);
      oscillator.frequency.setValueAtTime(frequency, newAudioContext.currentTime);
      oscillator.type = 'sine';
      
      let currentTime = newAudioContext.currentTime;
      
      // Set initial gain to 0
      gainNode.gain.setValueAtTime(0, currentTime);
      
      for (const char of morseText) {
        if (char === '.') {
          gainNode.gain.setValueAtTime(0.3, currentTime);
          gainNode.gain.setValueAtTime(0, currentTime + dotDuration / 1000);
          currentTime += (dotDuration + pauseDuration) / 1000;
        } else if (char === '-') {
          gainNode.gain.setValueAtTime(0.3, currentTime);
          gainNode.gain.setValueAtTime(0, currentTime + dashDuration / 1000);
          currentTime += (dashDuration + pauseDuration) / 1000;
        } else if (char === ' ') {
          currentTime += (pauseDuration * 3) / 1000; // Longer pause between letters
        } else if (char === '/') {
          currentTime += (pauseDuration * 7) / 1000; // Even longer pause between words
        }
      }
      
      oscillator.start();
      oscillator.stop(currentTime);
      
      // Clean up when finished
      const timeoutId = setTimeout(() => {
        setIsPlaying(false);
        setAudioContext(null);
        newAudioContext.close();
      }, (currentTime - newAudioContext.currentTime) * 1000 + 100); // Add small buffer
      
      setAudioTimeoutId(timeoutId);
      
    } catch (error) {
      console.error('Audio playback failed:', error);
      toast.error('Audio playback not supported');
      setIsPlaying(false);
      setAudioContext(null);
    }
  };

  const stopMorseCode = () => {
    setIsPlaying(false);
    
    // Clear timeout
    if (audioTimeoutId) {
      clearTimeout(audioTimeoutId);
      setAudioTimeoutId(null);
    }
    
    // Close audio context
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    toast.success('All fields cleared!');
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Morse Code Translator Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Convert text to Morse code and vice versa. Features audio playback, customizable timing, 
            and support for letters, numbers, and punctuation marks.
          </p>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          {/* Mode Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Translation Mode
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => handleModeChange('encode')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'encode'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                <Radio className="inline h-4 w-4 mr-2" />
                Text to Morse
              </button>
              <button
                onClick={() => handleModeChange('decode')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'decode'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                <Zap className="inline h-4 w-4 mr-2" />
                Morse to Text
              </button>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              <Volume2 className="inline h-5 w-5 mr-2" />
              Audio Playback
            </label>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <button
                onClick={playMorseCode}
                disabled={(!output && mode === 'encode') || (!input && mode === 'decode')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isPlaying
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="inline h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="inline h-4 w-4 mr-2" />
                    Play Morse
                  </>
                )}
              </button>
            </div>
            
            {/* Audio Settings */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Frequency (Hz)
                </label>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-muted-foreground">{frequency}Hz</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Dot Duration (ms)
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={dotDuration}
                  onChange={(e) => setDotDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-muted-foreground">{dotDuration}ms</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Dash Duration (ms)
                </label>
                <input
                  type="range"
                  min="150"
                  max="500"
                  value={dashDuration}
                  onChange={(e) => setDashDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-muted-foreground">{dashDuration}ms</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Pause Duration (ms)
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={pauseDuration}
                  onChange={(e) => setPauseDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-muted-foreground">{pauseDuration}ms</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  Input {mode === 'encode' ? '(Text)' : '(Morse Code)'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.html,.xml,.csv"
                    />
                  </label>
                  <button
                    onClick={clearAll}
                    className="bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={
                  mode === 'encode' 
                    ? 'Type text to convert to Morse code...' 
                    : 'Enter Morse code (use . for dots, - for dashes, spaces between letters, / for word breaks)...'
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
                  Output {mode === 'encode' ? '(Morse Code)' : '(Text)'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={swapInputOutput}
                    disabled={!output}
                    className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-lg text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRightLeft className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Swap</span>
                  </button>
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
              <div className="bg-muted/50 rounded-lg p-4 min-h-[192px] sm:min-h-[256px] overflow-y-auto">
                <code className="text-sm font-mono break-all whitespace-pre-wrap">
                  {output || `${mode === 'encode' ? 'Morse code' : 'Decoded text'} will appear here...`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {output.length}
              </p>
            </div>
          </div>
        </div>

        {/* Morse Code Reference */}
        <div className="mt-8 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h3 className="text-lg font-semibold mb-4">Morse Code Reference</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 text-sm">
            {Object.entries(morseCode).slice(0, -1).map(([letter, code]) => (
              <div key={letter} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                <span className="font-semibold">{letter}:</span>
                <code className="font-mono text-blue-600 dark:text-blue-400">{code}</code>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Conventions:</strong> Use spaces between letters, "/" for word breaks. 
              Standard timing: dash = 3× dot duration, letter gap = 3× dot duration, word gap = 7× dot duration.
            </p>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Morse Code
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Morse Code?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Morse code is a method used in telecommunication to encode text characters as sequences 
                of dots and dashes. Developed by Samuel Morse and Alfred Vail in the 1830s for the telegraph, 
                it remains an important communication method today.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Key Principles</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Dots (dit) are short signals</li>
                <li>• Dashes (dah) are three times longer than dots</li>
                <li>• Spaces separate letters and words</li>
                <li>• Most common letters have shorter codes</li>
                <li>• International standard (ITU-R M.1677-1)</li>
                <li>• Case-insensitive encoding</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Modern Applications</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Amateur radio communications</li>
                <li>• Emergency signaling (SOS: ...---...)</li>
                <li>• Aviation and maritime navigation</li>
                <li>• Assistive technology for disabilities</li>
                <li>• Military and survival communications</li>
                <li>• Educational and hobby activities</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Tool Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Bidirectional text/Morse conversion</li>
                <li>• Audio playback with custom timing</li>
                <li>• Adjustable frequency and speed</li>
                <li>• Complete character reference chart</li>
                <li>• File upload and download support</li>
                <li>• Copy to clipboard functionality</li>
                <li>• Support for letters, numbers, and punctuation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
