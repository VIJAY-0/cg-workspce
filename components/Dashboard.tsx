
import React, { useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Workspace, VMStatus } from '../types';
import { Icons, COLORS } from '../constants';

interface DashboardProps {
  workspaces: Workspace[];
  onOpen: (ws: Workspace) => void;
  onCreate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ workspaces, onOpen, onCreate }) => {
  const [filter, setFilter] = useState('all');

  const filteredWorkspaces = workspaces.filter(ws => {
    if (filter === 'all') return true;
    if (filter === 'running') return ws.status === VMStatus.RUNNING;
    if (filter === 'shared') return ws.isShared;
    return true;
  });

  return (
    <div className="h-full max-w-7xl mx-auto px-8 py-16 flex flex-col gap-12 overflow-y-auto">
      <header className="flex justify-between items-center relative">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center glow-indigo shadow-lg rotate-3 group cursor-default">
                <Icons.Layout className="text-white w-6 h-6 transition-transform group-hover:scale-110" />
             </div>
             <h1 className="text-5xl font-extrabold tracking-tighter text-white">CloudGrep</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium tracking-wide flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE CLOUD NODES IN US-EAST-1
          </p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreate}
          className="relative group px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
            <span className="text-lg leading-none">+</span>
            Deploy Node
          </span>
        </motion.button>
      </header>

      <div className="space-y-8">
        <LayoutGroup>
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
            <div className="flex items-center gap-10">
              {['all', 'running', 'shared'].map((f) => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`pb-4 px-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${filter === f ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {f}
                  {filter === f && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500 glow-indigo shadow-indigo-500/50" 
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter tabular-nums">
              Session Load: 12% | Network: 240ms
            </div>
          </div>
        </LayoutGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWorkspaces.map((ws, idx) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, ease: "easeOut" }}
            >
              <WorkspaceCard workspace={ws} onClick={() => onOpen(ws)} />
            </motion.div>
          ))}
          
          <motion.div 
             whileHover={{ scale: 1.01, borderColor: "rgba(99, 102, 241, 0.3)" }}
             onClick={onCreate}
             className="border-2 border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-zinc-700 hover:text-indigo-400/80 cursor-pointer transition-all bg-zinc-900/5 group"
          >
             <div className="w-16 h-16 rounded-3xl border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-indigo-500/50 transition-colors">
                <span className="text-4xl font-light">+</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Allocate Resource</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const WorkspaceCard: React.FC<{ workspace: Workspace; onClick: () => void }> = ({ workspace, onClick }) => {
  const getStatusColor = (status: VMStatus) => {
    switch (status) {
      case VMStatus.RUNNING: return 'bg-emerald-500 glow-emerald';
      case VMStatus.PAUSED: return 'bg-amber-500';
      case VMStatus.SAVING: return 'bg-indigo-500 animate-pulse';
      case VMStatus.STARTING: return 'bg-blue-500 animate-pulse';
      default: return 'bg-zinc-700';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative glass rounded-[2.5rem] p-8 cursor-pointer transition-all hover:translate-y-[-4px] hover:border-indigo-500/40 overflow-hidden shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 transition-opacity opacity-0 group-hover:opacity-100" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center group-hover:border-indigo-500/40 transition-all duration-500 group-hover:scale-110">
            <Icons.Github className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-white group-hover:text-indigo-400 leading-none mb-1 transition-colors">{workspace.name}</h3>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tighter opacity-80">{workspace.repo}</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full text-[9px] font-black tracking-widest flex items-center gap-2 bg-black border border-zinc-800/80">
          <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(workspace.status)}`} />
          <span className="uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">{workspace.status}</span>
        </div>
      </div>

      <div className="space-y-4 mb-8 relative z-10">
         <div className="flex justify-between items-end">
            <div className="space-y-1">
               <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Deployment</span>
               <span className="text-sm text-zinc-200 font-mono font-medium">us-east-1.node-x2</span>
            </div>
            <div className="text-right space-y-1">
               <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Uptime</span>
               <span className="text-sm text-zinc-200 font-mono font-medium">99.98%</span>
            </div>
         </div>
         
         <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: workspace.status === VMStatus.RUNNING ? '100%' : '0%' }}
               className={`h-full ${workspace.status === VMStatus.RUNNING ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            />
         </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-zinc-900 relative z-10">
        <div className="flex items-center gap-3">
           <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-black text-white">JD</div>
              {workspace.isShared && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-black text-white">AK</div>
              )}
           </div>
           {workspace.isShared && (
             <span className="text-[9px] font-black text-indigo-400 tracking-[0.2em] uppercase">SHARED</span>
           )}
        </div>
        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest tabular-nums">
          {workspace.lastActive}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
