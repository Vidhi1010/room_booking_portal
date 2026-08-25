import { useState, useEffect } from 'react';

export function WhatsAppFloat() {
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px' }}>
      {showTooltip && (
        <span style={{
          background: '#fff',
          color: '#333',
          fontSize: '13px',
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          animation: 'waTooltipFade 5s ease-in-out forwards',
        }}>
          Ask your query 💬
        </span>
      )}
      <a
        href="https://wa.me/message/SDBBRJT5ZRASI1"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg viewBox="0 0 32 32" width="32" height="32" fill="white">
          <path d="M16.004 2.003C8.268 2.003 2.007 8.264 2.007 15.999c0 2.467.644 4.877 1.867 6.998L2 30l7.207-1.89a13.94 13.94 0 0 0 6.797 1.757c7.735 0 13.996-6.261 13.996-13.996S23.74 2.003 16.004 2.003zm0 25.59a11.58 11.58 0 0 1-5.905-1.617l-.424-.252-4.392 1.152 1.172-4.283-.276-.44a11.56 11.56 0 0 1-1.776-6.154c0-6.397 5.207-11.604 11.604-11.604 6.397 0 11.604 5.207 11.604 11.604-.003 6.4-5.21 11.594-11.607 11.594zm6.36-8.684c-.348-.174-2.06-1.017-2.38-1.133-.32-.116-.553-.174-.785.174-.232.348-.9 1.133-1.103 1.365-.203.232-.406.261-.754.087-.348-.174-1.47-.542-2.8-1.727-1.035-.922-1.733-2.062-1.937-2.41-.203-.348-.022-.536.153-.71.157-.156.348-.406.522-.609.174-.203.232-.348.348-.58.116-.232.058-.435-.029-.609-.087-.174-.785-1.893-1.075-2.592-.283-.681-.571-.589-.785-.6-.203-.01-.435-.012-.667-.012s-.609.087-.928.435c-.32.348-1.22 1.191-1.22 2.906s1.249 3.37 1.423 3.602c.174.232 2.457 3.75 5.952 5.26.832.359 1.481.573 1.988.733.835.265 1.595.228 2.195.138.67-.1 2.06-.842 2.35-1.656.29-.813.29-1.51.203-1.656-.087-.145-.32-.232-.667-.406z"/>
        </svg>
      </a>
      <style>{`
        @keyframes waTooltipFade {
          0% { opacity: 0; transform: translateX(10px); }
          10% { opacity: 1; transform: translateX(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
