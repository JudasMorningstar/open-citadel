import { useMutation } from '@tanstack/react-query';
import React from 'react';

import { showToast } from '@/components/toast/toast-provider';
import { invalidateBlogLibrary } from '@/query-manager/blogs';
import { followByAddress } from '@/services/blogs/actions';
import { haptics } from '@/utils/haptics';

/**
 * Following a blog by its address: the sheet's text, the search for its feed
 * (a mutation, so its pending state is the button's), and what went wrong in
 * words when it did. `onFollowed` gets the blog's id, to open it.
 */
export function useAddBlog(onFollowed: (blogId: string) => void) {
  const [visible, setVisible] = React.useState(false);
  const [address, setAddress] = React.useState('');
  // Keys the field per opening: it is uncontrolled (see EditTitleSheet), so a
  // fresh key is how it starts from `address` rather than last time's text.
  const [epoch, setEpoch] = React.useState(0);
  const follow = useMutation({
    mutationFn: (input: string) => followByAddress(input),
    onSuccess: (blogId) => {
      haptics.commit();
      invalidateBlogLibrary();
      setVisible(false);
      setAddress('');
      showToast({ message: 'Following', tone: 'success' });
      onFollowed(blogId);
    },
    onError: () => haptics.warn(),
  });

  // `mutate` and `reset` are stable; the result object around them is not.
  const { mutate, reset, isPending, isError } = follow;
  const open = React.useCallback(
    (initial?: string) => {
      reset();
      setAddress(initial ?? '');
      setEpoch((n) => n + 1);
      setVisible(true);
    },
    [reset],
  );
  const close = React.useCallback(() => {
    if (!isPending) setVisible(false);
  }, [isPending]);
  const submit = React.useCallback(() => {
    const value = address.trim();
    if (value && !isPending) mutate(value);
  }, [address, isPending, mutate]);
  const change = React.useCallback(
    (value: string) => {
      setAddress(value);
      if (isError) reset();
    },
    [isError, reset],
  );

  return {
    open,
    sheet: {
      visible,
      address,
      fieldKey: String(epoch),
      finding: isPending,
      error: follow.error?.message ?? null,
      onChange: change,
      onSubmit: submit,
      onClose: close,
    },
  };
}
