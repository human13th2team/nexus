<<<<<<< HEAD
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function getCategories(parentId?: string) {
  const url = parentId
    ? `${API}/api/v1/industry/categories/${parentId}`
    : `${API}/api/v1/industry/categories`;

  const res = await fetch(url);
=======
import { api } from '@/lib/api';

export async function getCategories(parentId?: string) {
  const url = parentId
    ? `/api/v1/industry/categories/${parentId}`
    : `/api/v1/industry/categories`;

  const res = await api.get(url);
>>>>>>> ee31a0495004b2bac36f517b8c0a8eacfec7f3a1
  return res.json();
}

export async function getSurveys(industryId: string) {
<<<<<<< HEAD
  const res = await fetch(`${API}/api/v1/industry/${industryId}/surveys`);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createChecklist(payload: any) {
  const res = await fetch(`${API}/api/v1/checklist/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

=======
  try {
    const res = await api.get(`/api/v1/industry/${industryId}/surveys`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch surveys:', error);
    return [];
  }
}

export async function createChecklist(payload: any) {
  const res = await api.post('/api/v1/checklist/create', payload);
>>>>>>> ee31a0495004b2bac36f517b8c0a8eacfec7f3a1
  return res.json();
}

export async function updateStep(progressId: string, payload: any) {
<<<<<<< HEAD
  await fetch(`${API}/api/v1/checklist/${progressId}/step`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
=======
  await api.patch(`/api/v1/checklist/${progressId}/step`, payload);
>>>>>>> ee31a0495004b2bac36f517b8c0a8eacfec7f3a1
}
