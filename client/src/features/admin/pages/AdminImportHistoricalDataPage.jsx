import { useState } from 'react';
import { FileText, Upload, X, CheckCircle, AlertCircle, Loader2, Eye, Download, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '../../auth/api/auth.api.js';
import { confirmImportRequest, previewImportRequest } from '../api/admin.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';

const SAMPLE_CSV = `studentId,nationalId,academicYear,grade,section,subject1,mark1,maxMark1,subject2,mark2,maxMark2,subject3,mark3,maxMark3,schoolInfo,notes
,STU-001,2019/20,9,A,Mathematics,75,100,English,80,100,Science,78,100,Previous School,Imported from paper records
,STU-002,2019/20,9,A,Mathematics,82,100,English,75,100,Science,85,100,Previous School,Imported from paper records`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'historical-records-template.csv';
  link.click();
}

function PreviewTable({ preview, onConfirm, onCancel, loading }) {
  const validRecords = preview.filter((p) => p.valid);
  const invalidRecords = preview.filter((p) => !p.valid);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview Results</h3>
        <div className="flex gap-2">
          <Badge tone="success">{validRecords.length} Valid</Badge>
          <Badge tone="danger">{invalidRecords.length} Invalid</Badge>
          <Badge tone="neutral">{preview.length} Total</Badge>
        </div>
      </div>

      {validRecords.length > 0 && (
        <div className="overflow-x-auto max-h-[400px]">
          <table className="table w-full text-[12.5px]">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="th">Row</th>
                <th className="th">Student</th>
                <th className="th">Year</th>
                <th className="th">Grade</th>
                <th className="th">Section</th>
                <th className="th">Subjects</th>
                <th className="th">Avg</th>
                <th className="th">Source</th>
              </tr>
            </thead>
            <tbody>
              {validRecords.map((item, idx) => (
                <tr key={idx} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="td">{item.row}</td>
                  <td className="td">
                    <div className="font-medium">{item.data?.studentName || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{item.data?.studentNationalId || item.data?.studentId}</div>
                  </td>
                  <td className="td">{item.data?.academicYear}</td>
                  <td className="td"><Badge tone="primary">Grade {item.data?.grade}</Badge></td>
                  <td className="td">{item.data?.section}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {item.data?.subjects?.slice(0, 2).map((s, i) => (
                        <Badge key={i} tone="neutral" className="text-xs">{s.subject} ({s.mark}/{s.maxMark ?? 100})</Badge>
                      ))}
                      {item.data?.subjects?.length > 2 && <Badge tone="neutral" className="text-xs">+{item.data.subjects.length - 2} more</Badge>}
                    </div>
                  </td>
                  <td className="td">
                    {(() => {
                      let totalObtained = 0, totalMax = 0;
                      item.data?.subjects?.forEach((s) => { totalObtained += s.mark; totalMax += s.maxMark ?? 100; });
                      return totalMax > 0 ? `${Math.round((totalObtained / totalMax) * 100)}%` : '—';
                    })()}
                  </td>
                  <td className="td"><Badge tone="amber">Historical</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invalidRecords.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
            <AlertCircle size={16} aria-hidden="true" /> Invalid Records ({invalidRecords.length})
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {invalidRecords.map((item, idx) => (
              <div key={idx} className="text-sm text-slate-700 dark:text-slate-300 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <div className="font-medium">Row {item.row}: {item.errors.join('; ')}</div>
                {item.data && (
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    {JSON.stringify(item.data, null, 2).slice(0, 200)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button
          onClick={onConfirm}
          disabled={loading || validRecords.length === 0}
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : `Import ${validRecords.length} Records`}
        </Button>
      </div>
    </div>
  );
}

export function AdminImportHistoricalDataPage() {
  const [step, setStep] = useState('upload');
  const [previewData, setPreviewData] = useState(null);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['.csv', '.xlsx', '.xls'].some((ext) => f.name.toLowerCase().endsWith(ext))) {
      setFileError('Please select a CSV or Excel file');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB');
      return;
    }
    setFile(f);
    setFileError(null);
    setPreviewData(null);
    setImportResult(null);
  };

  const handlePreview = async () => {
    if (!file) return;
    try {
      const result = await previewImportRequest(file);
      setPreviewData(result);
      setStep('preview');
    } catch (err) {
      setFileError(extractErrorMessage(err, 'Could not preview file'));
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    setImportLoading(true);
    try {
      const validRecords = previewData.preview.filter((p) => p.valid).map((p) => p.data);
      const result = await confirmImportRequest(validRecords);
      setImportResult(result);
      setStep('result');
    } catch (err) {
      setImportResult({ message: extractErrorMessage(err, 'Import failed'), imported: 0, failed: 0, errors: [] });
      setStep('result');
    } finally {
      setImportLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setPreviewData(null);
    setFile(null);
    setFileError(null);
    setImportResult(null);
    const input = document.getElementById('file-input');
    if (input) input.value = '';
  };

  return (
    <>
      <PageHeader
        title="Import Historical Data"
        subtitle="Upload CSV or Excel files to bulk import historical academic records."
        actions={
          <Button variant="secondary" onClick={downloadSample}>
            <Download size={15} aria-hidden="true" /> Download Template
          </Button>
        }
      />

      {step === 'upload' && (
        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Upload File</h2>
            <p className="panel__desc">Select a CSV or Excel file containing historical academic records.</p>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" aria-hidden="true" />
            <input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Select CSV or Excel file"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Button variant="secondary" size="lg">
                <Upload size={18} aria-hidden="true" /> Choose File
              </Button>
            </label>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Supports CSV, XLSX, XLS · Max 5MB
            </p>
            {file && (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-slate-600 dark:text-slate-400" aria-hidden="true" />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} aria-label="Remove file">
                    <X size={16} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
            {fileError && <Alert tone="danger" className="mt-4">{fileError}</Alert>}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-medium mb-3">Expected Columns</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {[
                'studentId (MongoDB ID)',
                'nationalId (alternative)',
                'academicYear (e.g., 2023/24)',
                'grade (9, 10, 11, 12)',
                'section (A, B, C...)',
                'subject1, mark1, maxMark1',
                'subject2, mark2, maxMark2',
                '... up to 20 subjects',
                'schoolInfo (optional)',
                'notes (optional)',
              ].map((col, i) => (
                <Badge key={i} tone="neutral" className="text-xs h-auto px-2 py-1.5">{col}</Badge>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={handlePreview} disabled={!file || fileError}>
              <Eye size={16} aria-hidden="true" /> Preview Data
            </Button>
          </div>
        </section>
      )}

      {step === 'preview' && previewData && (
        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Preview & Confirm</h2>
            <p className="panel__desc">Review the parsed data before importing. Invalid records will be skipped.</p>
          </div>
          <PreviewTable
            preview={previewData.preview}
            onConfirm={handleConfirmImport}
            onCancel={() => setStep('upload')}
            loading={importLoading}
          />
        </section>
      )}

      {step === 'result' && importResult && (
        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Import Complete</h2>
            <p className="panel__desc">{importResult.message}</p>
          </div>

          <div className="flex gap-4 mb-4">
            <Badge tone="success" className="text-base px-4 py-2">{importResult.imported} Imported</Badge>
            <Badge tone={importResult.failed > 0 ? 'danger' : 'neutral'} className="text-base px-4 py-2">{importResult.failed} Failed</Badge>
          </div>

          {(importResult.errors || []).length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                <AlertCircle size={16} aria-hidden="true" /> Errors & Warnings
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {importResult.errors.map((err, idx) => (
                  <div key={idx} className="text-sm text-slate-700 dark:text-slate-300 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                    {err.error || err.message || JSON.stringify(err)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={reset}>
              <Upload size={16} aria-hidden="true" /> Import Another File
            </Button>
            <Button onClick={reset}>Done</Button>
          </div>
        </section>
      )}
    </>
  );
}