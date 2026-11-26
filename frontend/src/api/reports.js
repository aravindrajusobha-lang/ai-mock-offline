import { ApiError, apiRequest } from './client.js';

export async function getReport(sessionId) {
  const response = await apiRequest(`/api/reports/${encodeURIComponent(sessionId)}`);
  const report = response?.report ?? response?.data?.report ?? response?.data ?? response;
  const storedReport = report?.report_json ?? report?.reportJson;

  if (typeof storedReport === 'string') {
    try {
      const parsed = JSON.parse(storedReport);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new TypeError('Report data must be an object.');
      }
      return { ...report, ...parsed };
    } catch (cause) {
      throw new ApiError('The TalkReady server returned an invalid session report.', {
        code: 'INVALID_REPORT_RESPONSE',
        details: cause,
      });
    }
  }
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new ApiError('The TalkReady server returned an invalid session report.', {
      code: 'INVALID_REPORT_RESPONSE',
      details: response,
    });
  }
  return report;
}
