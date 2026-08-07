import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarCheck, CalendarDays, GraduationCap, TrendingUp } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import { getStudentOverviewRequest } from '../api/student.api.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Stat } from '../../../components/ui/Stat.jsx';

const STATUS_TONES = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'neutral',
};

function StatCards({ attendanceSummary, subjects, gradeSummary, classDoc }) {
  const cards = [
    {
      label: 'Attendance rate',
      value: attendanceSummary.rate != null ? `${attendanceSummary.rate}%` : '—',
      tone: 'green',
      icon: CalendarCheck,
    },
    { label: 'Days recorded', value: attendanceSummary.total, tone: 'indigo', icon: CalendarDays },
    { label: 'Subjects', value: subjects.length, tone: 'slate', icon: BookOpen },
    { label: 'Class', value: classDoc ? `${classDoc.grade} · ${classDoc.name}` : 'Unassigned', tone: 'amber', icon: GraduationCap },
    { label: 'Terms graded', value: gradeSummary.reduce((sum, s) => sum + s.count, 0), tone: 'slate', icon: TrendingUp },
  ];
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <Stat key={card.label} label={card.label} value={card.value} tone={card.tone} icon={<card.icon size={18} aria-hidden="true" />} />
      ))}
    </div>
  );
}

export function StudentDashboardPage() {
  const { data, loading, error, run } = useAsync(getStudentOverviewRequest);

  if (loading && !data) return <Spinner label="Loading your overview…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load your overview')} onRetry={run} />;

  const overview = data ?? {
    class: null,
    subjects: [],
    gradeSummary: [],
    attendanceSummary: { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: null },
  };

  return (
    <>
      <PageHeader
        title="My overview"
        subtitle="Your subjects, grades and attendance at a glance."
        actions={
          <>
            <Link to="/student/grades" className="btn btn--secondary btn--sm">
              Grades <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link to="/student/attendance" className="btn btn--secondary btn--sm">
              Attendance <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </>
        }
      />

      <StatCards
        attendanceSummary={overview.attendanceSummary}
        subjects={overview.subjects}
        gradeSummary={overview.gradeSummary}
        classDoc={overview.class}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Subjects</h2>
              <p className="panel__desc">Your teachers for this academic year.</p>
            </div>
          </div>
          <div className="panel__body">
            {overview.subjects.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={28} aria-hidden="true" />}
                title="No subjects assigned"
                description="Subjects appear here once you are placed in a class with teaching assignments."
              />
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {overview.subjects.map((subject) => (
                  <li key={subject.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold">{subject.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{subject.code}</div>
                    </div>
                    <div className="min-w-0 text-right text-[13px] text-slate-600 dark:text-slate-300">
                      {subject.teacher ? subject.teacher.name : '—'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Grade summary</h2>
              <p className="panel__desc">Average across all recorded terms, per subject.</p>
            </div>
          </div>
          <div className="panel__body">
            {overview.gradeSummary.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={28} aria-hidden="true" />}
                title="No grades yet"
                description="Your teachers have not recorded marks for you yet."
              />
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {overview.gradeSummary.map((entry) => (
                  <li key={entry.subject.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold">{entry.subject.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{entry.count} term{entry.count === 1 ? '' : 's'} recorded</div>
                    </div>
                    <Badge tone={entry.average == null ? 'neutral' : entry.average >= 50 ? 'success' : 'danger'}>
                      {entry.average == null ? '—' : `${entry.average}%`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="panel mt-5">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Attendance this year</h2>
            <p className="panel__desc">Every status across all recorded sessions.</p>
          </div>
        </div>
        <div className="panel__body">
          {overview.attendanceSummary.total === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={28} aria-hidden="true" />}
              title="No attendance recorded"
              description="Attendance records will appear here once your teachers start taking sessions."
            />
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(overview.attendanceSummary)
                .filter(([key]) => key !== 'total' && key !== 'rate')
                .map(([status, count]) => (
                  <Badge key={status} tone={STATUS_TONES[status]} dot>
                    {status}: {count}
                  </Badge>
                ))}
              <span className="ml-auto text-[13px] text-slate-500 dark:text-slate-400">
                Total sessions: <strong className="text-slate-700 dark:text-slate-200">{overview.attendanceSummary.total}</strong>
              </span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
