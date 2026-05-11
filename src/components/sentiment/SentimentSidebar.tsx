"use client";

import { useUIStore } from "@/store/uiStore";
import { SentimentFeed } from "./SentimentFeed";
import { PostForm }      from "./PostForm";
import { QAPanel }       from "@/components/qa/QAPanel";

const TABS = [
  { id: "sentiment" as const, label: "Sentiment" },
  { id: "post"      as const, label: "Post"      },
  { id: "discuss"   as const, label: "Q&A"       },
];

export function SentimentSidebar() {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <aside className="bg-crypto-bg3 border-l border-crypto-border flex flex-col overflow-hidden lg:max-h-[calc(100vh-124px)] lg:sticky lg:top-[124px]">
      {/* Tabs */}
      <div className="flex border-b border-crypto-border bg-crypto-bg2 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-3.5 font-mono text-[8px] tracking-[0.1em] uppercase transition-all
              border-b-2 bg-none border-none cursor-pointer
              ${activeTab === tab.id
                ? "text-gold border-b-gold"
                : "text-crypto-text3 border-b-transparent hover:text-crypto-text2"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {activeTab === "sentiment" && <SentimentFeed />}
        {activeTab === "post"      && <PostForm />}
        {activeTab === "discuss"   && <QAPanel inline />}
      </div>
    </aside>
  );
}
