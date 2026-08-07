import { BookOpen } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import { getGradesRequest } from '../api/student.api.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

function percentage(obtained, max) {
  if (!max) return null;
  return Math.round((obtained / max) * 100);
}

export function StudentGradesPage() {
  const { data, loading, error, run } = useAsync(getGradesRequest);

  if (loading && !data) return <Spinner label="Loading your grades…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load your grades')} onRetry={run} />;

  const marks = data?.marks ?? [];

  return (
    <>
      <PageHeader title="My grades" subtitle={`${marks.length} mark record${marks.length === 1 ? '' : 's'} across your subjects.`} />

      <section className="panel">
        {marks.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={28} aria-hidden="true" />}
            title="No grades recorded"
            description="Once your teachers record marks, they will appear here grouped by subject and term."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-[13.5px]">
              <thead>
                <tr>
                  <th className="th">Subject</th>
                  <th className="th">Term</th>
                  <th className="th">Marks</th>
                  <th className="th">Out of</th>
                  <th className="th">Result</th>
                  <th className="th">Comment</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark) => {
                  const pct = percentage(mark.marksObtained, mark.maxMarks);
                  return (
                    <tr key={mark.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="td font-semibold">
                        {mark.subject?.name ?? '—'}
                        {mark.subject?.code ? <span className="ml-1.5 text-xs text-slate-400">{mark.subject.code}</span> : null}
                      </td>
                      <td className="td">{mark.term}</td>
                      <td className="td font-semibold">{mark.marksObtained}</td>
                      <td className="td text-slate-500 dark:text-slate-400">{mark.maxMarks}</td>
                      <td className="td">
                        {pct == null ? (
                          <Badge tone="neutral">—</Badge>
                        ) : (
                          <Badge tone={pct >= 50 ? 'success' : 'danger'}>{pct}%</Badge>
                        )}
                      </td>
                      <td className="td text-slate-500 dark:text-slate-400">{mark.comment ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
