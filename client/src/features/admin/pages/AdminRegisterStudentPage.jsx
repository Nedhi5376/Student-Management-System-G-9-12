import { useState } from 'react';
import { GraduationCap, KeyRound, UserPlus } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage, listUsersRequest } from '../../auth/api/auth.api.js';
import { createUserRequest, listClassesRequest } from '../api/admin.api.js';
import { formatDate } from '../../auth/utils/format.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Field } from '../../../components/ui/Field.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

const GRADES = ['9', '10', '11', '12'];

const EMPTY_FORM = { name: '', nationalId: '', grade: '9', classId: '' };

export function AdminRegisterStudentPage() {
  const classes = useAsync(listClassesRequest);
  const recent = useAsync(() => listUsersRequest({ role: 'student', limit: 10 }));

  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [actionError, setActionError] = useState(null);

  const classOptions = classes.data?.classes ?? [];
  const sectionsForGrade = classOptions.filter((klass) => klass.grade === form.grade);
  const recentStudents = recent.data?.users ?? [];

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    setCreated(null);
    try {
      const result = await createUserRequest({
        name: form.name,
        nationalId: form.nationalId.trim() || null,
        role: 'student',
        grade: form.grade,
        classId: form.classId || null,
        emailVerified: true,
      });
      setCreated({ user: result.user, password: result.password ?? form.nationalId });
      await recent.run();
      setForm(EMPTY_FORM);
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not register the student'));
    } finally {
      setBusy(false);
    }
  };

  if (classes.loading && !classes.data) return <Spinner label="Loading classes…" />;

  return (
    <>
      <PageHeader
        title="Register student"
        subtitle="Create a student account. The username is their full name; if a National ID is provided it is the initial password, otherwise a temporary one is issued."
      />

      {actionError ? (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      ) : null}

      {created ? (
        <div className="mb-4">
          <Alert tone="success">
            <span>
              <strong>{created.user.name}</strong> registered successfully. Hand over these credentials:{' '}
              <strong>Username:</strong> {created.user.name} · <strong>Password:</strong> {created.password}
            </span>
          </Alert>
        </div>
      ) : null}

      <section className="panel mb-5">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Student details</h2>
            <p className="panel__desc">Only the full name is required; National ID, grade and section are optional.</p>
          </div>
        </div>
        <div className="panel__body">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit} noValidate>
            <Field label="Full name" required>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                maxLength={80}
                placeholder="e.g. Abebe Kebede"
              />
            </Field>
            <Field label="National ID" hint="If provided, also used as the initial password.">
              <input
                className="input"
                value={form.nationalId}
                onChange={(event) => setField('nationalId', event.target.value)}
                maxLength={30}
                placeholder="e.g. KD12345678"
              />
            </Field>
            <Field label="Grade">
              <select className="input" value={form.grade} onChange={(event) => setField('grade', event.target.value)}>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Section" hint={sectionsForGrade.length === 0 ? 'Create this class first.' : undefined}>
              <select className="input" value={form.classId} onChange={(event) => setField('classId', event.target.value)}>
                <option value="">Select section…</option>
                {sectionsForGrade.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" loading={busy} disabled={!form.name.trim()}>
                <UserPlus size={15} aria-hidden="true" />
                Register student
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Recently registered</h2>
            <p className="panel__desc">The latest student accounts.</p>
          </div>
        </div>
        <div className="panel__body">
          {recentStudents.length === 0 ? (
            <EmptyState
              icon={<GraduationCap size={28} aria-hidden="true" />}
              title="No students yet"
              description="Registered students will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentStudents.map((student) => (
                <li key={student.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                      <GraduationCap size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
                      {student.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {student.nationalId ? <KeyRound size={12} aria-hidden="true" /> : null}
                      {student.nationalId ?? 'No National ID'}
                      {student.class ? <>· {student.class.name}</> : null}
                      {student.grade ? <>· Grade {student.grade}</> : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(student.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
