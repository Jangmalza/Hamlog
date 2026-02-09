import React, { useState } from 'react';
import parse from 'html-react-parser';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal } from 'lucide-react';
import type { PostSection } from '../data/blogData';


interface PostContentProps {
  sections?: PostSection[];
  contentHtml?: string;
}

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


const PostContent: React.FC<PostContentProps> = ({ sections = [], contentHtml }) => {
  // 1. If we have raw HTML (from Tiptap)
  if (contentHtml && contentHtml.trim()) {
    const options = {
      replace: (domNode: any) => {
        // 1. Handle Headings: Add IDs for TOC
        if (['h1', 'h2', 'h3'].includes(domNode.name)) {
          // Check if ID already exists
          if (!domNode.attribs.id) {
            // Generate ID from text content
            const text = domNode.children
              ?.filter((child: any) => child.type === 'text')
              .map((child: any) => child.data)
              .join('') || '';

            // Simple slugify
            const id = text
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9가-힣\s-]/g, '') // Remove special chars
              .replace(/\s+/g, '-');

            domNode.attribs.id = `heading-${id}-${Math.random().toString(36).substr(2, 5)}`;
          }
        }

        // 2. Handle Code Blocks
        if (domNode.name === 'pre') {
          // Robustly find the code element (ignore whitespace text nodes)
          const codeNode = domNode.children && domNode.children.find(
            (child: any) => child.name === 'code'
          );

          if (codeNode) {
            // Extract language class from code block if exists (e.g., class="language-js")
            const className = codeNode.attribs.class || '';
            const languageMatch = className.match(/language-(\w+)/);
            const language = languageMatch ? languageMatch[1] : 'plaintext';

            // Extract text content from children
            // Helper to get text from nested children
            const getText = (node: any): string => {
              if (node.type === 'text') return node.data;
              if (node.type === 'tag') {
                if (node.name === 'br') return '\n';

                const content = node.children ? node.children.map(getText).join('') : '';

                // Add newline after block elements if not empty
                if (['p', 'div', 'li', 'tr'].includes(node.name)) {
                  return content + '\n';
                }
                return content;
              }
              return '';
            };

            let codeContent = getText(codeNode);

            // Simple unescape for common entities if html-react-parser missed them
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
        {parse(contentHtml, options)}
      </div>
    );
  }

  // 2. Legacy Sections Fallback (if any)
  return (
    <div className="post-content">
      {sections.map((section, index) => {
        const key = `${section.type}-${index}`;

        switch (section.type) {
          // ... (Previous cases preserved just in case)
          case 'code':
            return (
              <CodeBlock key={key} language={section.language || 'plaintext'} code={section.content} />
            );
          default:
            // For other legacy types, we could implement similar rendering or just skip since most new posts use contentHtml
            if (section.type === 'heading') return <h2 key={key} className="post-heading">{section.content}</h2>;
            if (section.type === 'paragraph') return <p key={key} className="post-paragraph">{section.content}</p>;
            // ... minimal fallback
            return null;
        }
      })}
    </div>
  );
};

export default PostContent;
