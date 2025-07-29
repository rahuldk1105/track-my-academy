import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Performance Trend Chart
export const PerformanceTrendChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Performance Score',
        data: data.map(item => item.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance Trend Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

// Attendance Analytics Chart
export const AttendanceChart = ({ data }) => {
  const attendanceData = data.recent_attendance || [];
  
  const chartData = {
    labels: attendanceData.map(item => new Date(item.session_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Attendance',
        data: attendanceData.map(item => {
          switch(item.status) {
            case 'present': return 1;
            case 'late': return 0.5;
            case 'absent': return 0;
            default: return 0;
          }
        }),
        backgroundColor: attendanceData.map(item => {
          switch(item.status) {
            case 'present': return 'rgba(34, 197, 94, 0.8)';
            case 'late': return 'rgba(251, 191, 36, 0.8)';
            case 'absent': return 'rgba(239, 68, 68, 0.8)';
            default: return 'rgba(156, 163, 175, 0.8)';
          }
        }),
        borderColor: attendanceData.map(item => {
          switch(item.status) {
            case 'present': return 'rgb(34, 197, 94)';
            case 'late': return 'rgb(251, 191, 36)';
            case 'absent': return 'rgb(239, 68, 68)';
            default: return 'rgb(156, 163, 175)';
          }
        }),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Recent Attendance History',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const status = attendanceData[context.dataIndex]?.status || 'not_marked';
            return `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 0.5,
          callback: function(value) {
            if (value === 1) return 'Present';
            if (value === 0.5) return 'Late';
            if (value === 0) return 'Absent';
            return '';
          }
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// Attendance Summary Doughnut Chart
export const AttendanceSummaryChart = ({ data }) => {
  const attendedSessions = data.attended_sessions || 0;
  const totalSessions = data.total_sessions || 0;
  const missedSessions = totalSessions - attendedSessions;

  const chartData = {
    labels: ['Attended', 'Missed'],
    datasets: [
      {
        data: [attendedSessions, missedSessions],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: `Attendance Summary (${data.attendance_percentage}%)`,
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

// Academy Overview Chart
export const AcademyOverviewChart = ({ academyData }) => {
  const chartData = {
    labels: ['Academies', 'Coaches', 'Students', 'Sessions'],
    datasets: [
      {
        label: 'Count',
        data: [
          academyData.academies || 0,
          academyData.coaches || 0,
          academyData.students || 0,
          academyData.sessions || 0
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(147, 51, 234, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(147, 51, 234)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Academy Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// Performance Distribution Chart
export const PerformanceDistributionChart = ({ students }) => {
  const performanceRanges = {
    'Excellent (8-10)': 0,
    'Good (6-8)': 0,
    'Average (4-6)': 0,
    'Needs Improvement (0-4)': 0,
  };

  students.forEach(student => {
    const score = student.performance_score;
    if (score >= 8) performanceRanges['Excellent (8-10)']++;
    else if (score >= 6) performanceRanges['Good (6-8)']++;
    else if (score >= 4) performanceRanges['Average (4-6)']++;
    else performanceRanges['Needs Improvement (0-4)']++;
  });

  const chartData = {
    labels: Object.keys(performanceRanges),
    datasets: [
      {
        data: Object.values(performanceRanges),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Student Performance Distribution',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};