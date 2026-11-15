import React from 'react';
import { BookOpen, Flame, Award, AlertTriangle, Scale, BarChart3 } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'explore', label: '书库', icon: BookOpen },
    { id: 'new', label: '新书', icon: Flame, badge: '热' },
    { id: 'leaderboards', label: '榜单', icon: Award },
    { id: 'warnings', label: '避坑', icon: AlertTriangle, color: 'text-rose-500' },
    { id: 'comparison', label: '对决', icon: Scale },
    { id: 'analytics', label: '透视', icon: BarChart3 }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 flex items-center justify-around safe-area-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
              isActive
                ? 'text-sky-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'} ${tab.color && !isActive ? tab.color : ''}`} />
              {tab.badge && (
                <span className="absolute -top-1 -right-2 px-1 text-[9px] font-black bg-rose-500 text-white rounded-full leading-tight">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-sky-600 mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
