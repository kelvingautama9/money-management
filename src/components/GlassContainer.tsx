import React from 'react';
import { GlassSettings } from '../types';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  settings: GlassSettings;
  id?: string;
  enableTilt?: boolean;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  className = '',
  settings,
  id
}) => {
  const opacityDecimal = settings.translucency / 100;
  const darkTintDecimal = settings.darkTint / 100;
  const specular = settings.specularIntensity / 100;

  // Dark tint base color
  const bgColor = `rgba(${Math.round(14 * (1 - darkTintDecimal))}, ${Math.round(16 * (1 - darkTintDecimal))}, ${Math.round(30 * (1 - darkTintDecimal))}, ${opacityDecimal})`;

  return (
    <div
      id={id}
      style={{
        backgroundColor: bgColor,
        backdropFilter: `blur(${settings.blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${settings.blur}px) saturate(180%)`,
        borderColor: `rgba(255, 255, 255, ${0.12 * specular})`,
        boxShadow: `
          0 20px 40px -10px rgba(0, 0, 0, 0.55),
          inset 0 1.5px 0.5px rgba(255, 255, 255, ${0.45 * specular}),
          inset 0 -1px 1px rgba(0, 0, 0, 0.5)
        `,
      }}
      className={`rounded-3xl border relative overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Top Rim Specular Highlight Bar */}
      <div 
        className="absolute top-0 inset-x-4 h-[1px] pointer-events-none z-10"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, ${0.7 * specular}) 50%, transparent 100%)`
        }}
      />

      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

