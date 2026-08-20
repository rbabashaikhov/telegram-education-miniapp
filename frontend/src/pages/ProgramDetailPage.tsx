import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { TabBar } from '../components/TabBar';
import type { GroupDetails, Program } from '../types';
import { money } from '../lib/format';

export function ProgramDetailPage() {
  const { id } = useParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [groups, setGroups] = useState<GroupDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const programId = Number(id);
    if (!programId) return;
    void Promise.all([api.getProgram(programId), api.getGroups(programId)])
      .then(([p, g]) => {
        setProgram(p.data);
        setGroups(g.data);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) return <div className="error-state">{error}</div>;
  if (!program) return <div className="loading">Загрузка программы…</div>;

  return (
    <div className="page">
      <Link className="back-link" to="/programs">
        ← Назад
      </Link>
      <header className="hero">
        <p className="eyebrow">{program.level}</p>
        <h1>{program.title}</h1>
        <p className="lead">{program.description}</p>
      </header>
      <section className="card">
        <p>{program.ageFrom}–{program.ageTo} лет · {program.durationMinutes} минут</p>
        <p>от {money(program.priceFrom)}</p>
      </section>
      {groups.length === 0 ? (
        <div className="empty-state card">Свободных групп пока нет. Оставьте заявку на подбор.</div>
      ) : (
        groups.map((group) => (
          <article key={group.id} className="card">
            <h2>{group.title}</h2>
            <p>{group.schedule.labels.join(' / ')} {group.schedule.startTime}</p>
            <p className="muted">Преподаватель: {group.teacher.name}</p>
            <p>Свободно: {group.freeSeats} места</p>
          </article>
        ))
      )}
      <div className="row-actions">
        <Link className="btn btn-primary" to={`/trial?programId=${program.id}`}>Записаться на пробное</Link>
        <Link className="btn btn-secondary" to="/match">Подобрать программу</Link>
      </div>
      <TabBar />
    </div>
  );
}
