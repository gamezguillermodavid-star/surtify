-- Permite que un usuario recién registrado cree su fila en public.users
create policy "usuarios crean su propio perfil" on public.users
  for insert with check (auth.uid() = id);
