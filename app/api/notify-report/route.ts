import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { haversineDistanceKm } from '@/lib/geo';

const FUEL_LABELS: Record<string, string> = {
  diesel: 'Diésel',
  gasolina_95: 'Gasolina 95',
  gasolina_98: 'Gasolina 98',
  glp: 'GLP',
  adblue: 'AdBlue',
  gasoleo_premium: 'Gasóleo Premium',
  gasolina_95_premium: 'Gasolina 95 Premium',
  gasoleo_b: 'Gasóleo B',
};

const SERVICE_LABELS: Record<string, string> = {
  aseos: 'Aseos',
  pago_tarjeta: 'Pago con tarjeta',
  tienda: 'Tienda',
  aire_agua: 'Aire y agua',
  lavado: 'Lavado',
};

const WAIT_LABELS: Record<string, string> = {
  sin_espera: 'sin espera',
  espera_normal: 'espera normal',
  mucha_espera: 'mucha espera',
};

// Radio alrededor de la gasolinera dentro del cual se notifica a los
// usuarios que tienen activadas las notificaciones de zona.
const ZONE_NOTIFICATION_RADIUS_KM = 15;

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

function buildNotificationBody(
  stationName: string,
  kind: 'price' | 'service' | 'wait',
  body: Record<string, unknown>
): string | null {
  if (kind === 'price') {
    const fuelType = typeof body.fuelType === 'string' ? body.fuelType : null;
    const price = typeof body.price === 'number' ? body.price : null;
    const hasPhoto = Boolean(body.hasPhoto);
    if (!fuelType || price === null) return null;
    const fuelLabel = FUEL_LABELS[fuelType] ?? fuelType;
    return `Nuevo precio en ${stationName}: ${fuelLabel} a ${price.toFixed(3)} €/L${
      hasPhoto ? ' (con foto)' : ''
    }`;
  }

  if (kind === 'service') {
    const services = Array.isArray(body.services)
      ? body.services.filter((s): s is string => typeof s === 'string')
      : [];
    if (services.length === 0) return null;
    const labels = services.map((s) => SERVICE_LABELS[s] ?? s).join(', ');
    return `${stationName} tiene: ${labels}`;
  }

  if (kind === 'wait') {
    const level = typeof body.level === 'string' ? body.level : null;
    if (!level) return null;
    const label = WAIT_LABELS[level] ?? level;
    return `Espera reportada en ${stationName}: ${label}`;
  }

  return null;
}

export async function POST(request: Request) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ notified: 0 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const requestBody = await request.json().catch(() => null);
  const stationId =
    typeof requestBody?.stationId === 'string' ? requestBody.stationId : null;
  const kind = requestBody?.kind;

  if (!stationId || (kind !== 'price' && kind !== 'service' && kind !== 'wait')) {
    return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: station } = await service
    .from('gas_stations')
    .select('name, latitude, longitude')
    .eq('id', stationId)
    .single();

  const stationName = station?.name ?? 'una gasolinera';
  const notificationBody = buildNotificationBody(stationName, kind, requestBody ?? {});

  if (!notificationBody) {
    return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
  }

  const recipientIds = new Set<string>();

  const { data: favorites } = await service
    .from('favorites')
    .select('user_id, users!inner(notify_favorites)')
    .eq('station_id', stationId)
    .eq('users.notify_favorites', true)
    .neq('user_id', user.id);

  for (const row of favorites ?? []) recipientIds.add(row.user_id);

  if (station?.latitude != null && station?.longitude != null) {
    const { data: zoneUsers } = await service
      .from('users')
      .select('id, last_latitude, last_longitude')
      .eq('notify_zone', true)
      .not('last_latitude', 'is', null)
      .not('last_longitude', 'is', null)
      .neq('id', user.id);

    for (const candidate of zoneUsers ?? []) {
      if (candidate.last_latitude == null || candidate.last_longitude == null) continue;
      const distanceKm = haversineDistanceKm(
        station.latitude,
        station.longitude,
        candidate.last_latitude,
        candidate.last_longitude
      );
      if (distanceKm <= ZONE_NOTIFICATION_RADIUS_KM) {
        recipientIds.add(candidate.id);
      }
    }
  }

  if (recipientIds.size === 0) {
    return NextResponse.json({ notified: 0 });
  }

  const { data: subscriptions } = await service
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', Array.from(recipientIds));

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  const payload = JSON.stringify({
    title: 'Surtify',
    body: notificationBody,
    url: `/station/${stationId}`,
  });

  let notified = 0;
  const expiredIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        notified += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    })
  );

  if (expiredIds.length > 0) {
    await service.from('push_subscriptions').delete().in('id', expiredIds);
  }

  return NextResponse.json({ notified });
}
