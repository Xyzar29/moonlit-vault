# Moonlit Vault

A top-down museum stealth game that plays offline in a desktop browser.
Three gems, three galleries, one thief: slip past the night watchmen's
lanterns, hide behind the display cases and crates, wait in the shadow
pools, steal each gallery's gem and reach the glowing EXIT unseen.

![make.fun bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)
![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Xyzar29/moonlit-vault/rank.svg)
![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Xyzar29/moonlit-vault/reward.svg)

Entered in make.fun's [Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759) bounty.

## Play

Serve the `game/` folder with any static file server and open `index.html`
in desktop Chrome — no build step, no network requests:

```
node -e "const http=require('http'),fs=require('fs'),path=require('path');const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};http.createServer((req,res)=>{const p=path.join('game',req.url==='/'?'index.html':req.url.split('?')[0]);fs.readFile(p,(e,d)=>{if(e){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(d)})}).listen(8080)"
```

Then visit http://localhost:8080.

## How it plays

- **WASD / arrow keys** move, **Shift** sneaks: slower and silent, and low
  enough to hide behind crates and plants.
- Walking on stone is loud — a guard who hears a footstep turns toward it.
- Lantern cones change colour with a guard's mood: amber while he patrols,
  orange when suspicious, red on the alarm. A glimpse only raises suspicion;
  break line of sight and he searches, gives up, and returns to his patrol.
- Shadow pools dim the light: inside one you are noticed far more slowly.
- Steal the gem, take any coins you dare, and reach the EXIT. Finish a
  gallery without ever raising the alarm for the Ghost bonus.

## Layout

- `game/` — the game as static files (`index.html`, `css/`, `src/` modules:
  levels, vision, guards, player, physics, render, audio, input).
- `screenshots/` — real renders of the game, taken by its maker.
- `main.ts` — the Node 22 hand-in program: copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json` with the vendored
  `vendor/makefun-game.ts` library.

## License

MIT — see `LICENSE`.
