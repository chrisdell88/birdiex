import { useState } from 'react';
import type { TabId, DataSet, TournamentId } from './types';
import { roundOnlyData as mastersRound, cumulativeData as mastersCumulative } from './data/mastersR1Data';
import { roundOnlyData as heritageRound, cumulativeData as heritageCumulative } from './data/rbcHeritageR1Data';
import Header from './components/Header';
import Footer from './components/Footer';
import RankingsTable from './components/RankingsTable';
import MatchupsView from './components/MatchupsView';
import MethodologyPage from './components/MethodologyPage';
import ResultsPage from './components/ResultsPage';
import OddsTablePage from './components/OddsTablePage';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('rankings');
  const [dataSet, setDataSet] = useState<DataSet>('round');
  const [tournament, setTournament] = useState<TournamentId>('heritage');

  const roundData = tournament === 'masters' ? mastersRound : heritageRound;
  const cumulativeData = tournament === 'masters' ? mastersCumulative : heritageCumulative;
  const activeData = dataSet === 'round' ? roundData : cumulativeData;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dataSet={dataSet}
        onDataSetChange={setDataSet}
        tournament={tournament}
        onTournamentChange={setTournament}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeTab === 'rankings' && <RankingsTable data={activeData} />}
        {activeTab === 'matchups' && <MatchupsView data={activeData} tournament={tournament} />}
        {activeTab === 'odds' && <OddsTablePage data={activeData} tournament={tournament} />}
        {activeTab === 'methodology' && <MethodologyPage onNavigateToResults={() => setActiveTab('results')} tournament={tournament} />}
        {activeTab === 'results' && <ResultsPage tournament={tournament} />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
