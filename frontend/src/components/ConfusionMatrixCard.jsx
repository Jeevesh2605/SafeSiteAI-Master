import React, { useEffect } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

const ConfusionMatrixCard = ({
  matrix = {
    TP: 82,
    FP: 6,
    FN: 9,
    TN: 103,
  },
}) => {
  const { TP, FP, FN, TN } = matrix;

  const precision = TP / (TP + FP);
  const recall = TP / (TP + FN);
  const f1 = (2 * precision * recall) / (precision + recall);

  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);

  const fadeVariant = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, type: "spring" },
    }),
  };

  const NumberCounter = ({ value, delay = 0 }) => {
    const controls = useAnimation();
    const ref = React.useRef();

    useEffect(() => {
      const animateNumber = async () => {
        await controls.start({
          count: value,
          transition: { duration: 1.5, delay },
        });
      };
      animateNumber();
    }, [controls, value, delay]);

    return (
      <motion.span
        ref={ref}
        animate={controls}
        initial={{ count: 0 }}
      >
        {Math.round(controls.current?.count ?? 0)}
      </motion.span>
    );
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={fadeVariant}
      className="bg-white/5 border border-white/10 rounded-xl p-6 text-white backdrop-blur-sm"
    >
      <motion.h3
        custom={0}
        variants={fadeVariant}
        className="text-lg font-semibold mb-5"
      >
        Confusion Matrix
      </motion.h3>

      {/* Matrix */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div></div>
        <div className="text-center text-xs text-gray-400">Predicted +</div>
        <div className="text-center text-xs text-gray-400">Predicted -</div>

        <div className="text-xs text-gray-400 flex items-center justify-center `rotate-[-90deg]` col-span-1 row-span-2">
          Actual + / -
        </div>

        {[
          { label: "True Positive", val: TP, color: "green" },
          { label: "False Negative", val: FN, color: "pink" },
          { label: "False Positive", val: FP, color: "orange" },
          { label: "True Negative", val: TN, color: "cyan" },
        ].map((cell, i) => (
          <motion.div
            key={cell.label}
            custom={i + 1}
            variants={fadeVariant}
            className={`bg-${cell.color}-500/20 border border-${cell.color}-400/40 rounded-lg p-3 text-center`}
          >
            <div className={`text-xl font-bold text-${cell.color}-300`}>
              <NumberCounter value={cell.val} delay={i * 0.3} />
            </div>
            <div className="text-xs text-gray-300">{cell.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Metrics summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { name: "Precision", val: precision * 100, color: "orange" },
          { name: "Recall", val: recall * 100, color: "pink" },
          { name: "F1-Score", val: f1 * 100, color: "cyan" },
        ].map((metric, i) => (
          <motion.div
            key={metric.name}
            custom={i + 6}
            variants={fadeVariant}
            className="bg-white/5 rounded-lg p-3"
          >
            <div className="text-sm text-gray-300">{metric.name}</div>
            <div className={`text-lg font-semibold text-${metric.color}-400`}>
              {metric.val.toFixed(1)}%
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ConfusionMatrixCard;
