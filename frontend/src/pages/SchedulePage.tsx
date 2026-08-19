import { useEffect, useState } from 'react';
import { TabBar } from '../components/TabBar';
import { api } from '../api/client';
import { usePortal } from '../context/PortalContext';
import type { LessonDetails } from '../types';
import { ATTEND_STATUS, humanDate, timeOf } from '../lib/format';

export function SchedulePage() {
  const { portal } = usePortal();
  const student = portal?.selectedStudent;
  const [lessons, setLessons] = useState<LessonDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    void api
      .getLessons(student.id)
      .then((res) => setLessons(res.data))
      .catch((err: Error) => setError(err.message));
  }, [student]);

  if (!student) {
    return (
      <div className="page">
        <div className="empty-state card">Добавьте ученика в профиле, чтобы увидеть расписание.</div>
        <TabBar />
      </div>
    );
  }

  const upcoming = lessons.filter((item) => item.status === 'SCHEDULED');
  const past = lessons.filter((item) => item.status !== 'SCHEDULED').slice(-8).reverse();

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Расписание</p>
        <h1>{student.firstName}</h1>
      </header>
      {error && <div className="error-state">{error}</div>}
      <h2>Ближайшие</h2>
      {upcoming.length === 0 ? (
        <div className="empty-state card">Ближайших занятий нет. Запишитесь на пробное или продлите абонемент.</div>
      ) : (
        upcoming.slice(0, 6).map((lesson) => (
          <article key={lesson.id} className="card">
            <strong>{lesson.program.title}</strong>
            <p>{humanDate(lesson.startsAt)}, {timeOf(lesson.startsAt)}</p>
            <p className="muted">{lesson.teacher.name} · {lesson.room}</p>
          </article>
        ))
      )}
      <h2>Прошедшие</h2>
      {past.length === 0 ? (
        <div className="empty-state card">Пока нет прошедших занятий.</div>
      ) : (
        past.map((lesson) => (
          <article key={lesson.id} className="card">
            <div className="list-row">
              <strong>{lesson.program.title}</strong>
              <span className={`status ${lesson.attendance?.status ?? ''}`}>
                {lesson.attendance ? ATTEND_STATUS[lesson.attendance.status] : '—'}
              </span>
            </div>
            <p className="muted">{humanDate(lesson.startsAt)} · {lesson.teacher.name}</p>
          </article>
        ))
      )}
      <TabBar />
    </div>
  );
}
