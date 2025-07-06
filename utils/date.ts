export const dateToInt = (date: Date): number => {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

export const intToDate = (dateInt: number): Date => {
  const year = Math.floor(dateInt / 10000)
  const month = Math.floor((dateInt % 10000) / 100) - 1
  const day = dateInt % 100
  return new Date(year, month, day)
}

export const getTodayInt = (): number => {
  return dateToInt(new Date())
}

export const formatDateInt = (dateInt: number): string => {
  const date = intToDate(dateInt)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  return date.toLocaleDateString('en-US', options)
}
