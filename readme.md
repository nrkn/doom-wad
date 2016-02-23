# doom-wad

## Read data out of a DOOM WAD

`npm install doom-wad`

Tries to take a DOOM WAD (Heretic et al. not supported at present, PRs welcome)
and mangle it into something useful. 

Can handle most of the data used by DOOM and DOOM 2, see 
[nlump](https://github.com/nrkn/nlump) for more details on which lumps are 
supported

It basically just uses nlump to convert the lumps, and tries to organise them
meaningfully, eg. grouping map lumps together etc.

Known to work with DOOM and DOOM 2 IWADs, the handful of map-only PWADs I tried
also worked

## Usage

```javascript
const fs = require( 'fs' )
const wad = require( 'doom-wad' )

fs.readFile( 'doom.wad', ( err, buffer ) => {
  const data = wad( buffer )
  
  console.dir( data )
})

```
