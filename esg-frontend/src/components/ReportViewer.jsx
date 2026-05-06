import React, { useState } from 'react';
import { Copy, Download, Trash2 } from 'lucide-react';

export default function ReportViewer({
  content,
  title = 'Analysis Report',
  onClear,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `esg-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!content) {
    return (
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <p>No report available</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
          {title}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopy}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              color: '#0f172a',
              backgroundColor: '#10b981',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={handleDownload}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              color: '#f1f5f9',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            <Download size={16} />
            Download
          </button>

          {onClear && (
            <button
              onClick={onClear}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                color: '#f1f5f9',
                backgroundColor: 'rgba(220, 38, 38, 0.2)',
                border: '1px solid rgba(220, 38, 38, 0.5)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <Trash2 size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        color: '#cbd5e1',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        fontSize: '0.875rem',
      }}>
        {content}
      </div>
    </div>
  );
}