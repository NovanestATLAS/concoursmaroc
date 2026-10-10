# Polices

L’application embarque les deux polices du site, en local (aucun appel à
Internet) :

| Fichier | Police | Usage |
|---|---|---|
| `plus-jakarta-sans-latin-wght-normal.woff2` | Plus Jakarta Sans (variable, 200–800) | textes en français et chiffres |
| `readex-pro-arabic-wght-normal.woff2` | Readex Pro (variable, 160–700) | textes en arabe |

Les deux sont publiées sous la **SIL Open Font License 1.1** : leurs licences
sont jointes (`OFL-plus-jakarta-sans.txt`, `OFL-readex-pro.txt`) et doivent
rester à côté des fichiers. Elles sont déclarées en tête de `css/app.css`
(`@font-face`, famille « CM Sans ») ; si un fichier manque, le texte s’affiche
avec les polices du téléphone (Roboto, Noto Sans Arabic).
