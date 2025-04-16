/**
 * Application type definitions
 */

export type HealthCoach = {
  id: string;
  name: string;
  avatar_url?: string;
  specialty: string;
  rating: number;
  bio?: string;
  credentials?: string[];
  services?: string[];
  is_verified: boolean;
  price_per_hour?: number;
  availability?: string[];
};

export interface HealthCoachSearchParams {
  specialty?: string;
  rating?: number;
  page?: number;
  limit?: number;
  pageSize?: number;
  searchTerm?: string;
}

export type UserType = 'user' | 'coach' | 'psychic';