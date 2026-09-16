import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const FUEL_LABELS: Record<string, string> = {
  diesel: 'Diésel',
  gasolina_95: 'Gasolina 95',
  gasolina_98: 'Gasolina 98',
  glp: 'GLP',
};

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
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

  const body = await request.json().catch(() => null);
  const stationId = typeof body?.stationId === 'string' ? body.stationId : null;
  const fuelType = typeof body?.fuelType === 'string' ? body.fuelType : null;
  const price = typeof body?.price === 'number' ? body.price : null;
  const hasPhoto = Boolean(body?.hasPhoto);

  if (!stationId || !fuelType || price === null) {
    return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: station } = await service
    .from('gas_stations')
    .select('name')
    .eq('id', stationId)
    .single();

  const { data: favorites } = await service
    .from('favorites')
    .select('user_id')
    .eq('station_id', stationId)
    .neq('user_id', user.id);

  const favoriteUserIds = (favorites ?? []).map((f) => f.user_id);

  if (favoriteUserIds.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  const { data: subscriptions } = await service
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', favoriteUserIds);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  const fuelLabel = FUEL_LABELS[fuelType] ?? fuelType;
  const stationName = station?.name ?? 'una gasolinera favorita';
  const payload = JSON.stringify({
    title: 'Surtify',
    body: `Nuevo precio en ${stationName}: ${fuelLabel} a ${price.toFixed(3)} €/L${
      hasPhoto ? ' (con foto)' : ''
    }`,
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
