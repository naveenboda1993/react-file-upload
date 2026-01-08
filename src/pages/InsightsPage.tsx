import React from 'react';
import { PowerBiEmbed } from '../components/insights/PowerBiEmbed';
import { InsightsStats } from '../components/insights/InsightsStats';

export const InsightsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-600 mt-2">
          Monitor your document processing metrics and analytics
        </p>
      </div>

      <InsightsStats />

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
        <PowerBiEmbed height="800px" />
      </div>
    </div>
  );
};