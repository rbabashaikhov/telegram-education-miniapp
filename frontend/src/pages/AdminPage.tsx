import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getAdminToken, setAdminToken } from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import type { AdminDashboard, AdminLead, AdminStudent, TrialDetails } from '../types';
import { LEAD_STATUS, personName, TRIAL_STATUS } from '../lib/format';

export function AdminPage({ preview = false }: { preview?: boolean }) {
  const business = useBusiness();
  const [tab, setTab] = useState<'dashboard' | 'leads' | 'trials' | 'students'>('dashboard');
  const [token, setToken] = useState(getAdminToken());
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [trials, setTrials] = useState<TrialDetails[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const [d, l, t, s] = await Promise.all([
        api.adminDashboard(preview),
        api.adminLeads(preview),
        api.adminTrials(preview),
        api.adminStudents(preview),
      ]);
      setDashboard(d.data);
      setLeads(l.data);
      setTrials(t.data);
      setStudents(s.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить admin');
    }
  }, [preview]);

  useEffect(() => {
    void load();
  }, [load, token]);

  return (
    <div className="admin-shell">
      <header className="admin-head">
        <div>
          <p className="eyebrow">{preview ? 'Кабинет школы · только чтение' : 'Admin'}</p>
          <h1>{business.businessName}</h1>
          <p className="muted">Лёгкая консоль воронки, не полноценная CRM.</p>
        </div>
        <Link className="demo-chrome-cta" to="/">
          Открыть клиентское приложение
        </Link>
      </header>

      {!preview && (
        <div className="token-row card">
          <label>
            ADMIN_TOKEN
            <input
              type="password"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setAdminToken(event.target.value);
              }}
            />
          </label>
          {business.adminProtected && !token && <p className="banner">Запись заблокирована, пока не задан токен.</p>}
        </div>
      )}

      {preview && <p className="banner">Режим просмотра: статусы менять нельзя.</p>}
      {error && <div className="error-state">{error}</div>}

      <div className="admin-tabs">
        {(['dashboard', 'leads', 'trials', 'students'] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? 'is-on' : ''} onClick={() => setTab(item)}>
            {item === 'dashboard' ? 'Дашборд' : item === 'leads' ? 'Лиды' : item === 'trials' ? 'Пробные' : 'Ученики'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && dashboard && (
        <>
          <div className="kpi-grid">
            <div className="kpi"><span>Новые лиды</span><strong>{dashboard.kpis.newLeads}</strong></div>
            <div className="kpi"><span>Пробные занятия</span><strong>{dashboard.kpis.trials}</strong></div>
            <div className="kpi"><span>Новые ученики</span><strong>{dashboard.kpis.newStudents}</strong></div>
            <div className="kpi"><span>Продления</span><strong>{dashboard.kpis.renewals}</strong></div>
          </div>
          <section className="card funnel">
            <h2>Воронка · конверсия {dashboard.funnel.conversionRate}%</h2>
            {[
              ['Новые лиды', dashboard.funnel.newLeads],
              ['Квалифицированы', dashboard.funnel.qualified],
              ['Записались на пробное', dashboard.funnel.trialBooked],
              ['Посетили', dashboard.funnel.attended],
              ['Получили предложение', dashboard.funnel.offered],
              ['Купили', dashboard.funnel.converted],
            ].map(([label, value]) => (
              <div key={String(label)} className="funnel-row">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>
          <section className="card">
            <h2>Требуют внимания</h2>
            {dashboard.attention.length === 0 ? (
              <p className="muted">Сейчас нет горящих задач.</p>
            ) : (
              dashboard.attention.map((item) => (
                <article key={item.kind}>
                  <strong>{item.title}</strong>
                  <p className="muted">{item.detail}</p>
                </article>
              ))
            )}
          </section>
        </>
      )}

      {tab === 'leads' && (
        <section className="stack">
          {leads.map((lead) => (
            <article key={lead.id} className="card">
              <div className="list-row">
                <strong>{lead.customer ? personName(lead.customer) : 'Клиент'}</strong>
                <span className={`status ${lead.status}`}>{LEAD_STATUS[lead.status]}</span>
              </div>
              <p>{lead.student?.firstName ?? 'Ученик не указан'} · {lead.program?.title ?? 'программа не выбрана'}</p>
              <p className="muted">{lead.source}{lead.trial ? ` · пробное ${TRIAL_STATUS[lead.trial.status]}` : ''}</p>
              {!preview && (
                <div className="chip-row">
                  {lead.status !== 'LOST' && (
                    <button type="button" className="chip" onClick={() => void api.patchLead(lead.id, 'LOST').then(load)}>
                      Потерян
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === 'trials' && (
        <section className="stack">
          {trials.map((trial) => (
            <article key={trial.id} className="card">
              <div className="list-row">
                <strong>{trial.student.firstName} · {trial.program.title}</strong>
                <span className={`status ${trial.status}`}>{TRIAL_STATUS[trial.status]}</span>
              </div>
              <p className="muted">{trial.teacher.name}</p>
              {trial.teacherComment && <p>{trial.teacherComment}</p>}
              {!preview && (
                <div className="stack">
                  <textarea
                    placeholder="Комментарий преподавателя"
                    value={comments[trial.id] ?? trial.teacherComment}
                    onChange={(event) => setComments((prev) => ({ ...prev, [trial.id]: event.target.value }))}
                  />
                  <div className="row-actions">
                    {trial.status === 'BOOKED' && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          void api
                            .patchTrial(trial.id, {
                              status: 'ATTENDED',
                              teacherComment: comments[trial.id] ?? trial.teacherComment,
                            })
                            .then(load)
                        }
                      >
                        Отметить посещение
                      </button>
                    )}
                    {(trial.status === 'ATTENDED' || trial.status === 'COMPLETED' || trial.status === 'BOOKED') && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          void api
                            .patchTrial(trial.id, { teacherComment: comments[trial.id] ?? trial.teacherComment })
                            .then(() => api.createRecommendation(trial.id))
                            .then(load)
                        }
                      >
                        Создать рекомендацию
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === 'students' && (
        <section className="stack">
          {students.map((row) => (
            <article key={row.student.id} className="card">
              <strong>{row.student.firstName} {row.student.lastName}</strong>
              <p className="muted">{row.parent ? personName(row.parent) : 'родитель не указан'}</p>
              <p>{row.program?.title ?? 'без программы'} · {row.group?.title ?? 'без группы'}</p>
              <p>
                Остаток: {row.remainingLessons ?? '—'} · посещаемость {row.attendancePercent ?? '—'}%
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export function DemoAdminPage() {
  return <AdminPage preview />;
}
