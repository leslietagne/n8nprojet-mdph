# Demo video transcript

Video: https://youtu.be/9IoZ-zg9Nv4 (8:59, in French)

Transcript based on YouTube's automatic captions, cleaned up (hesitations removed, technical terms corrected).

## 0:00 – Introduction and goal

Bonsoir, je suis Leslie et aujourd'hui je vais vous présenter mon workflow n8n, qui a pour but de pré-remplir un certificat médical officiel : le certificat MDPH.

Le certificat MDPH, qu'est-ce que c'est ? C'est un formulaire médical officiel que le médecin remplit et qui permet aux patients en situation de handicap d'obtenir la totalité de leurs droits. C'est un certificat connu pour être très long, puisqu'il est composé de 8 pages et de dizaines de choix à remplir. L'idée m'est venue parce que ma mère est médecin et que je sais qu'elle y passe beaucoup de temps.

Avant, elle devait remplir entièrement le formulaire à la main. Grâce à ce workflow, il ne lui reste plus qu'à taper ses notes de consultation dans un formulaire. Ensuite, le workflow remplit les 59 champs et les 31 groupes de cases du PDF, range le PDF dans son Drive et lui envoie un mail avec tous les points à vérifier. Le médecin n'a plus qu'à vérifier et signer : c'est un gain de temps énorme. Et le principe d'or, c'est que l'IA pré-remplit, mais elle ne devine jamais.

Il y a la branche du haut, qui permet d'envoyer un nouveau formulaire et de pré-remplir le certificat, et la branche du bas, qui envoie au médecin un mail de rappel des certificats à renouveler dans les 60 jours. Les sticky notes listent les specs et expliquent les nœuds clés.

## 1:30 – The key nodes

Passons à la présentation des nœuds les plus importants du workflow.

**Sort Notes into Fields.** Le modèle, gpt-6-luna, lit et range les notes écrites par le médecin, ce qui permet de remplir les cases. Le Structured Output Parser garantit que la réponse sera toujours dans un format fixe, ce qui est très important. Il y a aussi l'OpenAI Model. Le prompt interdit à l'IA d'inventer : si une information lui manque, elle laisse la case vide et pose la question au médecin, pour qu'il puisse la remplir par la suite.

**Validate AI Output.** C'est un nœud Code, très important, puisqu'on ne peut malheureusement pas faire confiance à 100 % à l'IA : c'est une étape de vérification avant de passer au PDF. Grâce à ce nœud, on évite pas mal d'erreurs. Il calcule par exemple la position des cases sur le PDF, recalcule la date d'apparition, vide les valeurs hors liste, etc. Ce nœud n'aurait pas pu être remplacé par un nœud natif, et il est couvert par 39 tests.

**Les deux nœuds HTTP.** J'utilise un premier nœud HTTP parce que l'API PDF.co remplit les champs et coche les cases en un seul appel, alors qu'un nœud natif en aurait demandé deux. Le deuxième nœud HTTP permet tout simplement de télécharger le PDF, parce que PDF.co renvoie un lien alors que Drive a besoin d'un fichier.

Ensuite, ce sont des nœuds plutôt classiques : ils sauvegardent le PDF dans Drive, enregistrent les informations dans le Google Sheet et envoient le certificat par email une fois qu'il est prêt.

## 3:33 – Demo

Maintenant, une petite démo. Le médecin a déjà récupéré l'ensemble des notes concernant le patient. Il remplit ce petit formulaire : il entre l'identifiant du patient (ici, complètement fictif), la date de consultation et ses notes. Ici, il s'agit d'une maladie de Parkinson diagnostiquée en 2019, avec d'autres informations, fictives elles aussi. Il envoie le formulaire. Le traitement prend environ 40 secondes.

On voit « Form submitted » : le certificat est en préparation, et on va recevoir un email. Dans ma boîte mail, j'ai reçu un nouveau message : « Bonjour Docteur, le certificat MDPH du patient P001 est pré-rempli et prêt à relire. » L'IA signale les points dont elle n'est pas sûre, et c'est ça qui est important : elle indique au médecin les points à vérifier. Ici, il s'agit de la capacité du patient à couper ses aliments ou encore de la marche. Il y a aussi une section « À compléter vous-même » et un rappel : avant l'envoi, il faut toujours relire, cocher « médecin traitant », dater et signer.

Le médecin reçoit directement le lien vers le certificat, et on voit que toutes les informations du patient sont remplies : maladie de Parkinson depuis plus de 5 ans (cela date bien de 2019), tremblements de la main droite permanents, lenteur des mouvements réguliers. Tout est rempli en fonction des notes saisies par le médecin.

Voici le Google Sheet qui recense les patients et les certificats générés par le formulaire. Je précise une nouvelle fois que toutes les données, comme la date de naissance ou le numéro de sécurité sociale, sont absolument fictives. C'est ce fichier qui est utilisé par le workflow pour le suivi des patients, avec le rappel envoyé chaque lundi au médecin pour les dossiers à renouveler.

## 5:54 – n8ncli in the terminal

Maintenant, je vais vous montrer comment je travaille sur ce workflow depuis le terminal, avec n8ncli. Je traite ce workflow comme du code : je le récupère, je le vérifie sur mon ordinateur, puis je le renvoie dans n8n.

**`n8ncli envs list`** : je regarde à quelle instance je suis connectée. Mon environnement est « development » et, à la fin, dans la colonne API Key, il y a marqué « No », parce que je n'ai pas de clé API : je suis en essai gratuit. Ça va compter pour tout à l'heure.

**`n8ncli pull hdytFg0Ds6lB5vvz`** : je récupère mon workflow en collant son identifiant. Cette commande télécharge la dernière version et la transforme en fichier TypeScript sur mon ordinateur. C'est ce fichier que j'ai mis sur GitHub.

**`n8ncli import-skill`** : c'est la troisième commande, exactement comme on l'a vu en cours. Elle installe un fichier qui apprend à une IA comment utiliser n8ncli et lui donne une vraie méthode de travail. Le terminal affiche « Successfully imported ».

**`n8ncli validate`** : ma quatrième commande. À la fin, on voit bien que mon workflow est valide.

**`n8ncli push --dry-run`** : pour finir, le push sert à renvoyer le workflow dans n8n. J'ajoute, c'est très important, `--dry-run` : c'est une simulation, qui ne modifie rien en réalité. Le terminal affiche « Push simulated successfully ». Et c'est là que la clé API est importante : on a l'impression que le push est fait, mais en réalité seul le nom est modifié, pas le contenu des nœuds. Pour mettre à jour les nœuds, il faut importer le fichier directement dans n8n, puis faire un diff pour vérifier que tout est identique.

## 8:13 – Conclusion

Je vous remercie de m'avoir écoutée. Je suis très contente d'avoir découvert n8n et d'avoir pu mettre en pratique aussi rapidement tout ce que j'apprenais, surtout sur une problématique réelle : le pré-remplissage d'un document médical officiel très important. Comme je l'ai dit plus tôt, cela représente un énorme gain de temps.

Ce que j'aurais préféré, c'est savoir en amont tout ce qu'il fallait installer sur nos ordinateurs, pour être encore plus efficace. Mais sinon, en termes de contenu, j'ai été très satisfaite de tout ce que j'ai appris au cours de cette semaine.
