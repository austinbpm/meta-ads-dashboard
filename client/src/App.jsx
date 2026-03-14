import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { DataProvider, useData } from './DataContext';
import EconomicSummaryBar from './components/EconomicSummaryBar';
import AdTable from './views/AdTable';
import CreativePerformance from './views/CreativePerformance';
import Leaderboards from './views/Leaderboards';

// ─── Sidebar icons (inline SVG) ──────────────────────────────────────────────
const IconTable = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
);
const IconPlay = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M8 21h8M12 17v4M17 3H7l1 8a4 4 0 0 0 8 0l1-8z"/>
    <path d="M7 3H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4M17 3h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4"/>
  </svg>
);

const NAV_ITEMS = [
  { to: '/',              label: 'Ad Performance',     Icon: IconTable   },
  { to: '/creative',      label: 'Creative Detail',    Icon: IconPlay    },
  { to: '/leaderboards',  label: 'Leaderboards',       Icon: IconTrophy  },
];

function Sidebar() {
  return (
    <nav style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoAccent}>◈</span> Meta Ads
      </div>
      <div style={styles.navItems}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            <Icon />
            <span style={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </div>
      <div style={styles.sidebarFooter}>
        <span style={{ color: '#8899BB', fontSize: 11 }}>Car Insurance Lead Gen</span>
      </div>
    </nav>
  );
}

function Layout() {
  const { refresh } = useData();
  return (
    <div style={styles.shell}>
      <Sidebar />
      <div style={styles.main}>
        <EconomicSummaryBar onRefresh={refresh} />
        <div style={styles.content}>
          <Routes>
            <Route path="/"             element={<AdTable />}            />
            <Route path="/creative"     element={<CreativePerformance />} />
            <Route path="/leaderboards" element={<Leaderboards />}        />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Layout />
      </DataProvider>
    </BrowserRouter>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: '#132244',
    borderRight: '1px solid #1e3060',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    overflow: 'hidden',
  },
  logo: {
    fontSize: 18,
    fontWeight: 800,
    padding: '0 20px 24px',
    color: '#fff',
    borderBottom: '1px solid #1e3060',
    marginBottom: 16,
  },
  logoAccent: {
    color: '#00C9A7',
    marginRight: 6,
  },
  navItems: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 4,
    padding: '0 10px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    color: '#8899BB',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  navLinkActive: {
    background: '#1a2d58',
    color: '#00C9A7',
  },
  navLabel: {
    fontSize: 13,
  },
  sidebarFooter: {
    padding: '16px 20px 0',
    borderTop: '1px solid #1e3060',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
  },
};
