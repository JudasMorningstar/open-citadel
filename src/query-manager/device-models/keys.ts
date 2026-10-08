/** The on-device brains' facts that live on Hugging Face, not in the app. */
export const deviceModelKeys = {
  all: ['device-models'] as const,
  /** What a brain's files weigh at the revision the catalogue pins. */
  size: (id: string) => [...deviceModelKeys.all, 'size', id] as const,
};
