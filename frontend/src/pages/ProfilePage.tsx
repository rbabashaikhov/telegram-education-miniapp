import { Link } from 'react-router-dom';
import { TabBar } from '../components/TabBar';
import { usePortal } from '../context/PortalContext';
import { personName } from '../lib/format';

export function ProfilePage() {
  const { portal, selectStudent, loading } = usePortal();
  if (loading) return <div className="loading">Загрузка профиля…</div>;
  if (!portal) return <div className="empty-state">Профиль недоступен.</div>;
  const familyMembers = portal.familyMembers ?? portal.students.map((item) => ({ student: item, programTitle: null }));

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Семья</p>
        <h1>{personName(portal.customer)}</h1>
        <p className="lead">{portal.branch.name}</p>
      </header>
      <section className="card">
        <p className="eyebrow">Ученики</p>
        {familyMembers.length === 0 ? (
          <p>Пока нет учеников. После подбора программы ребёнок появится здесь.</p>
        ) : (
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
        )}
      </section>
      {portal.selectedStudent && (
        <section className="card">
          <p className="eyebrow">Сейчас выбран</p>
          <h2>{portal.selectedStudent.firstName} {portal.selectedStudent.lastName}</h2>
          <p className="muted">{portal.selectedStudent.age} лет</p>
        </section>
      )}
      <section className="card">
        <p>{portal.school.phone}</p>
        <p className="muted">{portal.school.email}</p>
      </section>
      <Link className="btn btn-secondary" to="/programs">Каталог программ</Link>
      <TabBar />
    </div>
  );
}
