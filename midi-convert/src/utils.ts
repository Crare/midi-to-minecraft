export function midiToPitchClass(noteNumber: number): string {
    const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	const note = noteNumber % 12;
	return scaleIndexToNote[note];
}

export function midiToMinecraftNote(noteNumber: number): number {
	return ((noteNumber - 6) % 24 + 24) % 24;
}