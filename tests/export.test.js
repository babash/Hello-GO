// L'export en Markdown (js/export.js, version 1.5.0) : node tests/export.test.js
// Le document complet et dans l'ordre ; les textes de l'élève neutralisés (aucun titre, lien, image ni HTML ne peut en
// sortir) ; les liens seulement en http(s) ; sans les retours par défaut ; ni code ni jeton, sauf case de l'enseignant·e ;
// toute la classe en un fichier ; les dossiers de chaque version publiée.
const assert = require('assert');
const X = require('../js/export.js'), R = require('../js/retours.js'), A = require('../js/coach.js');
const { DOSSIERS } = require('./dossiers-types.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const LE = new Date(2026, 10, 17, 10);

// ---------- Neutraliser ----------
const piege = '# Titre <img src=x onerror=alert(1)> [clic](javascript:alert(1)) ![i](http://x/y.png) *gras* _it_ `code` | a | ~~b~~ &amp; \\ fin';
const t = X.texte(piege);
ok(!/(^|[^\\])[<>[\]*_`|~#]/.test(t.replace(/\\\\/g, '')), 'aucun caractère spécial laissé seul : ' + t);
ok(t.startsWith('\\# ') && t.includes('\\<img') && t.includes('\\[clic\\]') && t.includes('\\&amp;'), 'barres obliques inverses : ' + t);
['- puce', '+ puce', '> citation', '1. liste', '12) liste', '= titre'].forEach((s) => ok(X.texte(s).startsWith('\\') || /^\d+\\[.)]/.test(X.texte(s)), 'début de ligne neutralisé : ' + X.texte(s)));
ok(X.texte('ligne 1\nligne 2\r\n\tligne 3') === 'ligne 1 ligne 2 ligne 3', 'une seule ligne');
ok(X.texte(String.fromCharCode(0) + 'a' + String.fromCharCode(0x1b) + 'b') === 'a b', 'caractères de contrôle retirés');
ok(X.lien('Le site', 'https://exemple.org/a(b)') === '[Le site](https://exemple.org/a%28b%29)', 'lien http(s), parenthèses encodées');
['javascript:alert(1)', 'data:text/html,x', 'ftp://exemple.org', 'https://exemple.org/a b', 'https://x/"><b>'].forEach((u) => ok(!/\]\(/.test(X.lien('x', u)), 'pas de lien : ' + u));

// ---------- Un dossier complet ----------
const d = DOSSIERS['1.4.0']();
d.questions[0].titre = 'Comment *lutter* contre les biais ? <script>';
d.questions[0].statut = 'validee';
d.sources.push({ id: 's2', titre: 'Un piège', auteur: '', lien: 'javascript:alert(1)', date: '', retiens: '', type: '' });
d.pistes.push({ id: 'pi2', titre: '[x](javascript:alert(1))', pourquoi: '', idees: [], candidates: [] });
const ret = R.nettoyer({ v: 1, items: [
  { id: 'r1', type: 'commentaire', cible: { type: 'point', id: 'p1' }, texte: 'Ajoute la date.' },
  { id: 'r2', type: 'commentaire', cible: { type: 'bilan' }, texte: 'Beau travail.' },
  { id: 'r3', type: 'validation', qid: 'q1', etat: 'validee', texte: 'Question claire.' },
  { id: 'r4', type: 'ressource', url: 'https://www.cnil.fr/', titre: 'CNIL', texte: 'Pour le RGPD' },
  { id: 'r5', type: 'evaluation', oral: 'o1', notes: { oral: 3 }, texte: 'Bonne voix.' }] });
const md = X.dossier(d, { retours: ret, le: LE });
const ordre = ['# Mon dossier de Grand oral · Zoé', '## Ma question : ', '### Le plan', '#### Introduction (environ 2 min)', '- **Accroche :** IA de recrutement', '### L’échange avec le jury',
  '- **Pourquoi ce sujet ?**', '  - Idées de réponse : NSI, société', '## Lexique', '### M1. Algorithme', '- **Définition d’une source :** Suite finie d’instructions (source : Larousse)', '- **Avec mes mots :**', '- **Image :** Une recette de cuisine',
  '## Sources', '- **S1.** Défenseur des droits, « [Algorithmes', '](https://www.defenseurdesdroits.fr/) », 2020', '## Mes pistes', '## Mes oraux et mes vidéos', 'vidéo déposée', '## Vérifie que tu as compris : mes quiz', '## Mes hauts faits'];
let k = -1; ordre.forEach((x) => { const i = md.indexOf(x, k + 1); ok(i > k, 'dans l’ordre : « ' + x + ' »'); k = i; });
ok(md.includes('téléchargé le 17 novembre 2026'), 'date du téléchargement');
ok(md.includes('Comment \\*lutter\\* contre les biais ? \\<script\\>'), 'titre neutralisé');
ok(md.includes('(M1, S1)'), 'mots et sources reliés au point');
ok(md.includes('**Ai-je compris l’épreuve ?** : meilleur score 8 sur 10'), 'quiz sur 10');
ok(md.includes('- 10 novembre 2026 : Hello, world') && md.indexOf('10 novembre 2026 : Hello') < md.indexOf('17 novembre 2026 : Un plan sans accroc'), 'hauts faits datés, dans l’ordre');
ok(md.includes('(adresse : javascript:alert(1))') && !/(^|[^\\])\]\(javascript/i.test(md), 'lien non web écrit en texte, jamais en lien');
ok(!/(^|[^\\])<(script|img)/i.test(md) && !/(^|[^\\])\[x\]\(/.test(md), 'aucun HTML ni lien piégé');
ok(!md.includes('Retour de l’enseignant·e') && !md.includes('Beau travail') && !md.includes('CNIL'), 'sans les retours par défaut');
const md2 = X.dossier(d, { retours: ret, avecRetours: true, le: LE });
['## Bilan de l’enseignant·e', '> Beau travail.', '> **Avis de l’enseignant·e :** question validée. Question claire.', '  > **Retour de l’enseignant·e :** Ajoute la date.', '- [CNIL](https://www.cnil.fr/) : Pour le RGPD', 'Évaluation de l’enseignant·e (de 1 à 4)', '> Bonne voix.']
  .forEach((x) => ok(md2.includes(x), 'avec les retours : « ' + x + ' »'));
ok(!/[A-Z]{3,}-[A-Z]{3,}-[0-9]{3}/.test(md2) && !/jeton/i.test(md2), 'ni code ni jeton');
ok(X.dossier(d, { code: 'MICRO-DECOR-123', le: LE }).includes('Code : MICRO-DECOR-123'), 'le code, seulement si demandé');
ok(!/\n{3,}/.test(md), 'pas de grands blancs');

// ---------- Toute la classe ----------
const cl = X.classe('Terminale NSI', [{ pseudo: 'Zoé B.', code: 'MICRO-DECOR-123', dossier: d, retours: ret }, { pseudo: 'Inès <b>', code: 'TROPHEE-LAMPE-456', dossier: null, retours: R.vides() }], { le: LE });
ok(cl.startsWith('# Classe Terminale NSI · Hello GO') && cl.includes('## Sommaire') && cl.includes('1. Zoé B.') && cl.includes('2. Inès \\<b\\>'), 'titre et sommaire');
ok(cl.includes('## Zoé B.') && cl.includes('### Ma question : ') && cl.includes('#### Le plan') && cl.includes('## Inès \\<b\\>') && cl.includes('Aucun dossier lisible'), 'une section par élève, titres décalés');
ok(!cl.includes('MICRO-DECOR-123') && !cl.includes('TROPHEE-LAMPE-456') && !cl.includes('Beau travail'), 'classe : ni codes ni retours par défaut');
const cl2 = X.classe('T', [{ pseudo: 'Zoé B.', code: 'MICRO-DECOR-123', dossier: d, retours: ret }], { avecCodes: true, avecRetours: true, le: LE });
ok(cl2.includes('Code : MICRO-DECOR-123') && cl2.includes('Beau travail'), 'classe : codes et retours sur demande');

// ---------- Les dossiers de chaque version, et un dossier vide ----------
Object.keys(DOSSIERS).forEach((v) => { const m = X.dossier(DOSSIERS[v](), { le: LE }); ok(m.includes('## Lexique') && m.includes('## Sources') && m.includes('## Mes hauts faits'), v + ' : export'); });
const vide = X.dossier({ v: 1, questions: [] }, { le: LE });
ok(vide.includes('Pas encore de question.') && vide.includes('Aucun mot défini.') && vide.includes('Aucune source.') && !vide.includes('## Mes hauts faits'), 'dossier vide');
ok(A.dossierValide(d), 'le dossier n’est pas modifié par l’export');
console.log('export Markdown : ' + n + ' contrôles');
