#!/bin/zsh
# scripts/stills.sh <out-dir> Comp:frame [Comp:frame ...]: bundle once, then render half-size stills for review.
out=$1; shift
npx remotion bundle src/index.ts --out-dir build --log=error >/dev/null || exit 1
for spec in "$@"; do
  npx remotion still build ${spec%%:*} "$out/s-${spec%%:*}-${spec##*:}.jpg" --frame=${spec##*:} --scale=0.5 --log=error
done
