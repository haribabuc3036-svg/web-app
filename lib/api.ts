import type {
  LoginResponse,
  MeResponse,
  DarshanUpdate,
  SsdStatus,
  LiveSsdStatus,
  PlaceRegion,
  Place,
  PlacePhoto,
  ServiceCatalogItem,
  ServiceCategoryResponse,
  ServiceDetailResponse,
  ServiceImageAdminResponse,
  Wallpaper,
  Faq,
  DressCodeItem,
  DosDont,
  ContactSupport,
  SsdLocation,
  ScraperStatus,
  ScraperRunResult,
  HealthStatus,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function req<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// Helper for multipart form data (no Content-Type header — browser sets boundary)
async function reqForm<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body,
  });

  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b?.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    req<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    req<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => req<MeResponse>('/api/auth/me'),
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  get: () => req<HealthStatus>('/health'),
};

// ─── Darshan ──────────────────────────────────────────────────────────────────

export const darshanApi = {
  getAll: () =>
    req<{ success: boolean; count: number; data: DarshanUpdate[] }>('/api/darshan/all'),

  getPaginated: (page = 1, limit = 10) =>
    req<{ success: boolean; page: number; limit: number; data: DarshanUpdate[] }>(
      `/api/darshan?page=${page}&limit=${limit}`
    ),

  upsert: (payload: Omit<DarshanUpdate, 'id' | 'created_at'>) =>
    req<{ success: boolean; data: DarshanUpdate }>('/api/darshan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── SSD ──────────────────────────────────────────────────────────────────────

export const ssdApi = {
  getLatest: () =>
    req<{ success: boolean; data: SsdStatus }>('/api/ssd'),

  getLive: () =>
    req<{ success: boolean; data: LiveSsdStatus }>('/api/ssd/live'),

  update: (payload: Partial<LiveSsdStatus>) =>
    req<{ success: boolean; data: LiveSsdStatus }>('/api/ssd', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  scrape: () =>
    req<{ success: boolean; data: Record<string, string> }>('/api/ssd/scrape'),
};

// ─── Places ───────────────────────────────────────────────────────────────────

export const placesApi = {
  getRegions: () =>
    req<{ success: boolean; count: number; data: PlaceRegion[] }>('/api/places/regions'),

  createRegion: (payload: Partial<PlaceRegion>) =>
    req<{ success: boolean; data: PlaceRegion }>('/api/places/regions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRegion: (regionId: string, payload: Partial<PlaceRegion>) =>
    req<{ success: boolean; data: PlaceRegion }>(`/api/places/regions/${regionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteRegion: (regionId: string) =>
    req<{ success: boolean }>(`/api/places/regions/${regionId}`, { method: 'DELETE' }),

  getByRegion: (regionId: string) =>
    req<{ success: boolean; count: number; data: Place[] }>(`/api/places/region/${regionId}`),

  getById: (placeId: string) =>
    req<{ success: boolean; data: Place }>(`/api/places/${placeId}`),

  create: (payload: Record<string, unknown>) =>
    req<{ success: boolean; data: Place }>('/api/places', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (placeId: string, payload: Partial<Place>) =>
    req<{ success: boolean; data: Place }>(`/api/places/${placeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (placeId: string) =>
    req<{ success: boolean }>(`/api/places/${placeId}`, { method: 'DELETE' }),

  getPhotos: (placeId: string) =>
    req<{ success: boolean; count: number; data: PlacePhoto[] }>(
      `/api/places/${placeId}/photos`
    ),

  uploadPhoto: (placeId: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return reqForm<{ success: boolean; data: PlacePhoto }>(
      `/api/places/${placeId}/photos`,
      fd
    );
  },

  deletePhoto: (_placeId: string, photoId: number) =>
    req<{ success: boolean }>(`/api/places/photos/${photoId}`, {
      method: 'DELETE',
    }),
};

// ─── Services ─────────────────────────────────────────────────────────────────

export const servicesApi = {
  getCatalog: () =>
    req<{ success: boolean; count: number; data: ServiceCategoryResponse[] }>('/api/services'),

  getById: (id: string) =>
    req<{ success: boolean; data: ServiceDetailResponse }>(`/api/services/${id}`),

  update: (id: string, payload: Partial<ServiceCatalogItem>) =>
    req<{ success: boolean; data: ServiceCatalogItem }>(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  patchBooking: (id: string, payload: { booking_date?: string | null; instructions?: string[] | null }) =>
    req<{ success: boolean; data: ServiceCatalogItem }>(`/api/services/${id}/booking`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getImages: (id: string) =>
    req<{ success: boolean; count: number; data: ServiceImageAdminResponse[] }>(`/api/services/${id}/images`),

  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return reqForm<{ success: boolean; data: ServiceImageAdminResponse }>(
      `/api/services/${id}/images`,
      fd
    );
  },

  deleteImage: (imageId: number) =>
    req<{ success: boolean }>(`/api/services/images/${imageId}`, { method: 'DELETE' }),

  uploadIconImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return reqForm<{ success: boolean; data: ServiceCatalogItem }>(
      `/api/services/${id}/icon-image`,
      fd
    );
  },

  sync: () =>
    req<{ success: boolean }>('/api/services/sync', { method: 'POST' }),

  uploadCategoryImage: (categoryId: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return reqForm<{ success: boolean; image: string }>(
      `/api/services/category/${categoryId}/image`,
      fd
    );
  },

  createService: (payload: {
    id: string;
    title: string;
    category_id: string;
    category_heading: string;
    description?: string;
    icon?: string;
    tag?: string | null;
    tag_color?: string | null;
    url?: string;
    sort_order?: number;
  }) =>
    req<{ success: boolean; data: ServiceCatalogItem }>('/api/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteService: (id: string) =>
    req<{ success: boolean; deleted: boolean; id: string }>(`/api/services/${id}`, { method: 'DELETE' }),
};

// ─── Wallpapers ───────────────────────────────────────────────────────────────

export const wallpapersApi = {
  getAll: (limit = 100) =>
    req<{ success: boolean; count: number; data: Wallpaper[] }>(
      `/api/wallpapers?limit=${limit}`
    ),

  upload: (file: File, title: string) => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', title);
    return reqForm<{ success: boolean; data: Wallpaper }>('/api/wallpapers', fd);
  },

  delete: (id: string) =>
    req<{ success: boolean }>(`/api/wallpapers/${id}`, { method: 'DELETE' }),
};

// ─── Help ─────────────────────────────────────────────────────────────────────

export const helpApi = {
  // FAQs
  getFaqs: () =>
    req<{ success: boolean; count: number; data: Faq[] }>('/api/help/faqs'),
  createFaq: (payload: Partial<Faq>) =>
    req<{ success: boolean; data: Faq }>('/api/help/faqs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateFaq: (id: number, payload: Partial<Faq>) =>
    req<{ success: boolean; data: Faq }>(`/api/help/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteFaq: (id: number) =>
    req<{ success: boolean }>(`/api/help/faqs/${id}`, { method: 'DELETE' }),

  // Dress Code
  getDressCode: () =>
    req<{ success: boolean; count: number; data: DressCodeItem[] }>('/api/help/dress-code'),
  createDressCode: (payload: Partial<DressCodeItem>) =>
    req<{ success: boolean; data: DressCodeItem }>('/api/help/dress-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDressCode: (id: number, payload: Partial<DressCodeItem>) =>
    req<{ success: boolean; data: DressCodeItem }>(`/api/help/dress-code/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteDressCode: (id: number) =>
    req<{ success: boolean }>(`/api/help/dress-code/${id}`, { method: 'DELETE' }),

  // Dos & Don'ts
  getDosDonts: () =>
    req<{ success: boolean; count: number; data: DosDont[] }>('/api/help/dos-donts'),
  createDosDont: (payload: Partial<DosDont>) =>
    req<{ success: boolean; data: DosDont }>('/api/help/dos-donts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDosDont: (id: number, payload: Partial<DosDont>) =>
    req<{ success: boolean; data: DosDont }>(`/api/help/dos-donts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteDosDont: (id: number) =>
    req<{ success: boolean }>(`/api/help/dos-donts/${id}`, { method: 'DELETE' }),

  // Contact Support
  getContacts: () =>
    req<{ success: boolean; count: number; data: ContactSupport[] }>('/api/help/contact-support'),
  createContact: (payload: Partial<ContactSupport>) =>
    req<{ success: boolean; data: ContactSupport }>('/api/help/contact-support', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateContact: (id: number, payload: Partial<ContactSupport>) =>
    req<{ success: boolean; data: ContactSupport }>(`/api/help/contact-support/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteContact: (id: number) =>
    req<{ success: boolean }>(`/api/help/contact-support/${id}`, { method: 'DELETE' }),
};

// ─── SSD Locations ────────────────────────────────────────────────────────────

export const ssdLocationsApi = {
  getAll: () =>
    req<{ success: boolean; count: number; data: SsdLocation[] }>('/api/ssd-locations'),

  getById: (id: number) =>
    req<{ success: boolean; data: SsdLocation }>(`/api/ssd-locations/${id}`),

  create: (payload: Partial<SsdLocation>) =>
    req<{ success: boolean; data: SsdLocation }>('/api/ssd-locations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<SsdLocation>) =>
    req<{ success: boolean; data: SsdLocation }>(`/api/ssd-locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    req<{ success: boolean }>(`/api/ssd-locations/${id}`, { method: 'DELETE' }),

  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return reqForm<{ success: boolean; data: SsdLocation }>(
      `/api/ssd-locations/${id}/image`,
      fd
    );
  },

  deleteImage: (id: number) =>
    req<{ success: boolean; data: SsdLocation }>(`/api/ssd-locations/${id}/image`, {
      method: 'DELETE',
    }),
};

// ─── Scraper ──────────────────────────────────────────────────────────────────

export const scraperApi = {
  getStatus: () =>
    req<{ success: boolean; data: ScraperStatus }>('/api/scraper/status'),

  run: () =>
    req<ScraperRunResult>('/api/scraper/run', { method: 'POST' }),

  preview: () =>
    req<{ success: boolean; data: Record<string, unknown>; elapsed_ms: number }>(
      '/api/scraper/preview',
      { method: 'POST' }
    ),
};
