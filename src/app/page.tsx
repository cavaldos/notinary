'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Gamepad2, Zap } from 'lucide-react';

const Home: React.FC = () => {
  const router = useRouter();

  const items = [
    { label: "Level 1", path: "/L1" },
    { label: "Level 2", path: "/L2" },
    { label: "Level 3", path: "/L3" },
    { label: "Level 4", path: "/L4" },
  ];

  const quickActions = [
    { label: "Game", path: "/game", icon: Gamepad2, desc: "Play & learn" },
    { label: "Auto", path: "/auto", icon: Zap, desc: "Auto review" },
  ];

  return (
    <div className="h-[80%] flex flex-col items-center justify-center gap-4 p-6">
      {/* Level grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => router.push(item.path)}
            className="bg-white p-6 rounded-lg shadow text-center text-lg font-semibold hover:shadow-lg cursor-pointer"
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Quick actions - tách ra ngoài grid của Level */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {quickActions.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className="bg-white p-6 rounded-lg shadow flex items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Icon size={20} className="shrink-0" />
              <div className="text-left">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom settings */}
      <div className="fixed bottom-2 left-0 right-0 z-50 flex justify-center pb-1">
        <div className="bg-beige text-grey-dark rounded-full px-3 py-1 flex items-center gap-4 shadow-lg transition-all duration-300">
          <button
            onClick={() => router.push('/setting')}
            className="p-1 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;