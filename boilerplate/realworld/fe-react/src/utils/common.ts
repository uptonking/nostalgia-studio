export function getLocalStorageValue(key: string) {
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

export function setLocalStorage(key: string, value: string) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 获取ISO格式的当前时间，返回值示例 2021-11-17T15:45:56，返回值可直接用来创建Date对象
 */
export function getDateISOStrWithTimezone(dateMilliseconds?: number) {
  if (dateMilliseconds === undefined || dateMilliseconds === null) {
    dateMilliseconds = Date.now();
  }
  //offset in milliseconds
  const timezoneOffset = new Date().getTimezoneOffset() * 60000;
  const dateISOStr = new Date(dateMilliseconds - timezoneOffset).toISOString();
  return dateISOStr.slice(0, -5);
}
