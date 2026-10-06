import React, { useState, useEffect } from 'react';
import { MindNode } from '../../types';
import { aiService } from '../../services/aiService';
import { useGraphStore } from '../../stores/useGraphStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  HelpCircle,
  X,
  Copy,
  Check,
  FilePlus,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';

interface AISocraticModalProps {
  node: MindNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AISocraticModal: React.FC<AISocraticModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const { language, themeMode } = useSettingsStore();
  const isLight = themeMode === 'light';
  const { isRtl } = useTranslation(language);
  const isFa = language === 'fa';
  const { updateNode } = useGraphStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [addedNoteSuccess, setAddedNoteSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && node) {
      fetchQuestions();
    } else {
      setQuestions([]);
      setError(null);
      setCopiedIndex(null);
      setAddedNoteSuccess(false);
    }
  }, [isOpen, node?.id]);

  const fetchQuestions = async () => {
    if (!node) return;
    setIsLoading(true);
    setError(null);
    setAddedNoteSuccess(false);
    try {
      const data = await aiService.getSocraticQuestions(node.title, node.note);
      const list = data?.socraticQuestions || [];
      setQuestions(list);
    } catch (err: any) {
      setError(err.response?.data?.error || (isFa ? 'خطا در برقراری ارتباط با سرویس هوش مصنوعی' : 'Failed to connect to AI service'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleAppendAllToNote = async () => {
    if (!node || questions.length === 0) return;
    const currentNote = node.note ? node.note.trim() : '';
    const socraticSection = isFa
      ? `\n\n### 🧠 پرسش‌های بنیادین سقراطی:\n` + questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
      : `\n\n### 🧠 Socratic Inquiry Questions:\n` + questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const newNote = currentNote ? `${currentNote}${socraticSection}` : socraticSection.trim();

    await updateNode(node.id, { note: newNote });
    setAddedNoteSuccess(true);
    setTimeout(() => {
      setAddedNoteSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen || !node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className={`${isLight ? 'bg-[#F8FAFD] border-amber-300 text-slate-800 shadow-xl' : 'bg-[#111827] border-amber-600/50 text-slate-100 shadow-glow-amber/20'} border rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'bg-amber-50/80 border-slate-200' : 'border-slate-800 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-950 text-amber-400 border-amber-800 shadow-glow-amber/40'}`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{isFa ? '۵ پرسش بنیادین سقراطی' : '5 Socratic Core Questions'}</h2>
                <Badge variant="amber">{isFa ? 'تفکر عمیق و نقادانه' : 'Deep Critical Thinking'}</Badge>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isFa ? 'مفهوم مورد بررسی:' : 'Concept Under Review:'} <strong className={isLight ? 'text-amber-800' : 'text-amber-300'}>«{node.title}»</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading && questions.length === 0 ? (
            <div className="py-14 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {isFa ? 'در حال استخراج پرسش‌های سقراطی و به چالش کشیدن مفروضات...' : 'Extracting Socratic questions and probing assumptions...'}
                </h4>
                <div className={`flex items-center justify-center gap-2 text-xs font-medium pt-1 ${isLight ? 'text-amber-700' : 'text-amber-400/90'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="animate-pulse">{isFa ? 'در حال بارگذاری...' : 'Loading...'}</span>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className={`p-4 border rounded-2xl flex flex-col gap-3 animate-fade-in shadow-lg ${isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800/80 text-rose-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl border shrink-0 ${isLight ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-rose-900/60 text-rose-400 border-rose-800'}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className={`font-bold text-sm ${isLight ? 'text-rose-900' : 'text-rose-100'}`}>{isFa ? 'پیام هوش مصنوعی / خطا در ارتباط' : 'AI Message / Connection Error'}</h4>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>{error}</p>
                </div>
              </div>
              <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isLight ? 'border-rose-200' : 'border-rose-900/50'}`}>
                <button
                  onClick={fetchQuestions}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${isLight ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300' : 'bg-rose-900/60 hover:bg-rose-800 text-rose-100 border-rose-700/80'}`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isFa ? 'تلاش مجدد' : 'Retry'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-3 border transition-all flex items-start gap-3 group ${isLight ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-sm' : 'bg-slate-900/60 border-slate-800 hover:border-amber-700/60'}`}
                >
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 shadow-sm ${isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/90 text-amber-400 border-amber-800'}`}>
                    {idx + 1}
                  </span>
                  <div className={`flex-1 text-xs leading-relaxed font-normal pt-1 ${isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}`}>
                    {q}
                  </div>
                  <button
                    onClick={() => handleCopyQuestion(q, idx)}
                    title={isFa ? 'کپی متن این پرسش' : 'Copy this question'}
                    className={`p-1.5 rounded-lg transition-colors opacity-80 group-hover:opacity-100 shrink-0 ${isLight ? 'text-slate-400 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'}`}
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'}`}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {isFa ? 'بستن' : 'Close'}
          </Button>

          {questions.length > 0 && (
            <Button
              variant="cyber"
              size="sm"
              disabled={isLoading || addedNoteSuccess}
              onClick={handleAppendAllToNote}
              className="gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-500/60 text-white"
            >
              {addedNoteSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  {isFa ? 'به یادداشت نود افزوده شد!' : 'Added to node note!'}
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  {isFa ? 'افزودن این ۵ پرسش به یادداشت نود' : 'Add 5 Questions to Node Note'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
