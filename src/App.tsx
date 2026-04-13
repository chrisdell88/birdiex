import { useState } from 'react';
import type { TabId, DataSet } from './types';
import { roundOnlyData, cumulativeData } from './data/mastersR1Data';
import Header from './components/Header';
import Footer from './components/Footer';
import RankingsTable from './components/RankingsTable';
import MatchupsView from './components/MatchupsView';
import MethodologyPage from './components/MethodologyPage';
import ResultsPage from './components/ResultsPage';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('rankings');
  const [dataSet, setDataSet] = useState<DataSet>('round');

  // Toggle between R4-only X Scores and R1+R2+R3+R4 Cumulative X Scores
  const activeData = dataSet === 'round' ? roundOnlyData : cumulativeData;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dataSet={dataSet}
        onDataSetChange={setDataSet}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeTab === 'rankings' && <RankingsTable data={activeData} />}
        {activeTab === 'matchups' && <MatchupsView data={activeData} />}
        {activeTab === 'methodology' && <MethodologyPage />}
        {activeTab === 'results' && <ResultsPage />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
