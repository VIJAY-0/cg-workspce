
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VMStatus, Workspace, ViewType } from './types';
import Dashboard from './components/Dashboard';
import WorkspaceEditor from './components/WorkspaceEditor';
import CreateWorkspace from './components/CreateWorkspace';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: 'ws-1',
      name: 'cloudgrep-engine-v2',
      repo: 'cloudgrep/engine',
      branch: 'main',
      status: VMStatus.RUNNING,
      lastActive: '2m ago',
      isShared: true,
      snapshotsCount: 3,
    },
    {
      id: 'ws-2',
      name: 'frontend-toolkit',
      repo: 'cloudgrep/ui-kit',
      branch: 'develop',
      status: VMStatus.PAUSED,
      lastActive: '3h ago',
      isShared: false,
      snapshotsCount: 1,
    },
    {
      id: 'ws-3',
      name: 'api-gateway-service',
      repo: 'cloudgrep/gateway',
      branch: 'feature/auth-reboot',
      status: VMStatus.OFFLINE,
      lastActive: '2d ago',
      isShared: false,
      snapshotsCount: 0,
    }
  ]);

  const activeWorkspace = useMemo(() => 
    workspaces.find(ws => ws.id === activeWorkspaceId), 
    [workspaces, activeWorkspaceId]
  );

  const handleOpenWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    setCurrentView('editor');
  };

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setActiveWorkspaceId(null);
  };

  const handleCreateWorkspace = (data: Partial<Workspace>) => {
    const newWsId = `ws-${Date.now()}`;
    const newWs: Workspace = {
      id: newWsId,
      name: data.name || 'new-workspace',
      repo: data.repo || 'owner/repo',
      branch: data.branch || 'main',
      status: VMStatus.STARTING,
      lastActive: 'Just now',
      isShared: false,
      snapshotsCount: 0,
    };
    
    setWorkspaces(prev => [newWs, ...prev]);
    setActiveWorkspaceId(newWsId);
    setCurrentView('editor');

    // Simulate VM initialization
    setTimeout(() => {
      setWorkspaces(prev => prev.map(ws => 
        ws.id === newWsId ? { ...ws, status: VMStatus.RUNNING } : ws
      ));
    }, 4000);
  };

  const handleUpdateStatus = (id: string, status: VMStatus) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === id ? { ...ws, status } : ws
    ));
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-indigo-500/40">
      <AnimatePresence mode="wait">
        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="h-full w-full"
          >
            <Dashboard 
              workspaces={workspaces} 
              onOpen={handleOpenWorkspace} 
              onCreate={handleCreateNew} 
            />
          </motion.div>
        )}
        
        {currentView === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="h-full w-full"
          >
            <CreateWorkspace 
              onCancel={handleBackToDashboard} 
              onCreate={handleCreateWorkspace} 
            />
          </motion.div>
        )}
        
        {currentView === 'editor' && activeWorkspace && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4, ease: "anticipate" }}
            className="h-full w-full"
          >
            <WorkspaceEditor 
              workspace={activeWorkspace} 
              onBack={handleBackToDashboard}
              onUpdateStatus={(status) => handleUpdateStatus(activeWorkspace.id, status)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
