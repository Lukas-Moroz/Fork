import { db } from '@/lib/db';

import React, { useState } from 'react';
import { X, Mail, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useFork } from '../../context/ForkContext';
import { emailSchema } from '@/lib/schemas';

export default function InviteByEmailSheet({ open, onClose }) {
  const { sendFriendRequest } = useFork();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async ({ email }) => {
    setSending(true);
    setSentEmail(email);
    await Promise.all([
      db.integrations.Core.SendEmail({
        to: email.trim(),
        subject: 'Join me on Fork 🍴',
        body: `Hey! I'm using Fork to save and share restaurant finds from social media. Come join me!\n\nSign up here: ${window.location.origin}\n\nSee you on Fork! 🍴`,
      }),
      sendFriendRequest(email.trim()),
    ]);
    setSent(true);
    setSending(false);
    setTimeout(() => { setSent(false); reset(); onClose(); }, 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card w-full max-w-[390px] rounded-t-2xl p-5 sheet-safe-pb"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Invite by email</h2>
              <button onClick={onClose}><X className="w-5 h-5" /></button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-bold">Invite sent!</p>
                <p className="text-sm text-muted-foreground">We sent an invite to {sentEmail}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm text-muted-foreground">Send a friend an email invite to join Fork</p>
                <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    type="email"
                    {...register('email')}
                    placeholder="friend@email.com"
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50"
                >
                  {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send invite'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
