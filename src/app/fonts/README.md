# Polices

**Aucun fichier de police binaire n'est livré dans ce paquet.** C'est un choix
délibéré, autorisé par le cahier des charges (« police correctement licenciée
embarquée localement **ou** repli fiable sur les polices système ») :

* les polices système d'Android couvrent parfaitement les deux langues de
  l'application (Roboto pour le latin, Noto Naskh Arabic / Droid Arabic Naskh
  pour l'arabe) ;
* ne rien embarquer évite d'alourdir l'APK de plusieurs centaines de kilooctets ;
* cela supprime tout risque de licence mal documentée dans le dépôt.

La pile déclarée dans `css/app.css` est :

```css
--font-ui: "Segoe UI", Roboto, "Helvetica Neue", Arial, system-ui, sans-serif;
--font-ar: "Noto Naskh Arabic", "Traditional Arabic", "Geeza Pro",
           "Droid Arabic Naskh", serif;
```

## Si vous souhaitez embarquer Noto

1. Téléchargez **Noto Naskh Arabic** et **Noto Sans** depuis
   <https://fonts.google.com/noto> (licence SIL Open Font License 1.1).
2. Placez les fichiers `.ttf` dans ce dossier.
3. Ajoutez en tête de `css/app.css` :

```css
@font-face {
  font-family: "Noto Naskh Arabic";
  src: url("../fonts/NotoNaskhArabic-Regular.ttf") format("truetype");
  font-weight: 400;
  font-display: swap;
}
```

4. Copiez le texte de la licence OFL dans `THIRD_PARTY_LICENSES.md` et gardez le
   fichier `OFL.txt` d'origine à côté des `.ttf`.

La SIL OFL autorise l'inclusion dans une application commerciale ; elle interdit
la vente des fichiers de police seuls et impose de conserver l'avis de licence.
