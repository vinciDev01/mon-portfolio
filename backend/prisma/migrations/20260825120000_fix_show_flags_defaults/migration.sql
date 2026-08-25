-- Le bascule vers l'identite sombre a six sections avait mis a jour la ligne
-- existante (show_services = false, show_testimonials = false) mais pas le
-- defaut de colonne : toute installation neuve recreait donc ces deux
-- sections. On aligne le defaut de colonne sur l'intention du produit.
ALTER TABLE "site_settings"
ALTER COLUMN "show_services" SET DEFAULT false,
ALTER COLUMN "show_testimonials" SET DEFAULT false;
