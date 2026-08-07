import { client, unwrap } from './client';
import type {
  Dashboard,
  ReviewTodayItem,
  SeedItem,
  WiltingItem,
} from '../types';

export async function getDashboard(): Promise<Dashboard> {
  return unwrap<Dashboard>(client.get('/garden/dashboard'));
}

export async function getSeeds(): Promise<SeedItem[]> {
  return unwrap<SeedItem[]>(client.get('/garden/seeds'));
}

export async function getWilting(): Promise<WiltingItem[]> {
  return unwrap<WiltingItem[]>(client.get('/garden/wilting'));
}

export async function getReviewToday(): Promise<ReviewTodayItem[]> {
  return unwrap<ReviewTodayItem[]>(client.get('/garden/review-today'));
}
