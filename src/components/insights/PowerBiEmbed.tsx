import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { powerBiService } from '../../services/powerBiService';

interface PowerBiEmbedProps {
  reportId?: string;
  groupId?: string;
  height?: string;
}

export const PowerBiEmbed: React.FC<PowerBiEmbedProps> = ({
  height = '600px'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedConfig, setEmbedConfig] = useState<any>(null);

  useEffect(() => {
    const loadEmbedConfig = async () => {
      try {
        setLoading(true);
        const config = await powerBiService.getEmbedToken();
        setEmbedConfig(config);
        
        // Dynamically load Power BI SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/powerbi-client@2.23.0/dist/powerbi.min.js';
        script.onload = () => {
          const powerbi = (window as any).powerbi;
          const models = (window as any).powerbi.models;
          
          if (config && powerbi) {
            const embedConfiguration: any = {
              type: 'report',
              id: config.reportId,
              embedUrl: config.embedUrl,
              accessToken: config.accessToken,
              tokenExpiration: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
              permissions: models.Permissions.Read,
            };

            const report = powerbi.embed(
              document.getElementById('powerbi-container'),
              embedConfiguration
            );

            report.on('loaded', () => {
              setLoading(false);
            });

            report.on('error', (error: any) => {
              console.error('Power BI embed error:', error);
              setError('Failed to load Power BI visualization');
              setLoading(false);
            });
          }
        };
        script.onerror = () => {
          setError('Failed to load Power BI SDK');
          setLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading Power BI embed config:', err);
        setError('Failed to load Power BI configuration');
        setLoading(false);
      }
    };

    loadEmbedConfig();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="flex flex-col items-center space-y-2">
            <Loader size={32} className="text-blue-600 animate-spin" />
            <p className="text-gray-600 text-sm">Loading visualization...</p>
          </div>
        </div>
      )}
      <div
        id="powerbi-container"
        style={{ height, display: embedConfig ? 'block' : 'none' }}
        className="w-full"
      />
    </div>
  );
};