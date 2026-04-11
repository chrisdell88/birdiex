import { useState } from 'react';
import type { TabId } from './types';
import { mastersR1Data } from './data/mastersR1Data';
import Header from './components/Header';
import Footer from './components/Footer';
import RankingsTable from './components/RankingsTable';
import MatchupsView from './components/MatchupsView';
import MethodologyPage from './components/MethodologyPage';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('rankings');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeTab === 'rankings' && <RankingsTable data={mastersR1Data} />}
        {activeTab === 'matchups' && <MatchupsView data={mastersR1Data} />}
        {activeTab === 'methodology' && <MethodologyPage />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
