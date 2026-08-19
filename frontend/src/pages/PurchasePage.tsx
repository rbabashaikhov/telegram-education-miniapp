import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { TabBar } from '../components/TabBar';
import { usePortal } from '../context/PortalContext';
import type { SubscriptionPlan } from '../types';
import { money } from '../lib/format';

export function PurchasePage() {
  const { portal, refresh } = usePortal();
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const student = portal?.selectedStudent;
  const recommendation = portal?.recommendations.find((item) => item.status === 'NEW');
  const programId = recommendation?.program.id ?? portal?.subscriptions[0]?.plan.programId;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [planId, setPlanId] = useState<number | undefined>(
    query.get('planId') ? Number(query.get('planId')) : recommendation?.plan?.id,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void api.getPlans(programId).then((res) => {
      setPlans(res.data);
      if (!planId && res.data[0]) setPlanId(res.data[0].id);
    });
  }, [programId, planId]);

  async function pay() {
    if (!student || !planId) return;
    setPending(true);
    setError(null);
    try {
      await api.purchase({
        studentId: student.id,
        planId,
        recommendationId: recommendation?.id,
      });
      await refresh();
      navigate('/purchase/done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Оплата не прошла');
    } finally {
      setPending(false);
    }
  }

  if (!student) {
    return (
      <div className="page">
        <div className="empty-state card">Выберите ученика, чтобы купить абонемент.</div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Покупка</p>
        <h1>Абонемент для {student.firstName}</h1>
        <p className="lead">Mock-оплата: деньги не списываются, абонемент появляется сразу.</p>
      </header>
      {plans.length === 0 ? (
        <div className="empty-state card">Тарифы для этой программы пока не настроены.</div>
      ) : (
        plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={planId === plan.id ? 'card selectable is-on' : 'card selectable'}
            onClick={() => setPlanId(plan.id)}
          >
            <h2>{plan.title}</h2>
            <p>{plan.lessonCount} занятий · {plan.validityDays} дней</p>
            <p>{money(plan.price)}</p>
          </button>
        ))
      )}
      {error && <p className="error-state">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={!planId || pending} onClick={() => void pay()}>
        {pending ? 'Оплачиваем…' : 'Подтвердить и оплатить'}
      </button>
      <TabBar />
    </div>
  );
}

export function PurchaseDonePage() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Оплачено</p>
        <h1>Абонемент оформлен</h1>
        <p className="lead">Занятия появятся в расписании. Администратор видит зачисление в воронке.</p>
      </header>
      <div className="row-actions">
        <Link className="btn btn-primary" to="/schedule">Мои занятия</Link>
        <Link className="btn btn-secondary" to="/">На главную</Link>
      </div>
      <TabBar />
    </div>
  );
}
