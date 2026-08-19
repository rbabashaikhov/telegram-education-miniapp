import { AppError } from '../errors.js';
import type { Providers } from '../providers/types.js';
import type { AgeBand, Customer, GroupDetails, MatchInput, MatchResult, ProgramFormat } from '../types.js';
import { listGroupDetails } from './catalog.js';

const AGE_BANDS: Record<AgeBand, { from: number; to: number }> = {
  '4-6': { from: 4, to: 6 },
  '7-9': { from: 7, to: 9 },
  '10-12': { from: 10, to: 12 },
  '13-16': { from: 13, to: 16 },
  adult: { from: 17, to: 99 },
};

const GOAL_PROGRAMS: Record<string, string[]> = {
  'улучшить школьную успеваемость': ['English Start A1', 'Math Boost', 'Подготовка к школе'],
  'разговорный английский': ['English Conversation', 'English Start A1'],
  'подготовка к экзамену': ['English Conversation'],
  'обучение с нуля': ['English Start A1', 'Programming Start', 'Robotics Junior'],
  'подготовка к школе': ['Подготовка к школе', 'Creative Studio'],
  робототехника: ['Robotics Junior', 'Programming Start'],
  программирование: ['Programming Start', 'Robotics Junior'],
  'творческое развитие': ['Creative Studio'],
};

function ageFromBand(band: AgeBand, explicit?: number): number {
  if (explicit && explicit > 0) return explicit;
  const range = AGE_BANDS[band];
  return Math.round((range.from + range.to) / 2);
}

function preferredWeekdays(preferredTime: MatchInput['preferredTime'], preferredDays?: string): number[] {
  if (preferredDays) {
    const map: Record<string, number> = { вс: 0, пн: 1, вт: 2, ср: 3, чт: 4, пт: 5, сб: 6 };
    return preferredDays
      .toLowerCase()
      .split(/[,/ ]+/)
      .map((token) => map[token])
      .filter((value): value is number => value !== undefined);
  }
  if (preferredTime === 'weekend') return [6, 0];
  return [1, 2, 3, 4, 5];
}

function timeFits(startTime: string, preferredTime: MatchInput['preferredTime']): boolean {
  const hour = Number(startTime.slice(0, 2));
  if (preferredTime === 'weekday_morning') return hour < 12;
  if (preferredTime === 'weekday_after_school') return hour >= 14 && hour < 18;
  if (preferredTime === 'weekday_evening') return hour >= 17;
  return true;
}

function formatFits(programFormat: ProgramFormat, preferred: ProgramFormat): boolean {
  if (preferred === 'any') return true;
  if (programFormat === 'any') return true;
  return programFormat === preferred;
}

export function scoreGroup(group: GroupDetails, input: MatchInput): number {
  const age = ageFromBand(input.ageBand, input.age);
  let score = 0;
  if (age >= group.ageFrom && age <= group.ageTo) score += 40;
  else if (age >= group.program.ageFrom && age <= group.program.ageTo) score += 20;
  else return -1;

  const wanted = GOAL_PROGRAMS[input.goal] ?? [];
  if (wanted.includes(group.program.title)) score += 25;
  if (formatFits(group.program.format, input.preferredFormat)) score += 10;
  if (group.level.toLowerCase().includes(input.currentLevel.toLowerCase()) || input.currentLevel === 'не знаю') {
    score += 8;
  }
  if (group.freeSeats > 0) score += 10;
  else return -1;

  const days = preferredWeekdays(input.preferredTime, input.preferredDays);
  if (group.schedule.weekdays.some((day) => days.includes(day))) score += 10;
  if (timeFits(group.schedule.startTime, input.preferredTime)) score += 8;
  return score;
}

export function matchGroups(providers: Providers, input: MatchInput): GroupDetails[] {
  return listGroupDetails(providers)
    .map((group) => ({ group, score: scoreGroup(group, input) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.group);
}

export function qualifyLead(
  providers: Providers,
  customer: Customer,
  input: MatchInput,
): MatchResult {
  return providers.transaction(() => {
    const age = ageFromBand(input.ageBand, input.age);
    const recommendations = matchGroups(providers, { ...input, age });
    const top = recommendations[0];
    if (!top) {
      throw new AppError('Не нашли подходящую группу по этим условиям.', 422, 'NO_MATCHING_GROUP');
    }

    const lead = providers.leads.create({
      customerId: customer.id,
      studentId: input.studentId ?? null,
      programId: top.programId,
      source: input.source ?? 'miniapp',
      status: 'QUALIFIED',
    });
    const qualification = providers.leads.saveQualification({
      leadId: lead.id,
      age,
      ageBand: input.ageBand,
      currentLevel: input.currentLevel,
      goal: input.goal,
      preferredFormat: input.preferredFormat,
      preferredDays: input.preferredDays ?? '',
      preferredTime: input.preferredTime,
      notes: input.notes ?? '',
    });
    providers.crm.createLead(lead);
    providers.events.publish('lead_created', { leadId: lead.id, customerId: customer.id });
    providers.events.publish('lead_qualified', { leadId: lead.id, programId: top.programId });
    return { lead, qualification, recommendations };
  });
}
