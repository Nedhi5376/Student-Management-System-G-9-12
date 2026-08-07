import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import { getMyAssignmentsRequest } from '../api/teacher.api.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

export function TeacherDashboardPage() {
  const { data, loading, error, run } = useAsync(getMyAssignmentsRequest);

  if (loading && !data) return <Spinner label="Loading your classes…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load your classes')} onRetry={run} />;

  const assignments = data?.assignments ?? [];

  return (
    <>
      <PageHeader
        title="My classes"
        subtitle={`${assignments.length} teaching assignment${assignments.length === 1 ? '' : 's'} this year. Open a class to record marks and attendance.`}
      />

      <section className="panel">
        {assignments.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={28} aria-hidden="true" />}
            title="No classes assigned"
            description="Once an administrator assigns you a subject and class, it will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-[13.5px]">
              <thead>
                <tr>
                  <th className="th">Class</th>
                  <th className="th">Subject</th>
                  <th className="th">Students</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="td">
                      <div className="font-semibold">{assignment.class?.name ?? '—'}</div>
                      {assignment.class?.grade ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400">Grade {assignment.class.grade}</div>
                      ) : null}
                    </td>
                    <td className="td">
                      <div className="font-semibold">{assignment.subject?.name ?? '—'}</div>
                      {assignment.subject?.code ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{assignment.subject.code}</div>
                      ) : null}
                    </td>
                    <td className="td">
                      <Badge tone="neutral">
                        <Users size={13} aria-hidden="true" /> {assignment.studentCount ?? 0}
                      </Badge>
                    </td>
                    <td className="td">
                      <Link to={`/teacher/assignments/${assignment.id}`} className="btn btn--secondary btn--sm">
                        Open roster <ArrowRight size={14} aria-hidden="true" />
                      </Link>
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
