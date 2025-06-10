
import AttendanceAnalyticsOriginal from './AttendanceAnalyticsOriginal';

const AttendanceAnalytics = () => {
  // Define new vibrant colors for charts, avoiding orange
  const chartColors = {
    present: '#8B5CF6', // Vibrant purple
    absent: '#D946EF',  // Magenta pink
    late: '#0EA5E9',    // Ocean blue
    onTime: '#2DD4BF',  // Teal

    // Secondary palette
    secondaryPurple: '#E5DEFF',
    secondaryBlue: '#D3E4FD',
    secondaryTeal: '#CCFBF1',
    secondaryPink: '#FCE7F3',
  };

  // Apply a global style to override the chart colors
  return (
    <>
      <style>
        {`
        .recharts-default-color-0 { fill: ${chartColors.present}; }
        .recharts-default-color-1 { fill: ${chartColors.absent}; }
        .recharts-default-color-2 { fill: ${chartColors.late}; }
        .recharts-default-color-3 { fill: ${chartColors.onTime}; }
        
        .attendance-present { color: ${chartColors.present}; }
        .attendance-absent { color: ${chartColors.absent}; }
        .attendance-late { color: ${chartColors.late}; }
        
        .attendance-chart-present .recharts-sector { fill: ${chartColors.present}; }
        .attendance-chart-absent .recharts-sector { fill: ${chartColors.absent}; }
        .attendance-chart-late .recharts-sector { fill: ${chartColors.late}; }
        .attendance-chart-ontime .recharts-sector { fill: ${chartColors.onTime}; }
        
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line {
          stroke: #e2e8f0;
        }
        
        .recharts-pie-label-text {
          font-weight: 500;
        }
        
        .recharts-tooltip-wrapper .recharts-default-tooltip {
          background-color: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
        }
        `}
      </style>
      <AttendanceAnalyticsOriginal />
    </>
  );
};

export default AttendanceAnalytics;
