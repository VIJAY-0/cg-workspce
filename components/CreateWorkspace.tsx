
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../constants';

interface CreateWorkspaceProps {
  onCancel: () => void;
  onCreate: (data: any) => void;
}

const CreateWorkspace: React.FC<CreateWorkspaceProps> = ({ onCancel, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    repo: '',
    branch: 'main',
    source: 'github'
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStep, setLaunchStep] = useState(0);

  const steps = [
    'Provisioning Secure VM Isolation...',
    'Allocating Compute Cluster (t3.medium)...',
    'Cloning Source Repository Artifacts...',
    'Injecting VS Code Core Server...',
    'Opening Gateway Proxy to Node...'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLaunching(true);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLaunchStep(currentStep);
        currentStep++;
      } else {
        clearInterval(interval);
        onCreate(formData);
      }
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-950 px-8 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isLaunching ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            className="w-full max-w-2xl relative z-10"
          >
            <button 
              onClick={onCancel}
              className="mb-10 group flex items-center gap-4 text-zinc-500 hover:text-white transition-all"
            >
              <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-white group-hover:rotate-90 transition-all duration-300">
                 <Icons.X className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cancel Operation</span>
            </button>

            <div className="glass rounded-[3rem] p-12 shadow-2xl overflow-hidden relative border-white/5">
              <div className="mb-12 space-y-4">
                <h2 className="text-5xl font-black tracking-tighter text-white">Deploy Node</h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-md">
                  Provision a dedicated, ephemeral VM cluster with state persistence and live collaboration support.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-2 gap-6">
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, source: 'github'})}
                    className={`flex flex-col items-start gap-6 p-8 rounded-[2rem] border transition-all text-left relative overflow-hidden group ${formData.source === 'github' ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]' : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-500 hover:border-zinc-700'}`}
                   >
                     <Icons.Github className={`w-8 h-8 ${formData.source === 'github' ? 'text-indigo-400' : 'text-zinc-600'}`} />
                     <div>
                       <span className={`font-black uppercase tracking-[0.2em] text-[10px] block mb-2 ${formData.source === 'github' ? 'text-indigo-400' : 'text-zinc-600'}`}>Integrate GitHub</span>
                       <p className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 leading-tight">Sync your repository via managed OAuth2.</p>
                     </div>
                   </button>
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, source: 'url'})}
                    className={`flex flex-col items-start gap-6 p-8 rounded-[2rem] border transition-all text-left relative overflow-hidden group ${formData.source === 'url' ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]' : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-500 hover:border-zinc-700'}`}
                   >
                     <Icons.ExternalLink className={`w-8 h-8 ${formData.source === 'url' ? 'text-indigo-400' : 'text-zinc-600'}`} />
                     <div>
                       <span className={`font-black uppercase tracking-[0.2em] text-[10px] block mb-2 ${formData.source === 'url' ? 'text-indigo-400' : 'text-zinc-600'}`}>Remote Bundle</span>
                       <p className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 leading-tight">Fetch static archives or generic git endpoints.</p>
                     </div>
                   </button>
                </div>

                <div className="space-y-10">
                  <div className="relative group">
                    <label className="absolute -top-3 left-4 px-2 bg-zinc-950 text-[10px] font-black text-zinc-600 uppercase tracking-widest group-focus-within:text-indigo-500 transition-colors">Workspace Title</label>
                    <input 
                      type="text"
                      className="w-full bg-transparent border border-zinc-800 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
                      value={formData.name}
                      placeholder="e.g. cloud-engine-core"
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 relative group">
                      <label className="absolute -top-3 left-4 px-2 bg-zinc-950 text-[10px] font-black text-zinc-600 uppercase tracking-widest group-focus-within:text-indigo-500 transition-colors">Endpoint Path</label>
                      <input 
                        type="text"
                        className="w-full bg-transparent border border-zinc-800 rounded-2xl px-6 py-5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
                        value={formData.repo}
                        placeholder="owner/repo"
                        onChange={e => setFormData({...formData, repo: e.target.value})}
                        required
                      />
                    </div>
                    <div className="relative group">
                      <label className="absolute -top-3 left-4 px-2 bg-zinc-950 text-[10px] font-black text-zinc-600 uppercase tracking-widest group-focus-within:text-indigo-500 transition-colors">Branch</label>
                      <input 
                        type="text"
                        className="w-full bg-transparent border border-zinc-800 rounded-2xl px-6 py-5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                        value={formData.branch}
                        onChange={e => setFormData({...formData, branch: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.4em] text-xs shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_60px_-10px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-4"
                >
                  Confirm Allocation
                  <Icons.ChevronRight className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="launching"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center max-w-xl z-10 space-y-12"
          >
             <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-32 h-32 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Icons.Layout className="w-10 h-10 text-white" />
                </div>
             </div>
             
             <div className="space-y-6 w-full">
               <h3 className="text-4xl font-black tracking-tighter text-white">Booting VM Instance</h3>
               <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${((launchStep + 1) / steps.length) * 100}%` }} 
                    className="h-full bg-indigo-500 glow-indigo"
                  />
               </div>
               <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6 font-mono text-[10px] text-zinc-500 text-left space-y-1 uppercase tracking-widest">
                  {steps.slice(0, launchStep + 1).map((s, i) => (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex gap-4">
                      <span className="text-emerald-500 font-bold">[ OK ]</span>
                      <span>{s}</span>
                    </motion.div>
                  ))}
                  <div className="flex gap-4">
                     <span className="text-indigo-400 font-bold animate-pulse">[ BUSY ]</span>
                     <span className="text-zinc-100">{steps[launchStep]}</span>
                  </div>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateWorkspace;
