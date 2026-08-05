import React from 'react';

export interface ApplicationTitleProps {
  /**
   * Left text label displayed with font weight 400.
   * @default "TOKEN"
   */
  labelLeft?: string;
  /**
   * Right text label displayed with font weight 900.
   * @default "RAZOR"
   */
  labelRight?: string;
  /**
   * Optional full label for backwards compatibility.
   * If provided without labelLeft/labelRight, it will be split by space.
   */
  label?: string;
  /**
   * Optional custom CSS class name for the wrapper container.
   */
  className?: string;
}

export const ApplicationTitle: React.FC<ApplicationTitleProps> = ({
  labelLeft,
  labelRight,
  label,
  className = '',
}) => {
  const leftText = labelLeft ?? (label ? label.split(' ')[0] : 'TOKEN');
  const rightText = labelRight ?? (label ? label.split(' ').slice(1).join(' ') : 'RAZOR');

  return (
    <div className={`token-razor-title-container ${className}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');

        .token-razor-title-container {
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Orbitron', sans-serif;
          height: 35px;
          max-height: 35px;
          overflow: hidden;
        }

        .token-razor-wrapper {
          position: relative;
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 35px;
          max-height: 35px;
        }

        .token-razor-h1 {
          margin: 0;
          padding: 0;
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 3px;
          height: 35px;
          line-height: 35px;
          display: flex;
          align-items: center;

          /* Blended gradient mixing Gold (#ffd700), Silver (#cbd5e1), and Dollar Green (#10b981) */
          background: linear-gradient(
            120deg,
            #ffd700 0%,
            #a3e635 10%,
            #e2e8f0 40%,
            #10b981 60%,
            #fef08a 80%,
            #b8bdc3 100%
          );
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: tokenRazorHoloShift 15s ease infinite;
          white-space: nowrap;
        }

        .token-razor-left {
          font-weight: 100;
          margin-right: 0.35em;
        }

        .token-razor-right {
          font-weight: 800;
        }

        .token-razor-stroke-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 35px;
          line-height: 35px;
          color: transparent;
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-text-stroke: 1.2px #22c55e;
          animation: tokenRazorStrokeGlow 15s ease infinite alternate;
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
        }

        @keyframes tokenRazorHoloShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes tokenRazorStrokeGlow {
          0% {
            -webkit-text-stroke-color: rgba(34, 197, 94, 0.85);
            filter: drop-shadow(0 0 5px rgba(34, 197, 94, 0.5));
          }
          33% {
            -webkit-text-stroke-color: rgba(254, 240, 138, 0.85);
            filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
          }
          66% {
            -webkit-text-stroke-color: rgba(226, 232, 240, 0.85);
            filter: drop-shadow(0 0 5px rgba(226, 232, 240, 0.5));
          }
          100% {
            -webkit-text-stroke-color: rgba(52, 211, 153, 0.85);
            filter: drop-shadow(0 0 5px rgba(52, 211, 153, 0.5));
          }
        }
      `}</style>
      <div className="token-razor-wrapper">
        <h1 className="token-razor-h1">
          <span className="token-razor-left">{leftText}</span>
          <span className="token-razor-right">{rightText}</span>
        </h1>
        <div className="token-razor-stroke-overlay" aria-hidden="true">
          <span className="token-razor-left">{leftText}</span>
          <span className="token-razor-right">{rightText}</span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTitle;
