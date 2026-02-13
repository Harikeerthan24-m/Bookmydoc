export const APP_URL =
  process.env.REACT_APP_ENV === 'development'
    ? `http://localhost:${process.env.REACT_APP_PORT}`
    : '';

export const CURRENCY_SYMBOL = '₹';
