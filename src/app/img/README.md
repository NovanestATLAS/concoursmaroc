# Icônes et visuels

Tous les fichiers de ce dossier sont des **créations originales** réalisées pour
Concours Maroc. Aucun emblème officiel, armoirie, logo institutionnel ou visuel
sous droits d'auteur tiers n'est utilisé.

| Fichier | Usage |
|---|---|
| `icon.svg` | Icône de l'application (source vectorielle) |
| `mark.svg` | Étoile zellij seule, utilisée dans l'interface |
| `feature-graphic.svg` | Bandeau Play Store 1024×500 (à exporter en PNG) |

## Export pour Google Play

Google Play exige des PNG. Le script `tools/make_icons.sh` fait la conversion si
`rsvg-convert`, `inkscape` ou ImageMagick est installé :

```
bash tools/make_icons.sh
```

Tailles produites : 512×512 (icône Play), 1024×500 (bandeau), et le jeu
`mipmap-*` pour `res/`.
