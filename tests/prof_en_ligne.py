"""L'espace de l'enseignant·e, contre la reproduction locale : lancé par tests/en_ligne.py (données inventées)."""
import json, re, time


def essais(nav, Appareil, ok, base, prof, URL, CODE_PROF_A, classe_A, erreurs):
    P = Appareil(nav, 'P-1440-clair', 1440)
    p = P.p
    reponses = P.reponses

    def ecrire(*valeurs):  # la petite fenêtre de saisie de la page
        p.wait_for_selector('#dialogue[open]')
        for i, v in enumerate(valeurs):
            p.fill('#dialogue [name=c%d]' % i, v)
        p.click('#dialogue button[value=ok]')

    def attendre(texte, sel='#vue', delai=10000):
        p.wait_for_function('([s, t]) => (document.querySelector(s) || {}).textContent && document.querySelector(s).textContent.includes(t)', arg=[sel, texte], timeout=delai)

    # --- créer son espace ---
    p.goto(URL + '#/prof'); p.wait_for_selector('#prof-nom')
    P.large('p0-entree')
    ok('entrée : case « Rester connecté·e sur cet appareil », décochée par défaut', p.locator('#prof-rester').count() == 1 and not p.locator('#prof-rester').is_checked())
    p.fill('#prof-nom', 'M. Durand'); p.click('[data-pa=creer-espace]'); p.wait_for_selector('.code-eleve')
    code = p.inner_text('.code-eleve').strip()
    ok('espace : code de 3 mots et 4 chiffres montré une fois', re.fullmatch(r'[A-Z]+-[A-Z]+-[A-Z]+-\d{4}', code) is not None, code)
    ok('code montré : case « Rester connecté·e », décochée par défaut', p.locator('#prof-rester').count() == 1 and not p.locator('#prof-rester').is_checked())
    p.click('[data-pa=code-note]'); attendre('Mon espace · M. Durand')
    ok('code gardé pour la séance seulement (sessionStorage, pas localStorage)',
       p.evaluate("sessionStorage.getItem('hellogo:prof:code')") == code and p.evaluate("localStorage.getItem('hellogo:prof:code')") is None)
    ok('la navigation de l’élève est cachée', p.locator('#nav').is_hidden())
    # --- une classe, son lien, son QR code ---
    p.fill('#prof-classe-nom', 'Terminale NSI B'); p.click('[data-pa=creer-classe]')
    p.wait_for_selector('#qr svg', timeout=10000)
    lien = p.locator('.lien-classe a').first.inner_text()
    ok('classe : lien de classe et QR code (bibliothèque locale)', '#/classe/' in lien and p.locator('#qr svg').count() == 1)
    code_classe = lien.rsplit('/', 1)[-1]
    P.large('p1-classe-vide')
    # --- un·e élève s'inscrit et travaille ---
    S = Appareil(nav, 'S-390-obscur', 390, True)
    S.p.goto(lien); S.p.wait_for_selector('#pseudo'); S.p.fill('#pseudo', 'Inès B.'); S.p.click('[data-a=inscription]'); S.p.wait_for_selector('.code-eleve')
    code_eleve = S.p.inner_text('.code-eleve').strip()
    S.p.goto(URL + '#/questions'); S.p.fill('#question-libre', 'Le cloud est-il écologique ?'); S.p.click('[data-a=question-libre]')
    S.p.wait_for_selector('[data-a=plus-pt]'); S.p.locator('[data-a=plus-pt]').nth(1).click(); S.p.keyboard.type('Un centre de données consomme comme une ville')
    S.p.goto(URL + '#/mots'); S.p.click('[data-a=plus-mot]'); S.p.keyboard.type('Centre de données')
    S.p.goto(URL + '#/sources'); S.p.click('[data-a=plus-source]'); S.p.keyboard.type('Rapport ADEME')
    S.etat('Enregistré')
    # --- le tableau de la classe ---
    p.reload(); p.wait_for_selector('.tableau-classe')
    ligne = p.inner_text('.tableau-classe tbody')
    ok('tableau : l’élève, son résumé, nouveau travail', 'Inès B.' in ligne and 'Le cloud est-il écologique ?' in ligne and 'Nouveau travail' in ligne)
    ok('tableau : les codes sont masqués par défaut', code_eleve not in ligne)
    p.click('[data-pa=voir-code]')
    ok('tableau : un code révélé d’un clic', code_eleve in p.inner_text('.tableau-classe tbody'))
    p.click('[data-pa=voir-codes]')
    ok('tableau : tous les codes, prêts à imprimer', code_eleve in p.inner_text('.tableau-classe tbody') and code_eleve in p.locator('.codes-impression').inner_text())
    P.large('p2-tableau')
    # --- le dossier de l'élève et les retours ---
    p.click('.tableau-classe th a'); p.wait_for_selector('.question-prof')
    ok('dossier : le plan, avec les repères', 'P1' in p.inner_text('.question-prof') and 'Un centre de données consomme' in p.inner_text('.question-prof'))
    p.locator('.pt [data-pa=commenter]').first.click(); ecrire('Donne un chiffre précis.'); attendre('Retour envoyé.', '#toasts')
    p.click('[data-pa=valider][data-v=validee]'); ecrire('Question claire.'); attendre('Retour envoyé.', '#toasts')
    p.click('[data-pa=suggerer-question]'); ecrire('Que faire pour réduire cette consommation ?'); time.sleep(.5)
    p.goto(URL + '#/prof/eleve/' + p.url.split('/')[-1] + '/mots')
    p.wait_for_selector('[data-pa=definir]')
    p.click('[data-pa=definir]'); ecrire('Empreinte carbone', 'Tu en parles dans ton axe 1.'); time.sleep(.5)
    p.click('[data-pa=ressource]'); ecrire('javascript:alert(1)', 'Piège', ''); attendre('https://', '#toasts')
    p.click('[data-pa=ressource]'); ecrire('https://www.ademe.fr/', 'ADEME', 'Des chiffres officiels.'); time.sleep(.5)
    eleve = [x for x in prof('go_prof_classe', p_code=code, p_classe=p.evaluate('HGProf.etat.eleve.classe_id'))['eleves'] if x['pseudo'] == 'Inès B.'][0]
    r = prof('go_prof_dossier', p_code=code, p_eleve=eleve['id'])
    types = sorted(x['type'] for x in r['retours']['items'])
    ok('retours enregistrés : commentaire, validation, question, définition, ressource (pas le lien piégé)', types == ['commentaire', 'definir', 'question', 'ressource', 'validation'], types)
    # évaluation d'un oral
    p.goto(URL + '#/prof/eleve/%s/oraux' % eleve['id']); p.wait_for_selector('.grille-prof')
    f = p.locator('.grille-prof').first
    for c in ['oral', 'continu', 'connaissances', 'interaction', 'argumentation']:
        f.locator('input[name=%s][value="3"]' % c).check()
    f.locator('[name=texte]').fill('Bonne voix, regarde le jury.'); f.locator('[data-pa=evaluer]').click(); attendre('Évaluation enregistrée.', '#toasts')
    P.large('p3-oraux')
    # --- avec une IA ---
    p.goto(URL + '#/prof/eleve/%s/ia' % eleve['id']); p.wait_for_selector('[data-pa=telecharger-ia]')
    with p.expect_download() as dl:
        p.click('[data-pa=telecharger-ia]')
    texte = open(dl.value.path(), encoding='utf-8').read()
    ok('texte pour l’IA : sans prénom ni code, avec repères, consignes et format', 'Inès' not in texte and code_eleve not in texte and 'P1 ' in texte and 'M1 ' in texte and 'S1 ' in texte and texte.startswith('CONSIGNES') and '@BILAN' in texte)
    ok('nom du fichier sans prénom', 'ines' not in dl.value.suggested_filename.lower())
    reponse = 'Voici :\n- **@P1** : Ajoute la source du chiffre.\n2. @M1 - Définition à écrire.\n[S1] Bonne source.\n@DEFINIR datacenter | synonyme à connaître\n@SOURCE https://www.cnil.fr | CNIL | utile\n@QUESTION Le cloud peut-il être vert ?\n@BILAN Bon début.\n@P42 Inconnu\nMerci !'
    p.fill('#prof-ia', reponse); p.click('[data-pa=lire-ia]'); p.wait_for_selector('.brouillon')
    ok('retour d’IA : 7 brouillons, 1 ligne non reconnue', p.locator('.brouillon').count() == 7 and '@P42 Inconnu' in p.inner_text('#vue'), p.locator('.brouillon').count())
    P.large('p4-ia')
    p.locator('[data-brouillon="0"]').fill('Ajoute la source de ce chiffre (relu).')
    p.locator('[data-pa=retirer-brouillon][data-i="6"]').click()
    # un autre onglet a modifié les retours entre-temps : conflit de version, refait sans perte
    r = prof('go_prof_dossier', p_code=code, p_eleve=eleve['id'])
    items = r['retours']['items'] + [{'id': 'autreonglet', 'type': 'commentaire', 'cible': {'type': 'bilan', 'id': ''}, 'texte': 'Écrit dans un autre onglet', 'le': '2026-11-17'}]
    prof('go_prof_retours', p_code=code, p_eleve=eleve['id'], p_retours={'v': 1, 'items': items}, p_version_connue=r['retours_version'])
    p.click('[data-pa=envoyer-ia]'); attendre('6 retours envoyés.', '#toasts')
    r = prof('go_prof_dossier', p_code=code, p_eleve=eleve['id'])
    tout = json.dumps(r['retours'], ensure_ascii=False)
    ok('retours de l’IA envoyés, marqués ia, relus', sum(1 for x in r['retours']['items'] if x.get('ia')) == 6 and '(relu)' in tout and 'Bon début' not in tout)
    ok('conflit de version des retours : rien de perdu', 'Écrit dans un autre onglet' in tout)
    # --- corriger un texte de l'élève ---
    p.goto(URL + '#/prof/eleve/%s' % eleve['id']); p.wait_for_selector('.question-prof')
    p.locator('.pt [data-pa=corriger]').first.click(); p.fill('#dialogue [name=c0]', 'Un centre de données consomme autant qu’une ville moyenne'); p.click('#dialogue button[value=ok]')
    attendre('Correction enregistrée.', '#toasts')
    S.p.goto(URL + '#/question/' + r['dossier']['questions'][0]['id']); S.visible()
    S.p.wait_for_function("document.querySelector('.texte-pt') && document.querySelector('.texte-pt').value.includes('ville moyenne')", timeout=15000)
    ok('correction : l’élève la reçoit, sans annonce', 'corrig' not in S.p.inner_text('#toasts').lower())
    ok('élève : commentaire et mention de l’IA près du point', 'Donne un chiffre précis.' in S.p.inner_text('.pt') and 'Préparé avec l’aide d’une IA' in S.p.inner_text('.pt'))
    S.large('s1-retours')
    # --- le PDF du dossier de l'élève ---
    with p.expect_download(timeout=30000) as dl:
        p.locator('[data-pa=pdf]').first.click()
    ok('PDF du dossier de l’élève', dl.value.suggested_filename.endswith('.pdf'))
    # --- gérer les élèves ---
    p.goto(URL + '#/prof/classe/' + eleve_classe(p)); p.wait_for_selector('.tableau-classe')
    p.click('[data-pa=renommer-eleve]'); ecrire('Inès L.'); attendre('Inès L.', '.tableau-classe')
    p.click('[data-pa=code-eleve]'); attendre('Nouveau code', '#toasts')
    s2, rr = base.appel('go_connexion', {'p_code': code_eleve})
    ok('nouveau code : l’ancien ne marche plus', not rr['ok'])
    with p.expect_download() as dl:
        p.locator('[data-pa=exporter-classe]').first.click()
    ex = json.load(open(dl.value.path(), encoding='utf-8'))
    ok('export de la classe (JSON)', ex['ok'] and ex['classes'][0]['eleves'][0]['pseudo'] == 'Inès L.')
    p.fill('#prof-renommer-classe', 'TNSI B'); p.click('[data-pa=renommer-classe]'); attendre('Classe renommée.', '#toasts')
    p.click('[data-pa=inscriptions]'); attendre('fermées', '.lien-classe')
    s2, rr = base.appel('go_inscription', {'p_code_classe': code_classe, 'p_pseudo': 'Léo P.'})
    ok('inscriptions fermées', not rr['ok'])
    P2 = Appareil(nav, 'P-320-obscur', 320, True)
    P2.p.goto(URL + '#/prof'); P2.p.fill('#prof-code', code.lower().replace('-', ' ')); P2.p.check('#prof-rester'); P2.p.click('[data-pa=ouvrir]'); P2.p.wait_for_selector('.lien-carte')
    ok('« Rester connecté·e » cochée : le code est aussi dans localStorage', P2.p.evaluate("localStorage.getItem('hellogo:prof:code')") == code)
    P2.p.click('.lien-carte'); P2.p.wait_for_selector('.tableau-classe'); P2.large('p5-tableau-telephone')
    P2.p.click('.tableau-classe th a'); P2.p.wait_for_selector('.question-prof'); P2.large('p6-dossier-telephone')
    ok('le code n’est jamais dans l’adresse', code not in P2.p.url and code not in p.url)
    P3 = P2.ctx.new_page(); P3.goto(URL + '#/prof'); P3.wait_for_selector('.lien-carte')
    ok('« Rester connecté·e » : un nouvel onglet ouvre l’espace sans redemander le code', P3.locator('#prof-code').count() == 0)
    P3.close()
    P2.p.goto(URL + '#/prof'); P2.p.wait_for_selector('[data-pa=quitter]'); P2.p.click('[data-pa=quitter]'); P2.p.wait_for_selector('#prof-code')
    ok('« Fermer mon espace sur cet appareil » : le code est effacé des deux stockages',
       P2.p.evaluate("localStorage.getItem('hellogo:prof:code')") is None and P2.p.evaluate("sessionStorage.getItem('hellogo:prof:code')") is None)
    p.click('[data-pa=supprimer-eleve]'); attendre('Aucun·e élève', '#vue')
    reponses.append('TNSI B'); p.locator('details.carte summary').last.click(); p.click('[data-pa=supprimer-classe]'); attendre('Classe supprimée.', '#toasts')
    # --- son code, son espace ---
    p.goto(URL + '#/prof'); p.wait_for_selector('[data-pa=changer-code]'); p.click('[data-pa=changer-code]'); p.wait_for_selector('.code-eleve')
    nouveau = p.inner_text('.code-eleve').strip()
    s2, rr = base.appel('go_prof_ouvrir', {'p_code': code})
    ok('changer son code : l’ancien ne marche plus', not rr['ok'] and nouveau != code)
    p.click('[data-pa=code-note]'); attendre('Mon espace')
    # --- garde-fou (Gardien, T75) : un résumé piégé, écrit avec le jeton d'un·e élève, n'est jamais exécuté chez l'enseignant·e ---
    k = prof('go_prof_creer_classe', p_code=nouveau, p_nom='Classe piège')
    x = prof('go_inscription', p_code_classe=k['code'], p_pseudo='Max R.')
    piege = '<img src=x onerror="window.piege=1">'
    prof('go_sauvegarde', p_jeton=x['jeton'], p_dossier={'v': 1, 'questions': []}, p_version_connue=0,
         p_resume={'v': 1, 'etape': piege, 'questions': [{'titre': 'Q', 'statut': 'brouillon', 'points': piege}, piege], 'points': piege, 'mots': piege,
                   'mots_complets': piege, 'sources': piege, 'hauts_faits': piege, 'oraux': piege})
    p.goto(URL + '#/prof/classe/' + k['id']); p.wait_for_selector('.tableau-classe'); time.sleep(.5)
    ok('résumé piégé (écrit avec le jeton d’un·e élève) : jamais exécuté dans le tableau de la classe',
       not p.evaluate('window.piege') and p.locator('.tableau-classe img').count() == 0 and '0/0 mots' in p.inner_text('.tableau-classe'))
    p.goto(URL + '#/prof'); attendre('Mon espace')
    p.click('[data-pa=debloquer]'); attendre('Réseau débloqué', '#toasts')
    p.locator('details.carte summary').last.click(); p.fill('#prof-supprimer', 'SUPPRIMER'); p.click('[data-pa=supprimer-espace]'); p.wait_for_selector('#prof-nom')
    s2, rr = base.appel('go_prof_ouvrir', {'p_code': nouveau})
    ok('supprimer son espace', not rr['ok'])
    ok('le code n’est plus gardé sur l’appareil', p.evaluate("sessionStorage.getItem('hellogo:prof:code')") is None)


def eleve_classe(p):
    return p.evaluate('HGProf.etat.eleve.classe_id')
