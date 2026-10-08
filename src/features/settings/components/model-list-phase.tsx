import { useCSSVariable } from 'uniwind';

import { PageFade } from '@/components/scroll-fades';
import { ModelListSkeleton } from '@/components/skeletons/model-list-skeleton';
import { Sheet, useSheetSettled } from '@/components/ui/sheet';
import { Swipe, useSwipeGroup } from '@/components/ui/swipe';
import { ModelPickerHeader } from '@/features/settings/components/model-picker-header';
import { ModelRow } from '@/features/settings/components/model-row';
import { useStagedCount } from '@/hooks/use-staged-count';
import type { useModelSheet } from '@/features/settings/hooks/use-model-sheet';
import type { LocalModel } from '@/stores/model';
import { asColor } from '@/utils/colors';

type SheetState = ReturnType<typeof useModelSheet>;

const FILL: { flex: 1 } = { flex: 1 };
/** The rows a sheet this tall shows before it is scrolled. */
const FIRST_ROWS = 9;
/** How many more are drawn each time the thread is idle. */
const ROW_STEP = 6;

/**
 * Every brain Samwell offers that this phone could run.
 *
 * The sheet is fixed height and the list scrolls inside it, the way the chat
 * history does: fifteen brains are taller than the screen, and a sheet sized
 * to its content capped its own height but not the list's, which then ran off
 * the bottom and would not scroll. The title stays put above the list.
 */
export function ModelListPhase({
  sheet,
  mutedForeground,
  primary,
  onDelete,
}: {
  sheet: SheetState;
  mutedForeground?: string;
  primary?: string;
  /** A full swipe or the tile deletes the download at once: the swipe's reach point is the confirmation. */
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <ModelPickerHeader title="Choose Brain" />
      {/* The rows rise with the sheet: they are plain rows but for the
          downloads (see `ModelRow`), and a first screenful of those costs
          less than the placeholder that used to stand in for them. The
          skeleton is for the one real wait, a list not yet read from disk. */}
      {sheet.modelsHydrated ? (
        // `flex-1` on the group: the list inside has nothing to grow into
        // under an auto-height parent.
        <Swipe.Group className="flex-1">
          <ModelList
            models={sheet.models}
            activeModelId={sheet.activeModelId}
            onChoose={sheet.chooseModel}
            onDelete={onDelete}
            mutedForeground={mutedForeground}
            primary={primary}
          />
        </Swipe.Group>
      ) : (
        <ModelListSkeleton count={6} />
      )}
    </>
  );
}

/**
 * The list itself, below `Swipe.Group` so it can close rows as a scroll starts.
 *
 * A plain scroll view, not `Sheet.FlatList`: that list settles on its rows
 * over several passes of measuring and drawing again, eight of them here, and
 * the sheet waited through every one before it moved (1.4s on a Galaxy A33).
 * Fifteen rows need no recycling. The first screenful is drawn with the sheet
 * and the rest once it has landed (`useStagedCount`).
 */
function ModelList({
  models,
  activeModelId,
  onChoose,
  onDelete,
  mutedForeground,
  primary,
}: {
  models: LocalModel[];
  activeModelId: string | null;
  onChoose: (id: string) => void;
  onDelete: (id: string) => void;
  mutedForeground?: string;
  primary?: string;
}) {
  const { closeAll } = useSwipeGroup();
  const foreground = asColor(useCSSVariable('--color-foreground'));
  const settled = useSheetSettled();
  const count = useStagedCount(models.length, FIRST_ROWS, ROW_STEP, !settled);
  const drawn = count < models.length ? models.slice(0, count) : models;

  return (
    // `popover`, so the fade resolves to the sheet's own ground.
    <PageFade edges="both" surface="popover">
      <Sheet.ScrollView
        style={FILL}
        // A row dragged open is put back the moment a scroll begins.
        onScrollBeginDrag={closeAll}
      >
        {drawn.map((model) => (
          <ModelRow
            key={model.id}
            model={model}
            active={model.id === activeModelId}
            onChoose={onChoose}
            onDelete={onDelete}
            mutedForeground={mutedForeground}
            primary={primary}
            foreground={foreground}
            swipes={settled}
          />
        ))}
      </Sheet.ScrollView>
    </PageFade>
  );
}
