import { supabase } from './supabase/client';

export type PendingAction = () => void | Promise<void>;

let authModalHandler: ((options: { resume?: PendingAction; message?: string }) => void) | null = null;

export function registerAuthModalHandler(
  handler: (options: { resume?: PendingAction; message?: string }) => void
) {
  authModalHandler = handler;
}

export function openAuthModal(options: { resume?: PendingAction; message?: string } = {}) {
  if (authModalHandler) {
    authModalHandler(options);
  }
}

export async function requireAuth(
  arg1: string | (() => void | Promise<void>),
  arg2?: string | (() => void | Promise<void>) | { message?: string }
): Promise<void> {
  let cb: () => void | Promise<void>;
  let message: string | undefined;

  if (typeof arg1 === 'function') {
    cb = arg1;
    if (typeof arg2 === 'string') {
      message = arg2;
    } else if (arg2 && typeof arg2 === 'object' && 'message' in arg2) {
      message = (arg2 as { message?: string }).message;
    }
  } else {
    message = arg1;
    cb = typeof arg2 === 'function' ? arg2 : () => {};
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    openAuthModal({ resume: cb, message: message || 'Sign in to save your progress and interact with the community' });
    return;
  }
  return cb();
}
