import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // General DPDPA Questions
  {
    category: 'General DPDPA',
    question: 'What is the Digital Personal Data Protection Act (DPDPA)?',
    answer: 'The DPDPA is India\'s comprehensive data protection law that regulates the processing of digital personal data. It establishes rights for data principals (individuals) and obligations for data fiduciaries (organizations that process personal data).',
  },
  {
    category: 'General DPDPA',
    question: 'When did DPDPA come into effect?',
    answer: 'The DPDPA 2023 received Presidential assent in August 2023. The exact enforcement date will be notified by the Central Government. Organizations should begin compliance preparations immediately.',
  },
  {
    category: 'General DPDPA',
    question: 'Who does DPDPA apply to?',
    answer: 'DPDPA applies to: (1) Processing of digital personal data within India, (2) Processing outside India if offering goods/services to individuals in India, (3) Both government and private entities processing personal data.',
  },

  // Risk Assessment
  {
    category: 'Risk Assessment',
    question: 'How is my risk tier calculated?',
    answer: 'Your risk tier is calculated based on 10 factors including: organization type, data subjects (especially children), data types (sensitive data), processing scale, AI usage, cross-border transfers, and vendor relationships. The algorithm assigns weighted scores to determine BASIC, MODERATE, or HIGH risk.',
  },
  {
    category: 'Risk Assessment',
    question: 'What does each risk tier mean?',
    answer: 'BASIC: Standard compliance requirements for low-risk processing. MODERATE: Enhanced controls for medium-risk activities like profiling or vendor management. HIGH: Comprehensive safeguards for sensitive data, children\'s data, AI processing, or large-scale operations.',
  },
  {
    category: 'Risk Assessment',
    question: 'Can my risk tier change over time?',
    answer: 'Yes. Your risk tier should be reassessed when: (1) You start processing new types of data, (2) Your user base grows significantly, (3) You implement AI/ML systems, (4) You expand cross-border operations, or (5) You begin processing children\'s data.',
  },

  // SDF (Significant Data Fiduciary)
  {
    category: 'Significant Data Fiduciary',
    question: 'What is a Significant Data Fiduciary (SDF)?',
    answer: 'An SDF is an organization that processes personal data on a large scale, poses significant risk to data principals, or processes sensitive data. SDFs have enhanced obligations including appointing a Data Protection Officer (DPO) and conducting Data Protection Impact Assessments (DPIAs).',
  },
  {
    category: 'Significant Data Fiduciary',
    question: 'How do I know if I am an SDF?',
    answer: 'You may be an SDF if: (1) You process data of >1 million individuals, (2) You process sensitive personal data at scale, (3) You use AI for profiling or automated decisions, (4) The government designates you as an SDF. Our assessment tool flags potential SDF status.',
  },
  {
    category: 'Significant Data Fiduciary',
    question: 'What are the additional obligations for SDFs?',
    answer: 'SDFs must: (1) Appoint a Data Protection Officer (DPO) based in India, (2) Conduct Data Protection Impact Assessments (DPIAs), (3) Conduct periodic audits, (4) Implement enhanced security measures, (5) Maintain detailed processing records.',
  },

  // Consent Management
  {
    category: 'Consent',
    question: 'What constitutes valid consent under DPDPA?',
    answer: 'Valid consent must be: (1) Free - given without coercion, (2) Specific - for particular purposes, (3) Informed - with clear notice, (4) Unconditional - not bundled with services, (5) Unambiguous - clear affirmative action, (6) Given through clear affirmative action, (7) Allows withdrawal as easily as given.',
  },
  {
    category: 'Consent',
    question: 'When can I process data without consent?',
    answer: 'DPDPA allows processing without consent for: (1) State functions, (2) Legal obligations, (3) Court orders, (4) Medical emergencies, (5) Employment purposes (as specified), (6) Public interest (as specified by government). Always verify specific exemptions apply.',
  },
  {
    category: 'Consent',
    question: 'How should I handle consent withdrawal?',
    answer: 'Consent withdrawal must be: (1) As easy as giving consent, (2) Processed promptly (within reasonable timeframe), (3) Result in cessation of processing for that purpose, (4) Allow user to retain other active consents. You must stop processing within a reasonable period.',
  },

  // Children's Data
  {
    category: 'Children Data',
    question: 'What special rules apply to children\'s data?',
    answer: 'For children under 18: (1) Verifiable parental consent required, (2) No tracking, behavioral monitoring, or targeted advertising, (3) Enhanced security measures, (4) Clear, age-appropriate privacy notices, (5) Special care in data retention and deletion.',
  },
  {
    category: 'Children Data',
    question: 'How do I obtain parental consent?',
    answer: 'Parental consent methods include: (1) Signed consent forms, (2) Credit card verification, (3) OTP to parent\'s mobile, (4) Video verification, (5) Government ID verification. The method should be verifiable and documented.',
  },

  // Data Security
  {
    category: 'Data Security',
    question: 'What security measures are required?',
    answer: 'You must implement "reasonable security safeguards" including: (1) Encryption of sensitive data, (2) Access controls and authentication, (3) Regular security audits, (4) Incident response procedures, (5) Vendor security assessments, (6) Employee training, (7) Network security measures.',
  },
  {
    category: 'Data Security',
    question: 'What should I do if there\'s a data breach?',
    answer: 'In case of a breach: (1) Contain the breach immediately, (2) Assess the impact and affected data, (3) Notify the Data Protection Board without undue delay, (4) Inform affected individuals if required, (5) Document the breach and response, (6) Take corrective measures, (7) Update security procedures.',
  },

  // Cross-Border Transfers
  {
    category: 'Cross-Border Transfer',
    question: 'Can I transfer data outside India?',
    answer: 'Yes, but: (1) Certain sensitive data categories may be restricted (to be notified), (2) You must ensure adequate safeguards, (3) Data principals must be informed, (4) Comply with destination country laws, (5) Maintain records of transfers. The government will specify restricted categories.',
  },

  // Data Principal Rights
  {
    category: 'Data Rights',
    question: 'What rights do data principals have?',
    answer: 'Data principals have the right to: (1) Know what data is processed, (2) Obtain copies of their data, (3) Correct inaccurate data, (4) Erase or update data, (5) Data portability, (6) Withdraw consent, (7) Nominate someone to exercise rights after death.',
  },
  {
    category: 'Data Rights',
    question: 'How quickly must I respond to data principal requests?',
    answer: 'While DPDPA doesn\'t specify exact timeframes, you should respond "as soon as reasonably practicable." Best practice: (1) Acknowledge within 3-5 days, (2) Complete simple requests within 30 days, (3) Complex requests within 60 days, (4) Inform if more time is needed with justification.',
  },

  // Templates & Implementation
  {
    category: 'Implementation',
    question: 'How do I use the templates provided?',
    answer: 'Templates are starting points: (1) Download relevant templates for your risk tier, (2) Customize with your organization details, (3) Adapt to your specific processing activities, (4) Have legal counsel review, (5) Implement and train staff, (6) Review and update regularly.',
  },
  {
    category: 'Implementation',
    question: 'Do I need a Data Protection Officer (DPO)?',
    answer: 'You need a DPO if: (1) You are designated as an SDF, (2) You process data at significant scale, (3) Government notifies your category. The DPO must be based in India, have expertise in data protection, and serve as the point of contact with the Data Protection Board.',
  },
  {
    category: 'Implementation',
    question: 'What is a Data Protection Impact Assessment (DPIA)?',
    answer: 'A DPIA is a systematic assessment of: (1) Data processing activities and purposes, (2) Risks to data principals\' rights, (3) Measures to mitigate risks, (4) Alternative processing methods. Required for SDFs and high-risk processing activities.',
  },
];

const categories = [
  'All Categories',
  'General DPDPA',
  'Risk Assessment',
  'Significant Data Fiduciary',
  'Consent',
  'Children Data',
  'Data Security',
  'Cross-Border Transfer',
  'Data Rights',
  'Implementation',
];

export default function FAQPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const filteredFAQs =
    selectedCategory === 'All Categories'
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/60 border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DPDPA Risk Assessment</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-3"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-blue-100 max-w-3xl"
          >
            Get answers to common questions about DPDPA compliance and our assessment tool
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm p-5 mb-6 border border-white/60"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setOpenIndex(null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="mt-2 text-sm text-gray-600">
            Showing {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''}
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.02 }}
              className="backdrop-blur-md bg-white/70 rounded-2xl shadow-sm overflow-hidden border border-white/60"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-white/90 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <div className="text-xs text-blue-600 font-semibold mb-1">
                    {faq.category}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{faq.question}</h3>
                </div>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {openIndex === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 py-4 bg-blue-50/60 border-t border-white/60"
                >
                  <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12 backdrop-blur-md bg-white/70 rounded-2xl border border-white/60">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No questions found</h3>
            <p className="text-sm text-gray-500">Try selecting a different category</p>
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center text-white border border-white/20"
        >
          <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
          <p className="text-blue-100 mb-6 text-base">
            Take our risk assessment to get personalized guidance for your organization
          </p>
          <button
            onClick={() => navigate('/risk-assessment/start')}
            className="inline-flex items-center px-8 py-2 text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Assessment
          </button>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Legal Disclaimer:</strong> The information provided in these FAQs is for general
            guidance only and does not constitute legal advice. DPDPA compliance requirements may vary
            based on your specific circumstances. We recommend consulting with a qualified data
            protection or legal professional for advice tailored to your organization.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="backdrop-blur-md bg-white/60 border-t border-white/60 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-500">
            © 2026 DPDPA Risk Scoping Portal. Information provided for educational purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
