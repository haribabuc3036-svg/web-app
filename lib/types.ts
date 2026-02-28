// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  username: string;
  expiresIn: string;
}

export interface MeResponse {
  success: boolean;
  username: string;
}

// ─── Darshan ──────────────────────────────────────────────────────────────────

export interface DarshanUpdate {
  id: number;
  date: string;
  pilgrims: string;
  tonsures: string;
  hundi: string;
  waiting: string;
  darshan_time: string;
  created_at: string;
}

// ─── SSD ──────────────────────────────────────────────────────────────────────

export interface SsdStatus {
  id: number;
  running_slot: string;
  balance_tickets: string;
  date: string;
  updated_at: string;
}

export interface LiveSsdStatus {
  running_slot: string;
  slot_date: string;
  balance_tickets: string;
  balance_date: string;
}

// ─── Places ───────────────────────────────────────────────────────────────────

export interface PlaceRegion {
  id: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
}

export interface Place {
  id: string;
  region_id: string;
  name: string;
  description: string;
  maps_url: string;
  distance_from_tirumala_km: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlacePhoto {
  id: number;
  place_id: string;
  image_url: string;
  public_id: string;
  sort_order: number;
  created_at: string;
}

// ─── Services ─────────────────────────────────────────────────────────────────

export interface ServiceCatalogItem {
  id: string;
  category_id: string;
  category_heading: string;
  category_icon: string;
  category_image: string | null;
  category_image_public_id: string | null;
  category_order: number;
  title: string;
  description: string;
  icon: string;
  image: string | null;
  image_public_id: string | null;
  url: string;
  tag: string | null;
  tag_color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Wallpapers ───────────────────────────────────────────────────────────────

export interface Wallpaper {
  id: string;
  title: string;
  image_url: string;
  public_id: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  created_at: string;
}

// ─── Help ─────────────────────────────────────────────────────────────────────

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DressCodeItem {
  id: number;
  label: string;
  description: string | null;
  gender: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DosDont {
  id: number;
  type: 'do' | 'dont';
  text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactSupport {
  id: number;
  label: string;
  sub_label: string | null;
  icon: string | null;
  url: string;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

// ─── SSD Locations ────────────────────────────────────────────────────────────

export interface SsdLocation {
  id: number;
  name: string;
  area: string;
  timings: string;
  note: string | null;
  image_url: string | null;
  image_public_id: string | null;
  maps_url: string;
  tag: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

export interface ScraperStatus {
  isRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  lastError: string | null;
}

export interface ScraperRunResult {
  success: boolean;
  updated: boolean;
  changes: Record<string, unknown>;
  elapsed_ms: number;
  errors: string[];
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  env: string;
  poller: ScraperStatus;
}

// ─── Generic API response ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}
