/** @jsxImportSource react */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import './background-boxes.css';

type BoxesProps = React.HTMLAttributes<HTMLDivElement>;

const rows = new Array(34).fill(1);
const cols = new Array(22).fill(1);
const colors = [
  'rgb(125 211 252)',
  'rgb(249 168 212)',
  'rgb(134 239 172)',
  'rgb(253 224 71)',
  'rgb(252 165 165)',
  'rgb(216 180 254)',
  'rgb(147 197 253)',
  'rgb(165 180 252)',
  'rgb(196 181 253)',
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

function BoxesCore({ className, ...rest }: BoxesProps) {
  return (
    <div className={cn('velnora-boxes-grid', className)} {...rest}>
      {rows.map((_, rowIndex) => (
        <motion.div key={`row-${rowIndex}`} className="velnora-boxes-row">
          {cols.map((_, colIndex) => (
            <motion.div
              key={`col-${rowIndex}-${colIndex}`}
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              animate={{
                transition: { duration: 2 },
              }}
              className="velnora-boxes-cell"
            >
              {colIndex % 2 === 0 && rowIndex % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="velnora-boxes-plus"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

export const Boxes = React.memo(BoxesCore);
