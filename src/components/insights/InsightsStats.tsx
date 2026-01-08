import React, { useEffect, useState } from 'react';
import { FileText, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { powerBiService } from '../../services/powerBiService';
import { InsightStats } from '../../types';

export const InsightsStats: React.FC = () => {
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await powerBiService.getInsightsStats();
        setStats(data);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Shared Documents',
      value: stats.totalSharedDocuments,
      icon: Users,
      color: 'green'
    },
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Success',
      value: stats.processingSuccess,
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      label: 'Failed',
      value: stats.processingFailed,
      icon: AlertCircle,
      color: 'red'
    },
  ];

  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  const iconColorClasses: { [key: string]: string } = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        const colorClass = colorClasses[card.color] || colorClasses.blue;
        const iconColor = iconColorClasses[card.color] || iconColorClasses.blue;

        return (
          <div
            key={card.label}
            className={`border rounded-lg p-4 ${colorClass}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-75">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <Icon size={32} className={`${iconColor} opacity-50`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};