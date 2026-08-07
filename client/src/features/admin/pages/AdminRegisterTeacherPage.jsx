import { useState } from 'react';
import { BookUser, KeyRound, UserPlus } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage, listUsersRequest } from '../../auth/api/auth.api.js';
import { createUserRequest } from '../api/admin.api.js';
import { formatDate } from '../../auth/utils/format.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Field } from '../../../components/ui/Field.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

const EMPTY_FORM = {
  name: '',
  nationalId: '',
  employeeId: '',
  qualification: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  address: '',
};

export function AdminRegisterTeacherPage() {
  const recent = useAsync(() => listUsersRequest({ role: 'teacher', limit: 10 }));

  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [actionError, setActionError] = useState(null);

  const recentTeachers = recent.data?.users ?? [];

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
        role: 'teacher',
        employeeId: form.employeeId.trim() || null,
        qualification: form.qualification.trim() || null,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        emailVerified: true,
      });
      setCreated({ user: result.user, password: result.password ?? form.nationalId });
      await recent.run();
      setForm(EMPTY_FORM);
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not register the teacher'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Register teacher"
        subtitle="Create a teacher account. The username is their full name; if a National ID is provided it is the initial password, otherwise a temporary one is issued."
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
            <h2 className="panel__title">Teacher details</h2>
            <p className="panel__desc">Only the full name is required; everything else is optional.</p>
          </div>
        </div>
        <div className="panel__body">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit} noValidate>
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
            <Field label="Employee ID" hint="Optional staff number.">
              <input
                className="input"
                value={form.employeeId}
                onChange={(event) => setField('employeeId', event.target.value)}
                maxLength={20}
                placeholder="e.g. T001"
              />
            </Field>
            <Field label="Qualification" hint="Optional, e.g. BSc in Mathematics.">
              <input
                className="input"
                value={form.qualification}
                onChange={(event) => setField('qualification', event.target.value)}
                maxLength={120}
                placeholder="e.g. BSc in Mathematics"
              />
            </Field>
            <Field label="Gender">
              <select className="input" value={form.gender} onChange={(event) => setField('gender', event.target.value)}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                className="input"
                value={form.dateOfBirth}
                onChange={(event) => setField('dateOfBirth', event.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                maxLength={20}
                placeholder="e.g. +251 911 123 456"
              />
            </Field>
            <Field label="Address">
              <input
                className="input"
                value={form.address}
                onChange={(event) => setField('address', event.target.value)}
                maxLength={200}
                placeholder="e.g. Addis Ababa"
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" loading={busy} disabled={!form.name.trim()}>
                <UserPlus size={15} aria-hidden="true" />
                Register teacher
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Recently registered</h2>
            <p className="panel__desc">The latest teacher accounts.</p>
          </div>
        </div>
        <div className="panel__body">
          {recentTeachers.length === 0 ? (
            <EmptyState
              icon={<BookUser size={28} aria-hidden="true" />}
              title="No teachers yet"
              description="Registered teachers will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentTeachers.map((teacher) => (
                <li key={teacher.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                      <BookUser size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
                      {teacher.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {teacher.nationalId ? <KeyRound size={12} aria-hidden="true" /> : null}
                      {teacher.nationalId ?? 'No National ID'}
                      {teacher.employeeId ? <>· {teacher.employeeId}</> : null}
                      {teacher.qualification ? <>· {teacher.qualification}</> : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(teacher.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
