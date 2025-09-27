import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import './GlassCard.css';

// Combine custom props with all valid props for a framer-motion component
interface GlassCardProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...rest }) => {
  return (
    <motion.div className={`glass-card ${className}`} {...rest}>
      {children}
    </motion.div>
  );
};

export default GlassCard;
