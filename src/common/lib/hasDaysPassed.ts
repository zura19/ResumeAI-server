export function hasDaysPassed(date: Date, dayDifference: number): boolean {
  const start = new Date(date);
  const end = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays >= dayDifference;
}
