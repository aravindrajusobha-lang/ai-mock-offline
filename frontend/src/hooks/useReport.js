import { useCallback, useEffect, useState } from 'react';
import { getReport } from '../api/reports.js';

export default function useReport(sessionId) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getReport(sessionId);
      setReport(result);
      return result;
    } catch (requestError) {
      setError(requestError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { report, loading, error, refresh };
}
