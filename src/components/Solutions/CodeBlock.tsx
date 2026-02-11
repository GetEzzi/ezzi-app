import React, { useState, useRef, useEffect } from 'react';
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!wrapperRef.current) {
        console.log('[CodeBlock] wrapperRef is null, skipping');

        return;
      }
      const pre = wrapperRef.current.querySelector('pre');
      if (!pre) {
        console.log('[CodeBlock] pre element not found, skipping');

        return;
      }

      const containerPadding = 64;

      console.log(
        '[CodeBlock] pre.scrollWidth:',
        pre.scrollWidth,
        'pre.clientWidth:',
        pre.clientWidth,
        'overflow:',
        pre.scrollWidth - pre.clientWidth,
      );
      console.log('[CodeBlock] containerPadding:', containerPadding);

      if (pre.scrollWidth > pre.clientWidth) {
        const neededWidth = pre.scrollWidth + containerPadding;
        console.log(
          '[CodeBlock] Code OVERFLOWS. Requesting expansion. neededWidth:',
          neededWidth,
        );
        window.electronAPI
          .updateContentDimensions({
            width: neededWidth,
            height: document.documentElement.scrollHeight,
            source: 'CodeBlock',
          })
          .then(() => {
            console.log('[CodeBlock] expansion request succeeded');
          })
          .catch((err: unknown) => {
            console.error('[CodeBlock] expansion request FAILED:', err);
          });
      } else {
        console.log(
          '[CodeBlock] Code FITS. Sending width: 0 to shrink to base.',
        );
        window.electronAPI
          .updateContentDimensions({
            width: 0,
            height: document.documentElement.scrollHeight,
            source: 'CodeBlock',
          })
          .then(() => {
            console.log('[CodeBlock] shrink request succeeded');
          })
          .catch((err: unknown) => {
            console.error('[CodeBlock] shrink request FAILED:', err);
          });
      }
    });

    return () => cancelAnimationFrame(id);
  }, [code]);

  const handleCopy = async () => {
    try {
      // Use copy → hide → wait → show sequence to prevent title bar appearing
      const result = await window.electronAPI.copyAndRefreshWindow(code, 250);

      if (result.success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('Failed to copy and refresh window:', result.error);
      }
    } catch (error) {
      console.error('Failed to copy and refresh window:', error);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <SyntaxHighlighter
        showLineNumbers
        language={language === ProgrammingLanguage.Go ? 'go' : language}
        style={a11yDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          paddingRight: showCopyButton ? '3rem' : '1rem',
          overflowX: 'auto',
          backgroundColor: 'rgba(22, 27, 34, 0.8)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
      >
        {code}
      </SyntaxHighlighter>

      {showCopyButton && (
        <button
          onClick={() => {
            handleCopy().catch(console.error);
          }}
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
