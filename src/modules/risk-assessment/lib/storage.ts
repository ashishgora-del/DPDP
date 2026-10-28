// LocalStorage utilities for Risk Assessment
// NOTE: Assessment data is now stored in backend. This file only handles progress tracking.
import { SavedProgress } from '../types';

const STORAGE_KEYS = {
  PROGRESS: 'dpdpa_assessment_progress',
};

// Save progress (for multi-step form)
export function saveProgress(progress: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

// Load progress
export function loadProgress(): SavedProgress | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load progress:', error);
    return null;
  }
}

// Clear progress
export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  } catch (error) {
    console.error('Failed to clear progress:', error);
  }
}
