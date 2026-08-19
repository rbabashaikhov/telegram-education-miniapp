import type { DemoTourDefinition } from './types';

export const educationDemoTour: DemoTourDefinition = {
  id: 'brightway-sales',
  storageKey: 'brightway-demo-tour',
  intro: {
    title: 'Как учебный центр продаёт обучение',
    lead: 'Посмотрите, как учебный центр превращает нового посетителя в постоянного ученика.',
    bullets: ['Квалификация лида', 'Пробное занятие', 'Рекомендация и абонемент', 'Прогресс и продление'],
    startLabel: 'Начать демонстрацию',
    skipLabel: 'Смотреть самостоятельно',
  },
  finish: {
    title: 'От интереса до повторной покупки',
    lead: 'Mini App сопровождает клиента от первого интереса до повторной покупки.',
    bullets: ['Lead generation', 'Conversion', 'Client service', 'Retention'],
    adminLabel: 'Открыть dashboard',
    continueLabel: 'Посмотреть кабинет',
  },
  steps: [
    {
      id: 'matching',
      target: 'program-matching',
      route: '/',
      title: 'Подбор программы',
      description: 'Mini App помогает не просто показать список курсов, а квалифицировать нового клиента.',
    },
    {
      id: 'qualification',
      target: 'qualification-form',
      route: '/match',
      title: 'Квалификация',
      description: 'Возраст, цель, уровень и удобное время превращаются в структурированный лид для администратора или CRM.',
    },
    {
      id: 'trial',
      target: 'trial-booking',
      route: '/trial',
      title: 'Пробное занятие',
      description: 'Клиент сразу выбирает подходящее пробное занятие.',
    },
    {
      id: 'recommendation',
      target: 'teacher-recommendation',
      route: '/learn',
      title: 'Рекомендация преподавателя',
      description: 'После пробного школа превращает результат преподавателя в конкретное коммерческое предложение.',
    },
    {
      id: 'subscription',
      target: 'subscription-card',
      route: '/learn',
      title: 'Абонемент',
      description: 'Клиент может купить или продлить обучение без звонка администратору.',
    },
    {
      id: 'progress',
      target: 'progress-card',
      route: '/learn',
      title: 'Прогресс',
      description: 'Родитель видит результат обучения и получает дополнительную причину возвращаться в приложение.',
    },
    {
      id: 'retention',
      target: 'low-balance',
      route: '/',
      title: 'Продление',
      description: 'Когда занятия заканчиваются, Mini App автоматически создаёт повод для повторной продажи.',
    },
  ],
};
