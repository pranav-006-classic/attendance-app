import React from 'react';
import { X, Sparkles, BookOpen, Layers, CheckCircle2, ShieldCheck, Palette } from 'lucide-react';

interface DesignSystemSpecimenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignSystemSpecimenModal: React.FC<DesignSystemSpecimenModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-[#FAF9F5] dark:bg-[#151B18] w-full max-w-2xl rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-[#1A221E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#13523B] text-white flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#0D3828] dark:text-[#E8EFEA] leading-tight">
                Academic Ledger Design System
              </h3>
              <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                Design Kit Specimen • Visual Hierarchy & Color Tokens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-[#FAF9F5] dark:hover:bg-[#151B18] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* 1. Typography Scales */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
              Typography Matrix
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E]">
                <div className="text-3xl font-serif text-[#0D3828] dark:text-[#E8EFEA] mb-1 font-bold">
                  Aa
                </div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                  Newsreader Serif
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Editorial headings, dates, ledger title
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E]">
                <div className="text-3xl font-sans text-neutral-900 dark:text-white mb-1 font-bold">
                  Aa
                </div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                  Plus Jakarta Sans
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Navigation, buttons, UI body
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E]">
                <div className="text-3xl font-mono text-[#13523B] dark:text-emerald-400 mb-1 font-bold">
                  Aa
                </div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                  JetBrains Mono
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Roll numbers, metrics, audit hashes
                </div>
              </div>
            </div>
          </div>

          {/* 2. Color Palette Swatches */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
              Primary Academic Palette
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] space-y-2">
                <div className="h-10 rounded-lg bg-[#13523B] shadow-inner" />
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Ledger Green</div>
                <div className="text-[10px] font-mono text-neutral-400">#13523B • Primary</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] space-y-2">
                <div className="h-10 rounded-lg bg-[#FAF9F5] border border-[#E6E3D8] shadow-inner" />
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Parchment Canvas</div>
                <div className="text-[10px] font-mono text-neutral-400">#FAF9F5 • Surface</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] space-y-2">
                <div className="h-10 rounded-lg bg-[#BA3C2A] shadow-inner" />
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Terracotta Rust</div>
                <div className="text-[10px] font-mono text-neutral-400">#BA3C2A • Absent/Alert</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] space-y-2">
                <div className="h-10 rounded-lg bg-[#C77724] shadow-inner" />
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Academic Amber</div>
                <div className="text-[10px] font-mono text-neutral-400">#C77724 • Late/Pending</div>
              </div>
            </div>
          </div>

          {/* 3. Status Badges & Chips */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
              Attendance State Chips
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EF] text-[#13523B] border border-[#BEE0CE]">
                <span className="w-2 h-2 rounded-full bg-[#13523B]" />
                Present (P)
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDF2F0] text-[#BA3C2A] border border-[#F5C4BD]">
                <span className="w-2 h-2 rounded-full bg-[#BA3C2A]" />
                Absent (A)
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                Official Duty (OD)
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF7EE] text-[#C77724] border border-[#FAD9B3]">
                <span className="w-2 h-2 rounded-full bg-[#C77724]" />
                Late Arrival (L)
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
                Audit Approved
              </span>
            </div>
          </div>

          {/* 4. Architectural Core Rule Notice */}
          <div className="p-4 rounded-xl bg-[#EAF5EF] dark:bg-[#15271F] border border-[#BEE0CE] dark:border-[#1E3B2E] text-neutral-800 dark:text-neutral-200">
            <div className="flex items-center gap-2 font-bold text-[#13523B] dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Immutable Ledger Mandate</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Nothing is ever deleted. Attendance modifications record the prior state, the new state, the editor's signature, and a mandatory academic justification in an append-only audit trail.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-[#1A221E] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#13523B] text-white font-bold text-xs hover:bg-[#0F4A34] transition-colors cursor-pointer"
          >
            Close Specimen
          </button>
        </div>
      </div>
    </div>
  );
};
