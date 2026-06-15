
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
const Home: React.FC = () => {
  const router = useRouter();
  const navigate = (path: string) => {
    router.push(path);
  };


  const items = [
    { label: "Level 1", path: "/L1" },
    { label: "Level 2", path: "/L2" },
    { label: "Level 3", path: "/L3" },
    { label: "Level 4", path: "/L4" },
    // { label: "Level 5", path: "/L5" },
  ];



  return (
    <div className="h-[80%] flex flex-col items-center justify-center   p-6">
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className="bg-white p-6 rounded-lg shadow text-center text-lg font-semibold hover:shadow-lg cursor-pointer"
          >
            {item.label}
          </div>
        ))}

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
    </div>
  );
};

export default Home;
