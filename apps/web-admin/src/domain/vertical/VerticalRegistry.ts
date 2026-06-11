import type { VerticalConfig } from './VerticalConfig';
import { DEFAULT_VERTICAL_CONFIG } from './VerticalConfig';

export const VERTICALS: Record<string, VerticalConfig> = {
  talleres: {
    ...DEFAULT_VERTICAL_CONFIG,
    code: 'talleres',
    name: 'Taller de Reparación',
  },

  barberias: {
    ...DEFAULT_VERTICAL_CONFIG,
    code: 'barberias',
    name: 'Barbería',
  },

  hvac: {
    ...DEFAULT_VERTICAL_CONFIG,
    code: 'hvac',
    name: 'Climas y Refrigeración',
  },

  mecanicos: {
    ...DEFAULT_VERTICAL_CONFIG,
    code: 'mecanicos',
    name: 'Taller Mecánico',
  },

  rentas: {
    ...DEFAULT_VERTICAL_CONFIG,
    code: 'rentas',
    name: 'Renta de Equipos',
  },

  electronica: {
    ...DEFAULT_VERTICAL_CONFIG,
    code: 'electronica',
    name: 'Electrónica',
  },
};

export function resolveVertical(
  industryKey?: string | null,
): VerticalConfig {
  if (!industryKey) {
    return DEFAULT_VERTICAL_CONFIG;
  }

  return (
    VERTICALS[industryKey] ??
    DEFAULT_VERTICAL_CONFIG
  );
}
