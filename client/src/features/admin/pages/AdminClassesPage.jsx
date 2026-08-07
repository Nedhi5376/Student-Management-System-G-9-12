import { useState } from 'react';
import { Building2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage, listUsersRequest } from '../../auth/api/auth.api.js';
import {
  createClassRequest,
  deleteClassRequest,
  listClassesRequest,
  updateClassRequest,
} from '../api/admin.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Field } from '../../../components/ui/Field.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

const GRADES = ['9', '10', '11', '12'];

const EMPTY_FORM = { grade: '9', section: '', academicYear: '', classTeacher: '', roomNumber: '' };

function classPayload(form) {
  return {
    grade: form.grade,
    section: form.section,
    academicYear: form.academicYear.trim() || undefined,
    classTeacher: form.classTeacher || '',
    roomNumber: form.roomNumber.trim() || null,
  };
}

export function AdminClassesPage() {
  const { data, loading, error, run } = useAsync(listClassesRequest);
  const teachers = useAsync(() => listUsersRequest({ role: 'teacher', limit: 100 }));

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const classes = data?.classes ?? [];
  const teacherOptions = teachers.data?.users ?? [];

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setActionError(null);
    setNotice(null);
  };

  const startEdit = (klass) => {
    setEditingId(klass.id);
    setForm({
      grade: klass.grade,
      section: klass.section,
      academicYear: klass.academicYear ?? '',
      classTeacher: klass.classTeacher?.id ?? '',
      roomNumber: klass.roomNumber ?? '',
    });
    setActionError(null);
    setNotice(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      if (editingId) {
        await updateClassRequest(editingId, classPayload(form));
        setNotice('Class updated');
      } else {
        await createClassRequest(classPayload(form));
        setNotice('Class created');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not save class'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (klass) => {
    if (!window.confirm(`Delete class ${klass.name}? Marks, attendance and assignments for it will also be removed.`)) return;
    setActionError(null);
    try {
      await deleteClassRequest(klass.id);
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not delete class'));
    }
  };

  if (loading && !data) return <Spinner label="Loading classes…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load classes')} onRetry={run} />;

  return (
    <>
      <PageHeader title="Classes" subtitle="Grades, sections and room assignment for the current academic year." />

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
            <h2 className="panel__title">{editingId ? 'Edit class' : 'New class'}</h2>
            <p className="panel__desc">{editingId ? 'Update the details below.' : 'Add a grade and section for this academic year.'}</p>
          </div>
        </div>
        <div className="panel__body">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit} noValidate>
            <Field label="Grade" required>
              <select className="input" value={form.grade} onChange={(event) => setField('grade', event.target.value)}>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Section" required>
              <input className="input" value={form.section} onChange={(event) => setField('section', event.target.value)} maxLength={5} placeholder="e.g. A" />
            </Field>
            <Field label="Academic year">
              <input className="input" value={form.academicYear} onChange={(event) => setField('academicYear', event.target.value)} maxLength={12} placeholder="e.g. 2025/26" />
            </Field>
            <Field label="Room">
              <input className="input" value={form.roomNumber} onChange={(event) => setField('roomNumber', event.target.value)} maxLength={20} placeholder="e.g. 201" />
            </Field>
            <Field label="Class teacher" hint={teacherOptions.length === 0 ? 'No teacher accounts yet.' : undefined}>
              <select className="input" value={form.classTeacher} onChange={(event) => setField('classTeacher', event.target.value)}>
                <option value="">— Unassigned —</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button type="submit" loading={busy}>
                <Plus size={15} aria-hidden="true" />
                {editingId ? 'Save changes' : 'Create class'}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={startCreate}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="panel">
        {classes.length === 0 ? (
          <EmptyState
            icon={<Building2 size={28} aria-hidden="true" />}
            title="No classes yet"
            description="Create your first class above, then assign students to it from the user directory."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-[13.5px]">
              <thead>
                <tr>
                  <th className="th">Class</th>
                  <th className="th">Academic year</th>
                  <th className="th">Class teacher</th>
                  <th className="th">Students</th>
                  <th className="th">Room</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((klass) => (
                  <tr key={klass.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="td font-semibold">{klass.name}</td>
                    <td className="td text-slate-500 dark:text-slate-400">{klass.academicYear}</td>
                    <td className="td">{klass.classTeacher?.name ?? <Badge tone="neutral">Unassigned</Badge>}</td>
                    <td className="td">
                      <Badge tone="indigo">
                        <Users size={13} aria-hidden="true" /> {klass.studentCount ?? 0}
                      </Badge>
                    </td>
                    <td className="td text-slate-500 dark:text-slate-400">{klass.roomNumber ?? '—'}</td>
                    <td className="td">
                      <div className="flex items-center gap-1.5">
                        <button type="button" className="btn btn--secondary btn--sm" onClick={() => startEdit(klass)} aria-label={`Edit ${klass.name}`}>
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(klass)} aria-label={`Delete ${klass.name}`}>
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
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
