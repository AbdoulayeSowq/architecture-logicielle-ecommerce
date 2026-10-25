[OPEN] Debug session: `assignment-submit-500`

## Symptomes
- Soumission de devoir en erreur `500`
- Compteur `Surveillance (Sorties: 0/3)` ne bouge pas en usage reel
- Comportement attendu: compteur temps reel et soumission reussie

## Hypotheses
- `A`: l'UI affiche `mouseExitCount` alors que les sorties reelles incrementent surtout `tabSwitchCount`
- `B`: le payload de soumission ne correspond pas au DTO backend
- `C`: `mouseleave` ne detecte pas les changements d'application/fenetre
- `D`: l'URL/identifiant du devoir et le corps de requete sont incoherents
- `E`: des etats front masquent un comportement reel different de celui affiche

## Plan
- Demarrer le Debug Server
- Instrumenter sans changer la logique metier
- Reproduire
- Analyser les logs
- Appliquer un correctif minimal base sur preuves
