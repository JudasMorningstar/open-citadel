import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { spacing } from '@/constants/theme';

/**
 * Whole class strings rather than an interpolated width: the styling compiler
 * only sees classes written out in full.
 */
const LINES = [
  'h-4 w-full', 'h-4 w-[92%]', 'h-4 w-[97%]', 'h-4 w-[88%]',
  'h-4 w-[95%]', 'h-4 w-[58%]', 'h-4 w-[94%]', 'h-4 w-full',
  'h-4 w-[85%]', 'h-4 w-[96%]', 'h-4 w-[90%]', 'h-4 w-[66%]',
  'h-4 w-[93%]', 'h-4 w-full', 'h-4 w-[89%]', 'h-4 w-[97%]',
  'h-4 w-[91%]', 'h-4 w-[52%]', 'h-4 w-[96%]', 'h-4 w-[87%]',
  'h-4 w-full', 'h-4 w-[94%]', 'h-4 w-[90%]', 'h-4 w-[71%]',
  'h-4 w-[95%]', 'h-4 w-full', 'h-4 w-[88%]', 'h-4 w-[93%]',
  'h-4 w-[86%]', 'h-4 w-[61%]', 'h-4 w-[97%]', 'h-4 w-[92%]',
  'h-4 w-full', 'h-4 w-[89%]', 'h-4 w-[94%]', 'h-4 w-[68%]',
];

const PAGE = { marginTop: spacing[8], overflow: 'hidden' } as const;

/**
 * A page of serif lines, standing in for the book until its first page is
 * drawn: full-measure paragraphs that end mid-line, in the reader's own side
 * gutters.
 *
 * One pulse for the page (`SkeletonGroup`), with plain views for its lines.
 * It was a `Skeleton` per line, thirty-six animations of their own, and the
 * reader drew it twice. On a Galaxy A33 that was over a second between the
 * tap on a book and anything moving, and the slide then ran with the reader
 * not yet drawn: the Library moved aside, nothing arrived, and the reader
 * appeared in place afterwards.
 */
export function ReadingSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonGroup label={label} className="flex-1 gap-3 px-6">
      <View className="flex-1 gap-3" style={PAGE}>
        {LINES.map((line, index) => (
          <SkeletonBar key={index} className={line} />
        ))}
      </View>
    </SkeletonGroup>
  );
}
