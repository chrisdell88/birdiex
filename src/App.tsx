import { useState } from 'react';
import type { TabId, DataSet } from './types';
import { roundOnlyData, cumulativeData } from './data/pgaChampPreData';
import Header from './components/Header';
import Footer from './components/Footer';
import RankingsTable from './components/RankingsTable';
import MatchupsView from './components/MatchupsView';
import MethodologyPage from './components/MethodologyPage';
import ResultsPage from './components/ResultsPage';
import OddsTablePage from './components/OddsTablePage';
import PreTournamentPlaceholder from './components/PreTournamentPlaceholder';
import { CURRENT_TOURNAMENT } from './tournament';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('rankings');
  const [dataSet, setDataSet] = useState<DataSet>('round');

  // Active dataset: until live rounds are played, round = cumulative (both pre-tournament).
  const activeData = dataSet === 'round' ? roundOnlyData : cumulativeData;
  const phase = CURRENT_TOURNAMENT.phase;

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
        {activeTab === 'matchups' &&
          (phase === 'pre' ? (
            <PreTournamentPlaceholder label="Matchups" />
          ) : (
            <MatchupsView data={activeData} />
          ))}
        {activeTab === 'odds' &&
          (phase === 'pre' ? (
            <PreTournamentPlaceholder label="Odds" />
          ) : (
            <OddsTablePage data={activeData} />
          ))}
        {activeTab === 'methodology' && <MethodologyPage onNavigateToResults={() => setActiveTab('results')} />}
        {activeTab === 'results' && <ResultsPage />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
