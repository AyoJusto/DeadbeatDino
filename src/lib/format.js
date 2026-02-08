export function formatTime(totalSeconds) {
	const seconds = Math.floor(totalSeconds);
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const hms = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	return d > 0 ? `${d}d:${hms}` : hms;
}

export function formatPercent(value) {
	return (Math.ceil(value * 1000) / 10).toFixed(1);
}

export function blockAlpha(e) {
	if (e.key === 'e' || e.key === 'E') e.preventDefault();
}
