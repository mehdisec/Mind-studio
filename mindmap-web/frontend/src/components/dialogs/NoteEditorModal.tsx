import React, { useState, useEffect, useRef } from 'react';
import { MindNode } from '../../types';
import { useGraphStore } from '../../stores/useGraphStore';
import { Button } from '../common/Button';
import {
  X,
  Save,
  Trash2,
  Sparkles,
  Eye,
  Edit3,
  Star,
  Tag,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  Maximize2,
  Download,
  ZoomIn,
} from 'lucide-react';

import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';

interface NoteEditorModalProps {
  node: MindNode | null;
  isOpen: boolean;
  onClose: () => void;
  onDeepDive: (node: MindNode) => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  node,
  isOpen,
  onClose,
  onDeepDive,
}) => {
  const { language, themeMode } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';

  const {
    updateNode,
    deleteNode,
  } = useGraphStore();

  const parseTags = (rawTags: any): string[] => {
    let result: string[] = [];
    if (Array.isArray(rawTags)) result = rawTags.map(String);
    else if (typeof rawTags === 'string') {
      try {
        const parsed = JSON.parse(rawTags);
        if (Array.isArray(parsed)) result = parsed.map(String);
      } catch {
        result = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
    return result.slice(0, 4);
  };

  const [title, setTitle] = useState(node?.title || '');
  const [importance, setImportance] = useState(node?.importance || 5);
  const [note, setNote] = useState(node?.note || '');
  const [tags, setTags] = useState<string[]>(parseTags(node?.tags));
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Dedicated Node Image & Photo State
  const [imageUrl, setImageUrl] = useState(node?.imageUrl || '');
  const [nodeType, setNodeType] = useState<'text' | 'image'>(node?.nodeType || 'text');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>(node?.imageSize || 'small');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  // Full-size Lightbox Image state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      setTitle(node.title || '');
      setImportance(typeof node.importance === 'number' ? node.importance : 5);
      setNote(node.note || '');
      const parsed = parseTags(node.tags);
      setTags(parsed);
      setImageUrl(node.imageUrl || '');
      setNodeType(node.nodeType || 'text');
      setImageSize(node.imageSize || 'small');
      setShowUrlInput(false);
      setUrlInputValue('');
      setLightboxImage(null);
    }
  }, [node]);

  // ESC key listener to close lightbox or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, lightboxImage]);

  if (!isOpen || !node) return null;

  const handleSave = async () => {
    const finalTags = Array.isArray(tags) ? tags : [];

    // Update Node data with clean image storage
    await updateNode(node.id, {
      title: title.trim() || (isFa ? 'بدون عنوان' : 'Untitled'),
      importance,
      note,
      tags: finalTags,
      nodeType: imageUrl ? nodeType : 'text',
      imageUrl: imageUrl.trim(),
      imageSize: imageSize || 'small',
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm(isFa ? `آیا از حذف این نود («${node.title}») مطمئن هستید؟` : `Are you sure you want to delete node "${node.title}"?`)) {
      deleteNode(node.id);
      onClose();
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const clean = newTag.trim().replace(/^#/, '');
      const currentTags = Array.isArray(tags) ? tags : [];
      if (currentTags.length >= 4) {
        alert(isFa ? 'هر نود حداکثر می‌تواند ۴ تگ داشته باشد.' : 'Each node can have up to 4 tags maximum.');
        return;
      }
      if (!currentTags.includes(clean)) {
        const nextTags = [...currentTags, clean].slice(0, 4);
        setTags(nextTags);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = Array.isArray(tags) ? tags : [];
    setTags(currentTags.filter((t) => t !== tagToRemove));
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Store as actual node image!
        setImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInputValue.trim()) {
      setImageUrl(urlInputValue.trim());
      setUrlInputValue('');
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setNodeType('text');
  };

  const handleInsertLinkToNote = () => {
    const url = prompt(isFa ? 'آدرس اینترنتی پیوند را وارد کنید:' : 'Enter URL:');
    if (url?.trim()) {
      const textTitle = prompt(isFa ? 'عنوان پیوند:' : 'Link title:') || (isFa ? 'لینک' : 'Link');
      const mdLink = ` [${textTitle}](${url.trim()}) `;
      setNote((prev) => (prev || '') + mdLink);
    }
  };

  // Helper to render basic markdown with images in preview mode
  const renderMarkdownPreview = (text: string) => {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return <p className={`italic p-4 text-center ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{isFa ? 'متنی برای پیش‌نمایش وجود ندارد.' : 'No text available for preview.'}</p>;
    }

    const parts = [];
    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'image',
        alt: match[1] || (isFa ? 'تصویر' : 'Image'),
        src: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return (
      <div className="space-y-3 p-2">
        {parts.map((part, idx) => {
          if (part.type === 'image') {
            return (
              <div key={idx} className="my-3 flex flex-col items-center">
                <img
                  src={part.src}
                  alt={part.alt}
                  onClick={() => part.src && setLightboxImage(part.src)}
                  title={isFa ? 'کلیک برای مشاهده تصویر در ابعاد کامل' : 'Click to view full size image'}
                  className={`max-h-72 rounded-xl border object-contain shadow-lg cursor-zoom-in hover:brightness-105 transition-all ${
                    isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900/80'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {part.alt && <span className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>📷 {part.alt} {isFa ? '(جهت بزرگنمایی کلیک کنید)' : '(Click to enlarge)'}</span>}
              </div>
            );
          }
          return (
            <div
              key={idx}
              className={`whitespace-pre-wrap leading-relaxed text-sm font-sans ${
                isLight ? 'text-slate-900' : 'text-slate-200'
              }`}
            >
              {part.content}
            </div>
          );
        })}
      </div>
    );
  };

  const safeTags = Array.isArray(tags) ? tags : [];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-fade-in"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className={`border-2 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden z-[101] ${
          isLight
            ? 'bg-white border-sky-400 text-[#0F172A] shadow-2xl shadow-sky-950/20'
            : 'bg-[#0f172a] border-cyan-500/60 text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.3)]'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight
            ? 'border-[#CBD5E1] bg-gradient-to-r from-sky-50 via-white to-white'
            : 'border-slate-800 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold flex items-center gap-2 ${
                isLight ? 'text-[#0B192C]' : 'text-slate-100'
              }`}>
                {isFa ? 'ویرایشگر نود و یادداشت' : 'Node & Note Editor'}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                  isLight
                    ? 'text-sky-800 bg-sky-50 border-sky-200'
                    : 'text-cyan-400 bg-cyan-950/80 border-cyan-800'
                }`}>
                  {node.title}
                </span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>{isFa ? 'سازگار با ساختار Markdown و نوت‌های Obsidian' : 'Compatible with Markdown & Obsidian notes'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            title={isFa ? 'بستن پنجره (Esc)' : 'Close (Esc)'}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title and Importance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>{isFa ? 'عنوان مفهوم' : 'Concept Title'}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isFa ? 'عنوان نود...' : 'Node title...'}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  isLight
                    ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-sky-500'
                    : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500'
                }`}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isLight ? 'text-[#0B192C]' : 'text-slate-300'}>{isFa ? 'سطح اهمیت:' : 'Importance Level:'}</span>
                <span className="text-amber-500 font-bold">{importance}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={importance}
                onChange={(e) => setImportance(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-2"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className={`flex items-center gap-1 ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                <Tag className="w-3.5 h-3.5 text-sky-600" />
                {isFa ? 'تگ‌ها (تایپ کنید و Enter بزنید)' : 'Tags (type & press Enter)'}
              </label>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  safeTags.length >= 4
                    ? 'text-amber-700 bg-amber-50 border border-amber-300 font-bold'
                    : isLight
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {safeTags.length}/4 {isFa ? 'تگ' : 'tags'}
              </span>
            </div>
            <div className={`flex flex-wrap items-center gap-1.5 p-2 border rounded-xl min-h-[42px] ${
              isLight ? 'bg-slate-50 border-[#CBD5E1]' : 'bg-slate-900 border-slate-700'
            }`}>
              {safeTags.map((t) => (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border font-medium ${
                    isLight
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-slate-800 text-cyan-300 border-slate-700'
                  }`}
                >
                  #{t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {safeTags.length < 4 ? (
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={isFa ? 'افزودن تگ...' : 'Add tag...'}
                  className={`bg-transparent text-xs focus:outline-none min-w-[90px] flex-1 ${
                    isLight ? 'text-[#0F172A] placeholder-slate-400' : 'text-slate-200 placeholder-slate-500'
                  }`}
                />
              ) : (
                <span className="text-[11px] text-slate-400 italic px-2 select-none">
                  {isFa ? '(سقف ۴ تگ پر شده است)' : '(Maximum 4 tags reached)'}
                </span>
              )}
            </div>
          </div>

          {/* Node Image & Photo Attachment Section */}
          <div
            className={`border rounded-2xl p-4 transition-all space-y-3 ${
              isLight
                ? 'bg-slate-50/80 border-slate-200'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    imageUrl
                      ? isLight
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-950/80 text-emerald-400'
                      : isLight
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-cyan-950/80 text-cyan-400'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    {isFa ? 'تصویر اختصاصی نود' : 'Node Custom Image'}
                  </h4>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isFa ? 'ذخیره و پیوست عکس به این نود با نمایش آیکون در صفحه اصلی بوم' : 'Attach image to this node with visual icon on canvas'}
                  </p>
                </div>
              </div>

              {imageUrl ? (
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                  }`}
                >
                  {isFa ? '✓ دارای عکس' : '✓ Has Image'}
                </span>
              ) : (
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {isFa ? 'بدون تصویر' : 'No Image'}
                </span>
              )}
            </div>

            {/* If NO image attached yet: show upload / URL actions */}
            {!imageUrl ? (
              <div className="space-y-2">
                <div
                  className={`p-3.5 border-2 border-dashed rounded-xl flex flex-wrap items-center justify-between gap-3 ${
                    isLight
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-700/80 bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                      {isFa ? 'می‌توانید یک تصویر از کامپیوتر آپلود کنید یا آدرس وب آن را وارد نمایید:' : 'Upload an image from your device or enter a web URL:'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTriggerUpload}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                        isLight
                          ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-600'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isFa ? 'آپلود عکس از سیستم' : 'Upload Image'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 border ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      {isFa ? 'لینک تصویر' : 'Image URL'}
                    </button>
                  </div>
                </div>

                {/* Optional URL Input */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 p-2 border rounded-xl animate-in fade-in">
                    <input
                      type="url"
                      value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className={`flex-1 text-xs px-3 py-1.5 rounded-lg border font-mono focus:outline-none focus:ring-1 ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                          : 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold text-white ${
                        isLight ? 'bg-sky-600 hover:bg-sky-500' : 'bg-cyan-600 hover:bg-cyan-500'
                      }`}
                    >
                      {isFa ? 'ثبت تصویر' : 'Set Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                    >
                      {isFa ? 'انصراف' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* If image is attached: show preview card & display controls */
              <div
                className={`p-3.5 border rounded-xl flex flex-col sm:flex-row items-center gap-4 ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                {/* Thumbnail Preview with Full-size Click */}
                <div className="relative group shrink-0">
                  <img
                    src={imageUrl}
                    alt={isFa ? 'تصویر نود' : 'Node Image'}
                    onClick={() => setLightboxImage(imageUrl)}
                    title={isFa ? 'کلیک برای مشاهده تصویر در ابعاد کامل' : 'Click to view full size'}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-sky-400/50 shadow-md bg-slate-900 cursor-zoom-in hover:brightness-105 transition-all"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888">Error</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage(imageUrl);
                      }}
                      title={isFa ? 'مشاهده تصویر در اندازه کامل' : 'View full size'}
                      className="p-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 pointer-events-auto shadow-sm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerUpload();
                      }}
                      title={isFa ? 'تعویض عکس' : 'Change image'}
                      className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white pointer-events-auto shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      title={isFa ? 'حذف تصویر' : 'Remove image'}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 pointer-events-auto shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Display settings on graph */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                      {isFa ? 'نحوه نمایش این نود روی بوم اصلی (گراف):' : 'Display style on canvas (graph):'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNodeType('text')}
                        className={`p-2 rounded-xl border text-xs font-medium text-start transition-all flex items-center justify-between ${
                          nodeType === 'text'
                            ? isLight
                              ? 'bg-sky-50 border-sky-500 text-sky-950 shadow-sm'
                              : 'bg-cyan-950/70 border-cyan-500 text-cyan-300'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold block">{isFa ? 'نود متنی + آیکون تصویر' : 'Text Node + Image Badge'}</span>
                          <span className="text-[10px] opacity-75">{isFa ? 'کارت یا دایره همراه با نشانگر عکس' : 'Card or circle with image badge'}</span>
                        </div>
                        {nodeType === 'text' && <span className="text-sky-500 font-bold">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => setNodeType('image')}
                        className={`p-2 rounded-xl border text-xs font-medium text-start transition-all flex items-center justify-between ${
                          nodeType === 'image'
                            ? isLight
                              ? 'bg-sky-50 border-sky-500 text-sky-950 shadow-sm'
                              : 'bg-cyan-950/70 border-cyan-500 text-cyan-300'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold block">{isFa ? 'نود تمام‌تصویری' : 'Full Image Node'}</span>
                          <span className="text-[10px] opacity-75">{isFa ? 'نمایش مستقیم عکس دایره‌ای روی بوم' : 'Direct circular image displayed on canvas'}</span>
                        </div>
                        {nodeType === 'image' && <span className="text-sky-500 font-bold">✓</span>}
                      </button>
                    </div>
                  </div>

                  {/* Image size selector (if shown as image node) */}
                  {nodeType === 'image' && (
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        {isFa ? 'اندازه نود روی بوم:' : 'Node size on canvas:'}
                      </span>
                      {(['small', 'medium', 'large'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setImageSize(s)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                            imageSize === s
                              ? isLight
                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                : 'bg-cyan-600 text-white border-cyan-500'
                              : isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {s === 'small' ? (isFa ? 'کوچک' : 'Small') : s === 'medium' ? (isFa ? 'متوسط' : 'Medium') : (isFa ? 'بزرگ' : 'Large')}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions: change or delete image */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleTriggerUpload}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 border ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      {isFa ? 'تعویض عکس' : 'Change Image'}
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isFa ? 'حذف عکس نود' : 'Remove Image'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Markdown Note Editor / Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className={`text-xs font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                  {isFa ? 'محتوای یادداشت و توضیحات (Markdown)' : 'Note Content & Details (Markdown)'}
                </label>
                <button
                  type="button"
                  onClick={handleInsertLinkToNote}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 border ${
                    isLight
                      ? 'text-slate-700 hover:text-slate-900 bg-white border-[#CBD5E1]'
                      : 'text-slate-300 hover:text-white bg-slate-800 border border-slate-700'
                  }`}
                  title={isFa ? 'درج پیوند اینترنتی در متن یادداشت' : 'Insert URL link in note text'}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {isFa ? 'درج لینک در متن' : 'Insert Link'}
                </button>
              </div>

              <div
                className={`flex items-center gap-1 border p-0.5 rounded-lg ${
                  isLight ? 'bg-slate-100 border-[#CBD5E1]' : 'bg-slate-900 border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'edit'
                      ? 'bg-sky-600 text-white font-medium shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  {isFa ? 'ویرایش' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-sky-600 text-white font-medium shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  {isFa ? 'پیش‌نمایش' : 'Preview'}
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isFa ? 'یادداشت‌ها، توضیحات و جزئیات مفهوم را اینجا بنویسید (پشتیبانی کامل از Markdown)...' : 'Write notes, explanations, and details here (Full Markdown support)...'}
                rows={10}
                className={`w-full border rounded-xl p-3.5 text-sm font-mono focus:outline-none resize-none leading-relaxed ${
                  isLight
                    ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-500 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
              />
            ) : (
              <div
                className={`w-full min-h-[240px] max-h-[400px] border rounded-xl p-4 overflow-y-auto text-sm space-y-4 ${
                  isLight ? 'bg-white border-[#CBD5E1] text-[#0F172A]' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                {/* Hero attached image in preview if exists */}
                {imageUrl && (
                  <div className="flex flex-col items-center pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <img
                      src={imageUrl}
                      alt={title}
                      onClick={() => setLightboxImage(imageUrl)}
                      title={isFa ? 'کلیک برای مشاهده تصویر در ابعاد کامل' : 'Click to view full size'}
                      className="max-h-64 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md object-contain cursor-zoom-in hover:brightness-105 transition-all"
                    />
                    <span className={`text-[11px] mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isFa ? `🖼️ تصویر پیوست‌شده نود: ${title} (جهت مشاهده در ابعاد کامل کلیک کنید)` : `🖼️ Attached node image: ${title} (Click to view full size)`}
                    </span>
                  </div>
                )}
                {renderMarkdownPreview(note)}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${
          isLight ? 'border-[#CBD5E1] bg-[#F8FAFD]' : 'border-slate-800 bg-slate-900/80'
        }`}>
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className="gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {isFa ? 'حذف نود' : 'Delete Node'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onDeepDive({ ...node, title, note, importance });
              }}
              className="gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isFa ? 'تحلیل عمیق Gemini' : 'Gemini Deep-Dive'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {isFa ? 'انصراف' : 'Cancel'}
            </Button>
            <Button variant="cyber" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="w-4 h-4" />
              {isFa ? 'ذخیره تغییرات' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Full-size Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Header Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between pb-3 text-white px-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                {isFa ? 'مشاهده تصویر در اندازه کامل' : 'Full Size Image View'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                download="node-image"
                className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-1.5 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                {isFa ? 'دانلود تصویر' : 'Download Image'}
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 border border-white/20 text-white transition-colors"
                title={isFa ? 'بستن (Esc)' : 'Close (Esc)'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/40"
          >
            <img
              src={lightboxImage}
              alt={isFa ? 'تصویر نود در اندازه کامل' : 'Full size node image'}
              className="max-w-full max-h-[82vh] object-contain select-none shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
