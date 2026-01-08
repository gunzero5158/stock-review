import React, { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StockDataPoint } from '../types';

interface ChartsProps {
  data: StockDataPoint[];
}

// --- COLORS ---
const COLORS = {
  bg: '#030712',
  grid: '#1f2937',
  text: '#9ca3af',
  crosshair: '#4b5563',
  // Price (High Contrast Neon)
  rise: '#ff3333', // Bright Red
  fall: '#00ff88', // Bright Neon Green
  // MA
  ma5: '#facc15', // Yellow 400
  ma20: '#c084fc', // Purple 400
  // Bollinger
  boll: '#3b82f6', // Blue 500
  // Volume
  vol: '#4b5563', // Gray 600
  // Indicators
  k: '#fbbf24', // Amber
  d: '#38bdf8', // Sky Blue
  j: '#e879f9', // Fuchsia
  macd_dif: '#fff', // White
  macd_dea: '#f59e0b', // Orange
};

// Custom Shape for Candlesticks
const CandlestickShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  
  const isRising = close > open;
  const color = isRising ? COLORS.rise : COLORS.fall;
  
  const range = high - low;
  const ratio = range === 0 ? 0 : height / range;
  
  const yOpen = y + (high - open) * ratio;
  const yClose = y + (high - close) * ratio;
  
  const bodyY = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
  
  const center = x + width / 2;

  return (
    <g>
      <line x1={center} y1={y} x2={center} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect 
        x={x + 1} 
        y={bodyY} 
        width={Math.max(2, width - 2)} 
        height={bodyHeight} 
        fill={color} 
        stroke="none"
      />
    </g>
  );
};

// Custom Label for Price Line to ensure visibility
const CustomPriceLabel = (props: any) => {
  const { viewBox, value, color } = props;
  const { x, width, y } = viewBox;
  
  // Calculate position on the far right edge
  const labelX = x + width; 
  const labelY = y;

  return (
    <g>
      {/* Pointer Triangle */}
      <path d={`M${labelX} ${labelY} L${labelX + 6} ${labelY - 6} L${labelX + 6} ${labelY + 6} Z`} fill={color} />
      
      {/* Background Badge */}
      <rect 
        x={labelX + 6} 
        y={labelY - 11} 
        width={48} 
        height={22} 
        rx={3} 
        fill={color} 
      />
      
      {/* Text Value */}
      <text 
        x={labelX + 30} 
        y={labelY + 5} 
        fill="#000" // Black text on neon background is high contrast
        textAnchor="middle" 
        fontSize={11} 
        fontWeight="bold" 
        fontFamily="monospace"
      >
        {Number(value).toFixed(2)}
      </text>
    </g>
  );
};

export const TechnicalCharts: React.FC<ChartsProps> = ({ data }) => {
  const [subChart, setSubChart] = useState<'MACD' | 'RSI' | 'KDJ'>('MACD');

  const processedData = data.map(d => ({
    ...d,
    candleRange: [d.low, d.high]
  }));

  const lastPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const isLastUp = data.length > 1 ? data[data.length - 1].close > data[data.length - 1].open : true;
  const lastPriceColor = isLastUp ? COLORS.rise : COLORS.fall;

  // --- Tooltip Logic ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as StockDataPoint;
      const isUp = d.close > d.open;
      return (
        <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-lg shadow-2xl text-xs backdrop-blur-md z-50 min-w-[140px]">
          <div className="font-mono text-gray-400 border-b border-gray-700 pb-1 mb-2 flex justify-between">
             <span>{label}</span>
             <span className={isUp ? 'text-red-400' : 'text-green-400'}>{isUp ? '▲' : '▼'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2 font-mono">
            <div className="flex justify-between"><span className="text-gray-500">O</span> <span className={isUp ? 'text-red-400' : 'text-green-400'}>{d.open.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">H</span> <span>{d.high.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">L</span> <span>{d.low.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">C</span> <span className={isUp ? 'text-red-400' : 'text-green-400'}>{d.close.toFixed(2)}</span></div>
          </div>

          {d.magic9 && Math.abs(d.magic9) === 9 && (
            <div className={`text-center font-bold px-1 py-0.5 rounded mb-2 ${d.magic9 > 0 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
               Magic 9: {d.magic9 > 0 ? 'Bottom?' : 'Top?'}
            </div>
          )}

          <div className="border-t border-gray-700 pt-2 space-y-1">
             {payload.map((p: any) => {
                if (['open','high','low','close','min','max','magic9','candleRange'].includes(p.dataKey)) return null;
                return (
                  <div key={p.name} className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: p.color}}></div>
                         <span className="text-gray-300">{p.name}</span>
                      </div>
                      <span className="font-mono text-gray-200">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
                  </div>
                );
             })}
          </div>
        </div>
      );
    }
    return null;
  };

  const prices = data.flatMap(d => [d.low, d.high, d.bollUpper || d.high, d.bollLower || d.low]);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;

  const StatusLine = ({ items }: { items: { label: string; color: string }[] }) => (
    <div className="absolute top-2 left-2 flex flex-wrap gap-3 text-[10px] pointer-events-none z-10 bg-gray-900/50 p-1 rounded backdrop-blur-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
          <span className="font-bold text-gray-300 shadow-black drop-shadow-md">{item.label}</span>
        </div>
      ))}
    </div>
  );

  const renderSubChart = () => {
    switch(subChart) {
      case 'MACD':
        return (
          <>
            <StatusLine items={[
                { label: 'DIF', color: COLORS.macd_dif }, 
                { label: 'DEA', color: COLORS.macd_dea },
                { label: 'Hist', color: COLORS.fall } 
            ]} />
            <ComposedChart data={processedData} syncId="stockId" margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <YAxis stroke={COLORS.text} tick={{fontSize: 9}} orientation="right" width={40} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.crosshair }} />
              <ReferenceLine y={0} stroke={COLORS.text} opacity={0.5} />
              <Bar dataKey="hist" name="MACD Hist" barSize={2}>
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(entry.hist || 0) > 0 ? COLORS.rise : COLORS.fall} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke={COLORS.macd_dif} dot={false} strokeWidth={1} name="DIF" />
              <Line type="monotone" dataKey="signal" stroke={COLORS.macd_dea} dot={false} strokeWidth={1} name="DEA" />
            </ComposedChart>
          </>
        );
      case 'RSI':
        return (
          <>
            <StatusLine items={[{ label: 'RSI (14)', color: COLORS.j }]} />
            <LineChart data={processedData} syncId="stockId" margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <YAxis domain={[0, 100]} stroke={COLORS.text} tick={{fontSize: 9}} orientation="right" ticks={[30, 70]} width={40} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.crosshair }} />
              <ReferenceLine y={70} stroke={COLORS.rise} strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={30} stroke={COLORS.fall} strokeDasharray="3 3" opacity={0.5} />
              <Line type="monotone" dataKey="rsi" stroke={COLORS.j} dot={false} strokeWidth={1.5} name="RSI" />
            </LineChart>
          </>
        );
      case 'KDJ':
        return (
          <>
            <StatusLine items={[
                { label: 'K', color: COLORS.k }, 
                { label: 'D', color: COLORS.d },
                { label: 'J', color: COLORS.j }
            ]} />
            <LineChart data={processedData} syncId="stockId" margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <YAxis domain={[0, 100]} stroke={COLORS.text} tick={{fontSize: 9}} orientation="right" width={40} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.crosshair }} />
              <Line type="monotone" dataKey="k" stroke={COLORS.k} dot={false} strokeWidth={1} name="K" />
              <Line type="monotone" dataKey="d" stroke={COLORS.d} dot={false} strokeWidth={1} name="D" />
              <Line type="monotone" dataKey="j" stroke={COLORS.j} dot={false} strokeWidth={1} name="J" />
            </LineChart>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-950 rounded-xl border border-gray-800 h-full flex flex-col overflow-hidden relative shadow-inner">
      
      {/* --- Main Chart (Price) --- */}
      <div className="flex-grow min-h-0 relative border-b border-gray-800">
        
        <StatusLine items={[
            { label: 'Price', color: '#e5e7eb' },
            { label: 'MA5', color: COLORS.ma5 },
            { label: 'MA20', color: COLORS.ma20 },
            { label: 'BOLL', color: COLORS.boll },
            { label: 'Vol', color: COLORS.vol }
        ]} />

        <ResponsiveContainer width="100%" height="100%">
          {/* Increased Right Margin to 60 to fit the price badge */}
          <ComposedChart data={processedData} syncId="stockId" margin={{ top: 15, right: 60, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            
            <YAxis 
              domain={[minPrice, maxPrice]} 
              orientation="right" 
              stroke={COLORS.text} 
              tick={{fontSize: 10, fill: COLORS.text}} 
              width={45}
              tickFormatter={(val) => val.toFixed(1)}
            />
            <XAxis dataKey="date" hide />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.crosshair }} />

            <Bar dataKey="volume" yAxisId="vol" fill={COLORS.vol} opacity={0.2} barSize={2} name="Volume" />
            <YAxis yAxisId="vol" orientation="left" hide domain={[0, 'dataMax * 4']} />

            <Line type="monotone" dataKey="bollUpper" stroke={COLORS.boll} strokeDasharray="3 3" dot={false} strokeWidth={1} strokeOpacity={0.6} name="Boll UP" />
            <Line type="monotone" dataKey="bollLower" stroke={COLORS.boll} strokeDasharray="3 3" dot={false} strokeWidth={1} strokeOpacity={0.6} name="Boll LOW" />

            <Line type="monotone" dataKey="ma5" stroke={COLORS.ma5} dot={false} strokeWidth={1.5} name="MA5" />
            <Line type="monotone" dataKey="ma20" stroke={COLORS.ma20} dot={false} strokeWidth={1.5} name="MA20" />

            <Bar 
               dataKey="candleRange" 
               shape={<CandlestickShape />} 
               isAnimationActive={false}
               name="Price"
            />
            
            {/* Current Price Line with Custom Label */}
            {lastPrice > 0 && (
               <ReferenceLine 
                  y={lastPrice} 
                  stroke={lastPriceColor} 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  isFront={true}
                  label={<CustomPriceLabel value={lastPrice} color={lastPriceColor} />}
               />
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* --- Sub Chart Controls --- */}
      <div className="h-8 flex items-center px-2 bg-gray-900 border-b border-gray-800 gap-2 z-20">
        {['MACD', 'RSI', 'KDJ'].map((t) => (
          <button
            key={t}
            onClick={() => setSubChart(t as any)}
            className={`text-[10px] font-bold px-3 py-1 rounded transition-all ${
              subChart === t 
              ? 'bg-gray-700 text-white shadow-sm' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* --- Sub Chart Area --- */}
      <div className="h-[30%] relative bg-gray-950">
        <ResponsiveContainer width="100%" height="100%">
           {renderSubChart()}
        </ResponsiveContainer>
      </div>

    </div>
  );
};
