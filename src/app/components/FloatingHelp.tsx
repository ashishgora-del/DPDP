import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-6 mb-4"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-purple-900 mb-1">Need Help?</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  I'm your compliance assistant! I can guide you through:
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3">
                <p className="text-sm text-blue-900">📋 Understanding DPDP requirements</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3">
                <p className="text-sm text-green-900">✅ Completing risk assessments</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3">
                <p className="text-sm text-orange-900">📄 Generating compliance documents</p>
              </div>
            </div>

            <button className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-md hover:shadow-lg transition-shadow font-medium">
              Chat with Assistant
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={!isOpen ? { y: [0, -10, 0] } : {}}
        transition={!isOpen ? { duration: 2, repeat: Infinity, repeatType: "loop" } : {}}
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <MessageCircle className="w-7 h-7" />
        )}
      </motion.button>
    </div>
  );
}
