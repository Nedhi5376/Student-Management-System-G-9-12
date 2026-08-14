import { BookOpen, FileText, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { useState } from 'react';
import { useAsync } from '../../../lib/useAsync.js';
import { useRecordEvents } from '../../../lib/useRecordEvents.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import { getGradesRequest, getAcademicHistoryRequest } from '../api/student.api.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

function percentage(obtained, max) {
  if (!max) return null;
  return Math.round((obtained / max) * 100);
}

function GradeBadge({ grade, source }) {
  const tones = { 9: 'slate', 10: 'blue', 11: 'purple', 12: 'primary' };
  return (
    <Badge tone={tones[grade] || 'neutral'} className="gap-1">
      Grade {grade}
      {source === 'historical' && <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Historical</span>}
      {source === 'system' && <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Current</span>}
    </Badge>
  );
}

function SubjectRow({ subject, mark, maxMark, term, comment, source }) {
  const pct = percentage(mark, maxMark);
  return (
    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <td className="td font-medium">
        {subject}
        {source === 'historical' && <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Historical</span>}
      </td>
      <td className="td">{term || 'Annual'}</td>
      <td className="td font-semibold">{mark}</td>
      <td className="td text-slate-500 dark:text-slate-400">{maxMark}</td>
      <td className="td">
        {pct == null ? (
          <Badge tone="neutral">—</Badge>
        ) : (
          <Badge tone={pct >= 50 ? 'success' : 'danger'}>{pct}%</Badge>
        )}
      </td>
      <td className="td text-slate-500 dark:text-slate-400">{comment ?? '—'}</td>
    </tr>
  );
}

function YearSection({ year, records, expanded, onToggle }) {
  const hasHistorical = records.some((r) => r.source === 'historical');
  const hasSystem = records.some((r) => r.source === 'system');

  const subjects = [];
  for (const record of records) {
    for (const subj of record.subjects || []) {
      const existing = subjects.find((s) => s.subject === subj.subject);
      if (existing) {
        existing.marks.push({ ...subj, source: record.source, term: subj.term || 'Annual', comment: subj.comment });
      } else {
        subjects.push({ subject: subj.subject, marks: [{ ...subj, source: record.source, term: subj.term || 'Annual', comment: subj.comment }] });
      }
    }
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <GradeBadge grade={year.grade} source={year.source} />
          <span className="font-medium text-slate-700 dark:text-slate-300">{year.academicYear}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">Section {year.section}</span>
          {year.className && <span className="text-sm text-slate-500 dark:text-slate-400">({year.className})</span>}
          {year.average !== null && (
            <Badge tone={year.average >= 50 ? 'success' : 'danger'}>{year.average}%</Badge>
          )}
        </div>
        {expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="table w-full text-[13px]">
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
                {subjects.map((subj, idx) =>
                  subj.marks.map((m, mi) => (
                    <SubjectRow
                      key={`${idx}-${mi}`}
                      subject={subj.subject}
                      mark={m.mark ?? m.marksObtained}
                      maxMark={m.maxMark ?? m.maxMarks}
                      term={m.term}
                      comment={m.comment}
                      source={m.source}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              {hasHistorical && <Badge tone="amber" className="mr-2">Historical Record</Badge>}
              {hasSystem && <Badge tone="success" className="mr-2">Current System</Badge>}
            </span>
            {year.schoolInfo && <span className="text-slate-500 dark:text-slate-400">School: {year.schoolInfo}</span>}
            {year.notes && <span className="text-slate-500 dark:text-slate-400">Notes: {year.notes}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentGradesPage() {
  const [expandedYears, setExpandedYears] = useState({});
  const { user } = useAuth();

  const { data: gradesData, loading: gradesLoading, error: gradesError, run: runGrades } = useAsync(getGradesRequest);
  const { data: historyData, loading: historyLoading, error: historyError, run: runHistory } = useAsync(getAcademicHistoryRequest);

  useRecordEvents({ userId: user?.id, onEvent: () => { runHistory(); runGrades(); } });

  const loading = gradesLoading || historyLoading;
  const error = gradesError || historyError;

  if (loading && !gradesData && !historyData) return <Spinner label="Loading your academic records…" />;
  if (error && !gradesData && !historyData) return <ErrorState message={extractErrorMessage(error, 'Could not load your grades')} onRetry={() => { runGrades(); runHistory(); }} />;

  const marks = gradesData?.marks ?? [];
  const historicalRecords = historyData?.records ?? [];

  const gradeSortKey = (grade) => {
    const order = { 9: 1, 10: 2, 11: 3, 12: 4 };
    return order[grade] ?? 99;
  };

  const yearMap = new Map();

  for (const record of historicalRecords) {
    const key = `${record.academicYear}|${record.grade}|${record.section}`;
    if (!yearMap.has(key)) {
      yearMap.set(key, {
        academicYear: record.academicYear,
        grade: record.grade,
        section: record.section,
        source: record.source,
        subjects: [],
        average: record.average,
        schoolInfo: record.schoolInfo,
        notes: record.notes,
      });
    }
    const year = yearMap.get(key);
    year.subjects.push(...record.subjects);
  }

  const currentByYear = new Map();
  for (const mark of marks) {
    const subject = mark.subject;
    if (!subject) continue;
    const classSubject = mark.classSubjectId;
    const classDoc = classSubject?.classId;
    const academicYear = classDoc?.academicYear || 'Current';
    const grade = classDoc?.grade || 'Unknown';
    const section = classDoc?.section || '';

    const key = `${academicYear}|${grade}|${section}`;
    if (!currentByYear.has(key)) {
      currentByYear.set(key, {
        academicYear,
        grade,
        section,
        source: 'system',
        subjects: [],
        classId: classDoc?._id,
        className: classDoc?.name,
      });
    }
    const year = currentByYear.get(key);
    year.subjects.push({
      subject: subject.name,
      subjectCode: subject.code,
      mark: mark.marksObtained,
      maxMark: mark.maxMarks,
      term: mark.term,
      comment: mark.comment,
    });
  }

  for (const [, year] of currentByYear) {
    let totalObtained = 0;
    let totalMax = 0;
    for (const subj of year.subjects) {
      totalObtained += subj.mark;
      totalMax += subj.maxMark;
    }
    year.average = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : null;
    yearMap.set(`${year.academicYear}|${year.grade}|${year.section}`, year);
  }

  const sortedYears = [...yearMap.values()].sort((a, b) => {
    const yearDiff = (a.academicYear || '').localeCompare(b.academicYear || '');
    if (yearDiff !== 0) return yearDiff;
    return gradeSortKey(a.grade) - gradeSortKey(b.grade);
  });

  const toggleYear = (year) => {
    const key = `${year.academicYear}|${year.grade}|${year.section}`;
    setExpandedYears((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isExpanded = (year) => {
    const key = `${year.academicYear}|${year.grade}|${year.section}`;
    return expandedYears[key] ?? false;
  };

  const totalRecords = marks.length + historicalRecords.length;

  return (
    <>
      <PageHeader
        title="My Academic Records"
        subtitle={totalRecords > 0 ? `Complete academic history — ${totalRecords} record${totalRecords === 1 ? '' : 's'} across all years.` : 'No academic records yet.'}
        actions={
          <a href="/student/transcript" className="btn btn--secondary">
            <FileText size={15} aria-hidden="true" /> View Transcript
          </a>
        }
      />

      <section className="panel">
        {sortedYears.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={28} aria-hidden="true" />}
            title="No academic records yet"
            description="Your grades will appear here once teachers record them, or when historical records are added by an administrator."
          />
        ) : (
          <div className="space-y-4">
            {sortedYears.map((year, idx) => (
              <YearSection key={idx} year={year} expanded={isExpanded(year)} onToggle={toggleYear} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}