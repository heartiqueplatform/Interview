import React from 'react';
import { Calendar, HelpCircle, MessageSquare, User as UserIcon } from 'lucide-react';

export type TabType = 'today' | 'interview' | 'community' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  labels: {
    today: string;
    interview: string;
    community: string;
    profile: string;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, labels }) => {
  const tabs = [
    { id: 'today' as TabType, label: labels.today, Icon: Calendar },
    { id: 'interview' as TabType, label: labels.interview, Icon: HelpCircle },
    { id: 'community' as TabType, label: labels.community, Icon: MessageSquare },
    { id: 'profile' as TabType, label: labels.profile, Icon: UserIcon },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ backgroundColor: 'var(--card)' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 safe-bottom px-2">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-colors"
              style={{
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                backgroundColor: 'transparent',
              }}
            >
              <Icon
                className="w-5 h-5 transition-transform"
                style={{
                  strokeWidth: isActive ? 2.4 : 1.8,
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                }}
              />
              <span
                className="text-[11px] font-medium tracking-tight mt-1 whitespace-nowrap"
                style={{ fontWeight: isActive ? 600 : 500 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
