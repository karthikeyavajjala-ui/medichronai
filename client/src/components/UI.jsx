import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

export const Card = ({ children, className = "", hover = false, ...props }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all' : ''} ${className}`} {...props}>
    {children}
  </div>
);

export const Button = ({ children, variant = 'primary', size = 'md', loading, className = "", ...props }) => {
  const variants = {
    primary: 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm',
    secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700',
    teal: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-sm',
    violet: 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-sm rounded-xl'
  };
  return (
    <button className={`inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
    <input className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-slate-600 transition ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-700'} ${className}`} {...props} />
    {error && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export const Select = ({ label, error, children, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
    <select className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-slate-600 transition ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} ${className}`} {...props}>
      {children}
    </select>
    {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

export const Textarea = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
    <textarea className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-slate-600 transition resize-none ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} ${className}`} {...props} />
    {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

export const Badge = ({ children, variant = 'default', className = "" }) => {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${variants[variant]} ${className}`}>{children}</span>;
};

export const Alert = ({ type = 'info', title, children, className = "" }) => {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
  };
  const Icons = { info: Info, success: CheckCircle, warning: AlertCircle, error: AlertCircle };
  const Icon = Icons[type];
  return (
    <div className={`rounded-xl border p-4 flex gap-3 ${styles[type]} ${className}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="space-y-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
};

export const Skeleton = ({ className = "" }) => <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;

export const ProcessingSteps = ({ current }) => {
  const steps = ['Uploading', 'Extracting', 'Analyzing', 'Structuring', 'Building Timeline', 'Completed'];
  const statusMap = { UPLOADED: 0, EXTRACTING: 1, ANALYZING: 2, STRUCTURING: 3, BUILDING_TIMELINE: 4, COMPLETED: 5 };
  const currentIdx = statusMap[current] ?? 0;
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${idx <= currentIdx ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{idx < currentIdx ? '✓' : idx + 1}</div>
          {idx < steps.length - 1 && <div className={`w-6 h-0.5 shrink-0 ${idx < currentIdx ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// Advanced Markdown Renderer for AI Assistant
export const MarkdownRenderer = ({ content }) => {
  const renderContent = (text) => {
    if (!text) return null;
    
    // Split by lines
    const lines = text.split('\n');
    const elements = [];
    let inList = false;
    let listItems = [];
    let inTable = false;
    let tableRows = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-3 ml-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
            <table className="min-w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800">
                {tableRows[0] && (
                  <tr>
                    {tableRows[0].split('|').filter(Boolean).map((cell, i) => (
                      <th key={i} className="px-3 py-2 text-left font-semibold border-b dark:border-slate-700">{cell.trim()}</th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {row.split('|').filter(Boolean).map((cell, ci) => (
                      <td key={ci} className="px-3 py-2" dangerouslySetInnerHTML={{ __html: formatInline(cell.trim()) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        flushList();
        flushTable();
        elements.push(<div key={`space-${idx}`} className="h-2" />);
        return;
      }

      // Table detection
      if (trimmed.includes('|') && trimmed.split('|').length > 2) {
        if (!inTable) flushList();
        inTable = true;
        if (!trimmed.match(/^[\s|\-]+$/)) tableRows.push(trimmed);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(<h3 key={idx} className="text-base font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(4)) }} />);
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(<h2 key={idx} className="text-lg font-bold mt-5 mb-3" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(3)) }} />);
      } else if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(<h1 key={idx} className="text-xl font-bold mt-5 mb-3" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />);
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
        flushList();
        elements.push(<p key={idx} className="font-bold text-sm mt-3 mb-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />);
      }
      // List items
      else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        inList = true;
        listItems.push(trimmed.slice(2));
      } else if (/^\d+\.\s/.test(trimmed)) {
        inList = true;
        listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      }
      // Regular paragraph
      else {
        flushList();
        if (trimmed.startsWith('|')) {
          // Already handled as table
        } else {
          elements.push(<p key={idx} className="text-sm leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />);
        }
      }
    });

    flushList();
    flushTable();

    return elements;
  };

  const formatInline = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\[([^\]]+)\]/g, '<span class="font-medium">$1</span>');
  };

  return <div className="prose prose-sm dark:prose-invert max-w-none">{renderContent(content)}</div>;
};

// Timeline Graph Component
export const TimelineGraph = ({ events, labResults = [] }) => {
  // Group lab results by test name for trend chart
  const labTrends = {};
  labResults.forEach(lab => {
    if (!labTrends[lab.testName]) labTrends[lab.testName] = [];
    labTrends[lab.testName].push(lab);
  });

  // Sort trends by date
  Object.keys(labTrends).forEach(test => {
    labTrends[test].sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
  });

  const getEventIcon = (type) => {
    const icons = {
      'Lab Test': '🧪',
      'Diagnosis': '🩺',
      'Prescription': '💊',
      'Consultation': '👨‍⚕️',
      'Vital Signs': '❤️',
      'Imaging': '🖼️',
      'Procedure': '⚕️'
    };
    return icons[type] || '📋';
  };

  const getEventColor = (type) => {
    const colors = {
      'Lab Test': 'from-blue-500 to-cyan-500',
      'Diagnosis': 'from-amber-500 to-orange-500',
      'Prescription': 'from-emerald-500 to-teal-500',
      'Consultation': 'from-violet-500 to-purple-500',
      'Vital Signs': 'from-red-500 to-pink-500',
      'Imaging': 'from-indigo-500 to-blue-500'
    };
    return colors[type] || 'from-slate-500 to-slate-600';
  };

  return (
    <div className="space-y-8">
      {/* Visual Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-200 via-cyan-200 to-violet-200 dark:from-teal-800 dark:via-cyan-800 dark:to-violet-800 rounded-full hidden sm:block" />
        
        <div className="space-y-6">
          {events.map((group, groupIdx) => (
            <div key={group.date} className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 flex flex-col items-center justify-center shadow-lg z-10 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(group.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-xl font-bold leading-none">{new Date(group.date).getDate()}</span>
                  <span className="text-[10px]">{new Date(group.date).getFullYear()}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{new Date(group.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{group.events.length} medical events</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Timeline</span>
                </div>
              </div>
              
              <div className="sm:ml-20 space-y-4">
                {group.events.map((evt, evtIdx) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIdx * 0.1) + (evtIdx * 0.05) }}
                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b rounded-l-2xl opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to bottom, var(--tw-gradient-stops))` }} />
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getEventColor(evt.eventType)} rounded-l-2xl`} />
                    
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getEventColor(evt.eventType)} flex items-center justify-center text-white shadow-md shrink-0 text-lg`}>
                        {getEventIcon(evt.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r ${getEventColor(evt.eventType)} text-white shadow-sm`}>
                            {evt.eventType}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            🕐 {new Date(evt.eventDate).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${evt.verificationStatus === 'DOCTOR_VERIFIED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'}`}>
                            {evt.verificationStatus === 'DOCTOR_VERIFIED' ? '✓ Doctor Verified' : '🤖 AI Extracted'}
                          </span>
                          {evt.confidence && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                              {Math.round(evt.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed mt-2">
                          {evt.description}
                        </p>
                        
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-2.5 py-1 rounded-full">
                            <span>📄</span>
                            <span className="font-medium">{evt.sourceReference}</span>
                          </span>
                          {evt.document && (
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <span>•</span>
                              <span className="truncate max-w-[150px]">{evt.document.originalName}</span>
                            </span>
                          )}
                          {evt.pageNumber && (
                            <span className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-mono text-[11px] border border-teal-200 dark:border-teal-800">
                              Page {evt.pageNumber}
                            </span>
                          )}
                        </div>

                        {evt.relationships && evt.relationships.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Related Events</p>
                            {evt.relationships.slice(0, 2).map((rel, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[11px] bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border dark:border-slate-700 rounded-xl p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${rel.isDocumented ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
                                  {rel.isDocumented ? '📋 Documented' : '🤖 AI Interpretation'}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                  <span className="font-semibold">{rel.type.replace(/_/g, ' ')}:</span> {rel.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lab Trends Graph */}
      {Object.keys(labTrends).length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm">📈</span>
            Lab Results Trend — Visual Progression
          </h3>
          
          <div className="grid gap-6">
            {Object.entries(labTrends).slice(0, 4).map(([testName, results]) => {
              if (results.length < 2) return null;
              const sorted = [...results].sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
              const values = sorted.map(r => r.numericValue).filter(v => v != null);
              if (values.length < 2) return null;
              
              const min = Math.min(...values);
              const max = Math.max(...values);
              const range = max - min || 1;
              
              return (
                <div key={testName} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{testName}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{results.length} readings</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${sorted[sorted.length-1].status === 'Normal' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                        {sorted[sorted.length-1].status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative h-20 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 p-2 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`gradient-${testName}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <line x1="0" y1="15" x2="300" y2="15" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" className="dark:opacity-20" />
                      <line x1="0" y1="30" x2="300" y2="30" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" className="dark:opacity-20" />
                      <line x1="0" y1="45" x2="300" y2="45" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" className="dark:opacity-20" />
                      
                      {/* Area */}
                      <path
                        d={`M 0,60 ${sorted.map((r, i) => {
                          const x = (i / (sorted.length - 1)) * 280 + 10;
                          const y = 50 - ((r.numericValue - min) / range) * 40;
                          return `L ${x},${y}`;
                        }).join(' ')} L 290,60 Z`}
                        fill={`url(#gradient-${testName})`}
                      />
                      
                      {/* Line */}
                      <path
                        d={`M ${sorted.map((r, i) => {
                          const x = (i / (sorted.length - 1)) * 280 + 10;
                          const y = 50 - ((r.numericValue - min) / range) * 40;
                          return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                        }).join(' ')}`}
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Points */}
                      {sorted.map((r, i) => {
                        const x = (i / (sorted.length - 1)) * 280 + 10;
                        const y = 50 - ((r.numericValue - min) / range) * 40;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#0d9488" stroke="white" strokeWidth="2" />
                            <circle cx={x} cy={y} r="6" fill="#0d9488" opacity="0.2" />
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* Value labels */}
                    <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>{sorted[0]?.result} {sorted[0]?.unit}</span>
                      <span>{sorted[sorted.length-1]?.result} {sorted[sorted.length-1]?.unit}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {new Date(sorted[0].testDate).toLocaleDateString()} → {new Date(sorted[sorted.length-1].testDate).toLocaleDateString()}
                    </span>
                    <span className={`font-bold ${sorted[sorted.length-1].numericValue > sorted[0].numericValue ? 'text-emerald-600 dark:text-emerald-400' : sorted[sorted.length-1].numericValue < sorted[0].numericValue ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {sorted[sorted.length-1].numericValue > sorted[0].numericValue ? '↗ Increased' : sorted[sorted.length-1].numericValue < sorted[0].numericValue ? '↘ Decreased' : '→ Unchanged'} by {Math.abs(sorted[sorted.length-1].numericValue - sorted[0].numericValue).toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
