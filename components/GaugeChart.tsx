import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

interface GaugeChartProps {
  score: number; // 0 to 5
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ score }) => {
  const { t } = useLanguage();
  
  // Normalize score to percentage for the gauge
  // Red (Buy/High Score), Green (Sell/Low Score)
  const data = [
    { name: t('gauge.strongSell'), value: 1, color: '#10b981' }, // Green (Left) - Strong Sell
    { name: t('gauge.sell'), value: 1, color: '#34d399' }, // Light Green
    { name: t('gauge.neutral'), value: 1, color: '#9ca3af' }, // Gray (Top)
    { name: t('gauge.buy'), value: 1, color: '#f87171' }, // Light Red
    { name: t('gauge.strongBuy'), value: 1, color: '#ef4444' }, // Red (Right) - Strong Buy
  ];

  // Calculate needle rotation
  // Start (Left) = -90deg (CSS logic) or 0 relative to base.
  // End (Right) = +90deg (CSS logic) or 180 relative to base.
  // Score 0 -> 0 rotation. Score 5 -> 180 rotation.
  const needleRotation = (score / 5) * 180;

  return (
    <div className="relative h-56 w-full flex flex-col items-center justify-end pb-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="70%" 
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Needle */}
      <div 
        className="absolute w-1 h-28 origin-bottom bg-white border-2 border-gray-900 rounded-full shadow-lg transition-transform duration-1000 ease-out"
        style={{ 
            left: '50%',
            bottom: '30%', /* Aligns with cy=70% (100-70=30) */
            // -90deg sets the starting position to point Left (180deg on the Pie).
            // needleRotation then adds to it.
            // 0 Score -> rotate(0) -> Remains Left (Green area)
            // 5 Score -> rotate(180) -> Moves to Right (Red area)
            transform: `translateX(-50%) rotate(-90deg) rotate(${needleRotation}deg)`,
        }}
      >
        <div className="w-3 h-3 bg-white rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-4 border-gray-900"></div>
      </div>
      
      {/* Score Text - Positioned cleanly below */}
      <div className="absolute bottom-2 text-center w-full">
        <div className="text-4xl font-bold text-white leading-tight mb-1">{score.toFixed(1)}</div>
        <div className="text-xs text-gray-400 uppercase tracking-widest">{t('gauge.label')}</div>
        <div className="text-[10px] text-gray-600 mt-1">{t('scoreRange')}</div>
      </div>
    </div>
  );
};