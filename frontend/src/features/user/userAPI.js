import { BASE_URL } from '../../app/constants';

export function fetchLoggedInUserOrders() {
  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/orders/own/`, { credentials: 'include' });
    const data = await response.json();
    resolve({ data });
  });
}

export function fetchLoggedInUser() {
  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/users/own`, { credentials: 'include' });
    const data = await response.json();
    resolve({ data });
  });
}

export function updateUser(update) {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(`${BASE_URL}/users/${update.id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    // Don't overwrite userInfo with an error body on failure.
    if (!response.ok) {
      reject(data?.message || 'Failed to update profile');
      return;
    }
    resolve({ data });
  });
}
