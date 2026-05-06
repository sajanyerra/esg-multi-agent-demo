import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart3, Building2, Loader } from 'lucide-react';
import AgentPipeline from '../components/AgentPipeline';
import ReportViewer from '../components/ReportViewer';
import DismissibleBanner from '../components/DismissibleBanner';
import { client } from '../api/client';
import { useAnalysis } from '../hooks/useAnalysis';
import { useSensors } from '../context/SensorContext';

const stateCache = {
  asset: {
    selectedWebid: null,
    selectedSensorName: null,
    report: '',
    stage: 'idle',
    error: null,
  },
  facility: {
    report: '',
    stage: 'idle',
    error: null,
  },
};

export default function ComparePage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('asset');
  const { sensors, loading: sensorsLoading, error: sensorsError } = useSensors();

  const [selectedWebid, setSelectedWebid] = useState(stateCache.asset.selectedWebid);
  const [selectedSensorName, setSelectedSensorName] = useState(stateCache.asset.selectedSensorName);

  const assetAnalysis = useAnalysis({
    report: stateCache.asset.report,
    stage: stateCache.asset.stage,
  });

  const facilityAnalysis = useAnalysis({
    report: stateCache.facility.report,
    stage: stateCache.facility.stage,
  });

  const assetTimerRef = useRef(null);
  const facilityTimerRef = useRef(null);

  // Fetch sensors

  // Handle sensor selection from dashboard
  useEffect(() => {
    if (location.state?.selectedWebid && sensors.length > 0) {
      setSelectedWebid(location.state.selectedWebid);
      const sensor = sensors.find((s) => s.WebId === location.state.selectedWebid);
      if (sensor) {
        setSelectedSensorName(sensor.Name);
      }
    }
  }, [location.state, sensors]);

  // Timers
  useEffect(() => {
    if (assetAnalysis.isLoading) {
      assetTimerRef.current = setInterval(() => {
        assetAnalysis.setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (assetTimerRef.current) clearInterval(assetTimerRef.current);
    }

    return () => {
      if (assetTimerRef.current) clearInterval(assetTimerRef.current);
    };
  }, [assetAnalysis.isLoading]);

  useEffect(() => {
    if (facilityAnalysis.isLoading) {
      facilityTimerRef.current = setInterval(() => {
        facilityAnalysis.setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (facilityTimerRef.current) clearInterval(facilityTimerRef.current);
    }

    return () => {
      if (facilityTimerRef.current) clearInterval(facilityTimerRef.current);
    };
  }, [facilityAnalysis.isLoading]);

  // Asset analysis handler
const handleAssetAnalyze = async () => {
  if (!selectedWebid) {
    alert('Please select a sensor first');
    return;
  }

  assetAnalysis.setIsLoading(true);
  assetAnalysis.setStage('data');
  assetAnalysis.setElapsedTime(0);
  assetAnalysis.setMessages([]);
  assetAnalysis.setError(null);
  assetAnalysis.setReport('');

  try {
    const sensor = sensors.find(s => s.WebId === selectedWebid);
    if (!sensor) {
      throw new Error('Sensor not found');
    }

    assetAnalysis.addMessage('Initializing Data Agent...');

    const payload = {
      asset_name: sensor.Name,
      asset_descriptor: sensor.Descriptor,
      webid: sensor.WebId,
      hours: 24,
      fuel_type: 'natural_gas',
      fuel_amount: 1240,
    };

    const response = await client.post('/analyze', payload);

    if (!response || !response.report) {
      throw new Error('Invalid response format');
    }

    assetAnalysis.addMessage('Analysis complete');
    assetAnalysis.setStage('complete');
    assetAnalysis.setReport(response.report);
    
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Failed to analyze';
    assetAnalysis.setError(errorMsg);
    assetAnalysis.setStage('idle');
  } finally {
    assetAnalysis.setIsLoading(false);
  }
};

  // Save asset state to cache on every change
  useEffect(() => {
    stateCache.asset = {
      selectedWebid,
      selectedSensorName,
      report: assetAnalysis.report,
      stage: assetAnalysis.stage,
      error: assetAnalysis.error,
    };
  }, [selectedWebid, selectedSensorName, assetAnalysis.report, assetAnalysis.stage, assetAnalysis.error]);

  // Save facility state to cache on every change
  useEffect(() => {
    stateCache.facility = {
      report: facilityAnalysis.report,
      stage: facilityAnalysis.stage,
      error: facilityAnalysis.error,
    };
  }, [facilityAnalysis.report, facilityAnalysis.stage, facilityAnalysis.error]);
  
  // Facility audit handler
const handleFacilityAudit = async () => {
  facilityAnalysis.setIsLoading(true);
  facilityAnalysis.setStage('data');
  facilityAnalysis.setElapsedTime(0);
  facilityAnalysis.setMessages([]);
  facilityAnalysis.setError(null);
  facilityAnalysis.setReport('');

  try {
    facilityAnalysis.addMessage('Initializing facility-wide audit...');

    const payload = {
      hours: 24,
      fuel_assumptions: {
        'Boilers': { fuel_type: 'natural_gas', amount: 5000 },
        'Reactors': { fuel_type: 'natural_gas', amount: 2000 },
        'Power Systems': { fuel_type: 'diesel', amount: 1000 },
        'Flow Meters': { fuel_type: 'natural_gas', amount: 1500 },
        'Tanks': { fuel_type: 'natural_gas', amount: 500 },
        'Equipment': { fuel_type: 'diesel', amount: 300 },
        'Other': { fuel_type: 'natural_gas', amount: 100 },
      }
    };

    const response = await client.post('/analyze/facility', payload);

    if (!response || !response.report) {
      throw new Error('Invalid response format');
    }

    facilityAnalysis.addMessage('Facility audit complete');
    facilityAnalysis.setStage('complete');
    facilityAnalysis.setReport(response.report);
    
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Failed to audit facility';
    facilityAnalysis.setError(errorMsg);
    facilityAnalysis.setStage('idle');
  } finally {
    facilityAnalysis.setIsLoading(false);
  }
};

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #0f172a 100%)', paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
            ESG Analysis & Compliance
          </h1>
          <p style={{ color: '#cbd5e1' }}>
            Analyze individual assets or conduct facility-wide carbon emissions audits
          </p>
        </div>

        {/* Banners */}
        <DismissibleBanner
          type="warning"
          title="⚡ Render Cold Start"
          message="First request may take 30-50 seconds as services wake up."
          details="Subsequent requests will be significantly faster."
        />

        <DismissibleBanner
          type="info"
          title="📋 CSRD Compliance Notice"
          message="These thresholds are demo baselines for internal review only."
          details="Real CSRD compliance is assessed at the organisational level for companies with 1,000+ employees or €450M+ turnover."
        />

        {sensorsError && (
          <DismissibleBanner
            type="alert"
            title="Data Connection Error"
            message={sensorsError}
          />
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <button
            onClick={() => setActiveTab('asset')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: '500',
              borderBottom: activeTab === 'asset' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'asset' ? '#6ee7b7' : '#64748b',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <BarChart3 size={18} />
            Single Asset Analysis
          </button>

          <button
            onClick={() => setActiveTab('facility')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: '500',
              borderBottom: activeTab === 'facility' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'facility' ? '#6ee7b7' : '#64748b',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Building2 size={18} />
            Facility Audit
          </button>
        </div>

        {/* Asset Analysis Tab */}
        {activeTab === 'asset' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Left panel */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={24} style={{ color: '#6ee7b7' }} />
                Select Sensor
              </h2>

              <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                Choose a sensor to analyze its ESG impact and emissions data.
              </p>

              {sensorsLoading ? (
                <p style={{ color: '#64748b' }}>Loading sensors...</p>
              ) : sensors.length === 0 ? (
                <p style={{ color: '#64748b' }}>No sensors available</p>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {sensors.map((sensor) => (
                      <button
                        key={sensor.WebId}
                        onClick={() => {
                          setSelectedWebid(sensor.WebId);
                          setSelectedSensorName(sensor.Name);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          borderRadius: '0.5rem',
                          background: selectedWebid === sensor.WebId ? 'rgba(16, 185, 129, 0.2)' : 'rgba(51, 65, 85, 0.2)',
                          border: selectedWebid === sensor.WebId ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(51, 65, 85, 0.3)',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{sensor.Name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sensor.WebId}</p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAssetAnalyze}
                    disabled={!selectedWebid || assetAnalysis.isLoading}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      color: '#0f172a',
                      backgroundColor: '#10b981',
                      border: 'none',
                      cursor: assetAnalysis.isLoading || !selectedWebid ? 'not-allowed' : 'pointer',
                      opacity: assetAnalysis.isLoading || !selectedWebid ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {assetAnalysis.isLoading ? (
                      <>
                        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={18} />
                        Analyze Selected Sensor
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Right panel */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              minHeight: '400px',
            }}>
              {assetAnalysis.error ? (
                <div style={{ color: '#f87171' }}>
                  <strong>Error:</strong> {assetAnalysis.error}
                </div>
              ) : assetAnalysis.isLoading ? (
                <>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Analysis in Progress</h3>
                  <AgentPipeline
                    stage={assetAnalysis.stage}
                    isLoading={assetAnalysis.isLoading}
                    elapsedTime={assetAnalysis.elapsedTime}
                    messages={assetAnalysis.messages}
                  />
                </>
              ) : assetAnalysis.report ? (
                <ReportViewer
                  content={assetAnalysis.report}
                  title={`Analysis Report: ${selectedSensorName}`}
                  onClear={assetAnalysis.clearReport}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <p>No report generated yet</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Select a sensor and click Analyze
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Facility Audit Tab */}
        {activeTab === 'facility' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Left panel */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={24} style={{ color: '#6ee7b7' }} />
                Facility Audit
              </h2>

              <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                Run a comprehensive emissions analysis across all {sensors.length} sensors in your facility.
              </p>

              <button
                onClick={handleFacilityAudit}
                disabled={facilityAnalysis.isLoading || sensors.length === 0}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  color: '#0f172a',
                  backgroundColor: '#10b981',
                  border: 'none',
                  cursor: facilityAnalysis.isLoading ? 'not-allowed' : 'pointer',
                  opacity: facilityAnalysis.isLoading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {facilityAnalysis.isLoading ? (
                  <>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Auditing...
                  </>
                ) : (
                  <>
                    <Building2 size={18} />
                    Run Facility Audit
                  </>
                )}
              </button>
            </div>

            {/* Right panel */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              minHeight: '400px',
            }}>
              {facilityAnalysis.error ? (
                <div style={{ color: '#f87171' }}>
                  <strong>Error:</strong> {facilityAnalysis.error}
                </div>
              ) : facilityAnalysis.isLoading ? (
                <>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Audit in Progress</h3>
                  <AgentPipeline
                    stage={facilityAnalysis.stage}
                    isLoading={facilityAnalysis.isLoading}
                    elapsedTime={facilityAnalysis.elapsedTime}
                    messages={facilityAnalysis.messages}
                  />
                </>
              ) : facilityAnalysis.report ? (
                <ReportViewer
                  content={facilityAnalysis.report}
                  title="Facility Audit Report"
                  onClear={facilityAnalysis.clearReport}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <p>No audit report generated yet</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Click "Run Facility Audit" to start
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}