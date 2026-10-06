import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useGraphStore } from './stores/useGraphStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { Navbar } from './components/layout/Navbar';
import { PageTabsBar } from './components/layout/PageTabsBar';
import { Sidebar } from './components/layout/Sidebar';
import { DiagramSidebar } from './components/layout/DiagramSidebar';
import { PhysicsGraphCanvas } from './components/graph/PhysicsGraphCanvas';
import { QuickAddNodeDock } from './components/graph/QuickAddNodeDock';
import { DiagramPageCanvas } from './components/diagram/DiagramPageCanvas';
import { NoteEditorModal } from './components/dialogs/NoteEditorModal';
import { AISubTopicsModal } from './components/dialogs/AISubTopicsModal';
import { AISocraticModal } from './components/dialogs/AISocraticModal';
import { AuthModal } from './components/dialogs/AuthModal';
import { SettingsModal, SettingsTab } from './components/dialogs/SettingsModal';
import { LandingPage } from './components/landing/LandingPage';
import { MindNode } from './types';

export const App: React.FC = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { fetchPages, pages, activePageId } = useGraphStore();
  const { language, themeMode } = useSettingsStore();

  const activePage = pages.find((p) => p.id === activePageId);

  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('appearance');
  const [editingNode, setEditingNode] = useState<MindNode | null>(null);
  const [subTopicsNode, setSubTopicsNode] = useState<MindNode | null>(null);
  const [socraticNode, setSocraticNode] = useState<MindNode | null>(null);

  // Initialize Auth & Load User's Workspace
  useEffect(() => {
    const init = async () => {
      const isAuthed = await checkAuth();
      if (isAuthed) {
        await fetchPages();
        setShowLanding(false);
      } else {
        setShowLanding(true);
      }
    };
    init();
  }, [checkAuth, fetchPages]);

  // When user authenticates enter studio; when user logs out return to landing page
  useEffect(() => {
    if (isAuthenticated) {
      setShowLanding(false);
      fetchPages();
    } else {
      setShowLanding(true);
    }
  }, [isAuthenticated, fetchPages]);

  // Synchronize document dir & lang: Keep studio layout right-to-left permanently so sidebar stays on the right
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'rtl';
  }, [language]);

  // Ensure strict no-scroll lock inside Studio Workspace
  useEffect(() => {
    if (!showLanding) {
      document.body.style.overflow = 'hidden';
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.overflow = 'hidden';
      }
    }
  }, [showLanding]);

  const isLight = themeMode === 'light';

  const handleAuthSuccess = async () => {
    setIsAuthModalOpen(false);
    setShowLanding(false);
    await fetchPages();
  };

  // If in Landing Page view, show full landing page with centered Auth Modal
  if (showLanding) {
    return (
      <>
        <LandingPage
          onEnterStudio={() => setShowLanding(false)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div
      dir="rtl"
      className={`flex flex-col h-full w-full max-w-full max-h-full overflow-hidden font-sans select-none transition-colors fixed inset-0 ${isLight ? 'bg-[#E2E8F0] text-slate-900' : 'bg-[#0B0F19] text-slate-100'
        }`}
    >
      {/* 1. Top Navbar: Clean Brand, Gear Settings Icon, User Profile & Auth */}
      <Navbar
        onOpenLanding={() => setShowLanding(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSettings={(tab = 'appearance') => {
          setSettingsTab(tab);
          setIsSettingsModalOpen(true);
        }}
      />

      {/* 2. Main Workspace: Fixed Studio Sidebar permanently on the right, Physics Canvas & Bottom Toolbar in the center/left */}
      <div
        className="flex-1 flex overflow-hidden relative"
        dir="rtl"
      >
        {/* Dynamic Studio Sidebar: Diagram Sidebar for diagram mode, Mindmap Concept Sidebar for mindmap mode */}
        {activePage?.pageMode === 'diagram' ? (
          <DiagramSidebar />
        ) : (
          <Sidebar
            onEditNode={(node) => setEditingNode(node)}
            onOpenSubTopics={(node) => setSubTopicsNode(node)}
            onOpenSocratic={(node) => setSocraticNode(node)}
          />
        )}

        {/* Mind Graph Frame: Interactive Physics Canvas or Manual Diagram Canvas, Page Tabs at the bottom */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            {activePage?.pageMode === 'diagram' ? (
              <DiagramPageCanvas key={activePage.id} page={activePage} />
            ) : (
              <>
                <PhysicsGraphCanvas
                  onEditNode={(node) => setEditingNode(node)}
                  onOpenSubTopics={(node) => setSubTopicsNode(node)}
                  onOpenSocratic={(node) => setSocraticNode(node)}
                />
                {/* Centered Floating Quick Add Node Box in Graph Canvas */}
                <QuickAddNodeDock />
              </>
            )}
          </div>

          {/* Bottom Bar: Page Tabs and Controls */}
          <PageTabsBar />
        </main>
      </div>

      {/* Note Editor Modal */}
      {editingNode && (
        <NoteEditorModal
          key={editingNode.id}
          node={editingNode}
          isOpen={true}
          onClose={() => setEditingNode(null)}
          onDeepDive={(node) => {
            setEditingNode(null);
            setSubTopicsNode(node);
          }}
        />
      )}

      {/* Separate Modal 1: AI Sub-Topics & Idea Milestones */}
      <AISubTopicsModal
        node={subTopicsNode}
        isOpen={!!subTopicsNode}
        onClose={() => setSubTopicsNode(null)}
      />

      {/* Separate Modal 2: 5 Socratic Critical Questions */}
      <AISocraticModal
        node={socraticNode}
        isOpen={!!socraticNode}
        onClose={() => setSocraticNode(null)}
      />

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Comprehensive System Settings Modal (Appearance & Language, AI & Gemini API, Profile, Security) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        initialTab={settingsTab}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default App;
