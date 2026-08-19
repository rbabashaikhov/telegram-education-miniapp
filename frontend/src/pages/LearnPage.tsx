import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { TabBar } from '../components/TabBar';
import { usePortal } from '../context/PortalContext';
import type { HomeworkItem, MaterialItem, StudentProgress } from '../types';
import { humanDate, LEDGER_TYPE, lessonWhen, money, shortDate, TOPIC_STATUS } from '../lib/format';

export function LearnPage() {
  const { portal } = usePortal();
  const student = portal?.selectedStudent;
  const subscription = portal?.subscriptions[0];
  const recommendation = portal?.recommendations.find((item) => item.status !== 'DECLINED' && item.status !== 'ACCEPTED');
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  useEffect(() => {
    if (!student) return;
    void Promise.all([api.getProgress(student.id), api.getHomework(student.id), api.getMaterials(student.id)])
      .then(([p, h, m]) => {
        setProgress(p.data);
        setHomework(h.data);
        setMaterials(m.data);
      })
      .catch(() => undefined);
  }, [student]);

  if (!student) {
    return (
      <div className="page">
        <div className="empty-state card">Выберите ученика в профиле, чтобы увидеть обучение.</div>
        <TabBar />
      </div>
    );
  }

  const latestHomework = homework[0];

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Обучение</p>
        <h1>{student.firstName}</h1>
      </header>

      {recommendation && (
        <section className="card highlight" data-demo-tour="teacher-recommendation">
          <p className="eyebrow">Рекомендация преподавателя</p>
          <h2>{student.firstName} подходит: {recommendation.program.title}</h2>
          {recommendation.group && (
            <p>
              {recommendation.group.schedule.labels.join(' / ')} {recommendation.group.schedule.startTime}
            </p>
          )}
          {recommendation.teacher && <p>{recommendation.teacher.name}</p>}
          {recommendation.plan && (
            <p>
              {recommendation.plan.lessonCount} занятий · {money(recommendation.plan.price)}
            </p>
          )}
          <p className="muted">{recommendation.text}</p>
          <Link className="btn btn-primary" to={`/purchase?recommendationId=${recommendation.id}&planId=${recommendation.plan?.id ?? ''}`}>
            Записаться в группу
          </Link>
        </section>
      )}

      {subscription ? (
        <section className="card" data-demo-tour="subscription-card">
          <p className="eyebrow">Абонемент</p>
          <h2>{subscription.program.title}</h2>
          <p>Осталось: {subscription.remainingLessons} из {subscription.purchasedLessons} занятий</p>
          <p>Действует до: {shortDate(subscription.expiresAt)}</p>
          {subscription.nextLessonAt && <p>Следующее занятие: {lessonWhen(subscription.nextLessonAt)}</p>}
          <p className="muted">{subscription.plan.title} · куплен {shortDate(subscription.startsAt)}</p>
          {subscription.ledger && subscription.ledger.length > 0 && (
            <div className="stack">
              {subscription.ledger.slice(0, 5).map((entry) => (
                <div key={entry.id} className="list-row">
                  <span>{LEDGER_TYPE[entry.type] ?? entry.type}</span>
                  <span>{entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}</span>
                </div>
              ))}
            </div>
          )}
          <Link className="btn btn-gold" to="/purchase">Продлить</Link>
        </section>
      ) : (
        <section className="card" data-demo-tour="subscription-card">
          <p className="eyebrow">Абонемент</p>
          <h2>Пока нет активного абонемента</h2>
          <p className="muted">После пробного можно купить пакет занятий за минуту.</p>
          <Link className="btn btn-primary" to="/purchase">Выбрать тариф</Link>
        </section>
      )}

      {progress ? (
        <section className="card" data-demo-tour="progress-card">
          <p className="eyebrow">Прогресс</p>
          <p className="metric">{progress.lessonsHeld} занятий</p>
          <p>Посещаемость {progress.attendancePercent}%</p>
          <p className="muted">{progress.latestComment}</p>
          <div className="stack">
            {progress.topics.map((topic) => (
              <div key={topic.id} className="list-row">
                <span>{topic.topic}</span>
                <span className={`status ${topic.status}`}>{TOPIC_STATUS[topic.status]}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="card" data-demo-tour="progress-card">
          <p className="eyebrow">Прогресс</p>
          <p>Пока нет записей преподавателя. Они появятся после занятий.</p>
        </section>
      )}

      <section className="card">
        <p className="eyebrow">Домашнее задание</p>
        {latestHomework ? (
          <>
            <h2>{latestHomework.title}</h2>
            <p>{latestHomework.description}</p>
            <p className="muted">Срок: {humanDate(latestHomework.dueAt)}</p>
          </>
        ) : (
          <p>Сейчас нет активного задания.</p>
        )}
      </section>

      <section className="card">
        <p className="eyebrow">Материалы</p>
        {materials.length === 0 ? (
          <p>Материалы появятся после урока.</p>
        ) : (
          materials.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
              {item.title} · {item.type}
            </a>
          ))
        )}
      </section>
      <TabBar />
    </div>
  );
}
