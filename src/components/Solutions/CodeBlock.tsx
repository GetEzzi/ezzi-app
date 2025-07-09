import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ProgrammingLanguage } from '../../../shared/api';

interface CodeBlockProps {
  code: string;
  language: ProgrammingLanguage;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  return (
    <SyntaxHighlighter
      showLineNumbers
      language={language === ProgrammingLanguage.Go ? 'go' : language}
      style={a11yDark}
      customStyle={{
        maxWidth: '100%',
        margin: 0,
        padding: '1rem',
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
  );
};

export default CodeBlock;
