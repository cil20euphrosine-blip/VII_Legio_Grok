# VII LEGIO — Version Grok

Dépôt public indépendant du projet `VII_Legio`, destiné à recevoir le code de `grok-workspace.zip`.

## Statut

Import des sources à finaliser. Le moteur de jeu et l'interface ne sont pas encore publiés dans ce dépôt.

## Architecture de l'archive

- React / TypeScript / Vite
- `src/lib/legio/engine.ts` : moteur
- `src/lib/legio/content.ts` : données et tables
- `src/components/legio/console.tsx` : interface

## Conformité

Les tables A–L comportent des données provisoires : elles doivent être confrontées au règlement original.

## Sécurité

Ne pas importer les secrets, fichiers `.env`, dépendances installées ou sorties de compilation. L'archive source nettoyée doit faire l'objet d'une revue avant publication.
