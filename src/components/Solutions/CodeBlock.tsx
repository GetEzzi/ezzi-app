import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { ProgrammingLanguage } from '@shared/api.ts';

interface CodeBlockProps {
  code: string;
  language: ProgrammingLanguage;
  showCopyButton?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  showCopyButton = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Temporarily disable focus to prevent title bar restoration
      await window.electronAPI.setWindowFocusable(false);

      const result = await window.electronAPI.writeText(code);

      // Re-enable focus after copy completes
      await window.electronAPI.setWindowFocusable(true);

      if (result.success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('Failed to copy code:', result.error);
      }
    } catch (error) {
      // Always restore focusable state on error
      try {
        await window.electronAPI.setWindowFocusable(true);
      } catch (restoreError) {
        console.error('Failed to restore focus state:', restoreError);
      }
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="relative">
      <SyntaxHighlighter
        showLineNumbers
        language={language === ProgrammingLanguage.Go ? 'go' : language}
        style={a11yDark}
        customStyle={{
          maxWidth: '100%',
          margin: 0,
          padding: '1rem',
          paddingRight: showCopyButton ? '3rem' : '1rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          backgroundColor: 'rgba(22, 27, 34, 0.8)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
        wrapLongLines={true}
      >
        {code}
      </SyntaxHighlighter>

      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors duration-200 group"
          title="Copy code"
        >
          {copied ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} className="text-gray-400 group-hover:text-white" />
          )}
        </button>
      )}
    </div>
  );
};

export default CodeBlock;
