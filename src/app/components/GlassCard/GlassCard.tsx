import React from 'react';
import { motion } from 'framer-motion';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  // Allow passing any framer-motion props
  [key: string]: any;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...rest }) => {
  return (
    <motion.div className={`glass-card ${className}`} {...rest}>
      {children}
    </motion.div>
  );
};

export default GlassCard;
