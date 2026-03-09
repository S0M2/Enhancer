/**
 * Storage Service
 * Wrapper around Chrome Storage API with clean interface
 */

const STORAGE_KEYS = {
  SETTINGS: 'settings',
  COURSES: 'courseSettings',
  VERSION: 'version'
};

/**
 * Get value from storage
 * @param {string} key
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
export async function get(key, defaultValue = null) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? defaultValue;
  } catch (error) {
    console.error('Storage get error:', error);
    return defaultValue;
  }
}

/**
 * Set value in storage
 * @param {string} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export async function set(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error('Storage set error:', error);
  }
}

/**
 * Remove value from storage
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function remove(key) {
  try {
    await chrome.storage.local.remove(key);
  } catch (error) {
    console.error('Storage remove error:', error);
  }
}

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export async function clear() {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    console.error('Storage clear error:', error);
  }
}

/**
 * Get all settings
 * @returns {Promise<Object>}
 */
export async function getSettings() {
  return get(STORAGE_KEYS.SETTINGS, {});
}

/**
 * Get single setting
 * @param {string} key
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
export async function getSetting(key, defaultValue = null) {
  const settings = await getSettings();
  return settings[key] ?? defaultValue;
}

/**
 * Set single setting
 * @param {string} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  const settings = await getSettings();
  settings[key] = value;
  await set(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Update multiple settings
 * @param {Object} updates
 * @returns {Promise<void>}
 */
export async function updateSettings(updates) {
  const settings = await getSettings();
  Object.assign(settings, updates);
  await set(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Get course settings
 * @returns {Promise<Object>}
 */
export async function getCourseSettings() {
  return get(STORAGE_KEYS.COURSES, {});
}

/**
 * Get single course setting
 * @param {string} courseName
 * @returns {Promise<Object|null>}
 */
export async function getCourseSetting(courseName) {
  if (!courseName) return null;
  const courses = await getCourseSettings();
  
  // Try exact match first
  if (courses[courseName]) return courses[courseName];
  
  // Try without [BAC n] suffix
  const normalized = courseName.replace(/\s*\[BAC\s*\d\]/i, '').trim();
  return courses[normalized] ?? null;
}

/**
 * Set course setting
 * @param {string} courseName
 * @param {Object} setting
 * @returns {Promise<void>}
 */
export async function setCourseSetting(courseName, setting) {
  const courses = await getCourseSettings();
  courses[courseName] = setting;
  await set(STORAGE_KEYS.COURSES, courses);
}

/**
 * Update course setting
 * @param {string} courseName
 * @param {Object} updates
 * @returns {Promise<void>}
 */
export async function updateCourseSetting(courseName, updates) {
  const courses = await getCourseSettings();
  if (!courses[courseName]) courses[courseName] = {};
  Object.assign(courses[courseName], updates);
  await set(STORAGE_KEYS.COURSES, courses);
}

/**
 * Listen for storage changes
 * @param {string} key
 * @param {Function} callback
 * @returns {Function} - Unsubscribe function
 */
export function onStorageChange(key, callback) {
  const handler = (changes) => {
    if (changes[key]) {
      callback(changes[key].newValue, changes[key].oldValue);
    }
  };
  
  chrome.storage.onChanged.addListener(handler);
  
  // Return unsubscribe function
  return () => chrome.storage.onChanged.removeListener(handler);
}

/**
 * Listener on any storage changes
 * @param {Function} callback
 * @returns {Function} - Unsubscribe function
 */
export function onAnyChange(callback) {
  const handler = (changes, areaName) => {
    if (areaName === 'local') {
      callback(changes);
    }
  };
  
  chrome.storage.onChanged.addListener(handler);
  
  return () => chrome.storage.onChanged.removeListener(handler);
}

export { STORAGE_KEYS };
