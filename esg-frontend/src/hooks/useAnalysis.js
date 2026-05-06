import { useState, useCallback } from 'react';

export function useAnalysis() {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const clearReport = useCallback(() => {
    setReport('');
    setIsLoading(false);
    setStage('idle');
    setElapsedTime(0);
    setMessages([]);
    setError(null);
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return {
    report,
    setReport,
    isLoading,
    setIsLoading,
    stage,
    setStage,
    elapsedTime,
    setElapsedTime,
    messages,
    setMessages,
    addMessage,
    error,
    setError,
    clearReport,
  };
}