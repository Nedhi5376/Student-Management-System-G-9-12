import { useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage, listUsersRequest } from '../../auth/api/auth.api.js';
import {
  createAssignmentRequest,
  deleteAssignmentRequest,
  listAssignmentsRequest,
  listClassesRequest,
  listSubjectsRequest,
} from '../api/admin.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Field } from '../../../components/ui/Field.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

export function AdminAssignmentsPage() {
  const { data, loading, error, run } = useAsync(listAssignmentsRequest);
  const classes = useAsync(listClassesRequest);
  const subjects = useAsync(listSubjectsRequest);
  const teachers = useAsync(() => listUsersRequest({ role: 'teacher', limit: 100 }));

  const [form, setForm] = useState({ classId: '', subjectId: '', teacherId: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const assignments = data?.assignments ?? [];
  const classOptions = classes.data?.classes ?? [];
  const subjectOptions = subjects.data?.subjects ?? [];
  const teacherOptions = teachers.data?.users ?? [];

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await createAssignmentRequest(form);
      setNotice('Assignment created');
      setForm({ classId: '', subjectId: '', teacherId: '' });
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not create assignment'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (assignment) => {
    if (!window.confirm(`Remove assignment of ${assignment.subject?.name ?? 'this subject'} to ${assignment.class?.name ?? 'this class'}? Marks recorded for it will be deleted.`)) return;
    setActionError(null);
    try {
      await deleteAssignmentRequest(assignment.id);
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not delete assignment'));
    }
  };

  const canSubmit = form.classId && form.subjectId && form.teacherId;

  if (loading && !data) return <Spinner label="Loading assignments…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load assignments')} onRetry={run} />;

  return (
    <>
      <PageHeader title="Assignments" subtitle="Decide which teacher teaches which subject in which class." />

      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      ) : null}

      <section className="panel mb-5">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">New assignment</h2>
            <p className="panel__desc">A subject can only be assigned once per class.</p>
          </div>
        </div>
        <div className="panel__body">
          <form className="grid gap-4 sm:grid-cols-3" onSubmit={submit} noValidate>
            <Field label="Class" required hint={classOptions.length === 0 ? 'Create a class first.' : undefined}>
              <select className="input" value={form.classId} onChange={(event) => setField('classId', event.target.value)}>
                <option value="">Select class…</option>
                {classOptions.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject" required hint={subjectOptions.length === 0 ? 'Create a subject first.' : undefined}>
              <select className="input" value={form.subjectId} onChange={(event) => setField('subjectId', event.target.value)}>
                <option value="">Select subject…</option>
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Teacher" required hint={teacherOptions.length === 0 ? 'Create a teacher account first.' : undefined}>
              <select className="input" value={form.teacherId} onChange={(event) => setField('teacherId', event.target.value)}>
                <option value="">Select teacher…</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end sm:col-span-3">
              <Button type="submit" loading={busy} disabled={!canSubmit}>
                <Plus size={15} aria-hidden="true" />
                Create assignment
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel">
        {assignments.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={28} aria-hidden="true" />}
            title="No assignments yet"
            description="Assign a subject to a class and a teacher above. Teachers will see it on their dashboard."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-[13.5px]">
              <thead>
                <tr>
                  <th className="th">Class</th>
                  <th className="th">Subject</th>
                  <th className="th">Teacher</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="td">
                      <span className="font-semibold">{assignment.class?.name ?? '—'}</span>{' '}
                      {assignment.class?.grade ? <Badge tone="neutral">Grade {assignment.class.grade}</Badge> : null}
                    </td>
                    <td className="td">
                      <span className="font-semibold">{assignment.subject?.name ?? '—'}</span>{' '}
                      {assignment.subject?.code ? <span className="text-xs text-slate-400">{assignment.subject.code}</span> : null}
                    </td>
                    <td className="td">{assignment.teacher?.name ?? '—'}</td>
                    <td className="td">
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(assignment)} aria-label={`Delete ${assignment.subject?.name} assignment`}>
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
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
