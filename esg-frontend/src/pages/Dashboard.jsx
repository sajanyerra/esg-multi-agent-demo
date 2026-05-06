import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useSensors } from '../context/SensorContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { sensorsWithValues, loading: sensorsLoading, error: sensorsError } = useSensors();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #0f172a 100%)', paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
            Live Sensor Feed
          </h1>
          <p style={{ color: '#cbd5e1' }}>
            Real-time industrial sensor readings from your facility
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              color: '#0f172a',
              backgroundColor: '#10b981',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <RefreshCw size={18} />
            Refresh Now
          </button>

          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              color: '#f1f5f9',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              cursor: 'pointer',
            }}
          >
            Back to Reports
          </button>
        </div>

        {sensorsError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#f87171',
          }}>
            {sensorsError}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.875rem', color: '#6ee7b7', fontWeight: '500' }}>
            {sensorsWithValues.length} sensors online
          </span>
        </div>

        {sensorsWithValues.length === 0 ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <p style={{ color: '#64748b' }}>Loading sensors...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {sensorsWithValues.map((sensor) => (
              <div
                key={sensor.WebId}
                onClick={() => navigate('/', { state: { selectedWebid: sensor.WebId } })}
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                <h3 style={{ fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
                  {sensor.Name}
                </h3>
                <div style={{ marginBottom: '0.75rem', padding: '1rem', background: 'rgba(51, 65, 85, 0.2)', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Current Value</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    {sensor.value}{sensor.unit ? ` ${sensor.unit}` : ''}
                  </p>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                  {sensor.Descriptor}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}