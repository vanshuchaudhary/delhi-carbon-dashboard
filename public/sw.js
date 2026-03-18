self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || '⚠️ Critical Emission Zone detected. Proximity warning active.',
    icon: '/shield-alert.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      action: 'reroute'
    },
    actions: [
      {
        action: 'reroute',
        title: '🚀 Reroute Now',
        icon: '/check-icon.png'
      },
      {
        action: 'ignore',
        title: 'Dismiss'
      }
    ],
    tag: 'sentinel-alert',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Sentinel Guard Alert', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'reroute') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            client.postMessage({ type: 'TRIGGER_REROUTE' });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/?action=reroute');
        }
      })
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

