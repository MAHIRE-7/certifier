import React from 'react';
import { FileText, Check, Layout, QrCode } from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificate Templates</h1>
        <p className="text-xs text-slate-500 mt-1">
          Pre-engineered vector PDF layouts rendering high-resolution landscape A4 credentials with embedded QR codes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modern Tech Template Preview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Template 1
              </span>
              <span className="text-xs text-slate-400 font-mono">modern_tech</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">Modern Technology Workshop</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Designed specifically for developer workshops, bootcamps, and hackathons. Features crisp technical
              borders, electric blue accent header bars, dynamic title typography, and a prominent QR verification matrix.
            </p>

            {/* Stylized Miniature Preview */}
            <div className="aspect-[1.414/1] bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border-2 border-blue-600/70 p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
              <div className="h-1.5 w-full bg-blue-600 rounded-full" />
              <div className="text-center space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-blue-700 font-bold">ORGANIZATION NAME</div>
                <div className="text-sm font-extrabold text-slate-900">CERTIFICATE OF COMPLETION</div>
                <div className="text-[8px] text-slate-400">PRESENTED TO</div>
                <div className="text-xs font-bold text-blue-900 border-b border-blue-300 pb-0.5 max-w-[140px] mx-auto">
                  Recipient Full Name
                </div>
                <div className="text-[8px] text-slate-600">for completing Distributed Systems Workshop</div>
              </div>
              <div className="flex items-end justify-between pt-2 text-[8px] text-slate-500 border-t border-slate-200/80">
                <div>
                  <div className="font-semibold text-slate-700">Lead Instructor</div>
                  <div>Issued: 2026-06-01</div>
                </div>
                <div className="w-8 h-8 bg-white border border-slate-300 rounded flex items-center justify-center shadow-xs">
                  <QrCode className="w-6 h-6 text-slate-800" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Format: Landscape A4 Vector</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Built-in Default
            </span>
          </div>
        </div>

        {/* Minimal Achievement Template Preview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Template 2
              </span>
              <span className="text-xs text-slate-400 font-mono">minimal_achievement</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">Minimal Professional Achievement</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tailored for executive awards, academic credentials, and official corporate certifications.
              Features a classic double border, warm gold accent divider lines, and formal serif typography.
            </p>

            {/* Stylized Miniature Preview */}
            <div className="aspect-[1.414/1] bg-amber-50/20 rounded-xl border-2 border-slate-700 p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
              <div className="border border-amber-600/40 p-2 h-full flex flex-col justify-between">
                <div className="text-center space-y-1">
                  <div className="text-[9px] text-slate-600 font-serif">Academic Organization</div>
                  <div className="text-sm font-bold text-slate-900 font-serif">Certificate of Excellence</div>
                  <div className="text-[8px] text-slate-400">Awarded to</div>
                  <div className="text-xs font-bold text-slate-900 font-serif border-b border-amber-500/60 pb-0.5 max-w-[140px] mx-auto">
                    Recipient Full Name
                  </div>
                  <div className="text-[8px] text-slate-600">in recognition of outstanding achievement</div>
                </div>
                <div className="flex items-end justify-between pt-2 text-[8px] text-slate-500 border-t border-slate-200">
                  <div>
                    <div>Date: 2026-06-01</div>
                    <div className="font-semibold text-emerald-700">Ed25519 Verified</div>
                  </div>
                  <div className="w-8 h-8 bg-white border border-slate-300 rounded flex items-center justify-center shadow-xs">
                    <QrCode className="w-6 h-6 text-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Format: Landscape A4 Vector</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Built-in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
