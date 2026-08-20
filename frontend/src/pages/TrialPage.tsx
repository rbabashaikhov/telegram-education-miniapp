import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { TabBar } from '../components/TabBar';
import { usePortal } from '../context/PortalContext';
import type { TrialSlot } from '../types';
import { humanDate, timeOf } from '../lib/format';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function TrialPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const { portal, refresh } = usePortal();
  const programId = query.get('programId') ? Number(query.get('programId')) : undefined;
  const groupId = query.get('groupId') ? Number(query.get('groupId')) : undefined;
  const [leadId, setLeadId] = useState(query.get('leadId') ? Number(query.get('leadId')) : undefined);
  const [studentId, setStudentId] = useState(portal?.selectedStudent?.id);
  const [slots, setSlots] = useState<TrialSlot[]>([]);
  const [slot, setSlot] = useState<TrialSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void api
      .trialSlots({ programId, groupId })
      .then((res) => setSlots(res.data))
      .catch((err: Error) => setError(err.message));
  }, [programId, groupId]);

  const grouped = useMemo(() => {
    const map = new Map<string, TrialSlot[]>();
    for (const item of slots) {
      const day = item.startsAt.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return [...map.entries()];
  }, [slots]);

  async function confirm() {
    if (!slot || !studentId) {
      setError('Выберите ученика и слот.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      let resolvedLead = leadId;
      if (!resolvedLead) {
        const created = await api.createLead({ studentId, programId: slot.programId, source: 'trial' });
        resolvedLead = created.data.id;
        setLeadId(resolvedLead);
      }
      const booked = await api.bookTrial({
        leadId: resolvedLead,
        studentId,
        groupId: slot.groupId,
        startsAt: slot.startsAt,
      });
      await refresh();
      navigate('/trial/done', { state: booked.data });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось записать на пробное');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page">
      <Link className="back-link" to={programId ? `/programs/${programId}` : '/programs'}>
        ← Назад
      </Link>
      <header className="hero">
        <p className="eyebrow">Пробное занятие</p>
        <h1>Выберите слот</h1>
        <p className="lead">Программа, преподаватель и время — сразу, без звонка администратору.</p>
      </header>

      <section className="card stack" data-demo-tour="trial-booking">
        <label>
          Ученик
          <select value={studentId ?? ''} onChange={(event) => setStudentId(Number(event.target.value) || undefined)}>
            <option value="">Выберите ученика</option>
            {(portal?.students ?? []).map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>
        </label>
        {grouped.length === 0 ? (
          <div className="empty-state">Свободных пробных слотов сейчас нет. Попробуйте другую программу.</div>
        ) : (
          grouped.map(([day, items]) => (
            <div key={day} className="stack">
              <strong>{humanDate(day)}</strong>
              <div className="slot-grid">
                {items.map((item) => (
                  <button
                    key={`${item.groupId}-${item.startsAt}`}
                    type="button"
                    className={slot?.startsAt === item.startsAt && slot.groupId === item.groupId ? 'slot is-on' : 'slot'}
                    onClick={() => setSlot(item)}
                  >
                    <strong>{timeOf(item.startsAt)}</strong>
                    <span>{item.groupTitle}</span>
                    <span className="muted">{item.teacherName} · свободно {item.freeSeats}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
        {error && <p className="error-state">{error}</p>}
        <button type="button" className="btn btn-primary" disabled={!slot || pending} onClick={() => void confirm()}>
          {pending ? 'Записываем…' : 'Подтвердить запись'}
        </button>
      </section>
      <TabBar />
    </div>
  );
}

export function TrialDonePage() {
  const location = useLocation();
  const trial = location.state as
    | {
        student: { firstName: string };
        program: { title: string };
        teacher: { name: string };
        startsAt: string;
        branch: { name: string };
      }
    | undefined;

  if (!trial) {
    return (
      <div className="page">
        <div className="empty-state card">Запись не найдена. Вернитесь к выбору слота.</div>
        <Link className="btn btn-primary" to="/trial">К записи</Link>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Готово</p>
        <h1>{trial.student.firstName} записан на пробное</h1>
      </header>
      <section className="card">
        <p>{trial.program.title}</p>
        <p>{trial.teacher.name}</p>
        <p>{humanDate(trial.startsAt)}, {timeOf(trial.startsAt)}</p>
        <p className="muted">{trial.branch.name}</p>
        <p>Приходите за 10 минут. Сменная обувь не нужна, бейджик выдадим на ресепшен.</p>
      </section>
      <div className="row-actions">
        <Link className="btn btn-primary" to="/schedule">Мои занятия</Link>
        <Link className="btn btn-secondary" to="/">На главную</Link>
      </div>
      <TabBar />
    </div>
  );
}
