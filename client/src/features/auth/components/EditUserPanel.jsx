import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage, updateUserRequest } from '../api/auth.api.js';
import { listClassesRequest } from '../../admin/api/admin.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Field } from '../../../components/ui/Field.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

const GRADES = ['9', '10', '11', '12'];
const GENDERS = [
  { value: '', label: '— Not set —' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

function emptyForm(user) {
  return {
    name: user.name ?? '',
    nationalId: user.nationalId ?? '',
    email: user.email ?? '',
    gender: user.gender ?? '',
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    phone: user.phone ?? '',
    address: user.address ?? '',
    grade: user.grade ?? '',
    classId: user.class?.id ?? '',
    rollNumber: user.rollNumber ?? '',
    guardianName: user.guardianName ?? '',
    guardianPhone: user.guardianPhone ?? '',
    employeeId: user.employeeId ?? '',
    qualification: user.qualification ?? '',
  };
}

function buildPayload(form, role) {
  const payload = {
    name: form.name,
    nationalId: form.nationalId.trim() || undefined,
    email: form.email.trim() || undefined,
    gender: form.gender || null,
    dateOfBirth: form.dateOfBirth || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
  };
  if (role === 'student') {
    payload.grade = form.grade || null;
    payload.classId = form.classId || '';
    payload.rollNumber = form.rollNumber.trim() || null;
    payload.guardianName = form.guardianName.trim() || null;
    payload.guardianPhone = form.guardianPhone.trim() || null;
  }
  if (role === 'teacher') {
    payload.employeeId = form.employeeId.trim() || null;
    payload.qualification = form.qualification.trim() || null;
  }
  return payload;
}

export function EditUserPanel({ user, onSaved, onCancel }) {
  const classes = useAsync(listClassesRequest);
  const [form, setForm] = useState(() => emptyForm(user));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const classOptions = classes.data?.classes ?? [];
  const sectionsForGrade = classOptions.filter((klass) => klass.grade === form.grade);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateUserRequest(user.id, buildPayload(form, user.role));
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update user'));
    } finally {
      setBusy(false);
    }
  };

  if (classes.loading && !classes.data) return <Spinner label="Loading options…" />;

  return (
    <section className="panel mb-5">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Edit {user.role}</h2>
          <p className="panel__desc">Update the profile details for {user.name}.</p>
        </div>
      </div>
      <div className="panel__body">
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit} noValidate>
          <Field label="Full name" required>
            <input className="input" value={form.name} onChange={(event) => setField('name', event.target.value)} maxLength={80} />
          </Field>
          <Field label="National ID">
            <input className="input" value={form.nationalId} onChange={(event) => setField('nationalId', event.target.value)} maxLength={30} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} maxLength={254} />
          </Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={(event) => setField('gender', event.target.value)}>
              {GENDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date of birth">
            <input className="input" type="date" value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={(event) => setField('phone', event.target.value)} maxLength={20} />
          </Field>
          <Field label="Address">
            <input className="input" value={form.address} onChange={(event) => setField('address', event.target.value)} maxLength={200} />
          </Field>

          {user.role === 'student' ? (
            <>
              <Field label="Grade">
                <select className="input" value={form.grade} onChange={(event) => setField('grade', event.target.value)}>
                  <option value="">— Not assigned —</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Section" hint={sectionsForGrade.length === 0 ? 'Create this class first.' : undefined}>
                <select
                  className="input"
                  value={form.classId}
                  onChange={(event) => setField('classId', event.target.value)}
                  disabled={!form.grade}
                >
                  <option value="">— Unassigned —</option>
                  {sectionsForGrade.map((klass) => (
                    <option key={klass.id} value={klass.id}>
                      {klass.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Roll number">
                <input className="input" value={form.rollNumber} onChange={(event) => setField('rollNumber', event.target.value)} maxLength={10} />
              </Field>
              <Field label="Guardian name">
                <input className="input" value={form.guardianName} onChange={(event) => setField('guardianName', event.target.value)} maxLength={80} />
              </Field>
              <Field label="Guardian phone">
                <input className="input" value={form.guardianPhone} onChange={(event) => setField('guardianPhone', event.target.value)} maxLength={20} />
              </Field>
            </>
          ) : null}

          {user.role === 'teacher' ? (
            <>
              <Field label="Employee ID">
                <input className="input" value={form.employeeId} onChange={(event) => setField('employeeId', event.target.value)} maxLength={20} />
              </Field>
              <Field label="Qualification">
                <input className="input" value={form.qualification} onChange={(event) => setField('qualification', event.target.value)} maxLength={120} />
              </Field>
            </>
          ) : null}

          <div className="flex items-end gap-2 sm:col-span-2">
            <Button type="submit" loading={busy} disabled={!form.name.trim()}>
              <Save size={15} aria-hidden="true" />
              Save changes
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              <X size={15} aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
