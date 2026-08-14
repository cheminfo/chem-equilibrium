# pH indicators dataset — notes

`ph-indicators.tsv` is the vendored colour-transition table used by the titration
tool of equilibrium.cheminfo.org. It has one row per transition (25 rows for 21
indicators): a polychromic indicator such as thymol blue contributes two rows
that share the same `name`.

Columns:

| column       | meaning                                        |
| ------------ | ---------------------------------------------- |
| `transition` | label distinguishing the rows of one indicator |
| `name`       | English indicator name (the grouping key)      |
| `pH1`        | lower pH bound of the transition range         |
| `pH2`        | upper pH bound of the transition range         |
| `color1`     | colour of the acid form, lowercase 6-digit hex |
| `color2`     | colour of the base form, lowercase 6-digit hex |
| `source`     | spreadsheet the row was extracted from         |

## Provenance and refresh

The data originates from the Google spreadsheet

```
1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU
```

https://docs.google.com/spreadsheets/d/1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU

To refresh, export it as TSV and re-apply the transformation below:

```sh
curl -L 'https://docs.google.com/spreadsheets/d/1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU/export?format=tsv' \
  -o indicators-raw.tsv
```

The legacy visualizer view fetched the same document through
`https://googledocs.cheminfo.org/spreadsheets/d/<id>/export?format=tsv` and parsed
it with papaparse (`header: true`, `dynamicTyping: true`), sorting ascending by
`pH1` and grouping by `name`.

The transformation applied when vendoring:

1. Drop the French `Indicateur6` column and replace it with a short English
   `transition` label.
2. Translate `name` to English (see the mapping table below), keeping the exact
   grouping of the source — rows that shared a French `name` share the English one.
3. Copy `pH1` / `pH2` verbatim; no value is corrected and no row is reordered.
4. Convert every CSS colour keyword to its exact lowercase hex and lowercase the
   values that are already hex. Trailing carriage returns from the CRLF export are
   stripped.

Keyword conversions used: `yellow` → `#ffff00`, `red` → `#ff0000`,
`blue` → `#0000ff`, `violet` → `#ee82ee`, `lime` → `#00ff00`,
`fuchsia` → `#ff00ff`, `pink` → `#ffc0cb`, `white` → `#ffffff`.

## Known quirks in the source data

### Bromothymol blue's first row is degenerate

The first bromothymol blue row has `pH1 = pH2 = 0`, i.e. a zero-width transition
at the very bottom of the pH scale, from `#ff0088` to `#ffff00`. This is an
artefact of the source spreadsheet, not a real acid-form transition; bromothymol
blue's usable transition is the second one (6 → 7.6, yellow → blue). The value is
kept verbatim so the vendored file stays a faithful copy, but any consumer that
interpolates a colour gradient must handle a zero-width interval — dividing by
`pH2 - pH1` produces a division by zero. Either skip the row or treat it as a
hard colour step at pH 0.

### Colourless acid forms need special rendering

Phenolphthalein (8.2 → 10) and thymolphthalein (9.4 → 10.6) both have `white`
(`#ffffff`) as `color1`. Chemically the acid form is **colourless**, not white —
the spreadsheet uses white as the closest CSS approximation. Malachite green's
second transition (11.5 → 13.2) ends the same way, with a `#ffffff` base form.

On a light background a `#ffffff` swatch is invisible. Renderers should treat
`#ffffff` as "colourless" and give it a distinct treatment — a thin outline, a
checkerboard/hatched fill, or the label "colourless" — rather than painting a
white rectangle on white.

## English / French name mapping

| English name           | French name (source)                           |
| ---------------------- | ---------------------------------------------- |
| bromothymol blue       | Bleu de bromothymol (BBT)                      |
| cresol red             | Rouge de crésol                                |
| gentian violet         | Violet de gentiane                             |
| malachite green        | Vert malachite                                 |
| thymol blue            | Bleu de thymol                                 |
| methyl yellow          | Jaune de méthyle                               |
| bromophenol blue       | Bleu de bromophénol (BBP)                      |
| Congo red              | Rouge Congo                                    |
| methyl orange          | Hélianthine (Méthyl orange)                    |
| screened methyl orange | Hélianthine en solution dans le xylène cyanole |
| bromocresol green      | Vert de bromocrésol                            |
| methyl red             | Rouge de méthyle                               |
| litmus                 | Papier de tournesol (Azolitmine)               |
| bromocresol purple     | Pourpre de bromocrésol                         |
| phenol red             | Rouge de phénol (Phénolsulfonephtaléine)       |
| neutral red            | Rouge neutre                                   |
| phenolphthalein        | Phénolphtaléine                                |
| thymolphthalein        | Thymolphtaléine                                |
| alizarin yellow R      | Jaune d'alizarine R                            |
| alizarin               | Alizarine                                      |
| indigo carmine         | Carmin d'indigo                                |

Four indicators are polychromic and contribute two rows each: bromothymol blue,
cresol red, malachite green, and thymol blue. Their French transition labels were
`(1re transition)` / `(acide - 1re transition)` and `(2e transition)` /
`(base - 2e transition)`, rendered here as `first transition (acid)` and
`second transition (base)`. The other 17 indicators carry `single transition`.
