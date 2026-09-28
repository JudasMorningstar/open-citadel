import React from 'react';

import { ActionButton } from '@/components/action-button';
import { CircleAlert, Import } from '@/components/icons';
import { GoldButton } from '@/components/ui/gold-button';
import { OnboardingStage } from '@/components/stage/onboarding-stage';
import { StageGlyph } from '@/components/stage/stage-glyph';
import { StageHeading } from '@/components/stage/stage-heading';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type ImportFailedProps = {
  message: string;
  bottomPadding: number;
  onRetry: () => void;
  /** Back to where the import was started from. */
  onCancel: () => void;
};

/**
 * An import that stopped: what went wrong in plain words, another go, and a
 * way back out, so a wrong file is never a dead end.
 */
export function ImportFailed({ message, bottomPadding, onRetry, onCancel }: ImportFailedProps) {
  const tokens = useThemeTokens();
  const footer = (
    <>
      <GoldButton label="CHOOSE ANOTHER FILE" icon={Import} onPress={onRetry} />
      <ActionButton label="NOT NOW" onPress={onCancel} centered className="h-12" />
    </>
  );

  return (
    <OnboardingStage bottomPadding={bottomPadding} footer={footer}>
      <StageGlyph icon={CircleAlert} color={tokens['--color-muted-foreground']} />
      <StageHeading title="That file did not work" subtitle={message} />
    </OnboardingStage>
  );
}
