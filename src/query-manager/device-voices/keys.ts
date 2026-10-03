/** The phone's own text-to-speech voices. */
export const deviceVoiceKeys = {
  all: ['device-voices'] as const,
  /** Every voice the phone's speech engine has. */
  list: () => [...deviceVoiceKeys.all, 'list'] as const,
};
