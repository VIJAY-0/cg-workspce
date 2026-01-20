
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VMStatus, Workspace, Snapshot, Port } from '../types';
import { Icons } from '../constants';
import { config } from '../config';

interface WorkspaceEditorProps {
  workspace: Workspace;
  onBack: () => void;
  onUpdateStatus: (status: VMStatus) => void;
}

const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({ workspace, onBack, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState('explorer');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([
    { id: 'snap-1', workspaceId: workspace.id, name: 'Prod-ready checkpoint', createdAt: '2d ago' }
  ]);
  const [ports, setPorts] = useState<Port[]>([
    { port: 8080, url: 'https://8080-ws-1.grep.ws', status: 'active' }
  ]);
  const [savingProgress, setSavingProgress] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);

  // WebSocket Connection for Terminal
  useEffect(() => {
    const ws = new WebSocket(`${config.WS_ENDPOINT}/workspaces/${workspace.id}/terminal`);

    ws.onopen = () => {
        setIsConnected(true);
        setTerminalLines(prev => [...prev, '[system] Connected to cloud terminal session...']);
    };

    ws.onmessage = (event) => {
        setTerminalLines(prev => [...prev, event.data]);
    };

    ws.onclose = () => {
        setIsConnected(false);
        setTerminalLines(prev => [...prev, '[system] Connection lost. Reconnecting...']);
    };

    ws.onerror = () => {
        // Fallback for demo if backend is missing
        if (!isConnected) {
            setTerminalLines(prev => [...prev, '[warn] Remote terminal unavailable. Falling back to local shell.']);
        }
    };

    setSocket(ws);

    return () => {
        ws.close();
    };
  }, [workspace.id]);


  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();

    // If socket is connected, send command to backend
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
        socket.send(cmd);
        setTerminalLines(prev => [...prev, `cloud-node@grep:~$ ${cmd}`]);
    } else {
        // Local fallback logic
        const newLines = [...terminalLines, `cloud-node@grep:~$ ${cmd}`];
        switch (cmd.toLowerCase()) {
            case 'clear':
                setTerminalLines([]);
                break;
            case 'help':
                setTerminalLines([...newLines, 'Available commands: help, clear, ls, status, ports, exit']);
                break;
            case 'ls':
                setTerminalLines([...newLines, 'src  components  public  package.json  tsconfig.json  README.md']);
                break;
            case 'status':
                setTerminalLines([...newLines, `VM Status: ${workspace.status}`, `Memory: 2.4GB / 4GB`, `CPU: 12%`]);
                break;
            case 'ports':
                setTerminalLines([...newLines, 'Active Ports:', '8080: http://localhost:8080']);
                break;
            default:
                setTerminalLines([...newLines, `bash: command not found: ${cmd}`]);
        }
    }
    setTerminalInput('');
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const handlePause = () => {
    onUpdateStatus(workspace.status === VMStatus.PAUSED ? VMStatus.RUNNING : VMStatus.PAUSED);
  };

  const handleCreateSnapshot = (name: string) => {
    onUpdateStatus(VMStatus.SAVING);
    setShowSnapshotModal(false);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 5;
      setSavingProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setSavingProgress(0);
        onUpdateStatus(VMStatus.RUNNING);
        setSnapshots([{ id: `snap-${Date.now()}`, workspaceId: workspace.id, name, createdAt: 'Just now' }, ...snapshots]);
      }
    }, 100);
  };

  const handleCreatePort = (portNum: number) => {
    if (ports.some(p => p.port === portNum)) return;
    const newPort: Port = {
        port: portNum,
        url: `https://${portNum}-${workspace.id}.grep.ws`,
        status: 'active'
    };
    setPorts([...ports, newPort]);
    setTerminalLines(prev => [...prev, `[net] forwarding port ${portNum} -> ${newPort.url}`]);
  };

  const handleDeletePort = (portNum: number) => {
      setPorts(ports.filter(p => p.port !== portNum));
      setTerminalLines(prev => [...prev, `[net] stopped forwarding port ${portNum}`]);
  };

  return (
    <div className="h-full flex flex-col bg-[#080808]">
      {/* Premium Top Bar */}
      <header className="h-16 bg-black border-b border-zinc-900 flex items-center justify-between px-6 shrink-0 relative z-40">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="p-2.5 hover:bg-zinc-900 rounded-xl transition-all text-zinc-500 hover:text-white group">
            <Icons.ChevronRight className="rotate-180 w-5 h-5 group-hover:scale-110" />
          </button>
          
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 group cursor-pointer">
                <Icons.Github className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
             </div>
             <div className="space-y-0.5">
                <div className="flex items-center gap-3">
                   <span className="text-sm font-black text-white tracking-tight uppercase">{workspace.name}</span>
                   <div className="h-5 px-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${workspace.status === VMStatus.RUNNING ? 'bg-emerald-500 glow-emerald' : workspace.status === VMStatus.PAUSED ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`} />
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">{workspace.status}</span>
                   </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-600 block tabular-nums">{workspace.repo} : {workspace.branch}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {workspace.status === VMStatus.SAVING && (
            <div className="flex items-center gap-4 px-5 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl mr-2">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest tabular-nums">Saving Image: {savingProgress}%</span>
               <div className="w-24 h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div initial={{width: 0}} animate={{width: `${savingProgress}%`}} className="h-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
               </div>
            </div>
          )}

          <div className="flex items-center p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <button 
              onClick={handlePause}
              disabled={workspace.status === VMStatus.SAVING}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${workspace.status === VMStatus.PAUSED ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-100'} disabled:opacity-50`}
            >
              {workspace.status === VMStatus.PAUSED ? <Icons.Play className="w-4 h-4" /> : <Icons.Pause className="w-4 h-4" />}
              {workspace.status === VMStatus.PAUSED ? 'Resume' : 'Hibernate'}
            </button>
            <button 
              onClick={() => setShowSnapshotModal(true)}
              disabled={workspace.status === VMStatus.PAUSED || workspace.status === VMStatus.SAVING}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-all disabled:opacity-50"
            >
              <Icons.Save className="w-4 h-4" />
              Capture
            </button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
          >
            <Icons.Share className="w-4 h-4" />
            Share
          </motion.button>
          
          <div className="h-10 w-px bg-zinc-900 mx-4" />
          
          <div className="flex items-center gap-3">
             <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[11px] font-black">JD</div>
                {workspace.isShared && <div className="w-9 h-9 rounded-full bg-indigo-600 border-2 border-black flex items-center justify-center text-[11px] font-black">AK</div>}
             </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className="w-16 bg-[#050505] flex flex-col items-center py-8 gap-10 shrink-0 border-r border-zinc-900/50 relative z-30">
          {[
            { id: 'explorer', icon: Icons.Files },
            { id: 'search', icon: Icons.Search },
            { id: 'git', icon: Icons.Git },
            { id: 'snapshots', icon: Icons.Save },
            { id: 'ports', icon: Icons.ExternalLink }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`p-1 transition-all relative group ${activeTab === item.id ? 'text-indigo-400 scale-110' : 'text-zinc-700 hover:text-zinc-400'}`}
            >
              <item.icon className="w-6 h-6" />
              {activeTab === item.id && (
                <motion.div layoutId="act-bar" className="absolute -left-5 top-[-10px] bottom-[-10px] w-1 bg-indigo-500 rounded-full glow-indigo shadow-indigo-500/50" />
              )}
            </button>
          ))}
          <button className="mt-auto text-zinc-700 hover:text-zinc-400 p-1">
            <Icons.Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic Sidebar */}
        <div className="w-80 bg-[#0c0c0c] border-r border-zinc-900/50 flex flex-col shrink-0 relative z-20">
          <div className="p-6 uppercase text-[10px] font-black text-zinc-600 tracking-[0.3em] flex justify-between items-center">
            <span>{activeTab === 'snapshots' ? 'Snapshot Vault' : activeTab === 'ports' ? 'Network Ports' : 'Project Node'}</span>
            <Icons.More className="w-4 h-4 cursor-pointer hover:text-zinc-300" />
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {activeTab === 'snapshots' ? (
              <div className="flex flex-col gap-3">
                {snapshots.map(snap => (
                  <motion.div 
                    initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}}
                    key={snap.id} 
                    className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-zinc-100 tracking-tight group-hover:text-indigo-400">{snap.name}</span>
                      <Icons.Play className="w-3.5 h-3.5 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest tabular-nums">{snap.createdAt}</div>
                  </motion.div>
                ))}
              </div>
            ) : activeTab === 'ports' ? (
              <div className="flex flex-col gap-3">
                 <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <div className="flex gap-2 mb-3">
                        <input type="number" id="port-input" placeholder="3000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50" onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = parseInt(e.currentTarget.value);
                                if (val) {
                                    handleCreatePort(val);
                                    e.currentTarget.value = '';
                                }
                            }
                        }} />
                        <button onClick={() => {
                            const input = document.getElementById('port-input') as HTMLInputElement;
                            const val = parseInt(input.value);
                            if (val) {
                                handleCreatePort(val);
                                input.value = '';
                            }
                        }} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-colors">
                            <Icons.Check className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
                 {ports.map(port => (
                   <div key={port.port} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] group">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-white font-mono">{port.port}</span>
                         <div className="flex gap-2">
                            <a href={port.url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-indigo-400 transition-colors"><Icons.ExternalLink className="w-3.5 h-3.5" /></a>
                            <button onClick={() => handleDeletePort(port.port)} className="text-zinc-500 hover:text-red-400 transition-colors"><Icons.Trash className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                      <div className="text-[10px] text-zinc-600 truncate font-mono">{port.url}</div>
                      <div className="mt-2 flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-emerald" />
                         <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Active</span>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <FileItem name="src" isOpen={true} isFolder={true} />
                <FileItem name="components" isOpen={true} isFolder={true} depth={1} />
                <FileItem name="App.tsx" isActive={true} depth={2} />
                <FileItem name="Workspace.tsx" depth={2} />
                <FileItem name="types.ts" depth={1} />
                <FileItem name="config" isFolder={true} />
                <FileItem name="package.json" />
              </div>
            )}
          </div>
        </div>

        {/* Editor Engine Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-black z-10">
          {/* Editor Tabs */}
          <div className="h-12 bg-[#0c0c0c] flex items-center border-b border-zinc-900/50">
             <div className="h-full px-6 bg-black border-r border-zinc-900/50 text-[11px] font-black tracking-tight flex items-center gap-4 text-white border-t-2 border-t-indigo-500 relative">
                <span className="text-indigo-400">App.tsx</span>
                <Icons.X className="w-3.5 h-3.5 text-zinc-700 hover:text-white cursor-pointer transition-colors" />
             </div>
             <div className="h-full px-6 border-r border-zinc-900/50 text-[11px] font-bold flex items-center gap-3 text-zinc-600 hover:bg-white/5 cursor-pointer transition-colors">
                <span>types.ts</span>
             </div>
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden group/editor">
             <div className="flex-1 relative bg-[#1e1e1e]">
                {/* Embed VS Code Server via Iframe */}
                <iframe
                    src={`${config.API_ENDPOINT}/?folder=/home/coder/project`}
                    className="w-full h-full border-none"
                    title="VS Code Editor"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />

                <AnimatePresence>
                  {workspace.status === VMStatus.PAUSED && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-[30px] flex flex-col items-center justify-center z-50 transition-all duration-1000"
                    >
                        <motion.div 
                          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                          className="glass p-16 rounded-[4rem] flex flex-col items-center gap-10 shadow-3xl max-w-lg border-white/10"
                        >
                          <div className="relative">
                            <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/30 relative">
                              <Icons.Pause className="w-10 h-10" />
                            </div>
                            <motion.div 
                              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }} 
                              transition={{ repeat: Infinity, duration: 2.5 }}
                              className="absolute inset-0 bg-amber-500 rounded-full" 
                            />
                          </div>
                          <div className="text-center space-y-3">
                            <h3 className="text-4xl font-black tracking-tighter text-white">Node Hibernated</h3>
                            <p className="text-zinc-500 text-sm font-semibold leading-relaxed max-w-[280px] mx-auto">
                              Compute resources are suspended to save costs. 
                              Local state is cached in persistent storage.
                            </p>
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                            onClick={handlePause}
                            className="w-full bg-white text-black py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-zinc-200 transition-all"
                          >
                            Wake Up Node
                          </motion.button>
                        </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Pro Terminal Engine */}
             <div className="h-64 bg-black border-t border-zinc-900/80 flex flex-col shrink-0 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <div className="h-12 px-8 flex items-center gap-10 border-b border-zinc-900/50 bg-[#080808]">
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] border-b-2 border-indigo-500 h-full flex items-center relative">
                      Terminal
                   </span>
                   <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] hover:text-zinc-300 cursor-pointer h-full flex items-center transition-colors">Output</span>
                   <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] hover:text-zinc-300 cursor-pointer h-full flex items-center transition-colors">Port Proxy</span>
                   <div className="ml-auto flex items-center gap-6">
                      <div className="flex items-center gap-2.5">
                         <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`} />
                         <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">WS_BRIDGE: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                      </div>
                      <Icons.Trash className="w-4 h-4 text-zinc-800 hover:text-zinc-400 cursor-pointer transition-colors" />
                   </div>
                </div>
                <div ref={terminalRef} className="flex-1 p-6 font-mono text-[11px] overflow-y-auto scroll-smooth">
                   {terminalLines.map((line, idx) => (
                     <div key={idx} className={`${line.includes('✓') || line.includes('[OK]') ? 'text-emerald-500' : 'text-zinc-600'} mb-1.5 opacity-80 hover:opacity-100 transition-opacity`}>
                       <span className="mr-3 opacity-30 select-none">{idx + 1}</span>
                       {line}
                     </div>
                   ))}
                   <div className="flex items-center gap-3 mt-4">
                     <span className="text-indigo-500 font-black tracking-tight select-none">cloud-node@grep:~$</span>
                     <form onSubmit={handleTerminalSubmit} className="flex-1">
                        <input
                            className="bg-transparent text-zinc-300 focus:outline-none w-full font-mono text-[11px]"
                            value={terminalInput}
                            onChange={e => setTerminalInput(e.target.value)}
                            autoFocus
                            spellCheck={false}
                        />
                     </form>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Enterprise Status Footer */}
      <footer className="h-8 bg-indigo-600 flex items-center px-6 justify-between text-[10px] shrink-0 font-black tracking-widest uppercase">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-lg cursor-pointer transition-all">
            <Icons.Git className="w-4 h-4" />
            <span>branch: main*</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Icons.Check className="w-4 h-4" />
            <span>Health Check: Nominal</span>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <span className="text-white/60">Ln 24, Col 12</span>
          <span className="text-white/60">UTF-8</span>
          <div className="flex items-center gap-3 bg-indigo-900/40 px-3 py-1 rounded-lg border border-white/10 shadow-inner">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
             <span>Tunnel Secure</span>
          </div>
        </div>
      </footer>

      {showSnapshotModal && (
        <SnapshotModal onCancel={() => setShowSnapshotModal(false)} onConfirm={handleCreateSnapshot} />
      )}
      {showShareModal && (
        <ShareModal onCancel={() => setShowShareModal(false)} workspaceId={workspace.id} snapshots={snapshots} />
      )}
    </div>
  );
};

const FileItem: React.FC<{ name: string; isFolder?: boolean; isOpen?: boolean; isActive?: boolean; depth?: number }> = ({ name, isFolder, isOpen, isActive, depth = 0 }) => (
  <div 
    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] cursor-pointer transition-all group ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-600 hover:bg-white/5 hover:text-zinc-300'}`}
    style={{ marginLeft: `${depth * 14}px` }}
  >
    {isFolder ? <Icons.ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''} text-zinc-700 group-hover:text-zinc-400`} /> : <div className="w-3.5" />}
    <span className={`${isFolder ? 'font-black uppercase tracking-widest text-[10px]' : 'font-medium'} transition-colors`}>{name}</span>
  </div>
);

const SnapshotModal: React.FC<{ onCancel: () => void; onConfirm: (name: string) => void }> = ({ onCancel, onConfirm }) => {
  const [name, setName] = useState(`SNAPSHOT_${new Date().getTime().toString().slice(-4)}`);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[50px] z-[200] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-lg rounded-[3.5rem] p-12 shadow-3xl overflow-hidden relative border-white/10"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 blur-[60px] rounded-full" />
        <h3 className="text-4xl font-black mb-4 tracking-tighter text-white">Capture State</h3>
        <p className="text-zinc-500 text-sm mb-12 font-semibold leading-relaxed">Snapshotting saves an immutable copy of the VM's disk and memory. You can revert to this checkpoint instantly.</p>
        
        <div className="mb-12 group">
          <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 group-focus-within:text-indigo-400 transition-colors">Identity Tag</label>
          <input 
            autoFocus
            className="w-full bg-zinc-950 border border-zinc-900 rounded-[1.5rem] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-black placeholder:text-zinc-800 tracking-tight"
            value={name}
            placeholder="e.g. READY_TO_MERGE"
            onChange={e => setName(e.target.value)}
          />
        </div>
        
        <div className="flex gap-5">
          <button onClick={onCancel} className="flex-1 py-5 rounded-[1.5rem] border border-zinc-900 text-zinc-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest">Abort</button>
          <button onClick={() => onConfirm(name)} className="flex-1 py-5 rounded-[1.5rem] bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20">Write Block</button>
        </div>
      </motion.div>
    </div>
  );
};

const ShareModal: React.FC<{ onCancel: () => void; workspaceId: string; snapshots: Snapshot[] }> = ({ onCancel, workspaceId, snapshots }) => {
  const [mode, setMode] = useState<'live' | 'snapshot'>('live');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('latest');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[50px] z-[200] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-2xl rounded-[3.5rem] p-12 shadow-3xl relative border-white/10"
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-4xl font-black mb-2 tracking-tighter text-white">Collaborators</h3>
            <p className="text-zinc-500 text-sm font-semibold tracking-tight">Provision access to this secure cloud node.</p>
          </div>
          <button onClick={onCancel} className="p-3 hover:bg-white/5 rounded-full text-zinc-700 hover:text-white transition-all">
            <Icons.X className="w-8 h-8" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
           <button 
            onClick={() => setMode('live')}
            className={`p-8 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group ${mode === 'live' ? 'bg-indigo-600/10 border-indigo-500/50 shadow-xl shadow-indigo-500/10' : 'bg-zinc-950/50 border-zinc-900 text-zinc-600 hover:border-zinc-800'}`}
           >
              <div className={`w-3 h-3 rounded-full mb-4 ${mode === 'live' ? 'bg-indigo-400 glow-indigo shadow-indigo-500/50' : 'bg-zinc-800'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${mode === 'live' ? 'text-indigo-400' : 'text-zinc-600'}`}>Real-Time Node</span>
              <p className="text-[11px] text-zinc-500 leading-tight font-medium">Collaborators share the same active memory space and CPU cycles.</p>
           </button>
           <button 
            onClick={() => setMode('snapshot')}
            className={`p-8 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group ${mode === 'snapshot' ? 'bg-indigo-600/10 border-indigo-500/50 shadow-xl shadow-indigo-500/10' : 'bg-zinc-950/50 border-zinc-900 text-zinc-600 hover:border-zinc-800'}`}
           >
              <div className={`w-3 h-3 rounded-full mb-4 ${mode === 'snapshot' ? 'bg-indigo-400 glow-indigo shadow-indigo-500/50' : 'bg-zinc-800'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${mode === 'snapshot' ? 'text-indigo-400' : 'text-zinc-600'}`}>Snapshot Fork</span>
              <p className="text-[11px] text-zinc-500 leading-tight font-medium">Recipients receive an isolated copy based on current filesystem state.</p>
           </button>
        </div>

        <AnimatePresence>
            {mode === 'snapshot' && (
                <motion.div
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }} animate={{ height: 'auto', opacity: 1, marginBottom: 32 }} exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                        <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Select Checkpoint</label>
                        <select
                            value={selectedSnapshotId}
                            onChange={(e) => setSelectedSnapshotId(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        >
                            <option value="latest">Latest State (Current)</option>
                            {snapshots.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.createdAt})</option>
                            ))}
                        </select>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="space-y-8">
           <div className="group">
              <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-4 group-focus-within:text-indigo-400 transition-colors">Direct Invite</label>
              <div className="flex gap-4">
                <input 
                  placeholder="collaborator@engineering.dev"
                  className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/40 font-bold placeholder:text-zinc-800"
                />
                <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">Grant</button>
              </div>
           </div>
           <div className="bg-black/50 p-6 rounded-[2rem] border border-white/5 relative group">
              <label className="block text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-3 group-hover:text-zinc-600 transition-colors">External Share Endpoint</label>
              <div className="flex gap-6 items-center">
                <input 
                  readOnly
                  value={`https://grep.ws/node/${workspaceId}`}
                  className="flex-1 bg-transparent text-indigo-400/50 text-[12px] font-mono outline-none truncate"
                />
                <button className="text-[10px] font-black uppercase tracking-widest text-white hover:text-indigo-400 transition-colors underline underline-offset-8">Copy URL</button>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkspaceEditor;
