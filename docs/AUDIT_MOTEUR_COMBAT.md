# LEGIO VII Grok — Audit moteur de combat (2026-11-01)

## Portée
Inspection statique de `src/lib/legio/engine.ts`. Aucun changement de règles ni de code exécutable.

## Constats
1. `applyC(g, times)` initialise `prevHull = false` à chaque appel. Deux résultats coque successifs **dans le même appel** déclenchent `wreck`. Des impacts répartis entre plusieurs appels ne sont pas mémorisés par cet indicateur.
2. Un résultat autre que coque remet `prevHull` à `false` ; il s'agit de deux résultats coque *consécutifs*, non d'un compteur cumulatif.
3. `wreck` remet les points à zéro, attribue une nouvelle nef et ramène le joueur à la base. La conformité de ce traitement doit être comparée aux textes de référence.
4. L'action `deploy` refuse le débarquement si `g.shieldsUp` est vrai, et indique de réessayer au tour suivant.
5. Le moteur utilise `Math.random()` pour les dés. Pour obtenir des tests déterministes, prévoir une injection contrôlée de la source aléatoire ou un harnais de test, sans modifier les probabilités.

## Limite de l'exécution
Node.js 22.16.0 ne résout pas directement l'import TypeScript sans extension `./content` du moteur dans cette configuration. Une compilation TypeScript isolée en mode NodeNext signale aussi cet import (et un autre import relatif sans extension). Cela ne démontre pas un échec de la compilation Vite du projet.

## Prochaines vérifications
- Comparer les règles « deux impacts coque » et « vaisseau détruit » au règlement original.
- Tester deux résultats coque dans un même appel et dans deux appels distincts.
- Tester boucliers actifs/inactifs, débarquement et changement de tour.
- Tester l'état après destruction et la sauvegarde locale.
- Exécuter la compilation du projet avec ses dépendances dans un environnement isolé, sans migration de base de données.

## Politique de modification
Conserver `main` inchangée. Ne modifier aucune règle avant validation documentaire et tests de non-régression.
