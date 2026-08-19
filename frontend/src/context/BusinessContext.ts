import { createContext, useContext } from 'react';
import type { AppConfig } from '../types';

export const DEFAULT_APP_CONFIG: AppConfig = {
  businessName: 'BrightWay Education',
  appTitle: 'BrightWay',
  appDescription: 'Личный кабинет учебного центра',
  timezone: 'Europe/Moscow',
  demoMode: true,
  adminProtected: false,
  branding: { accent: '#1F5C4D', logoUrl: null },
  features: { demoTour: true, demoAdminPreview: true },
};

export const BusinessContext = createContext<AppConfig>(DEFAULT_APP_CONFIG);

export function useBusiness(): AppConfig {
  return useContext(BusinessContext);
}
