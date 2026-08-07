import { CalendarCheck } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import { getAttendanceRequest } from '../api/student.api.js';
import { formatDate } from '../../auth/utils/format.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

const STATUS_TONES = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'neutral',
};

export function StudentAttendancePage() {
  const { data, loading, error, run } = useAsync(getAttendanceRequest);

  if (loading && !data) return <Spinner label="Loading your attendance…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load your attendance')} onRetry={run} />;

  const records = data?.records ?? [];

  const summary = records.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] ?? 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0 },
  );

  return (
    <>
      <PageHeader title="My attendance" subtitle={`${records.length} session${records.length === 1 ? '' : 's'} recorded.`} />

      {records.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2.5">
          {Object.entries(summary).map(([status, count]) => (
            <Badge key={status} tone={STATUS_TONES[status]} dot>
              {status}: {count}
            </Badge>
          ))}
        </div>
      ) : null}

      <section className="panel">
        {records.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={28} aria-hidden="true" />}
            title="No attendance recorded"
            description="Your teachers will record attendance for each session. Check back soon."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-[13.5px]">
              <thead>
                <tr>
                  <th className="th">Date</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="td">{formatDate(record.date)}</td>
                    <td className="td">
                      <Badge tone={STATUS_TONES[record.status]} dot>
                        {record.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
