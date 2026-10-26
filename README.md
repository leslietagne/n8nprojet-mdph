# MDPH Certificate: AI pre-filling with n8n

M1 Eugenia project. An n8n workflow that pre-fills the French MDPH medical certificate
(Cerfa 15695*01, 8 pages) from a doctor's consultation notes, then reminds them which certificates to renew.

![The MDPH Certificate workflow in n8n](workflow.png)
*Top: new certificate branch. Bottom: weekly renewal reminder. Sticky notes give the specs and explain the Code and HTTP nodes.*

## Demo video

**Video:** _link to be added_
If the link is unavailable or has expired, read the [transcript](video/transcript.md).

## Time saved

The MDPH certificate is 8 pages long. The workflow fills **59 form fields and 31 groups of tick boxes**
(origin, onset, evolution, technical aids, A–D autonomy grids…) from the notes alone.

| | By hand | With the workflow |
|---|---|---|
| Doctor's time | _to be added_ | Type the notes + review the pre-filled PDF |
| Processing | – | Under a minute per certificate (about 40 s on real runs) |

The doctor also receives a weekly reminder, so no certificate expires unnoticed.

## What the workflow does

1. **Form:** the doctor enters the patient ID, the consultation date and their notes.
2. **Google Sheets:** the patient record is read (an unknown ID triggers an email instead).
3. **gpt-6-luna** sorts the notes into the certificate fields, without inventing anything.
4. **Code node:** checks the AI answer before anything reaches the PDF.
5. **PDF.co** fills the official Cerfa; the PDF is saved to Drive and logged in a tracking sheet.
6. **Gmail:** the doctor gets the link and the points to check before signing.

**Every Monday at 8am**, a second branch emails the certificates expiring within 60 days.
The form, emails and PDF stay in French (French doctor, French official form). Data field names
(`pathologie_principale`, Sheet columns…) also stay in French because they mirror the official Cerfa and the
doctor's spreadsheet.

## Design choices

- **One Code node, on purpose.** The AI never fills the PDF directly. The Code node rejects off-list values,
  recomputes the onset date from the notes (the model gets date arithmetic wrong), empties any grid the AI
  is unsure about, unticks any aid or therapy the notes do not name, and maps the Cerfa box coordinates.
  No native node does this.
- **Two HTTP nodes, on purpose.** *Fill Cerfa PDF* fills the fields **and** draws the ticks in one PDF.co
  call (the native node would need two). *Download PDF* is needed because PDF.co returns a URL while Drive
  needs the file.

## AI reliability

Benchmark: 6 different sets of notes (osteoarthritis, stroke, autistic child, work accident, poor notes,
vague difficulties), 3 runs each. A run passes if it fills what the notes clearly say and invents nothing.

| Version | Model | Clean runs |
|---|---|---|
| Original prompt | gpt-4o-mini | 11/18 |
| Fixed prompt + Code node checks | gpt-4o-mini | 16/18 |
| **Final: English prompt + Code node checks** | **gpt-6-luna** | **18/18, twice** |

## Privacy (GDPR) and fictitious data

Health data is a special category under the GDPR (art. 9), and in France it must be hosted by a certified
health data host (HDS). OpenAI and PDF.co are not HDS-certified, so **this project only uses fictitious data**
(patients, doctor "Dr Claire Exemple", RPPS number).

The workflow already minimises what the AI sees: sex, age (not the birth date), known condition, treatments
and the notes. The workflow never sends the patient's name or social security number to the AI. A real deployment would
need HDS-certified providers. In every case, the doctor reviews, completes page 7, dates and signs.

## Repository

| Folder | Content |
|---|---|
| `workflows/` | `MDPH Certificate.workflow.ts` (n8n SDK, `n8ncli` 1.2.45) and `tests/`, 39 automated tests |
| `skills/` | 3 Claude Code skills: `interview` (turns an idea into a spec), `doubt-driven-dev` (every assumption tested), `hostile-review` (adversarial review before shipping) |
| `video/` | Demo video transcript |

## Run the tests

```bash
npm install
npm test
```

The tests replay the Code node and the n8n expressions locally, with no network and no credits.
Expected result: `39/39 TRUE`.

## Setup

1. Import `workflows/MDPH Certificate.workflow.ts` with `n8ncli`.
2. Connect the credentials: OpenAI, Google Sheets, Google Drive, Gmail, PDF.co.
3. Create a Google Sheet with a `Patients` tab (`id_patient`, `nom`, `prenom`, `date_naissance`, `sexe`,
   `adresse`, `code_postal`, `ville`, `num_secu`, `pathologie`, `traitements`) and a `Suivi` tab
   (`id_patient`, `date_consultation`, `date_echeance`, `lien_pdf`, `a_verifier`, `statut`).
4. Replace the recipient email address in the Gmail nodes.
