import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { TabBar } from '../components/TabBar';
import { usePortal } from '../context/PortalContext';
import type { GroupDetails } from '../types';

const AGE = [
  { id: '4-6', label: '4–6' },
  { id: '7-9', label: '7–9' },
  { id: '10-12', label: '10–12' },
  { id: '13-16', label: '13–16' },
  { id: 'adult', label: 'взрослый' },
];
const GOALS = [
  'улучшить школьную успеваемость',
  'разговорный английский',
  'подготовка к экзамену',
  'обучение с нуля',
  'подготовка к школе',
  'робототехника',
  'программирование',
  'творческое развитие',
];
const LEVELS = ['начинающий', 'базовый', 'средний', 'высокий', 'не знаю'];
const FORMATS = [
  { id: 'group', label: 'группа' },
  { id: 'individual', label: 'индивидуально' },
  { id: 'any', label: 'не важно' },
];
const TIMES = [
  { id: 'weekday_morning', label: 'будни утром' },
  { id: 'weekday_after_school', label: 'будни после школы' },
  { id: 'weekday_evening', label: 'будни вечером' },
  { id: 'weekend', label: 'выходные' },
];

export function MatchPage() {
  const navigate = useNavigate();
  const { portal, refresh } = usePortal();
  const [draft, setDraft] = useState({
    ageBand: '10-12',
    goal: 'разговорный английский',
    currentLevel: 'начинающий',
    preferredFormat: 'group',
    preferredTime: 'weekday_evening',
    studentId: portal?.selectedStudent?.id,
  });
  const [results, setResults] = useState<GroupDetails[] | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const studentOptions = portal?.students ?? [];

  const canSubmit = useMemo(() => Boolean(draft.ageBand && draft.goal), [draft]);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await api.match({
        ...draft,
        studentId: draft.studentId,
        source: 'miniapp',
      });
      setLeadId(res.data.lead.id);
      setResults(res.data.recommendations);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось подобрать программу');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page">
      <Link className="back-link" to="/">
        ← Назад
      </Link>
      <header className="hero">
        <p className="eyebrow">Квалификация</p>
        <h1>Подобрать программу</h1>
        <p className="lead">Несколько коротких вопросов — и школа понимает, куда приглашать.</p>
      </header>

      <form
        className="card stack"
        data-demo-tour="qualification-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {studentOptions.length > 0 && (
          <label>
            Ученик
            <select
              value={draft.studentId ?? ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, studentId: Number(event.target.value) || undefined }))}
            >
              <option value="">Выберу позже</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName}
                </option>
              ))}
            </select>
          </label>
        )}
        <div>
          <p>Возраст</p>
          <div className="chip-row">
            {AGE.map((item) => (
              <button
                key={item.id}
                type="button"
                className={draft.ageBand === item.id ? 'chip is-on' : 'chip'}
                onClick={() => setDraft((prev) => ({ ...prev, ageBand: item.id }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p>Цель</p>
          <div className="chip-row">
            {GOALS.map((item) => (
              <button
                key={item}
                type="button"
                className={draft.goal === item ? 'chip is-on' : 'chip'}
                onClick={() => setDraft((prev) => ({ ...prev, goal: item }))}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p>Текущий уровень</p>
          <div className="chip-row">
            {LEVELS.map((item) => (
              <button
                key={item}
                type="button"
                className={draft.currentLevel === item ? 'chip is-on' : 'chip'}
                onClick={() => setDraft((prev) => ({ ...prev, currentLevel: item }))}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p>Формат</p>
          <div className="chip-row">
            {FORMATS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={draft.preferredFormat === item.id ? 'chip is-on' : 'chip'}
                onClick={() => setDraft((prev) => ({ ...prev, preferredFormat: item.id }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p>Удобное время</p>
          <div className="chip-row">
            {TIMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={draft.preferredTime === item.id ? 'chip is-on' : 'chip'}
                onClick={() => setDraft((prev) => ({ ...prev, preferredTime: item.id }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="error-state">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={!canSubmit || pending}>
          {pending ? 'Подбираем…' : 'Показать рекомендации'}
        </button>
      </form>

      {results && (
        <section className="stack">
          <h2>Подходящие группы</h2>
          {results.length === 0 ? (
            <div className="empty-state card">По этим условиям свободных групп нет. Попробуйте другое время.</div>
          ) : (
            results.map((group) => (
              <article key={group.id} className="card">
                <h2>{group.title}</h2>
                <p>{group.schedule.labels.join(' / ')} {group.schedule.startTime}</p>
                <p>Преподаватель: {group.teacher.name}</p>
                <p>Свободно: {group.freeSeats} места</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(`/trial?programId=${group.programId}&groupId=${group.id}&leadId=${leadId ?? ''}`)
                  }
                >
                  Записаться на пробное
                </button>
              </article>
            ))
          )}
        </section>
      )}
      <Link className="btn btn-ghost" to="/">На главную</Link>
      <TabBar />
    </div>
  );
}
