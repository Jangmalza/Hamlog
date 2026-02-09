import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal } from 'lucide-react';

interface PostContentProps {
  contentHtml?: string;
}

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['data-size', 'data-width', 'style', 'width', 'class', 'colspan', 'rowspan', 'colwidth', 'data-caption', 'id'],
    ADD_TAGS: ['figure', 'figcaption']
  });

const CodeBlock = ({ language, code }: { language: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[#1e1e1e] shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-white/40" />
          <span className="text-xs font-medium text-white/60">
            {language || 'plaintext'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Area */}
      <div className="relative text-sm">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={true}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#6e7681',
            textAlign: 'right'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const PostContent: React.FC<PostContentProps> = ({ contentHtml }) => {
  if (!contentHtml || !contentHtml.trim()) {
    return null;
  }

  const sanitized = sanitizeHtml(contentHtml);

  const options = {
    replace: (domNode: any) => {
      // 1. Handle Headings: Add IDs for TOC
      if (domNode.type === 'tag' && ['h1', 'h2', 'h3'].includes(domNode.name)) {
        if (!domNode.attribs.id) {
          const text = (domNode.children
            ? domNode.children
              .filter((child: any) => child.type === 'text' || child.type === 'tag')
              .map((child: any) => child.data || (child.children?.[0]?.data) || '')
              .join('')
            : '') || 'heading';

          const slug = text
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 30);

          domNode.attribs.id = `heading-${domNode.startIndex ?? ''}-${slug}`;
        }
      }

      // 2. Handle Code Blocks
      if (domNode.type === 'tag' && domNode.name === 'pre') {
        const codeNode = domNode.children && domNode.children.find(
          (child: any) => child.name === 'code'
        );

        if (codeNode) {
          const className = codeNode.attribs.class || '';
          const languageMatch = className.match(/language-(\w+)/);
          const language = languageMatch ? languageMatch[1] : 'plaintext';

          const getText = (node: any): string => {
            if (node.type === 'text') return node.data;
            if (node.type === 'tag') {
              if (node.name === 'br') return '\n';
              const content = node.children ? node.children.map(getText).join('') : '';
              if (['p', 'div', 'li', 'tr'].includes(node.name)) {
                return content + '\n';
              }
              return content;
            }
            return '';
          };

          let codeContent = getText(codeNode);
          codeContent = codeContent
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');

          return <CodeBlock language={language} code={codeContent.trimEnd()} />;
        }
      }
    }
  };

  return (
    <div className="rich-content">
      {parse(sanitized, options)}
    </div>
  );
};

export default PostContent;
