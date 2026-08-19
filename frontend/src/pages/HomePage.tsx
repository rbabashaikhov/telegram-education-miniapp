import { Link } from 'react-router-dom';
import { TabBar } from '../components/TabBar';
import { useBusiness } from '../context/BusinessContext';
import { usePortal } from '../context/PortalContext';
import { lessonWhen, money, shortDate } from '../lib/format';

export function HomePage() {
  const { portal, loading, error, selectStudent } = usePortal();
  const business = useBusiness();

  if (loading) return <div className="loading">Загрузка кабинета…</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!portal) return <div className="empty-state">Кабинет пока недоступен.</div>;

  const student = portal.selectedStudent;
  const subscription = portal.subscriptions[0];
  const recommendation = portal.recommendations.find((item) => item.status !== 'DECLINED');
  const isNew = portal.isNewCustomer || !student;
  const familyMembers = portal.familyMembers ?? portal.students.map((item) => ({ student: item, programTitle: null }));

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">{portal.school.name}</p>
        <h1>{isNew ? `Добро пожаловать в ${business.appTitle}` : `Здравствуйте, ${portal.customer.firstName}`}</h1>
        <p className="lead">
          {isNew
            ? 'Подберём программу, запишем на пробное и покажем, как выглядит обучение.'
            : `${portal.branch.name}. Сейчас смотрим кабинет ${student.firstName}.`}
        </p>
      </header>

      {!isNew && student && (
        <>
          {familyMembers.length > 0 && (
            <section className="card">
              <p className="eyebrow">Семья</p>
              <div className="switcher">
                {familyMembers.map((member) => (
                  <button
                    key={member.student.id}
                    type="button"
                    className={portal.selectedStudent?.id === member.student.id ? 'student-pill is-on' : 'student-pill'}
                    onClick={() => void selectStudent(member.student.id)}
                  >
                    <strong>{member.student.firstName}</strong>
                    <p className="muted">{member.programTitle ?? `${member.student.age} лет`}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {subscription && subscription.remainingLessons <= 3 && (
            <section className="card highlight" data-demo-tour="low-balance">
              <p className="eyebrow">Продление</p>
              <h2>У {student.firstName} осталось {subscription.remainingLessons} из {subscription.purchasedLessons} занятий</h2>
              <p className="muted">Продлите абонемент, чтобы сохранить место в группе.</p>
              <div className="row-actions">
                <Link className="btn btn-gold" to="/purchase">Продлить</Link>
              </div>
            </section>
          )}

          {portal.nextLesson && (
            <section className="card accent-card">
              <p className="eyebrow">Ближайшее занятие</p>
              <h2>{portal.nextLesson.program.title}</h2>
              <p>{lessonWhen(portal.nextLesson.startsAt)}</p>
              <p className="muted">{portal.nextLesson.teacher.name} · {portal.nextLesson.room}</p>
            </section>
          )}

          {subscription && (
            <section className="card">
              <p className="eyebrow">Абонемент</p>
              <h2>{subscription.program.title}</h2>
              <p>Осталось: {subscription.remainingLessons} из {subscription.purchasedLessons} занятий</p>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${(subscription.remainingLessons / subscription.purchasedLessons) * 100}%` }}
                />
              </div>
              <p>Действует до: {shortDate(subscription.expiresAt)}</p>
              {subscription.nextLessonAt && <p className="muted">Следующее занятие: {lessonWhen(subscription.nextLessonAt)}</p>}
            </section>
          )}

          {recommendation && recommendation.status !== 'ACCEPTED' && (
            <section className="card">
              <p className="eyebrow">Рекомендация преподавателя</p>
              <h2>{student.firstName} подходит: {recommendation.program.title}</h2>
              <p>{recommendation.text}</p>
              <Link className="btn btn-primary" to="/purchase">Записаться в группу</Link>
            </section>
          )}

          {portal.notifications[0] && (
            <section className="card">
              <p className="eyebrow">Уведомления</p>
              <h2>{portal.notifications[0].title}</h2>
              <p className="muted">{portal.notifications[0].body}</p>
            </section>
          )}
        </>
      )}

      <section className="card" data-demo-tour="program-matching">
        <p className="eyebrow">Подбор</p>
        <h2>Подобрать программу</h2>
        <p className="muted">Короткий квиз: возраст, цель, уровень и удобное время.</p>
        <div className="row-actions">
          <Link className="btn btn-primary" to="/match">Подобрать программу</Link>
          <Link className="btn btn-secondary" to="/trial">Записаться на пробное</Link>
        </div>
      </section>

      <section className="stack">
        <h2>Направления</h2>
        {portal.programs.slice(0, 4).map((program) => (
          <Link key={program.id} className="card" to={`/programs/${program.id}`}>
            <strong>{program.title}</strong>
            <p className="muted">{program.ageFrom}–{program.ageTo} лет · {program.nextSchedule || program.format}</p>
            <p>от {money(program.priceFrom)}</p>
          </Link>
        ))}
        <Link className="btn btn-ghost" to="/programs">Все программы</Link>
      </section>
      <TabBar />
    </div>
  );
}
