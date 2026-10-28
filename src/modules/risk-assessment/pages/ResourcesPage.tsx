import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, Download, CheckCircle, Book, HelpCircle } from 'lucide-react';
import { templates, categories, riskTiers } from '../lib/templates-config';

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedRiskTier, setSelectedRiskTier] = useState('All Tiers');

  const filteredTemplates = templates.filter((template) => {
    const categoryMatch = selectedCategory === 'All Categories' || template.category === selectedCategory;
    const riskMatch = selectedRiskTier === 'All Tiers' || template.riskTier === selectedRiskTier || template.riskTier === 'ALL';
    return categoryMatch && riskMatch;
  });

  const getRiskBadgeColor = (tier: string) => {
    switch (tier) {
      case 'ALL':
        return 'bg-gray-100 text-gray-800';
      case 'BASIC':
        return 'bg-green-100 text-green-800';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (templateName: string) => {
    alert(`Download functionality will be implemented in future. Template: ${templateName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/60 border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <Shield className="h-8 w-8 text-blue-700" />
              <span className="text-xl font-bold text-gray-900">DPDPA Portal</span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-700 hover:text-blue-700 font-medium transition"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/risk-assessment')}
                className="text-sm text-gray-700 hover:text-blue-700 font-medium transition"
              >
                Risk Assessment
              </button>
              <button
                onClick={() => navigate('/risk-assessment/resources')}
                className="text-sm text-blue-700 font-medium border-b-2 border-blue-700"
              >
                Resources
              </button>
              <button
                onClick={() => navigate('/risk-assessment/faq')}
                className="text-sm text-gray-700 hover:text-blue-700 font-medium transition"
              >
                FAQ
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center mb-3"
          >
            <Book className="h-10 w-10 mr-3" />
            <h1 className="text-3xl font-bold">Resource Hub</h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-blue-100 max-w-3xl"
          >
            Download DPDPA-compliant templates, guides, and documentation to kickstart your compliance journey
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigate('/risk-assessment/start')}
            className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm p-6 hover:bg-white/90 hover:shadow-md transition-all border border-white/60 border-l-4 border-l-blue-600 cursor-pointer"
          >
            <CheckCircle className="h-10 w-10 text-blue-700 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Take Assessment</h3>
            <p className="text-sm text-gray-600">
              Complete our 10-question assessment to get personalized template recommendations
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onClick={() => navigate('/risk-assessment/faq')}
            className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm p-6 hover:bg-white/90 hover:shadow-md transition-all border border-white/60 border-l-4 border-l-green-500 cursor-pointer"
          >
            <HelpCircle className="h-10 w-10 text-green-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">FAQ</h3>
            <p className="text-sm text-gray-600">
              Find answers to common questions about DPDPA compliance
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm p-6 border border-white/60 border-l-4 border-l-purple-500"
          >
            <FileText className="h-10 w-10 text-purple-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {templates.length} Templates Available
            </h3>
            <p className="text-sm text-gray-600">
              Ready-to-use compliance templates for all risk levels
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm p-6 mb-8 border border-white/60"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filter Templates</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Tier
              </label>
              <select
                value={selectedRiskTier}
                onChange={(e) => setSelectedRiskTier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {riskTiers.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredTemplates.length} of {templates.length} templates
          </div>
        </motion.div>

        {/* Template Library */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
              className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm hover:bg-white/90 hover:shadow-md transition-all overflow-hidden border border-white/60"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <FileText className="h-8 w-8 text-blue-700 flex-shrink-0" />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(
                      template.riskTier
                    )}`}
                  >
                    {template.riskTier}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                <button
                  onClick={() => handleDownload(template.name)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No templates found</h3>
            <p className="text-gray-500">
              Try adjusting your filters to see more templates
            </p>
          </motion.div>
        )}

        {/* DPDPA Sections Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm p-8 border border-white/60"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            DPDPA Key Sections Reference
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-700 pl-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base">Section 5: Notice</h3>
              <p className="text-sm text-gray-600">
                Organizations must provide clear notice about data collection, purposes, and retention
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base">Section 6: Consent</h3>
              <p className="text-sm text-gray-600">
                Free, specific, informed, and unconditional consent required for processing
              </p>
            </div>

            <div className="border-l-4 border-amber-600 pl-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base">Section 8: Data Security</h3>
              <p className="text-sm text-gray-600">
                Reasonable security safeguards to prevent data breaches
              </p>
            </div>

            <div className="border-l-4 border-red-600 pl-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base">Section 10: SDF Obligations</h3>
              <p className="text-sm text-gray-600">
                Enhanced obligations for Significant Data Fiduciaries including DPO and DPIA
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base">Section 11-14: Data Principal Rights</h3>
              <p className="text-sm text-gray-600">
                Rights to access, correction, erasure, and data portability
              </p>
            </div>

            <div className="border-l-4 border-indigo-600 pl-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base">Section 16: Children's Data</h3>
              <p className="text-sm text-gray-600">
                Special protections and parental consent requirements for children under 18
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="backdrop-blur-md bg-white/60 border-t border-white/60 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-600">
            © 2026 DPDPA Risk Scoping Portal. Templates provided for guidance only.
          </p>
          <p className="text-xs mt-2 text-slate-400">
            Customize templates according to your specific organizational requirements.
          </p>
        </div>
      </footer>
    </div>
  );
}
