'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Printer, Copy, Check, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { listPlayers } from '@/lib/store/wellness-store';
import { JOIN_TOKEN } from '@/lib/store/seed';
import type { WellnessPlayer } from '@/lib/wellness/types/player';
import { Tr, usePageRest } from '@/i18n/page-rest';

export interface WellnessOnboardingProps {
  /** Optional context for labeling — defaults to 'squad' */
  context?: 'squad' | 'academy';
}

const STATUS_STYLE: Record<string, string> = {
  Verified: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'Not Started': 'bg-ink/[0.04] text-ink/35',
};

export default function WellnessOnboarding({ context = 'squad' }: WellnessOnboardingProps) {
  const L = usePageRest();
  const isAcademy = context === 'academy';
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [players, setPlayers] = useState<WellnessPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [fetched, setFetched] = useState(false);

  const joinUrl = joinToken
    ? `${window.location.origin}/clubs/wellness/join/${joinToken}`
    : null;

  const fetchData = useCallback(async () => {
    if (fetched) return;
    setFetched(true);
    try {
      const tokenData = { joinToken: JOIN_TOKEN };
      const playersData = await listPlayers();

      if (tokenData.joinToken) {
        setJoinToken(tokenData.joinToken);
        const url = `${window.location.origin}/clubs/wellness/join/${tokenData.joinToken}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      }

      if (playersData.players) {
        setPlayers(playersData.players);
      }
    } catch {
      /* fetch failed */
    }
    setLoading(false);
  }, [fetched]);

  // Fetch on first expand
  useEffect(() => { if (!collapsed) fetchData(); }, [collapsed, fetchData]);

  const handleCopy = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard failed */
    }
  };

  const handlePrint = () => {
    if (!qrDataUrl || !joinUrl) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wellness QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              background: #fff;
              color: #000;
            }
            h1 { font-size: 24px; font-weight: 300; margin-bottom: 8px; }
            p { font-size: 14px; color: #666; margin-bottom: 24px; }
            img { width: 256px; height: 256px; }
            .url { font-size: 11px; color: #999; margin-top: 16px; word-break: break-all; max-width: 300px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${isAcademy ? 'Academy Wellness' : 'Player Wellness'}</h1>
          <p>Scan to join</p>
          <img src="${qrDataUrl}" alt="QR Code" />
          <div class="url">${joinUrl}</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const verifiedCount = players.filter(p => p.status === 'Verified').length;
  const pendingCount = players.filter(p => p.status === 'Pending').length;

  if (loading && !collapsed) {
    return (
      <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-line overflow-hidden">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover transition-colors">
          <div className="flex items-center gap-3">
            <QrCode className="w-4 h-4 text-ink/40" />
            <h3 className="text-sm font-medium text-foreground">{isAcademy ? 'Academy Player Onboarding' : 'Player Onboarding'}</h3>
          </div>
          <span className="text-ink/25 text-xs">Hide</span>
        </button>
        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-ink/25" /></div>
      </div>
    );
  }

  return (
    <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-line overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <QrCode className="w-4 h-4 text-ink/40" />
          <h3 className="text-sm font-medium text-foreground">{isAcademy ? 'Academy Player Onboarding' : 'Player Onboarding'}</h3>
          {players.length > 0 && (
            <span className="text-[10px] text-ink/35 font-light">
              {verifiedCount}/{players.length} verified
              {pendingCount > 0 && ` · ${pendingCount} pending`}
            </span>
          )}
        </div>
        <span className="text-ink/25 text-xs">{collapsed ? 'Show' : 'Hide'}</span>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-5">
          {/* QR Code + Copy URL */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-background rounded-xl p-3">
                  <img
                    src={qrDataUrl}
                    alt={L("Wellness join QR code")}
                    width={160}
                    height={160}
                    className="block"
                  />
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink/60 hover:text-foreground bg-ink/[0.04] hover:bg-ink/[0.08] rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print QR Code
                </button>
              </div>
            )}

            {/* Instructions + URL */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-light text-ink/60 leading-relaxed">
                  {isAcademy
                    ? 'Share this QR code with academy players and parents. They scan it to register for wellness check-ins — no account needed.'
                    : 'Print or display this QR code in the locker room. Players scan it with their phone to register their WhatsApp number for wellness check-ins, nutrition plans, and injury surveys.'
                  }
                </p>
              </div>
              {joinUrl && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      readOnly
                      value={joinUrl}
                      className="w-full px-3 py-2 rounded-lg border border-line bg-ink/[0.02] text-xs text-ink/50 font-mono truncate focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink/60 hover:text-foreground bg-ink/[0.04] hover:bg-ink/[0.08] border border-line rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Player status table */}
          {players.length > 0 && (
            <div className="border border-line rounded-xl scroll-x">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-4 py-2.5 text-[10px] text-ink/35 uppercase tracking-wider font-light"><Tr s={"Player Name"} /></th>
                    <th scope="col" className="px-4 py-2.5 text-[10px] text-ink/35 uppercase tracking-wider font-light">
                      WhatsApp
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-[10px] text-ink/35 uppercase tracking-wider font-light">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr
                      key={p.wellness_token_id}
                      className="border-b border-ink/[0.03] last:border-0"
                    >
                      <td className="px-4 py-2.5 font-light text-foreground">
                        {p.player_name}
                      </td>
                      <td className="px-4 py-2.5 text-ink/40 font-extralight font-mono text-xs">
                        {p.phone_masked || '--'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status]}`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {players.length === 0 && (
            <p className="text-xs text-ink/30 font-light text-center py-3">
              {isAcademy
                ? 'No players found. Add players to the academy roster first.'
                : 'No players found. Add players via Contracts to see their onboarding status.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
