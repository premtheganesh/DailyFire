import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, ArrowRight, X } from 'lucide-react';
import './CelebrationModal.css';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="celebration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#6366F1', '#8B5CF6', '#22C55E', '#FF6B35'][Math.floor(Math.random() * 5)],
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: window.innerHeight + 100,
                x: (Math.random() - 0.5) * 200,
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 1,
                ease: 'linear',
              }}
            />
          ))}
          
          <motion.div
            className="celebration-content"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            <button className="close-celebration" onClick={onClose}>
              <X size={24} />
            </button>
            
            <div className="trophy-container">
              <div className="trophy-glow" />
              <Trophy size={80} color="#FFD700" />
            </div>
            
            <h1>Day Complete!</h1>
            <p>You showed up for yourself today.</p>
            
            <div className="flame-row">
              <Flame size={32} color="#FF6B35" />
              <Flame size={40} color="#F7931A" />
              <Flame size={32} color="#FFD700" />
            </div>
            
            <span className="bonus-xp">+50 Bonus XP</span>
            
            <button className="continue-btn" onClick={onClose}>
              Keep Going!
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
