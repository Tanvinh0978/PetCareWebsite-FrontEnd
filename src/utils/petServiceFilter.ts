import type { ServiceDTO } from '@/types/service.types';

/**
 * Checks whether a pet species is Cat (1 or 'cat')
 */
export function isPetCat(species: number | string | undefined | null): boolean {
  if (species === undefined || species === null) return false;
  return species === 1 || String(species).toLowerCase() === 'cat';
}

/**
 * Checks whether a pet species is Dog (0 or 'dog')
 */
export function isPetDog(species: number | string | undefined | null): boolean {
  if (species === undefined || species === null) return false;
  return species === 0 || String(species).toLowerCase() === 'dog';
}

/**
 * Checks whether a given service is compatible with the pet's species.
 * Analyzes service name, roomTypeName, and description.
 */
export function isServiceCompatibleWithPet(service: ServiceDTO, petSpecies: number | string | undefined | null): boolean {
  if (petSpecies === undefined || petSpecies === null) return true;

  const isCat = isPetCat(petSpecies);
  const isDog = isPetDog(petSpecies);

  const combinedText = [
    service.name || '',
    service.roomTypeName || '',
    service.description || ''
  ].join(' ').toLowerCase();

  const catKeywords = ['mèo', 'cat', 'feline', 'kitty'];
  const dogKeywords = ['chó', 'cún', 'dog', 'canine', 'puppy'];

  const matchesCat = catKeywords.some((kw) => combinedText.includes(kw));
  const matchesDog = dogKeywords.some((kw) => combinedText.includes(kw));

  // If service specifically mentions cats and not dogs
  if (matchesCat && !matchesDog) {
    return isCat;
  }

  // If service specifically mentions dogs and not cats
  if (matchesDog && !matchesCat) {
    return isDog;
  }

  // Universal / neutral service
  return true;
}

export interface RoomTierConfig {
  tier: 'VIP' | 'Suite' | 'Standard';
  label: string;
  badgeText: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  accentColor: string;
  icon: string;
  features: string[];
}

/**
 * Determines room tier (Standard, Suite, VIP) from room type name and service name.
 */
export function getRoomTierInfo(roomTypeName?: string, serviceName?: string): RoomTierConfig {
  const text = `${roomTypeName || ''} ${serviceName || ''}`.toLowerCase();

  if (text.includes('vip') || text.includes('villa') || text.includes('penthouse')) {
    return {
      tier: 'VIP',
      label: 'VIP Suite / Villa',
      badgeText: 'VIP Villa',
      badgeColor: '#b45309',
      badgeBg: '#fef3c7',
      badgeBorder: '#fde68a',
      accentColor: '#d97706',
      icon: 'VIP',
      features: ['24/7 Webcam Live', 'Air Conditioning', 'Private Play Area', 'Daily Wellness Check']
    };
  }

  if (text.includes('suite') || text.includes('deluxe') || text.includes('luxury')) {
    return {
      tier: 'Suite',
      label: 'Deluxe Suite',
      badgeText: 'Deluxe Suite',
      badgeColor: '#6d28d9',
      badgeBg: '#f3e8ff',
      badgeBorder: '#e9d5ff',
      accentColor: '#8b5cf6',
      icon: 'Suite',
      features: ['Extra Spacious', 'Soft Plush Bedding', 'Scheduled Playtime', 'Climate Controlled']
    };
  }

  return {
    tier: 'Standard',
    label: 'Standard Cozy',
    badgeText: 'Standard Room',
    badgeColor: '#0369a1',
    badgeBg: '#e0f2fe',
    badgeBorder: '#bae6fd',
    accentColor: '#0284c7',
    icon: 'Standard',
    features: ['Comfortable Cabin', 'Fresh Water & Meal', 'Daily Sanitization', 'Caring Supervision']
  };
}

