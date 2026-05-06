import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../api/client';

const SensorContext = createContext();

export function SensorProvider({ children }) {
  const [sensors, setSensors] = useState([]);
  const [sensorsWithValues, setSensorsWithValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sensor metadata once
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        setError(null);
        const response = await client.get('/sensors');
        
        if (Array.isArray(response)) {
          setSensors(response);
        } else {
          setError('Invalid sensor data format');
          setSensors([]);
        }
      } catch (err) {
        console.error('Error fetching sensors:', err);
        setError('Failed to fetch sensors');
        setSensors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSensors();
  }, []);

  // Fetch values periodically (shared across all pages)
  useEffect(() => {
    if (sensors.length === 0) return;

    const fetchValues = async () => {
      try {
        const updated = await Promise.all(
          sensors.map(async (sensor) => {
            try {
              const valueResponse = await client.get(`/sensors/${sensor.WebId}/value`);
              return {
                ...sensor,
                value: valueResponse?.Value || 'N/A',
                unit: sensor.EngineeringUnits || '',
                status: 'active',
                lastUpdated: new Date().toLocaleTimeString(),
              };
            } catch (err) {
              return {
                ...sensor,
                value: 'Error',
                unit: sensor.EngineeringUnits || '',
                status: 'error',
                lastUpdated: new Date().toLocaleTimeString(),
              };
            }
          })
        );
        setSensorsWithValues(updated);
      } catch (err) {
        console.error('Error fetching sensor values:', err);
      }
    };

    // Initial fetch
    fetchValues();

    // Then update every 5 seconds
    const interval = setInterval(fetchValues, 5000);
    return () => clearInterval(interval);
  }, [sensors]);

  return (
    <SensorContext.Provider value={{ sensors, sensorsWithValues, loading, error }}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensors() {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensors must be used within SensorProvider');
  }
  return context;
}