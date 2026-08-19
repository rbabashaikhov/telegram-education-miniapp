import { Link } from 'react-router-dom';
import { TabBar } from '../components/TabBar';
import { usePortal } from '../context/PortalContext';
import { money } from '../lib/format';

export function ProgramsPage() {
  const { portal, loading, error } = usePortal();
  if (loading) return <div className="loading">Загрузка программ…</div>;
  if (error) return <div className="error-state">{error}</div>;
  const programs = portal?.programs ?? [];

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Каталог</p>
        <h1>Программы BrightWay</h1>
        <p className="lead">Возраст, формат и ближайшее расписание — без воды.</p>
      </header>
      {programs.length === 0 ? (
        <div className="empty-state card">Пока нет открытых программ. Загляните позже или напишите администратору.</div>
      ) : (
        programs.map((program) => (
          <article key={program.id} className="card">
            <h2>{program.title}</h2>
            <p className="muted">{program.ageFrom}–{program.ageTo} лет · {program.format === 'group' ? 'группа' : 'индивидуально'}</p>
            <p>{program.description}</p>
            <p>от {money(program.priceFrom)}</p>
            <p className="muted">{program.nextSchedule || 'Расписание уточняется'}</p>
            <div className="row-actions">
              <Link className="btn btn-secondary" to={`/programs/${program.id}`}>Подробнее</Link>
              <Link className="btn btn-primary" to={`/trial?programId=${program.id}`}>Записаться на пробное</Link>
            </div>
          </article>
        ))
      )}
      <Link className="btn btn-ghost" to="/match">Подобрать программу</Link>
      <TabBar />
    </div>
  );
}
