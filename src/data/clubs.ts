import { Club } from '../types/fpl';

export const CLUBS: Record<string, Club> = {
  // 9th Grade (9/1 - 9/7)
  SCH_9_1: { id: 'SCH_9_1', name: 'Team 9/1', shortName: '9/1', primaryColor: '#059669', secondaryColor: '#A7F3D0', textColor: '#FFFFFF' },
  SCH_9_2: { id: 'SCH_9_2', name: 'Team 9/2', shortName: '9/2', primaryColor: '#0D9488', secondaryColor: '#99F6E4', textColor: '#FFFFFF' },
  SCH_9_3: { id: 'SCH_9_3', name: 'Team 9/3', shortName: '9/3', primaryColor: '#10B981', secondaryColor: '#111827', textColor: '#FFFFFF' },
  SCH_9_4: { id: 'SCH_9_4', name: 'Team 9/4', shortName: '9/4', primaryColor: '#14B8A6', secondaryColor: '#F3F4F6', textColor: '#FFFFFF' },
  SCH_9_5: { id: 'SCH_9_5', name: 'Team 9/5', shortName: '9/5', primaryColor: '#047857', secondaryColor: '#FBBF24', textColor: '#FFFFFF' },
  SCH_9_6: { id: 'SCH_9_6', name: 'Team 9/6', shortName: '9/6', primaryColor: '#065F46', secondaryColor: '#34D399', textColor: '#FFFFFF' },
  SCH_9_7: { id: 'SCH_9_7', name: 'Team 9/7', shortName: '9/7', primaryColor: '#0F766E', secondaryColor: '#FCD34D', textColor: '#FFFFFF' },

  // 10th Grade (10/1 - 10/7)
  SCH_10_1: { id: 'SCH_10_1', name: 'Team 10/1', shortName: '10/1', primaryColor: '#0284C7', secondaryColor: '#BAE6FD', textColor: '#FFFFFF' },
  SCH_10_2: { id: 'SCH_10_2', name: 'Team 10/2', shortName: '10/2', primaryColor: '#2563EB', secondaryColor: '#DBEAFE', textColor: '#FFFFFF' },
  SCH_10_3: { id: 'SCH_10_3', name: 'Team 10/3', shortName: '10/3', primaryColor: '#1D4ED8', secondaryColor: '#F59E0B', textColor: '#FFFFFF' },
  SCH_10_4: { id: 'SCH_10_4', name: 'Team 10/4', shortName: '10/4', primaryColor: '#0369A1', secondaryColor: '#38BDF8', textColor: '#FFFFFF' },
  SCH_10_5: { id: 'SCH_10_5', name: 'Team 10/5', shortName: '10/5', primaryColor: '#3B82F6', secondaryColor: '#111827', textColor: '#FFFFFF' },
  SCH_10_6: { id: 'SCH_10_6', name: 'Team 10/6', shortName: '10/6', primaryColor: '#1E40AF', secondaryColor: '#60A5FA', textColor: '#FFFFFF' },
  SCH_10_7: { id: 'SCH_10_7', name: 'Team 10/7', shortName: '10/7', primaryColor: '#0EA5E9', secondaryColor: '#FFFFFF', textColor: '#FFFFFF' },

  // 11th Grade (11/1 - 11/7)
  SCH_11_1: { id: 'SCH_11_1', name: 'Team 11/1', shortName: '11/1', primaryColor: '#0057B8', secondaryColor: '#FFFFFF', textColor: '#FFFFFF' },
  SCH_11_2: { id: 'SCH_11_2', name: 'Team 11/2', shortName: '11/2', primaryColor: '#E90052', secondaryColor: '#FFFFFF', textColor: '#FFFFFF' },
  SCH_11_3: { id: 'SCH_11_3', name: 'Team 11/3', shortName: '11/3', primaryColor: '#00C2FF', secondaryColor: '#111111', textColor: '#FFFFFF' },
  SCH_11_4: { id: 'SCH_11_4', name: 'Team 11/4', shortName: '11/4', primaryColor: '#FFB703', secondaryColor: '#023047', textColor: '#000000' },
  SCH_11_5: { id: 'SCH_11_5', name: 'Team 11/5', shortName: '11/5', primaryColor: '#FFFFFF', secondaryColor: '#F59E0B', textColor: '#000000' },
  SCH_11_6: { id: 'SCH_11_6', name: 'Team 11/6', shortName: '11/6', primaryColor: '#7209B7', secondaryColor: '#4CC9F0', textColor: '#FFFFFF' },
  SCH_11_7: { id: 'SCH_11_7', name: 'Team 11/7', shortName: '11/7', primaryColor: '#9333EA', secondaryColor: '#FBBF24', textColor: '#FFFFFF' },

  // 12th Grade (12/1 - 12/7)
  SCH_12_1: { id: 'SCH_12_1', name: 'Team 12/1', shortName: '12/1', primaryColor: '#DC2626', secondaryColor: '#FEE2E2', textColor: '#FFFFFF' },
  SCH_12_2: { id: 'SCH_12_2', name: 'Team 12/2', shortName: '12/2', primaryColor: '#B91C1C', secondaryColor: '#FDE047', textColor: '#FFFFFF' },
  SCH_12_3: { id: 'SCH_12_3', name: 'Team 12/3', shortName: '12/3', primaryColor: '#EA580C', secondaryColor: '#FFEDD5', textColor: '#FFFFFF' },
  SCH_12_4: { id: 'SCH_12_4', name: 'Team 12/4', shortName: '12/4', primaryColor: '#C2410C', secondaryColor: '#FFFFFF', textColor: '#FFFFFF' },
  SCH_12_5: { id: 'SCH_12_5', name: 'Team 12/5', shortName: '12/5', primaryColor: '#991B1B', secondaryColor: '#FCA5A5', textColor: '#FFFFFF' },
  SCH_12_6: { id: 'SCH_12_6', name: 'Team 12/6', shortName: '12/6', primaryColor: '#E11D48', secondaryColor: '#FFE4E6', textColor: '#FFFFFF' },
  SCH_12_7: { id: 'SCH_12_7', name: 'Team 12/7', shortName: '12/7', primaryColor: '#BE123C', secondaryColor: '#FCD34D', textColor: '#FFFFFF' },

  // Compatibility alias for 11/5
  SCH: { id: 'SCH_11_5', name: 'Team 11/5', shortName: '11/5', primaryColor: '#FFFFFF', secondaryColor: '#F59E0B', textColor: '#000000' },
};

/**
 * Returns school clubs sorted in natural order: 9/1-9/7, 10/1-10/7, 11/1-11/7, 12/1-12/7
 * and filters out any duplicate compatibility alias.
 */
export function getSortedSchoolClubs(clubsMap?: Record<string, Club>): Club[] {
  const map = clubsMap || CLUBS;
  const uniqueClubs = new Map<string, Club>();

  Object.entries(map).forEach(([key, club]) => {
    // Avoid duplicate SCH alias if SCH_11_5 is already present
    if (key === 'SCH' && (map['SCH_11_5'] || uniqueClubs.has('SCH_11_5'))) return;
    const standardId = club.id === 'SCH' ? 'SCH_11_5' : club.id;
    if (!uniqueClubs.has(standardId)) {
      uniqueClubs.set(standardId, { ...club, id: standardId });
    }
  });

  return Array.from(uniqueClubs.values()).sort((a, b) => {
    const parse = (shortName: string) => {
      const match = shortName.match(/^(\d+)\/(\d+)$/);
      if (match) return [parseInt(match[1], 10), parseInt(match[2], 10)];
      return [99, 99];
    };
    const [ga, ca] = parse(a.shortName);
    const [gb, cb] = parse(b.shortName);
    if (ga !== gb) return ga - gb;
    return ca - cb;
  });
}
