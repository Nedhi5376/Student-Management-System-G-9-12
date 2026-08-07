import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Save } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import {
  getAttendanceRequest,
  getRosterRequest,
  saveAttendanceRequest,
  saveMarksRequest,
} from '../api/teacher.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Final'];
const STATUSES = ['present', 'absent', 'late', 'excused'];

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function MarksPanel({ assignmentId, students, marks, onSaved }) {
  const [term, setTerm] = useState(TERMS[0]);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const existingByStudent = useMemo(() => {
    const map = {};
    for (const mark of marks) {
      if (mark.term === term) map[mark.studentId] = mark;
    }
    return map;
  }, [marks, term]);

  useEffect(() => {
    const next = {};
    for (const student of students) {
      const mark = existingByStudent[student.id];
      next[student.id] = {
        marksObtained: mark ? String(mark.marksObtained) : '',
        maxMarks: mark?.maxMarks ? String(mark.maxMarks) : '',
        comment: mark?.comment ?? '',
      };
    }
    setDrafts(next);
    setNotice(null);
  }, [existingByStudent, students]);

  const update = (studentId, field, value) =>
    setDrafts((current) => ({ ...current, [studentId]: { ...current[studentId], [field]: value } }));

  const save = async () => {
    const entries = Object.entries(drafts)
      .filter(([, draft]) => draft.marksObtained !== '' && draft.marksObtained != null)
      .map(([studentId, draft]) => ({
        studentId,
        marksObtained: Number(draft.marksObtained),
        ...(draft.maxMarks ? { maxMarks: Number(draft.maxMarks) } : {}),
        comment: draft.comment?.trim() ? draft.comment.trim() : null,
      }));

    if (entries.length === 0) {
      setError('Enter marks for at least one student before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await saveMarksRequest({ classSubjectId: assignmentId, term, entries });
      setNotice(result.message);
      await onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save marks'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Record marks — {term}</h2>
          <p className="panel__desc">Leave a student blank to skip them. Saved entries are overwritten per term.</p>
        </div>
        <select className="input input--sm w-[130px]" value={term} onChange={(event) => setTerm(event.target.value)} aria-label="Term">
          {TERMS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="panel__body">
        {notice ? (
          <div className="mb-4">
            <Alert tone="success">{notice}</Alert>
          </div>
        ) : null}
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        {students.length === 0 ? (
          <EmptyState icon={<Save size={28} aria-hidden="true" />} title="No students in this class" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full text-[13.5px]">
                <thead>
                  <tr>
                    <th className="th">Student</th>
                    <th className="th w-[120px]">Marks</th>
                    <th className="th w-[110px]">Out of</th>
                    <th className="th">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const draft = drafts[student.id] ?? { marksObtained: '', maxMarks: '', comment: '' };
                    return (
                      <tr key={student.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="td">
                          <div className="font-semibold">{student.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{student.rollNumber ?? '—'}</div>
                        </td>
                        <td className="td">
                          <input
                            type="number"
                            min="0"
                            className="input input--sm"
                            value={draft.marksObtained}
                            onChange={(event) => update(student.id, 'marksObtained', event.target.value)}
                            aria-label={`Marks for ${student.name}`}
                          />
                        </td>
                        <td className="td">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            className="input input--sm"
                            placeholder="100"
                            value={draft.maxMarks}
                            onChange={(event) => update(student.id, 'maxMarks', event.target.value)}
                            aria-label={`Max marks for ${student.name}`}
                          />
                        </td>
                        <td className="td">
                          <input
                            type="text"
                            maxLength={200}
                            className="input input--sm"
                            value={draft.comment}
                            onChange={(event) => update(student.id, 'comment', event.target.value)}
                            aria-label={`Comment for ${student.name}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={save} loading={saving}>
                <Save size={15} aria-hidden="true" />
                Save {term} marks
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function AttendancePanel({ classId, students }) {
  const [date, setDate] = useState(todayISO());
  const [statuses, setStatuses] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const loadExisting = useCallback(async () => {
    if (!classId) return;
    try {
      const data = await getAttendanceRequest({ classId, date });
      const map = {};
      for (const student of students) map[student.id] = 'present';
      for (const record of data.records ?? []) {
        if (record.student?.id) map[record.student.id] = record.status;
      }
      setStatuses(map);
    } catch {
      setStatuses(Object.fromEntries(students.map((student) => [student.id, 'present'])));
    }
  }, [classId, date, students]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const save = async () => {
    const entries = students.map((student) => ({
      studentId: student.id,
      status: statuses[student.id] ?? 'present',
    }));

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await saveAttendanceRequest({ classId, date, entries });
      setNotice(result.message);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save attendance'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Record attendance</h2>
          <p className="panel__desc">Set a status for every student on the chosen date.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-400" aria-hidden="true" />
          <input
            type="date"
            className="input input--sm w-[150px]"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Attendance date"
          />
        </div>
      </div>

      <div className="panel__body">
        {notice ? (
          <div className="mb-4">
            <Alert tone="success">{notice}</Alert>
          </div>
        ) : null}
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        {students.length === 0 ? (
          <EmptyState icon={<CalendarDays size={28} aria-hidden="true" />} title="No students in this class" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full text-[13.5px]">
                <thead>
                  <tr>
                    <th className="th">Student</th>
                    <th className="th w-[180px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="td">
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{student.rollNumber ?? '—'}</div>
                      </td>
                      <td className="td">
                        <select
                          className="input input--sm"
                          value={statuses[student.id] ?? 'present'}
                          onChange={(event) => setStatuses((current) => ({ ...current, [student.id]: event.target.value }))}
                          aria-label={`Attendance status for ${student.name}`}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={save} loading={saving}>
                <Save size={15} aria-hidden="true" />
                Save attendance
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function TeacherRosterPage() {
  const { assignmentId } = useParams();
  const roster = useAsync(() => getRosterRequest(assignmentId), [assignmentId]);

  if (roster.loading && !roster.data) return <Spinner label="Loading roster…" />;
  if (roster.error && !roster.data)
    return <ErrorState message={extractErrorMessage(roster.error, 'Could not load the roster')} onRetry={roster.run} />;

  const assignment = roster.data?.assignment;
  const students = roster.data?.students ?? [];
  const marks = roster.data?.marks ?? [];
  const classId = assignment?.class?.id;

  const title = assignment ? `${assignment.subject?.name ?? 'Subject'} · ${assignment.class?.name ?? 'Class'}` : 'Class roster';

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`${students.length} student${students.length === 1 ? '' : 's'} enrolled.`}
        actions={
          <Link to="/teacher" className="btn btn--secondary btn--sm">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to my classes
          </Link>
        }
      />

      <MarksPanel assignmentId={assignmentId} students={students} marks={marks} onSaved={roster.run} />

      {classId ? (
        <div className="mt-5">
          <AttendancePanel classId={classId} students={students} />
        </div>
      ) : null}
    </>
  );
}
