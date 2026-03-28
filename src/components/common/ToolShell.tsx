import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ToolShellProps {
  children: ReactNode;
}

export function ToolShell({ children }: ToolShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col p-3 md:p-6 gap-3 md:gap-4"
    >
      {children}
    </motion.div>
  );
}
