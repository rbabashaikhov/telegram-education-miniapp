import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DemoChrome } from './demo-tour/DemoChrome';
import { isSalesDemoAdminPath } from './demo-tour/eligibility';
import { useDemoTour } from './demo-tour/context';
import { AdminPage, DemoAdminPage } from './pages/AdminPage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { MatchPage } from './pages/MatchPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { PurchaseDonePage, PurchasePage } from './pages/PurchasePage';
import { SchedulePage } from './pages/SchedulePage';
import { TrialDonePage, TrialPage } from './pages/TrialPage';

export default function App() {
  const location = useLocation();
  const isAdmin = isSalesDemoAdminPath(location.pathname);
  const tour = useDemoTour();

  return (
    <div className={isAdmin ? undefined : 'app-shell'}>
      {tour.showChrome && (
        <DemoChrome
          showTour={tour.demoTourEnabled}
          showAdmin={tour.demoAdminPreviewEnabled}
          onStartTour={tour.start}
        />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/trial" element={<TrialPage />} />
        <Route path="/trial/done" element={<TrialDonePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/purchase/done" element={<PurchaseDonePage />} />
        <Route path="/demo/admin" element={<DemoAdminPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
