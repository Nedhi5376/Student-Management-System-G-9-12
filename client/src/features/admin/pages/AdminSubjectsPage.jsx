import { useState } from 'react';
import { BookMarked, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import {
  createSubjectRequest,
  deleteSubjectRequest,
  listSubjectsRequest,
  updateSubjectRequest,
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

const EMPTY_FORM = { code: '', name: '', grade: '9', description: '' };

export function AdminSubjectsPage() {
  const { data, loading, error, run } = useAsync(listSubjectsRequest);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const subjects = data?.subjects ?? [];

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setActionError(null);
    setNotice(null);
  };

  const startEdit = (subject) => {
    setEditingId(subject.id);
    setForm({
      code: subject.code,
      name: subject.name,
      grade: subject.grade,
      description: subject.description ?? '',
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
        await updateSubjectRequest(editingId, form);
        setNotice('Subject updated');
      } else {
        await createSubjectRequest(form);
        setNotice('Subject created');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not save subject'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (subject) => {
    if (!window.confirm(`Delete subject ${subject.name} (${subject.code})? Assignments and marks for it will also be removed.`)) return;
    setActionError(null);
    try {
      await deleteSubjectRequest(subject.id);
      await run();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not delete subject'));
    }
  };

  if (loading && !data) return <Spinner label="Loading subjects…" />;
  if (error && !data) return <ErrorState message={extractErrorMessage(error, 'Could not load subjects')} onRetry={run} />;

  return (
    <>
      <PageHeader title="Subjects" subtitle="The curriculum offered per grade. Assign them to classes from the Assignments page." />

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
            <h2 className="panel__title">{editingId ? 'Edit subject' : 'New subject'}</h2>
            <p className="panel__desc">A code is unique per grade.</p>
          </div>
        </div>
        <div className="panel__body">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit} noValidate>
            <Field label="Code" required>
              <input className="input" value={form.code} onChange={(event) => setField('code', event.target.value)} maxLength={12} placeholder="e.g. MATH" />
            </Field>
            <Field label="Name" required>
              <input className="input" value={form.name} onChange={(event) => setField('name', event.target.value)} maxLength={80} placeholder="e.g. Mathematics" />
            </Field>
            <Field label="Grade" required>
              <select className="input" value={form.grade} onChange={(event) => setField('grade', event.target.value)}>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={busy}>
                <Plus size={15} aria-hidden="true" />
                {editingId ? 'Save changes' : 'Create subject'}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={startCreate}>
                  Cancel
                </Button>
              ) : null}
            </div>
            <Field label="Description" className="sm:col-span-2 lg:col-span-4">
              <textarea className="input h-auto min-h-[64px] py-2" value={form.description} onChange={(event) => setField('description', event.target.value)} maxLength={300} placeholder="Optional short description" />
            </Field>
          </form>
        </div>
      </section>

      <section className="panel">
        {subjects.length === 0 ? (
          <EmptyState
            icon={<BookMarked size={28} aria-hidden="true" />}
            title="No subjects yet"
            description="Create your first subject above, then assign teachers to classes on the Assignments page."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-[13.5px]">
              <thead>
                <tr>
                  <th className="th">Code</th>
                  <th className="th">Name</th>
                  <th className="th">Grade</th>
                  <th className="th">Description</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="td font-mono text-[12.5px] font-semibold">{subject.code}</td>
                    <td className="td font-semibold">{subject.name}</td>
                    <td className="td">
                      <Badge tone="primary">{subject.grade}</Badge>
                    </td>
                    <td className="td max-w-[320px] truncate text-slate-500 dark:text-slate-400">{subject.description ?? '—'}</td>
                    <td className="td">
                      <div className="flex items-center gap-1.5">
                        <button type="button" className="btn btn--secondary btn--sm" onClick={() => startEdit(subject)} aria-label={`Edit ${subject.name}`}>
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(subject)} aria-label={`Delete ${subject.name}`}>
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
