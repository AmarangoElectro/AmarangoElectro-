-- Trigger de catálogo corre durante escrituras anon/authenticated en tienda vieja.
-- Sólo procesa OLD/NEW; ejecutarlo como dueño para acceder al helper privado.
alter function ae_private.ae_price_drop_catalog_trigger() security definer;
alter function ae_private.ae_price_drop_cellphone_trigger() security definer;