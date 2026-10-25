# 🎯 Audit UX/UI Professionnel — LMS EPT (Frontend Web)

**Date** : 11 Août 2026
**Périmètre** : `lms-frontend/src/` — focus Étudiant (`pages/Student/`) et Professeur (`pages/Lecturer/`), 35 707 lignes TS/TSX au total, 30 fichiers de pages dans le périmètre
**Méthode** : Revue de code statique (routing, protection contre la perte de données, feedback utilisateur, accessibilité, dette design) — pas de test manuel dans le navigateur
**Contexte** : `FRONTEND_DESIGN_GUIDE.md` documente déjà la charte graphique (couleurs, composants Classroom). Cet audit va plus loin, dans le même esprit que [`lms_ept/AUDIT_UX_PRO_2026.md`](lms_ept/AUDIT_UX_PRO_2026.md) côté mobile : il vérifie ce qui est **réellement appliqué** et se concentre sur l'**UX** (parcours, filet de sécurité, feedback), pas seulement sur la couleur des boutons.

---

## 📋 Résumé exécutif

Le frontend web a en réalité une **meilleure base qu'il n'y paraît** : un vrai design system existe déjà dans `components/ui/` (`Button`, `Card`, `Badge`, `ConfirmModal`, `EmptyState`, `Skeleton`, `Loading`...) et un wrapper de notifications propre (`components/notify.tsx`, `notifySuccess/Error/Warning/Info` sur `react-toastify`). Le problème n'est **pas l'absence d'outils**, c'est leur **adoption partielle** — exactement le même symptôme que l'audit mobile avait identifié comme le chantier le plus rentable.

Le travail récent (dernières semaines, voir `git log`) s'est concentré presque exclusivement sur le flux Quiz/Devoir/Meeting (timer, surveillance, sortie propre). Le reste des pages Étudiant/Professeur (Home, Grades, Forum, Materials, Mentorship, Analytics, Certificates, Leaderboard, Profile, Announcements, Timetable, AtRiskStudents) n'a pas été retouché depuis ~3 mois et concentre l'essentiel de la dette identifiée ici.

**Verdict** : Fondations (design tokens, composants partagés) solides ✅ — Sprint 1 (#1-3) et l'essentiel du Sprint 2 (#4-6) corrigés le 11/08/2026 ✅ — #8 partiellement corrigé (42 doublons hex exacts) 🟡 — Reste : réduction du volume de style inline (#7, nécessite une revue visuelle, pas mécanisable sans risque) et pagination à surveiller (#9).

> **📌 Mise à jour du 11 août 2026** — Sprint 1 et Sprint 2 sont corrigés. Le détail est dans [🗺️ Plan d'action priorisé](#️-plan-daction-priorisé), qui fait foi pour savoir ce qui reste à faire. Les sections "Problèmes" ci-dessous gardent l'analyse d'origine (utile pour comprendre le *pourquoi*) avec un tag ✅/⏳ sur chaque titre — deux d'entre elles portent aussi une note de correction là où le travail effectif a révélé une réalité un peu différente du comptage initial (états vides : deux conventions coexistaient déjà ; accessibilité : `title` servait déjà de filet pour la plupart des boutons).

| Axe | État | Priorité |
|---|---|---|
| Design tokens + composants partagés (`components/ui/`) | 🟢 Existent et sont bien conçus | Basse |
| Protection contre la perte de progression (refresh/fermeture pendant un quiz/devoir chronométré) | ✅ Corrigé (`beforeunload`) | ~~Haute~~ |
| Cohérence du feedback (`alert()`/`window.confirm()` vs `notify*`/`ConfirmModal`) | ✅ Corrigé sur le périmètre Student/Lecturer (+ Meeting/Practice partagés) | ~~Haute~~ |
| Cohérence des états vides/chargement (`.empty-state-box`, `Loading`) | ✅ Corrigé sur les blocs ad-hoc restants | ~~Moyenne~~ |
| Accessibilité (nom accessible sur actions icône-seule) | ✅ Corrigé (la plupart avaient déjà `title` ; 2 boutons sans filet corrigés) | ~~Moyenne~~ |
| Dette de style inline (`style={{...}}`, hex codés en dur) | 🟡 1145 `style={{}}` (inchangé, gros volume) — 42/~280 hex en doublon de token corrigés | Moyenne |
| Pagination / perf listes (forum, annonces) | 🟢 Pas critique au volume actuel (listes scopées à une classe) | Basse |

---

## 🔴 Problèmes critiques (à corriger en premier)

### 1. Aucune protection contre la perte de progression sur refresh/fermeture d'onglet pendant un quiz ou un devoir chronométré ✅ Corrigé

Le flux Quiz/Devoir a reçu un vrai travail de fond récemment : [AssignmentTake.tsx:639-651](lms-frontend/src/pages/Student/ModuleDetail/AssignmentTake.tsx#L639-L651) a un bouton **"Quitter"** explicite avec une modale de confirmation dédiée (remplaçant `window.confirm` justement pour éviter les faux positifs de sortie de souris — bon réflexe). Le layout plein écran (`FocusLayout.tsx`) masque toute navigation vers d'autres pages, donc le seul chemin de sortie *volontaire* est bien protégé.

Mais recherche de `beforeunload`/`onbeforeunload` sur tout `src/` : **0 résultat**. Sur ces mêmes écrans (`AssignmentTake.tsx`, `Quiz.tsx`), un F5 accidentel, un `Cmd+W`/fermeture d'onglet, ou le bouton retour du navigateur ferment la page **sans aucun avertissement natif**, alors que ce sont précisément des écrans avec timer, détection de sortie de souris et rapport d'intégrité — donc des tentatives à fort enjeu (notées, chronométrées) où perdre 20 questions sans prévenir est le pire scénario possible.

**Scénario concret** : un étudiant fait un devoir noté de 45 minutes, rafraîchit par réflexe (geste très courant) à la question 30 pour un problème d'affichage → toute la tentative est perdue silencieusement, aucun `window.confirm("Les modifications que vous avez apportées ne seront peut-être pas enregistrées.")` natif ne s'affiche.

**Fix** : ajouter un `useEffect` avec `window.addEventListener('beforeunload', handler)` sur `AssignmentTake.tsx` et `Quiz.tsx`, actif uniquement pendant une tentative en cours (pas après soumission) :
```tsx
useEffect(() => {
  if (!attemptInProgress) return;
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [attemptInProgress]);
```
~10 lignes par écran, à factoriser dans un hook partagé `useUnsavedChangesGuard`.

### 2. Les erreurs de soumission de quiz/devoir utilisent `alert()` natif au lieu du système de notification existant ✅ Corrigé

`components/notify.tsx` expose déjà `notifyError`, bien conçu (icône, thème sombre/clair, cohérent avec `react-toastify` déjà monté globalement dans [App.tsx:163-174](lms-frontend/src/App.tsx#L163-L174)). Pourtant, **26 appels `alert()` bruts** subsistent, concentrés précisément sur les moments les plus critiques :

- [Quiz.tsx:268](lms-frontend/src/pages/Student/Quiz/Quiz.tsx#L268) — `alert("La soumission a échoué.")`
- [Quiz.tsx:272](lms-frontend/src/pages/Student/Quiz/Quiz.tsx#L272) — `alert("Erreur lors de la soumission : " + ...)`
- [AdaptiveQuiz.tsx:125](lms-frontend/src/pages/Student/Quiz/AdaptiveQuiz.tsx#L125) — `alert("Erreur lors de la soumission : " + ...)`
- + 7 occurrences dans `Lecturer/ModuleDetail/ModuleDetail.tsx` (démarrage de Live, suppression de séance/devoir, génération de quiz IA)

`alert()` est bloquant (fige le thread JS), ne respecte ni le dark mode ni la charte graphique, et casse la cohérence visuelle sur exactement les écrans qui ont reçu le plus de soin ailleurs (timer, exit modal). C'est un signal "pas fini" très visible à l'instant précis où l'utilisateur est déjà stressé (échec de soumission d'un examen).

**Fix** : remplacer chaque `alert(...)` par `notifyError(...)` — mécanique, fichier par fichier, aucun risque de régression fonctionnelle.

### 3. `window.confirm()` encore utilisé malgré l'existence de `ConfirmModal` ✅ Corrigé

`components/ui/ConfirmModal.tsx` existe et est déjà adopté dans `AssignmentTake.tsx`. Mais **12 `window.confirm()`** bruts subsistent ailleurs, dont 5 dans le périmètre Étudiant/Professeur :

- [Lecturer/Materials/materials.tsx:69](lms-frontend/src/pages/Lecturer/Materials/materials.tsx#L69) — suppression d'un support
- [Lecturer/Quiz/Quiz.tsx:151](lms-frontend/src/pages/Lecturer/Quiz/Quiz.tsx#L151) — suppression d'un quiz
- [Lecturer/ModuleDetail/ModuleDetail.tsx:1932](lms-frontend/src/pages/Lecturer/ModuleDetail/ModuleDetail.tsx#L1932) — génération de quiz IA
- [Lecturer/Announcements/Announcements.tsx:172](lms-frontend/src/pages/Lecturer/Announcements/Announcements.tsx#L172) — suppression d'annonce

Même symptôme que le #2 : le composant partagé existe, un écran l'utilise déjà comme référence, mais la propagation s'est arrêtée là. Ce sont en plus des actions **destructives** (suppression), là où une modale cohérente avec la charte (plutôt qu'une popup navigateur générique) inspire davantage confiance avant un "supprimer".

**Fix** : remplacer les `window.confirm(...)` par `<ConfirmModal>` en suivant le pattern déjà en place dans `AssignmentTake.tsx`.

---

## 🟠 Problèmes moyens (impact réel, correction plus large)

### 4. `EmptyState`/`Skeleton` existent mais ne sont adoptés que dans 2 et 6 fichiers sur 30 ✅ Corrigé partiellement

`components/ui/EmptyState.tsx` et `components/ui/Skeleton.tsx` sont bien conçus, mais :
- `EmptyState` n'est importé que dans `Student/Grades/Grades.tsx` et `Student/Home/Home.tsx`
- `Skeleton` seulement dans 6 fichiers (Home ×2, ModuleDetail ×2, Announcements ×1)
- En comparaison, **30/30** fichiers Student+Lecturer contiennent du texte "Aucun ..." écrit à la main (état vide ad-hoc, mise en forme non garantie cohérente) et **13** fichiers ont leur propre bloc "Chargement..." (dont 3 avec du markup Bootstrap `spinner-border` brut plutôt que le composant `Loading` partagé).

C'est le chantier le plus "rentable" de ce rapport : peu de code par fichier, effort faible, mais cohérence visuelle immédiate sur toutes les pages qui n'ont pas eu la passe de redesign récente (Forum, Materials, Mentorship, Certificates, Leaderboard, Announcements, Timetable, Profile, AtRiskStudents...).

> **Correction en cours de travail** : en creusant fichier par fichier, il existe en réalité une **deuxième** convention déjà largement adoptée — la classe CSS `.empty-state-box` (`styles/components.css`), utilisée dans 11 fichiers, theme-aware et visuellement propre (icône atténuée + texte centré, bordure en pointillés). Le vrai problème n'était donc pas "aucun pattern partagé n'existe", mais **deux conventions qui coexistent** (le composant React `EmptyState` et la classe CSS `.empty-state-box`) plus une poignée de blocs réellement ad-hoc (couleurs/fond codés en dur, parfois cassant le dark mode comme `bg-white` dans `AtRiskStudents.tsx`). Le correctif a donc consisté à aligner les blocs ad-hoc restants sur `.empty-state-box` (déjà majoritaire) plutôt que de forcer une troisième migration vers `EmptyState` — moins de code changé, même résultat de cohérence.

### 5. Accessibilité quasi absente sur les actions icône-seule ✅ Corrigé (moins grave que le comptage initial ne le laissait penser)

**5 `aria-label`** au total sur les 30 fichiers Student+Lecturer, pour **148 `<button>`**. Beaucoup d'actions (supprimer, éditer, rejoindre un live, ouvrir un menu) sont des boutons ne contenant qu'une icône FontAwesome sans texte — sans `aria-label`, un lecteur d'écran ne peut pas les identifier. Aucun `<img>` n'a été trouvé dans le périmètre (les avatars semblent passer par un composant dédié plutôt que par des balises `<img>`), donc pas de problème d'`alt` manquant à ce niveau.

> **Correction en cours de travail** : une analyse programmatique de tous les `<button>` icône-seule du périmètre (contenu = uniquement une balise `<i>`, sans texte ni expression dynamique) montre que la quasi-totalité porte déjà un attribut `title` — qui sert de nom accessible de repli pour la plupart des lecteurs d'écran (calcul du nom accessible HTML-AAM), même si ce n'est pas aussi robuste qu'un `aria-label` explicite (pas de tooltip visible au clavier/tactile, dépend de l'implémentation du lecteur d'écran). Seuls **2 boutons** sur tout le périmètre avaient un `title` sans `aria-label` correspondant : "Modifier"/"Supprimer le devoir" dans `Lecturer/ModuleDetail.tsx` et "Quitter le quiz" dans `Student/Quiz/Quiz.tsx` — corrigés en ajoutant `aria-label` en complément du `title` existant. Le vrai trou n'était donc pas "148 boutons sans nom accessible" mais "148 boutons sans le tag `aria-label` explicite recommandé, dont la plupart ont déjà un filet de sécurité via `title`".

### 6. Code de layout mort/trompeur dans `StudentLayout.tsx` ✅ Corrigé

[StudentLayout.tsx:8](lms-frontend/src/pages/Student/StudentLayout.tsx#L8) contient :
```tsx
const isFocusMode = location.pathname.includes('/quiz') || location.pathname.includes('/take');
```
Mais en pratique, aucune route imbriquée sous `/student/*` (donc rendue via `StudentLayout`) ne matche `/quiz` ou `/take` : les vraies pages Quiz (`/student/:moduleId/quiz/:quizId`) et devoir (`.../take`) sont déclarées **hors** de `/student/*`, directement enveloppées dans `FocusLayout` ([App.tsx:186-197](lms-frontend/src/App.tsx#L186-L197)). Seule `AdaptiveQuiz` est imbriquée (`:id/adaptive-quiz`), et son chemin ne contient pas la sous-chaîne `/quiz` (c'est `adaptive-quiz`, pas `/quiz`). Cette condition est donc **toujours fausse** aujourd'hui — du code mort qui laisse croire à un mécanisme de protection qui n'agit jamais, exactement le type de piège relevé côté mobile (`_currentIndex()` avec une condition inatteignable).

**Fix** : soit supprimer ce bloc mort, soit — si l'intention était de masquer aussi la nav pendant `AdaptiveQuiz` — corriger la condition pour matcher réellement ce cas.

---

## 🟡 Problèmes mineurs / dette continue

### 7. Dette de style inline concentrée sur peu de fichiers ⏳ Partiellement corrigé (voir #8)

`FRONTEND_DESIGN_GUIDE.md` impose "Zéro Style Inline". La réalité : **1145 occurrences de `style={{...}}`** sur 14 fichiers du périmètre Student/Lecturer, très inégalement réparties :

| Fichier | Occurrences |
|---|---|
| `Lecturer/ModuleDetail/ModuleDetail.tsx` | 245 |
| `Student/ModuleDetail/AssignmentTake.tsx` | 154 |
| `Student/Home/Home.tsx` | 53 |
| `Student/Quiz/AdaptiveQuiz.tsx` | 72 |
| `Student/Quiz/Quiz.tsx` | 68 |
| `Student/ModuleDetail/ModuleDetail.tsx` | 74 |
| `Lecturer/Home/Home.tsx` | 35 |

Des couleurs hex codées en dur subsistent aussi dans ces mêmes fichiers (ex. `#d97706`, `#ef4444`, `#fff` dans [Quiz.tsx:492-590](lms-frontend/src/pages/Student/Quiz/Quiz.tsx#L492-L590)) plutôt que `var(--warning)`/`var(--danger)` — risque de désynchronisation silencieuse si la palette évolue, et pas de garantie de cohérence en dark mode sur ces valeurs précises même si elles semblent correctes visuellement aujourd'hui.

Ce n'est pas un problème d'UX en soi (le rendu peut être correct), mais une dette qui rend toute évolution future de la charte plus coûteuse et risquée sur ces deux fichiers en particulier.

> **Correction en cours de travail** : sur les ~325 couleurs hex codées en dur du périmètre, **42 dupliquaient exactement** la valeur d'un token (`#3b82f6`=`--accent`, `#16a34a`=`--success`, `#d97706`=`--warning`, `#dc2626`=`--danger`) — remplacées par `var(--...)` sur 12 fichiers, y compris dans un dégradé CSS (`linear-gradient`) et un cas où un ternaire mélangeait la valeur hex et la variable pour le **même** état (`AssignmentTake.tsx`, simplifié au passage). Ce sont des changements strictement sans risque visuel en mode clair (valeur identique) et qui corrigent un vrai bug de dark mode : ces couleurs restaient figées au lieu de basculer vers les variantes plus vives définies sous `[data-theme="dark"]`.
>
> Les **~240 couleurs restantes** (`#ef4444`, `#f59e0b`, `#6366f1`, `#8b5cf6`, `#fff` sur fond coloré, etc.) ne sont **pas** des doublons exacts d'un token existant — ce sont soit des teintes Tailwind proches mais différentes (choix probablement délibéré pour distinguer visuellement plusieurs états), soit des couleurs d'accent décoratives (icônes de stat cards) sans mapping évident vers les 4 tokens sémantiques actuels, soit du blanc de texte sur fond coloré (correct indépendamment du thème). Les remplacer à l'aveugle demanderait soit de deviner l'intention de chaque couleur, soit d'étendre la palette de tokens — un travail de design, pas un nettoyage mécanique sûr. Non fait dans ce lot ; à traiter avec une revue visuelle (ou en élargissant `index.css` avec des tokens secondaires : `--indigo`, `--purple`, etc.) plutôt qu'en aveugle.
>
> Idem pour la réduction du **nombre brut** de `style={{...}}` (1145 occurrences, #7) : une bonne partie sont légitimement dynamiques (couleur qui dépend d'un état `isSelected`/`timeLeft`/etc.) et ne peuvent pas devenir de simples classes CSS statiques sans un refactor plus large (classes conditionnelles + variables CSS custom, ou extraction de sous-composants). Vu le volume et le risque de régression visuelle sur des écrans aussi testés que Quiz/AssignmentTake sans navigateur pour vérifier, ce n'est pas quelque chose à faire en aveugle dans un gros lot — à traiter fichier par fichier, avec vérification visuelle, dans une prochaine session.

### 8. Pas de pagination sur les listes (Forum, Annonces, Leaderboard)

Pas de `pageSize`/`hasMore`/scroll infini dans les pages de liste — mais contrairement au mobile (historique global, plusieurs années), ces listes sont scopées à une classe/un module, donc le volume reste probablement raisonnable à court terme. **À surveiller**, pas urgent.

---

## 🟢 Ce qui est déjà bien fait (à ne pas casser)

- `components/ui/` : un vrai mini design-system existe (`Avatar`, `Badge`, `Breadcrumbs`, `Button`, `Card`, `ConfirmModal`, `EmptyState`, `ErrorBoundary`, `Input`, `Loading`, `PageTransition`, `Skeleton`, `Transition`) — plus mature que ce que l'audit mobile avait trouvé à l'équivalent.
- `components/notify.tsx` : wrapper `notifySuccess/Error/Warning/Info` propre sur `react-toastify`, avec icônes et thème cohérent — juste sous-utilisé.
- `AssignmentTake.tsx` : le bouton "Quitter" + modale de confirmation dédiée (plutôt que `window.confirm`) est exactement le bon pattern — c'est la référence à copier pour le reste de l'app.
- `FocusLayout.tsx` : layout plein écran propre pour les tentatives de quiz/devoir, avec nettoyage correct des classes body au démontage.
- `PrivateRoute.tsx` : logique de redirection par rôle centralisée et lisible, un seul endroit à maintenir.
- Code splitting via `lazy()` + `Suspense` sur la quasi-totalité des routes ([App.tsx](lms-frontend/src/App.tsx)) — bon réflexe de perf perçue au chargement initial.
- Dark mode déjà branché via `[data-theme="dark"]`, avec des correctifs récents ciblés (modales Home) qui montrent que le sujet est suivi activement.

---

## 🗺️ Plan d'action priorisé

| # | Action | Effort | Impact | Priorité | Statut |
|---|---|---|---|---|---|
| 1 | `beforeunload` sur `AssignmentTake.tsx` et `Quiz.tsx` pendant une tentative en cours | Faible | Élevé (anti perte de données sur écrans notés/chronométrés) | 🔴 Sprint 1 | ✅ Fait |
| 2 | Remplacer les 26 `alert()` par `notifyError`/`notifySuccess` | Faible-moyen | Élevé (cohérence, surtout sur échecs de soumission quiz/devoir) | 🔴 Sprint 1 | ✅ Fait |
| 3 | Remplacer les `window.confirm()` par `ConfirmModal` | Faible | Moyen-élevé (cohérence sur actions destructives) | 🔴 Sprint 1 | ✅ Fait (sauf 2 handlers morts, voir détail) |
| 4 | Supprimer/corriger le code mort `isFocusMode` dans `StudentLayout.tsx` | Très faible | Faible (clarté du code, évite un faux sentiment de protection) | 🟠 Sprint 2 | ✅ Fait |
| 5 | Aligner les états vides/chargement ad-hoc restants sur `.empty-state-box` / `Loading` | Moyen | Élevé (cohérence visuelle transversale) | 🟠 Sprint 2 | ✅ Fait (voir détail) |
| 6 | `aria-label` sur les actions icône-seule critiques (supprimer, soumettre, rejoindre live) | Moyen (incrémental) | Moyen (accessibilité) | 🟢 Continu | ✅ Fait (2 boutons concernés, le reste avait déjà `title`) |
| 7 | Réduire les style inline sur `Lecturer/ModuleDetail/ModuleDetail.tsx` (245) et `AssignmentTake.tsx` (154) en priorité | Élevé | Faible-moyen (maintenabilité charte) | 🟢 Continu | ⏳ À faire (nécessite revue visuelle, pas mécanisable) |
| 8 | Remplacer les hex codés en dur restants par les variables CSS (`var(--danger)`, `var(--warning)`...) | Faible-moyen | Faible (cohérence dark mode) | 🟢 Continu | 🟡 Fait pour les 42 doublons exacts / ~240 restants nécessitent un choix de design |
| 9 | Pagination Forum/Annonces/Leaderboard si le volume augmente | Moyen | Faible aujourd'hui | 🟢 À surveiller | ⏳ À surveiller |

### Détail des correctifs appliqués (11 août 2026)

- **#1** — `useEffect` `beforeunload` ajouté dans [AssignmentTake.tsx](lms-frontend/src/pages/Student/ModuleDetail/AssignmentTake.tsx) et [Quiz.tsx](lms-frontend/src/pages/Student/Quiz/Quiz.tsx), actif uniquement pendant une tentative en cours (`hasStarted && !result` / `activeQuiz && !resultDetail`) — n'affecte pas la navigation normale une fois soumis.
- **#2** — Tous les `alert()` du périmètre Student/Lecturer remplacés par `notifyError` (`components/notify.tsx`) : `Quiz.tsx`, `AdaptiveQuiz.tsx`, `Student/ModuleDetail/ModuleDetail.tsx`, `Student/Mentorship/Mentorship.tsx`, `Lecturer/ModuleDetail/ModuleDetail.tsx` (7 occurrences), `Lecturer/Mentorship/Mentorship.tsx`, `Lecturer/Quiz/Quiz.tsx`, et le composant partagé `components/Lecturer/QRDisplay.tsx`.
- **#3** — `window.confirm()` remplacé par `ConfirmModal` (`components/ui`) dans `Lecturer/Materials/materials.tsx`, `Practice/PracticeBuilder.tsx`, `Practice/PracticeSolve.tsx`, et `Meeting/MeetingList.tsx` (fusion des 2 confirmations "Terminer"/"Supprimer" en un seul état `confirmMeetingAction`). Dans `Lecturer/ModuleDetail/ModuleDetail.tsx`, le bloc "Générer un Quiz IA" a été réécrit pour utiliser le `confirmAction`/`ConfirmModal` déjà en place ailleurs dans ce même fichier, et son état de chargement (`window.__generatingQuiz` + manipulation DOM directe du bouton) a été remplacé par un state React (`generatingQuiz`) déjà utilisé par un second flux de génération dans le même fichier.
  - **Découverte en cours de route** : 2 `window.confirm()` restants (`Lecturer/Quiz/Quiz.tsx:152` et `Lecturer/Announcements/Announcements.tsx:172`) appartiennent à des fonctions `handleDelete` **jamais appelées depuis le JSX** — code mort, pas un risque UX actif. Laissés tels quels plutôt que d'ajouter une UI de suppression non demandée ; à trancher consciemment (brancher un vrai bouton, ou supprimer la fonction) dans une prochaine session.
- **#4** — Bloc `isFocusMode` supprimé dans [StudentLayout.tsx](lms-frontend/src/pages/Student/StudentLayout.tsx), remplacé par un commentaire expliquant pourquoi (routing des pages quiz/devoir hors de `/student/*`).
- **#5** — États vides ad-hoc alignés sur `.empty-state-box` (déjà la convention majoritaire, cf. correction ci-dessus) : `Lecturer/AtRiskStudents.tsx` (chargement + vide, suppression au passage d'un `bg-white` qui cassait le dark mode), `Lecturer/Home.tsx` (×2), `Student/Materials/materials.tsx`, `Student/ModuleDetail/ModuleDetail.tsx` (×3 : supports/quiz/devoirs, pour matcher la version Lecturer déjà alignée), `Student/Quiz/AdaptiveQuiz.tsx`. Le seul `spinner-border` Bootstrap brut du périmètre (`Student/Timetable/TimetablePage.tsx`) remplacé par le composant partagé `Loading`. Laissés tels quels (impact visuel trop faible pour justifier le risque) : le texte d'une ligne dans `Student/Mentorship/Mentorship.tsx:260` et l'encart `alert alert-light` de `TimetablePage.tsx`.
- **#6** — `aria-label` ajouté sur les 2 boutons icône-seule qui n'avaient ni texte ni `title` équivalent robuste (voir correction ci-dessus) : `Lecturer/ModuleDetail.tsx` (Modifier/Supprimer un devoir) et `Student/Quiz/Quiz.tsx` (Quitter le quiz).
- **#8 (partiel)** — 42 couleurs hex dupliquant exactement `--accent`/`--success`/`--warning`/`--danger` remplacées par `var(--...)` sur 12 fichiers (`Home.tsx` ×2, `ModuleDetail.tsx` ×2, `AssignmentTake.tsx`, `Quiz.tsx`, `AdaptiveQuiz.tsx`, `Materials.tsx` ×2, `Mentorship.tsx`, `AtRiskStudents.tsx`, `Announcements.tsx`). Voir la note de correction dans la section "Problèmes" pour ce qui a été volontairement laissé de côté (~240 couleurs non dupliquées, #7 gros volume).
- **Vérification** : `npx tsc --noEmit` ne signale aucune nouvelle erreur sur l'ensemble des fichiers modifiés dans cette session (les 2 erreurs restantes dans `MeetingRoom.tsx` sont préexistantes, hors périmètre de ce lot).

Les points **#5 à #9** touchent un grand nombre de fichiers (propagation, dette de style) ou dépendent d'un volume de données qui n'est pas encore critique (pagination) — laissés en `⏳ À faire`, à reprendre dans une prochaine session.

---

## Conclusion

Contrairement à une intuition "il faut redesigner", le frontend web n'a pas besoin d'un nouveau design system — il en a déjà un, plutôt bien fait, dans `components/ui/` et `notify.tsx`. Ce qui manque, c'est la **propagation** : les écrans récemment retravaillés (Quiz, Devoir) l'utilisent bien, mais s'appuient encore par endroits sur des primitives navigateur brutes (`alert`, `window.confirm`) sur exactement leurs moments les plus critiques, et n'ont **aucun filet de sécurité contre un refresh accidentel** malgré tout l'investissement déjà fait sur l'anti-triche. Les ~27 autres pages, elles, n'ont simplement pas encore reçu la passe de modernisation — leur dette (style inline, hex en dur, absence d'`EmptyState`) est plus une question de temps que de choix technique contestable.

**Suite donnée (11 août 2026)** : Sprint 1 (#1-3) et Sprint 2 (#4-6) ont été traités dans la foulée. Reste ouvert : #7-8 (dette de style inline — 1145 occurrences sur 14 fichiers, gros volume, à traiter par petites tranches plutôt qu'en un seul lot) et #9 (pagination, à surveiller sans urgence).

---

*Rapport généré par Claude Code — audit basé sur lecture de code, à valider par un test manuel dans le navigateur (Chrome/Firefox, dark + light mode) avant toute mise en production.*
