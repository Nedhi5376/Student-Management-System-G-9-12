import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import {
  createHistoricalRecordRequest,
  deleteHistoricalRecordRequest,
  listHistoricalRecordsRequest,
  updateHistoricalRecordRequest,
} from '../api/admin.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';

const GRADES = ['9', '10', '11', '12'];

function SubjectMarkRow({ subject, mark, maxMark, onChange, onRemove, index }) {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 min-w-0">
        <label className="label">Subject</label>
        <Input
          value={subject}
          onChange={(e) => onChange(index, 'subject', e.target.value)}
          placeholder="Subject name"
          required
        />
      </div>
      <div className="w-24">
        <label className="label">Mark</label>
        <Input
          type="number"
          min="0"
          max="500"
          value={mark}
          onChange={(e) => onChange(index, 'mark', Number(e.target.value) || 0)}
          required
        />
      </div>
      <div className="w-24">
        <label className="label">Out of</label>
        <Input
          type="number"
          min="1"
          max="500"
          value={maxMark}
          onChange={(e) => onChange(index, 'maxMark', Number(e.target.value) || 100)}
        />
      </div>
      <Button variant="ghost" size="sm" onClick={() => onRemove(index)} aria-label="Remove subject">
        <XCircle size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}

function HistoricalRecordForm({ record, students, onSubmit, onCancel, loading, error }) {
  const [formData, setFormData] = useState({
    studentId: record?.studentId || '',
    academicYear: record?.academicYear || '',
    grade: record?.grade || '9',
    section: record?.section || 'A',
    subjects: record?.subjects?.map((s) => ({ subject: s.subject, mark: s.mark, maxMark: s.maxMark ?? 100 })) || [{ subject: '', mark: 0, maxMark: 100 }],
    schoolInfo: record?.schoolInfo || '',
    notes: record?.notes || '',
  });

  const handleSubjectChange = (index, field, value) => {
    setFormData((prev) => {
      const subjects = [...prev.subjects];
      subjects[index] = { ...subjects[index], [field]: value };
      return { ...prev, subjects };
    });
  };

  const addSubject = () => {
    setFormData((prev) => ({ ...prev, subjects: [...prev.subjects, { subject: '', mark: 0, maxMark: 100 }] }));
  };

  const removeSubject = (index) => {
    if (formData.subjects.length <= 1) return;
    setFormData((prev) => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentId) return;
    if (!formData.academicYear) return;
    if (!formData.subjects.some((s) => s.subject && s.mark !== undefined)) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Student *</label>
          <Select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} required>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.nationalId || s.rollNumber || 'No ID'}) - Grade {s.grade}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="label">Academic Year *</label>
          <Input
            value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            placeholder="e.g., 2023/24"
            required
          />
        </div>
        <div>
          <label className="label">Grade *</label>
          <Select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} required>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="label">Section *</label>
          <Input
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
            placeholder="A"
            maxLength={5}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Subjects & Marks *</label>
          <Button type="button" variant="secondary" size="sm" onClick={addSubject}>
            <Plus size={14} aria-hidden="true" /> Add Subject
          </Button>
        </div>
        <div className="space-y-3">
          {formData.subjects.map((subj, idx) => (
            <SubjectMarkRow
              key={idx}
              subject={subj.subject}
              mark={subj.mark}
              maxMark={subj.maxMark}
              onChange={handleSubjectChange}
              onRemove={removeSubject}
              index={idx}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">At least one subject with a mark is required</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">School Info</label>
          <Input
            value={formData.schoolInfo}
            onChange={(e) => setFormData({ ...formData, schoolInfo: e.target.value })}
            placeholder="Previous school name"
          />
        </div>
        <div>
          <label className="label">Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : record ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export function AdminAcademicHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [formError, setFormError] = useState(null);
  const [busyRecordId, setBusyRecordId] = useState(null);
  const [students, setStudents] = useState([]);

  const params = { page, limit, search: search || undefined, grade: gradeFilter || undefined, source: sourceFilter || undefined };
  const { data, loading, error, run } = useAsync(() => listHistoricalRecordsRequest(params), [page, limit, search, gradeFilter, sourceFilter]);

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/admin/users?role=student&limit=500', { credentials: 'include' });
      const data = await res.json();
      setStudents(data.users || []);
    } catch (e) {
      console.error('Failed to load students', e);
    }
  };

  const handleCreate = async (formData) => {
    setFormError(null);
    try {
      await createHistoricalRecordRequest(formData);
      setCreatingRecord(false);
      await run();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not create record'));
    }
  };

  const handleUpdate = async (formData) => {
    setFormError(null);
    try {
      await updateHistoricalRecordRequest(editingRecord.id, formData);
      setEditingRecord(null);
      await run();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not update record'));
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete historical record for ${record.studentId?.name || 'student'} (${record.academicYear}, Grade ${record.grade})?`)) return;
    setBusyRecordId(record.id);
    try {
      await deleteHistoricalRecordRequest(record.id);
      await run();
    } catch (err) {
      alert(extractErrorMessage(err, 'Could not delete record'));
    } finally {
      setBusyRecordId(null);
    }
  };

  if (loading && !data) return <Spinner label="Loading historical records…" />;

  const records = data?.records || [];
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Academic History"
        subtitle={total > 0 ? `All historical academic records — ${total} total.` : 'No historical records yet.'}
        actions={
          <>
            <Button variant="secondary" onClick={loadStudents}>
              <FileText size={15} aria-hidden="true" /> Refresh Students
            </Button>
            <Button onClick={() => { loadStudents(); setCreatingRecord(true); }}>
              <Plus size={15} aria-hidden="true" /> Add Record
            </Button>
          </>
        }
      />

      {error && !data && <ErrorState message={extractErrorMessage(error, 'Could not load records')} onRetry={run} />}

      <section className="panel mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by student name, year, grade..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<Search size={16} aria-hidden="true" />}
            />
          </div>
          <Select value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }} className="w-36">
            <option value="">All Grades</option>
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </Select>
          <Select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} className="w-36">
            <option value="">All Sources</option>
            <option value="historical">Historical</option>
            <option value="system">System</option>
          </Select>
        </div>
      </section>

      {(creatingRecord || editingRecord) && (
        <section className="panel mb-4">
          <div className="panel__header">
            <h2 className="panel__title">{editingRecord ? 'Edit' : 'Add'} Historical Record</h2>
          </div>
          <HistoricalRecordForm
            record={editingRecord}
            students={students}
            onSubmit={editingRecord ? handleUpdate : handleCreate}
            onCancel={() => { setEditingRecord(null); setCreatingRecord(false); setFormError(null); }}
            loading={busyRecordId === (editingRecord?.id || 'new')}
            error={formError}
          />
        </section>
      )}

      <section className="panel">
        <div className="overflow-x-auto">
          <table className="table w-full text-[13.5px]">
            <thead>
              <tr>
                <th className="th">Student</th>
                <th className="th">Academic Year</th>
                <th className="th">Grade</th>
                <th className="th">Section</th>
                <th className="th">Subjects</th>
                <th className="th">Average</th>
                <th className="th">Source</th>
                <th className="th">Created By</th>
                <th className="th w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="td text-center py-8">
                    <EmptyState icon={<FileText size={28} aria-hidden="true" />} title="No records found" description="Add historical records or import from CSV/Excel." />
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="td">
                      <div className="font-medium">{record.studentId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{record.studentId?.nationalId || record.studentId?.rollNumber || 'No ID'}</div>
                    </td>
                    <td className="td">{record.academicYear}</td>
                    <td className="td">
                      <Badge tone="primary">Grade {record.grade}</Badge>
                    </td>
                    <td className="td">{record.section}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {record.subjects?.slice(0, 3).map((s, i) => (
                          <Badge key={i} tone="neutral" className="text-xs">{s.subject} ({s.mark}/{s.maxMark ?? 100})</Badge>
                        ))}
                        {record.subjects?.length > 3 && <Badge tone="neutral" className="text-xs">+{record.subjects.length - 3} more</Badge>}
                      </div>
                    </td>
                    <td className="td font-medium">{record.average !== null ? `${record.average}%` : '—'}</td>
                    <td className="td">
                      <Badge tone={record.source === 'historical' ? 'amber' : 'success'}>{record.source}</Badge>
                    </td>
                    <td className="td text-sm">{record.createdBy?.name || '—'}</td>
                    <td className="td">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => { loadStudents(); setEditingRecord(record); }} disabled={busyRecordId === record.id} aria-label="Edit">
                          <Edit2 size={15} aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" tone="danger" onClick={() => handleDelete(record)} disabled={busyRecordId === record.id} aria-label="Delete">
                          <Trash2 size={15} aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
      </section>

      <Modal isOpen={creatingRecord || !!editingRecord} onClose={() => { setCreatingRecord(false); setEditingRecord(null); }} title={editingRecord ? 'Edit Historical Record' : 'Add Historical Record'} size="lg">
        <HistoricalRecordForm
          record={editingRecord}
          students={students}
          onSubmit={editingRecord ? handleUpdate : handleCreate}
          onCancel={() => { setEditingRecord(null); setCreatingRecord(false); setFormError(null); }}
          loading={busyRecordId === (editingRecord?.id || 'new')}
          error={formError}
        />
      </Modal>
    </>
  );
}