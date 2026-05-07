import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

export const EDITABLE_ROW_ANIMATION = {
  layout: true,
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.25 },
};

export function EditableRowLayout({
  isEditing,
  view,
  edit,
}: {
  isEditing: boolean;
  view: ReactNode;
  edit: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="edit"
          {...EDITABLE_ROW_ANIMATION}
          className="overflow-hidden border-b border-glass-border"
        >
          {edit}
        </motion.div>
      ) : (
        <motion.div
          key="view"
          layout
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="border-b border-glass-border"
        >
          {view}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
