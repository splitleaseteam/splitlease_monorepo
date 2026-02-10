import { toDateString } from '../helpers/dateHelpers.js';

export function getNightOwner(nightString, calendarOwnership) {
  const entries = Object.entries(calendarOwnership || {});
  for (const [userId, nights] of entries) {
    if ((nights || []).includes(nightString)) return userId;
  }
  return null;
}

export function validateOwnership({ nights, fromUserId, calendarOwnership }) {
  for (const night of nights || []) {
    const nightString = toDateString(night);
    const owner = getNightOwner(nightString, calendarOwnership);
    if (owner !== fromUserId) {
      throw new Error(`Cannot transfer night ${nightString}: owned by ${owner || 'none'}`);
    }
  }
}

export function validateNotLocked({ nights, pendingNights }) {
  const locked = new Set(pendingNights || []);
  for (const night of nights || []) {
    const nightString = toDateString(night);
    if (locked.has(nightString)) {
      throw new Error('This night is part of another pending request.');
    }
  }
}

export function validateSwapOwnership({ nights, payerId, payeeId, calendarOwnership }) {
  for (const night of nights || []) {
    const nightString = toDateString(night);
    const owner = getNightOwner(nightString, calendarOwnership);
    if (owner !== payerId && owner !== payeeId) {
      throw new Error(`Cannot swap night ${nightString}: owned by ${owner || 'none'}`);
    }
  }
}

export function applyTransactionOwnership({ calendarOwnership, transaction }) {
  const nextOwnership = { ...calendarOwnership };
  const { nights = [], payerId, payeeId, type } = transaction;

  const normalize = (value) => Array.isArray(value) ? [...value] : [];
  nextOwnership[payerId] = normalize(nextOwnership[payerId]);
  nextOwnership[payeeId] = normalize(nextOwnership[payeeId]);

  if (type === 'full_week') {
    nights.forEach((night) => {
      const nightString = toDateString(night);
      nextOwnership[payeeId] = nextOwnership[payeeId].filter((n) => n !== nightString);
      if (!nextOwnership[payerId].includes(nightString)) {
        nextOwnership[payerId].push(nightString);
      }
    });
    return nextOwnership;
  }

  if (type === 'alternating') {
    nights.forEach((night) => {
      const nightString = toDateString(night);
      if (nextOwnership[payerId].includes(nightString)) {
        nextOwnership[payerId] = nextOwnership[payerId].filter((n) => n !== nightString);
        if (!nextOwnership[payeeId].includes(nightString)) {
          nextOwnership[payeeId].push(nightString);
        }
      } else if (nextOwnership[payeeId].includes(nightString)) {
        nextOwnership[payeeId] = nextOwnership[payeeId].filter((n) => n !== nightString);
        if (!nextOwnership[payerId].includes(nightString)) {
          nextOwnership[payerId].push(nightString);
        }
      }
    });
  }

  return nextOwnership;
}
