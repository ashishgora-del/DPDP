import { Routes, Route } from 'react-router-dom';
import ProjectPickerPage from './pages/ProjectPickerPage';
import WorkbenchPage from './pages/WorkbenchPage';
import CustomEditorPage from './pages/CustomEditorPage';
import DocumentEditorPage from './pages/DocumentEditorPage';
import DocumentListPage from './pages/DocumentListPage';

export default function TemplateGenerationModule() {
  return (
    <Routes>
      <Route path="/" element={<ProjectPickerPage />} />
      <Route path="/workbench" element={<WorkbenchPage />} />
      <Route path="/custom" element={<CustomEditorPage />} />
      <Route path="/editor/:id" element={<DocumentEditorPage />} />
      <Route path="/documents" element={<DocumentListPage />} />
    </Routes>
  );
}
