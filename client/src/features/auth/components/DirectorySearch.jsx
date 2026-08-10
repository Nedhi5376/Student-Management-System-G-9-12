import { useEffect, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { useAsync } from '../../../lib/useAsync.js';
import { extractErrorMessage, searchUsersRequest } from '../api/auth.api.js';
import { Alert } from '../../../components/ui/Alert.jsx';
import { Avatar } from '../../../components/ui/Avatar.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

const ROLE_TABS = [
  { value: 'student', label: 'Students' },
  { value: 'teacher', label: 'Teachers' },
];

function ResultMeta({ user }) {
  if (user.role === 'student') {
    const bits = [];
    if (user.grade) bits.push(`Grade ${user.grade}`);
    if (user.class?.name) bits.push(user.class.name);
    if (user.rollNumber) bits.push(`Roll ${user.rollNumber}`);
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {bits.length > 0 ? bits.join(' · ') : (user.nationalId ?? 'Student')}
      </div>
    );
  }
  return (
    <div className="text-xs text-slate-500 dark:text-slate-400">
      {user.qualification ?? (user.employeeId ?? 'Teacher')}
    </div>
  );
}

export function DirectorySearch() {
  const [role, setRole] = useState('student');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, loading, error } = useAsync(
    () => (debounced ? searchUsersRequest({ role, q: debounced }) : Promise.resolve({ users: [] })),
    [role, debounced],
  );

  const users = data?.users ?? [];

  return (
    <section className="panel mb-5">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Directory</h2>
          <p className="panel__desc">Search for students and teachers by name, National ID, roll number or employee ID.</p>
        </div>
      </div>
      <div className="panel__body">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setRole(tab.value)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${
                  role === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className="input pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${role === 'student' ? 'students' : 'teachers'}…`}
              aria-label={`Search ${role === 'student' ? 'students' : 'teachers'}`}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4">
            <Alert>{extractErrorMessage(error, 'Could not run the search')}</Alert>
          </div>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <Spinner label="Searching…" />
          ) : !debounced ? (
            <EmptyState
              icon={<Search size={28} aria-hidden="true" />}
              title="Type to search"
              description="Start typing a name, National ID, roll number or employee ID."
            />
          ) : users.length === 0 ? (
            <EmptyState
              icon={<SearchX size={28} aria-hidden="true" />}
              title="No matches"
              description={`No ${role === 'student' ? 'students' : 'teachers'} found for "${debounced}".`}
            />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={user.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                        {user.name}
                        <Badge tone={user.role === 'teacher' ? 'indigo' : 'neutral'}>{user.role}</Badge>
                      </div>
                      <ResultMeta user={user} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {user.nationalId ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
