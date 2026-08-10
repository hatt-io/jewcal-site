# JewCal website

Static site for [jewcal.org](https://jewcal.org/).

The site is deployed to GitHub Pages from `main` by `.github/workflows/pages.yml`.

## Edit Supporter Yahrzeits

Edit only [`supporter-yahrzeits.json`](supporter-yahrzeits.json).

1. Copy one complete entry, including its `{` and `}`.
2. Add a comma between entries.
3. Change its five values:
   - `id`: a permanent unique lowercase ID such as `cohen-rivka-2026`. Never reuse or change it later.
   - `name`: the loved one's display name.
   - `from`: the family, shul, or supporter shown after “From:”.
   - `note`: a personal wish, dedication, or memorial message shown below “From:”.
   - `hebrewDate`: for example `15 Av 5786`.
4. Commit to `main`. GitHub checks the file before deploying it.

Supported month names: `Tishrei`, `Cheshvan`, `Kislev`, `Tevet`, `Shevat`, `Adar`,
`Adar I`, `Adar II`, `Nisan`, `Iyar`, `Sivan`, `Tammuz`, `Av`, and `Elul`.
Use `Adar` only in a non-leap year and `Adar I` or `Adar II` only in a leap year.
