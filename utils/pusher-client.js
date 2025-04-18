'use client';

import Pusher from 'pusher-js';

let pusher;

export const getPusherClient = () => {
  if (!pusher) {
    pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
  }
  return pusher;
}; 