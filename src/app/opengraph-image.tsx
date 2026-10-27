import { ImageResponse } from 'next/og';

export const alt = 'Conciliacion_Bancaria_Q4.xlsx - Cloud Spreadsheets';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8f9fa',
          fontFamily: 'sans-serif',
          color: '#1f2937',
          border: '1px solid #d1d5db',
        }}
      >
        {/* Top Green Spreadsheet Chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#107c41',
            color: '#ffffff',
            padding: '24px 40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#107c41',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '22px',
              }}
            >
              X
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '28px', fontWeight: 700 }}>
                Q4_Financial_Reconciliation_2026.xlsx
              </span>
              <span style={{ fontSize: '15px', opacity: 0.9 }}>
                File  Edit  View  Insert  Format  Data  Audit  Extensions  [ES / EN]
              </span>
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            CLS = 0  |  Esc: Boss-Key Panic Mode
          </div>
        </div>

        {/* Formula Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderBottom: '2px solid #e5e7eb',
            padding: '14px 40px',
            fontSize: '22px',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              color: '#107c41',
              marginRight: '24px',
              paddingRight: '24px',
              borderRight: '2px solid #e5e7eb',
            }}
          >
            E5
          </span>
          <span style={{ fontStyle: 'italic', color: '#6b7280', marginRight: '16px' }}>
            fx
          </span>
          <span style={{ fontWeight: 600, color: '#111827' }}>
            =AUDIT(E5)   //   =SCAN_3X3(C4)   //   =BARRAGE_ROW(3)
          </span>
        </div>

        {/* Main Ledger Preview */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '36px 40px',
            gap: '32px',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              padding: '24px',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>
                ANNEX A — Internal Reserve Ledger (10x10)
              </span>
              <span
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                OK  |  $252,400.00
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span>OFT-501  Offshore Trust (5 cells)</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>$125,000.00 [OK]</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span>VCS-402  Venture Capital Syndicate (4 cells)</span>
                <span style={{ fontWeight: 700, color: '#991b1b' }}>#REF! -IMP [DISCREPANCY]</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span>SHC-303  Shell Holding Corp (3 cells)</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>$42,800.00 [OK]</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>PTC-205  Petty Cash (2 cells)</span>
                <span style={{ fontWeight: 700, color: '#991b1b' }}>#LIQ! [LIQUIDATED]</span>
              </div>
            </div>
            <div style={{ fontSize: '16px', color: '#4b5563' }}>
              Server-Side Fog-of-War Anti-Cheat  •  Bilingual (ES / EN)  •  Sheets / Excel / SQL Dark
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
