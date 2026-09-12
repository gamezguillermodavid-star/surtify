-- Permite que un usuario autenticado registre sus propios eventos de XP
create policy "usuarios registran sus propios eventos xp" on public.xp_events
  for insert with check (auth.uid() = user_id);
