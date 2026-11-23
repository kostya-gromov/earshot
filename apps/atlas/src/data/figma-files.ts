import { FigmaFiles } from '@earshot/contracts';
import records from './figma-files.json';

/*
 * The files for Figma the site offers, by pattern id (scripts/figma-file.ts writes the record;
 * a unit test compares its fingerprint with the board as it would be drawn now). A pattern
 * without a record has no download.
 */
export const figmaFiles: FigmaFiles = FigmaFiles.parse(records);
