import Bottleneck from 'bottleneck';

export default function throttle(server) {
  // no throttling on dev/test
  if (process.env.NODE_ENV !== 'production') return false;
  
  let throttler = new Bottleneck.Cluster(4, 250);
  server.addMiddleware(server.MIDDLEWARE_EMIT, function (req, next) {
    throttler.key(req.socket.id).submit(cb => { next(); cb(); }, null);
  });

  // TODO: throttle MIDDLEWARE_HANDSHAKE
}
