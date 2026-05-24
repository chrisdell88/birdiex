import { lazy, Suspense, useEffect, useState } from 'react';
import type { TabId, DataSet } from './types';

const VALID_TABS: readonly TabId[] = ['rankings', 'matchups', 'odds', 'simulator', 'methodology', 'results', 'alerts'] as const;

/** Parse the active tab from the URL hash (#matchups → 'matchups'). Falls
 *  back to 'rankings' when the hash is missing or unknown. */
function readTabFromHash(): TabId {
  const raw = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
  return (VALID_TABS as readonly string[]).includes(raw) ? (raw as TabId) : 'rankings';
}
import { currentEvent } from './config/event';
import Header from './components/Header';
import Ticker from './components/Ticker';
import Footer from './components/Footer';
import RankingsTable from './components/RankingsTable';
import MatchupsView from './components/MatchupsView';
import MethodologyPage from './components/MethodologyPage';
import ResultsPage from './components/ResultsPage';
import OddsTablePage from './components/OddsTablePage';
import SimulatorPage from './components/SimulatorPage';

// Lazy — these are the only views that pull in the Supabase client. Keeping
// them out of the main bundle avoids shipping it to every visitor.
const SignupPage = lazy(() => import('./components/SignupPage'));
const UnsubscribePage = lazy(() => import('./components/UnsubscribePage'));
// Private backtest page (#lab). Unlinked from nav — direct URL only.
const BacktestLab = lazy(() => import('./components/BacktestLab'));

function App() {
  // Tab persists across reloads via URL hash (#matchups, #results, etc).
  // Reading from hash on first render means a hard refresh keeps the user
  // on the same tab; sharing a URL with #tab works as deep-link.
  const [activeTab, setActiveTab] = useState<TabId>(() => readTabFromHash());
  // Default to cumulative — historically the stronger signal (see Masters data).
  const [dataSet, setDataSet] = useState<DataSet>('cumulative');

  // Two-way sync: tab change → update hash. Browser back/forward (which
  // fires hashchange) → update tab state.
  useEffect(() => {
    if (window.location.hash.replace(/^#/, '') !== activeTab) {
      // replaceState avoids polluting history on every internal tab click.
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => setActiveTab(readTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Private backtest page — direct URL only (#lab). Never linked from nav.
  // Check hash directly so the page doesn't appear as a normal tab.
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
  if (hash === 'lab') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold tracking-tight text-white">BIRDIE</span>
            <span className="text-2xl font-extrabold tracking-tight text-[#22c55e]">X</span>
            <span className="ml-3 text-[10px] uppercase tracking-wider text-[#737373]">lab</span>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Suspense fallback={<div className="text-center text-sm text-[#a1a1aa] py-16">Loading…</div>}>
            <BacktestLab />
          </Suspense>
        </main>
      </div>
    );
  }

  // Email alert footers link to `/?unsubscribe=<token>` — handle that before
  // rendering the normal app so the link works as a standalone confirmation.
  const unsubscribeToken = new URLSearchParams(window.location.search).get('unsubscribe');
  if (unsubscribeToken) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold tracking-tight text-white">BIRDIE</span>
            <span className="text-2xl font-extrabold tracking-tight text-[#22c55e]">X</span>
          </div>
        </div>
        <Suspense fallback={null}>
          <UnsubscribePage token={unsubscribeToken} />
        </Suspense>
      </div>
    );
  }

  // Toggle between round-only and cumulative X Scores for the current event.
  const activeData =
    dataSet === 'round' ? currentEvent.rankingsRound : currentEvent.rankingsCumulative;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-['Inter',system-ui,sans-serif]">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <Ticker />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* keyed wrapper -> remounts + fades in on every tab switch */}
        <div key={activeTab} className="fade-in">
          {activeTab === 'rankings' && <RankingsTable data={activeData} dataSet={dataSet} onDataSetChange={setDataSet} />}
          {activeTab === 'matchups' && <MatchupsView data={activeData} dataSet={dataSet} onDataSetChange={setDataSet} />}
          {activeTab === 'odds' && <OddsTablePage data={activeData} dataSet={dataSet} onDataSetChange={setDataSet} />}
          {activeTab === 'simulator' && <SimulatorPage />}
          {activeTab === 'methodology' && <MethodologyPage onNavigateToResults={() => setActiveTab('results')} />}
          {activeTab === 'results' && <ResultsPage />}
          {activeTab === 'alerts' && (
            <Suspense fallback={<div className="text-center text-sm text-[#a1a1aa] py-16">Loading…</div>}>
              <SignupPage />
            </Suspense>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
