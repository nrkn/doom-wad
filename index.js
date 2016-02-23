'use strict'

const nwad = require( 'nwad' )
const nlump = require( 'nlump' )

//should be a unique lump name, otherwise indexOf associations are unreliable
const getLump = ( wad, indexOf, processed, name, lumpType ) => {
  const index = indexOf[ name ]
  
  if( index >= 0 ){
    processed[ index ] = true  
    
    return nlump( wad.lumps[ index ].data, lumpType || name )
  } 
}

const mapIndices = lumps => 
  lumps.reduce(
    ( indices, lump, i ) => {
      if( lump.name === 'THINGS' ){
        indices.push( i - 1 )
      }
      
      return indices
    },
    []
  )
  
const getMap = ( wad, index, processed ) => {
  const lumpNames = [ 
    'things', 'linedefs', 'sidedefs', 'vertexes', 'segs', 'ssectors', 'nodes', 
    'sectors', 'reject', 'blockmap'
  ]
  
  processed[ index ] = true
  
  return lumpNames.reduce(
    ( map, name, i ) => {
      processed[ index + i + 1 ] = true
      
      map[ name ] = nlump( wad.lumps[ index + i + 1 ].data, name ) || wad.lumps[ index + i + 1 ].data
      
      return map
    },
    {
      name: wad.lumps[ index ].name  
    }
  )
}

const getMaps = ( wad, processed ) => {
  const maps = []
  
  mapIndices( wad.lumps ).forEach(
    index => 
      maps.push( getMap( wad, index, processed ) )      
  )  
  
  return maps
}

const getFlats = ( wad, indexOf, processed ) => {
  const start = indexOf[ 'F_START' ]
  const end = indexOf[ 'F_END' ]
  const flats = []
  
  if( start && end ){
    for( var i = start; i <= end; i++ ){
      processed[ i ] = true
      
      if( wad.lumps[ i ].data.length > 0 ){
        flats.push({
          name: wad.lumps[ i ].name,
          pixels: nlump( wad.lumps[ i ].data, 'flat' )
        })
      }
    }
  }
  
  return flats
}

const getSprites = ( wad, indexOf, processed ) => {
  const start = indexOf[ 'S_START' ]
  const end = indexOf[ 'S_END' ]
  const sprites = []
  
  if( start && end ){
    for( var i = start; i <= end; i++ ){
      processed[ i ] = true
      
      if( wad.lumps[ i ].data.length > 0 ){
        sprites.push({
          name: wad.lumps[ i ].name,
          picture: nlump( wad.lumps[ i ].data, 'picture' )
        })
      }
    }
  }
  
  return sprites
}

const getPnames = ( wad, indexOf, processed ) => 
  getLump( wad, indexOf, processed, 'PNAMES' ) || []
  
const markProcessed = ( name, indexOf, processed ) => {
  if( indexOf[ name ] >= 0 ){
    processed[ indexOf[ name ] ] = true
  }
}  
  
const getPatches = ( wad, indexOf, processed ) => {
  const markers = [ 
    'P_START', 'P_END', 'P1_START', 'P1_END', 'P2_START', 'P2_END', 'P3_START', 
    'P3_END' 
  ]
  
  markers.forEach( 
    name => 
      markProcessed( name, indexOf, processed ) 
  )

  //wow, a couple of pnames are in lower case!
  const names = getPnames( wad, indexOf, processed )
    .map( 
      p => 
        p.toUpperCase() 
    )
  
  return names.map( 
    name => ({
      name: name,
      picture: getLump( wad, indexOf, processed, name, 'picture' )
    })
  )
}  

const getPlayPal = ( wad, indexOf, processed ) => 
  getLump( wad, indexOf, processed, 'PLAYPAL' ) || []
  
const getColorMap = ( wad, indexOf, processed ) => 
  getLump( wad, indexOf, processed, 'COLORMAP' ) || []  
  
const getTextures = ( wad, indexOf, processed ) => {
  const t1 = getLump( wad, indexOf, processed, 'TEXTURE1', 'texture' )
  const t2 = getLump( wad, indexOf, processed, 'TEXTURE2', 'texture' )
  
  return t1 && t2 ? t1.concat( t2 ) : t1 ? t1 : t2 ? t2 : []
}

const getSounds = ( wad, indexOf, processed ) => {
  const names = Object.keys( indexOf ).filter(
    name => name.indexOf( 'DP' ) === 0 || name.indexOf( 'DS' ) === 0
  )
  
  return names.map( name => ({
    name,
    data: getLump( wad, indexOf, processed, name, 'raw' )
  }))
}

const getMusic = ( wad, indexOf, processed ) => {
  const names = Object.keys( indexOf ).filter(
    name => name.indexOf( 'D_' ) === 0
  )
  
  return names.map( name => ({
    name,
    data: getLump( wad, indexOf, processed, name, 'raw' )
  }))
}

const getDemos = ( wad, indexOf, processed ) => {
  const names = Object.keys( indexOf ).filter(
    name => name.indexOf( 'DEMO' ) === 0
  )
  
  return names.map( name => ({
    name,
    data: getLump( wad, indexOf, processed, name, 'raw' )
  }))
}

const getUi = ( wad, indexOf, processed ) => {
  const prefixes = [
    'HELP', 'CREDIT', 'TITLEPIC', 'VICTORY', 'END', 'INTERPIC', 'DMENUPIC',
    'BOSSBACK', 'AMM', 'ST', 'M_', 'BRDR', 'WI', 'PFUB', 'CWILV'
  ]
  
  const names = Object.keys( indexOf ).filter( 
    name =>
      !processed[ indexOf[ name ] ] &&
      !!prefixes.find( prefix => name.indexOf( prefix ) === 0 )
  )
  
  return names.map( name => ({
    name,
    picture: getLump( wad, indexOf, processed, name, 'picture' )
  }))  
}

const toObj = buffer => {
  const wad = nwad.load( buffer )
  
  const processed = []
  const indexOf = {}
  
  wad.lumps.forEach( 
    ( lump, i ) => {
      processed[ i ] = false
      
      //this method means that if there are multiple lumps with the same name
      //that you can only ever get the last one
      indexOf[ lump.name ] = i
    }
  )
  
  const type = wad.type
  const colorMap = getColorMap( wad, indexOf, processed )
  const demos = getDemos( wad, indexOf, processed )
  const dmxgus = getLump( wad, indexOf, processed, 'DMXGUS', 'raw' )
  const dmxgusc = getLump( wad, indexOf, processed, 'DMXGUSC', 'raw' )
  const endoom = getLump( wad, indexOf, processed, 'ENDOOM', 'raw' )
  const flats = getFlats( wad, indexOf, processed )
  const genMidi = getLump( wad, indexOf, processed, 'GENMIDI', 'raw' )
  const maps = getMaps( wad, processed )
  const music = getMusic( wad, indexOf, processed )
  const palettes = getPlayPal( wad, indexOf, processed )
  const patches = getPatches( wad, indexOf, processed )
  const sounds = getSounds( wad, indexOf, processed )
  const sprites = getSprites( wad, indexOf, processed )
  const textures = getTextures( wad, indexOf, processed )  
  //must be called last or it catches things it shouldn't due to sloppy prefix matching
  const ui = getUi( wad, indexOf, processed )
  
  /*
  const debug = {
    lumpCount: wad.lumps.length,
  }
  */
  
  const obj = {
    type, colorMap, demos, dmxgus, dmxgusc, endoom, flats, genMidi, maps, music, 
    palettes, patches, sounds, sprites, textures, ui
    //,debug
  }
  
  /*
  obj.debug.unprocessedCount = processed.reduce( 
    ( sum, isP ) => 
      isP ? sum : sum + 1,
    0 
  )
  
  obj.debug.unprocessed = wad.lumps
    .map( lump => lump.name )
    .filter( ( lump, i ) => !processed[ i ] )
  */
  
  return obj
}

module.exports = toObj
