const full=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0});
const compact=new Intl.NumberFormat('ko-KR',{notation:'compact',maximumFractionDigits:1});
export function compactNumber(value){if(!Number.isFinite(value))return '—';const n=Math.floor(value);return Math.abs(n)<10000?full.format(n):compact.format(n);}
