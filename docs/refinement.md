# Refinement round

After the Builder reports completion, the owner reviews the live app with the Partner session (`/partner`). The Partner writes the owner's notes here as numbered items, each with a verdict and a precise instruction, then hands the Builder a prompt that points at this file.

The Builder works the items in order, ticks them off, re-runs `npm run verify`, updates `progress.md`, and commits `R1: Refinement round 1`. If a second round is needed it goes under a new heading.

## Partner pre-review

(the Partner's own findings before the owner's notes, written per `partner.md`)

## Round 1

Owner's notes (written by the Partner):

```
R1-1 · <view or component> · <what the owner said, in his words>
      Instruction: <exactly what to change, referencing the spec section>
      [ ] done
```

(items start below)
