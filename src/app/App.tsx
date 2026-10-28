import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import IntroPage from '../modules/risk-assessment/pages/IntroPage';
import AssessmentPage from '../modules/risk-assessment/pages/AssessmentPage';
import ResultsPage from '../modules/risk-assessment/pages/ResultsPage';
import FAQPage from '../modules/risk-assessment/pages/FAQPage';
import ResourcesPage from '../modules/risk-assessment/pages/ResourcesPage';
import ProjectsDashboard from '../modules/risk-assessment/pages/ProjectsDashboard';
import ComplianceChecklistPage from '../modules/risk-assessment/pages/ComplianceChecklistPage';
import LearningPlatformModule from '../modules/learning-platform';
import TemplateGenerationModule from '../modules/template-generation';
import ComplianceProjectSelector from '../modules/compliance-tracking/pages/ComplianceProjectSelector';
import ComplianceDetailPage from '../modules/compliance-tracking/pages/ComplianceDetailPage';
import { ComplianceErrorBoundary } from '../modules/compliance-tracking/components/ErrorBoundary';
import { AuthProvider } from '../shared/auth';
import { QuickNav } from '../shared/components';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <QuickNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsDashboard />} />
        <Route path="/projects/:projectId/checklist" element={<ComplianceChecklistPage />} />
        <Route path="/risk-assessment" element={<IntroPage />} />
        <Route path="/risk-assessment/start" element={<AssessmentPage />} />
        <Route path="/risk-assessment/results/:id" element={<ResultsPage />} />
        <Route path="/risk-assessment/faq" element={<FAQPage />} />
        <Route path="/risk-assessment/resources" element={<ResourcesPage />} />
        <Route path="/learning-platform/*" element={<LearningPlatformModule />} />
        <Route path="/template-generation/*" element={<TemplateGenerationModule />} />
        <Route
          path="/compliance-tracking"
          element={
            <ComplianceErrorBoundary>
              <ComplianceProjectSelector />
            </ComplianceErrorBoundary>
          }
        />
        <Route
          path="/compliance-tracking/:projectId"
          element={
            <ComplianceErrorBoundary>
              <ComplianceDetailPage />
            </ComplianceErrorBoundary>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
