import { DrumNote, MappedDrumNote } from '../types/midi';
import {
  FGDP_PAD_MAPPING,
  FGDP_PAD_MAPPING_BY_GM,
  PadMappingEntry,
} from '../config/padMapping';

export interface PadMappingResult {
  mapped: MappedDrumNote[];
  unmapped: DrumNote[];
}

/**
 * Map drum notes (GM percussion) to FGDP pad indices using the configured table.
 */
export const mapDrumNotesToPads = (drumNotes: DrumNote[]): PadMappingResult => {
  if (drumNotes.length === 0) {
    return { mapped: [], unmapped: [] };
  }

  const mapped: MappedDrumNote[] = [];
  const unmapped: DrumNote[] = [];

  for (const note of drumNotes) {
    const mapping: PadMappingEntry | undefined =
      FGDP_PAD_MAPPING_BY_GM[note.midi];

    if (!mapping) {
      // Unmapped note - keep for potential debugging/visualization
      unmapped.push(note);
      continue;
    }

    mapped.push({
      ...note,
      padIndex: mapping.padIndex,
      padLabel: mapping.label,
    });
  }

  return { mapped, unmapped };
};




